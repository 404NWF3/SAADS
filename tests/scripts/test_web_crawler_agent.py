"""
=== SAADS WP1-1 验证脚本: Web Crawler Agent ===

功能: 验证 Web Crawler Agent 能否从多个数据源采集安全情报

前置配置:
  1. 复制 .env.example 为 .env (如果还没有)
  2. (可选) NVD_API_KEY=your_key   — 提升 NVD 速率
  3. (可选) GITHUB_TOKEN=ghp_xxx   — 启用 GitHub GraphQL 搜索
  4. (可选) HF_TOKEN=hf_xxx        — 提升 HuggingFace API 速率
  5. 无需 OPENAI_API_KEY (本脚本不使用 LLM)

运行方式:
  uv run python tests/scripts/test_web_crawler_agent.py

数据源:
  - NVD (需等待 2 秒/请求)
  - GitHub Advisories (需要 GITHUB_TOKEN)
  - Reddit RSS (公开，无需 key)
  - HackerNews (Algolia API, 公开)
  - HuggingFace (Models + Papers, 公开)
  - Exploit-DB (占位符)
  - AlienVault OTX (需要 ALIENVAULT_API_KEY)
  - VirusTotal (需要 VIRUSTOTAL_API_KEY)

预期输出:
  - 从各数据源采集 LLM 安全相关情报
  - 打印采集到的原始情报数量和内容摘要
  - 整个过程约需 20-60 秒（含等待时间）
"""

import sys
import asyncio
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from saads.agents.wp1_1.web_crawler import web_crawler_node


async def main():
    print("=" * 60)
    print("SAADS — Web Crawler Agent 验证")
    print("=" * 60)

    # 检查配置
    from saads.config import NVD_API_KEY, GITHUB_TOKEN

    print(f"\n  NVD_API_KEY:   {'已配置' if NVD_API_KEY else '未配置 (可选)'}")
    print(
        f"  GITHUB_TOKEN:  {'已配置' if GITHUB_TOKEN else '未配置 (GitHub 搜索将跳过)'}"
    )

    # 无需 key 的数据源直接启用
    target_sources = ["nvd", "hackernews", "huggingface", "reddit", "exploitdb"]
    if GITHUB_TOKEN:
        target_sources.append("github")

    # 检查可选 key
    import os

    if os.getenv("ALIENVAULT_API_KEY"):
        target_sources.append("alienvault")
        print(f"  ALIENVAULT:    已配置")
    else:
        print(f"  ALIENVAULT:    未配置 (跳过)")

    if os.getenv("VIRUSTOTAL_API_KEY"):
        target_sources.append("virustotal")
        print(f"  VIRUSTOTAL:    已配置")
    else:
        print(f"  VIRUSTOTAL:    未配置 (跳过)")

    if os.getenv("HF_TOKEN"):
        print(f"  HF_TOKEN:      已配置 (HuggingFace 速率提升)")
    else:
        print(f"  HF_TOKEN:      未配置 (HuggingFace 使用公开端点)")

    state = {
        "messages": [],
        "collection_strategy": {
            "keywords": ["prompt injection LLM"],
            "target_sources": target_sources,
            "max_per_source": 3,
        },
        "raw_intel": [],
        "standardized_entries": [],
        "coverage_report": {},
        "iteration": 0,
        "should_continue": True,
    }

    print(f"\n  搜索关键词: {state['collection_strategy']['keywords']}")
    print(f"  目标数据源: {target_sources}")
    print(f"\n  开始采集 (可能需要 10-20 秒)...\n")

    # 调用 Web Crawler Agent
    result = await web_crawler_node(state)

    raw_intel = result.get("raw_intel", [])
    print(f"\n{'=' * 60}")
    print(f"采集结果: 共 {len(raw_intel)} 条原始情报")
    print(f"{'=' * 60}")

    # 按数据源分组统计
    by_source = {}
    for item in raw_intel:
        src = item.get("_source_type", "unknown")
        by_source.setdefault(src, []).append(item)

    for src, items in by_source.items():
        print(f"\n--- {src.upper()} ({len(items)} 条) ---")
        for i, item in enumerate(items[:5], 1):
            title = (
                item.get("cve_id") or item.get("ghsa_id") or item.get("title", "N/A")
            )
            desc = item.get("description") or item.get("summary") or ""
            # 过滤掉可能导致 Windows 控制台编码错误的非 ASCII 字符
            title_safe = title.encode("ascii", errors="replace").decode("ascii")
            desc_safe = desc[:100].encode("ascii", errors="replace").decode("ascii")
            print(f"  [{i}] {title_safe}")
            print(f"      {desc_safe}...")

    print(f"\n{'=' * 60}")
    print("Web Crawler Agent 验证完成!")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
