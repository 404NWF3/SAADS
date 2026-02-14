"""
=== SAADS WP1-1 验证脚本: Paper Analyzer Agent ===

功能: 验证 Paper Analyzer Agent 能否从 arXiv 搜索论文并用 LLM 提取攻击信息

前置配置:
  1. 复制 .env.example 为 .env (如果还没有)
  2. 【必须】填入 OPENAI_API_KEY=sk-xxx  (需要 LLM 做论文摘要提取)
     或配置 OPENAI_BASE_URL 指向兼容 API
  3. 无需 NVD_API_KEY 或 GITHUB_TOKEN

运行方式:
  python tests/scripts/test_paper_analyzer_agent.py

预期输出:
  - 从 arXiv 搜索 AI 安全相关论文
  - 对每篇论文用 LLM 提取: 攻击类型、目标系统、严重性评估
  - 过滤掉低相关性论文 (relevance < 0.3)
  - 整个过程约需 15-40 秒 (取决于论文数量和 LLM 响应速度)
"""

import sys
import asyncio
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from saads.agents.wp1_1.paper_analyzer import paper_analyzer_node


async def main():
    print("=" * 60)
    print("SAADS — Paper Analyzer Agent 验证")
    print("=" * 60)

    # 检查配置
    from saads.config import OPENAI_API_KEY

    if not OPENAI_API_KEY:
        print("\n[ERROR] OPENAI_API_KEY 未配置!")
        print("  本脚本需要 LLM 从论文摘要中提取攻击信息。")
        print("  请在 .env 中设置: OPENAI_API_KEY=sk-xxx")
        return

    print(f"\n  OPENAI_API_KEY: 已配置")

    # 构造模拟 state
    state = {
        "messages": [],
        "collection_strategy": {
            "keywords": ["LLM security vulnerability"],
            "priority_categories": ["prompt_injection", "jailbreak"],
            "target_sources": ["arxiv"],
            "max_per_source": 3,
        },
        "raw_intel": [],
        "standardized_entries": [],
        "coverage_report": {},
        "iteration": 0,
        "should_continue": True,
    }

    print(f"  优先类别: {state['collection_strategy']['priority_categories']}")
    print(f"\n  开始搜索论文并提取攻击信息 (约需 15-40 秒)...\n")

    result = await paper_analyzer_node(state)

    raw_intel = result.get("raw_intel", [])
    print(f"\n{'=' * 60}")
    print(f"提取结果: 共 {len(raw_intel)} 条有效情报 (低相关性论文已过滤)")
    print(f"{'=' * 60}")

    for i, item in enumerate(raw_intel, 1):
        print(f"\n  [{i}] {item.get('title', 'N/A')[:80]}")
        print(f"      攻击类型: {item.get('attack_type', 'N/A')}")
        print(f"      严重性: {item.get('severity_estimate', 'N/A')}")
        print(f"      相关性: {item.get('relevance_score', 'N/A')}")
        targets = item.get("target_systems", [])
        if targets:
            print(f"      目标系统: {', '.join(targets[:3])}")
        findings = item.get("key_findings", [])
        if findings:
            print(f"      关键发现: {findings[0][:100]}...")
        print(f"      链接: {item.get('url', 'N/A')}")

    print(f"\n{'=' * 60}")
    print("Paper Analyzer Agent 验证完成!")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
