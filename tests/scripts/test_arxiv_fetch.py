"""
=== SAADS WP1-1 验证脚本: arXiv 论文搜索 ===

功能: 验证从 arXiv 搜索 AI 安全相关论文是否正常

前置配置:
  1. 无需任何配置! arXiv API 完全公开，无需 API key。
  2. 仅需网络连接。

运行方式:
  python tests/scripts/test_arxiv_fetch.py

预期输出:
  - 搜索 "prompt injection attack LLM" 相关的论文列表
  - 每条包含: 标题、作者、分类、发布日期、摘要
"""

import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

import json
from saads.tools.api_tools import _search_arxiv_impl


def main():
    print("=" * 60)
    print("SAADS — arXiv 论文搜索验证")
    print("=" * 60)
    print("\n[INFO] arXiv API 无需配置，直接使用\n")

    # --- 测试 1: 搜索提示词注入相关论文 ---
    print("--- 测试 1: 搜索 'prompt injection attack LLM' ---")
    result = _search_arxiv_impl("prompt injection attack LLM", max_results=5)

    try:
        data = json.loads(result)
        if isinstance(data, list):
            print(f"找到 {len(data)} 篇论文\n")
            for i, paper in enumerate(data, 1):
                print(f"  [{i}] {paper.get('title', 'N/A')}")
                authors = paper.get("authors", [])
                if authors:
                    author_str = ", ".join(authors[:3])
                    if len(authors) > 3:
                        author_str += f" et al. ({len(authors)} authors)"
                    print(f"      作者: {author_str}")
                cats = paper.get("categories", [])
                if cats:
                    print(f"      分类: {', '.join(cats)}")
                print(f"      发布: {paper.get('published', 'N/A')[:10]}")
                print(f"      链接: {paper.get('url', 'N/A')}")
                summary = paper.get("summary", "")
                if summary:
                    print(f"      摘要: {summary[:150]}...")
                print()
        else:
            print(f"返回结果: {result[:500]}")
    except json.JSONDecodeError:
        print(f"返回非 JSON 结果: {result[:500]}")

    # --- 测试 2: 搜索越狱攻击论文 ---
    print("--- 测试 2: 搜索 'jailbreak large language model' ---")
    result2 = _search_arxiv_impl("jailbreak large language model", max_results=3)

    try:
        data2 = json.loads(result2)
        if isinstance(data2, list):
            print(f"找到 {len(data2)} 篇论文\n")
            for i, paper in enumerate(data2, 1):
                print(f"  [{i}] {paper.get('title', 'N/A')}")
                print(
                    f"      发布: {paper.get('published', 'N/A')[:10]} | 分类: {', '.join(paper.get('categories', [])[:2])}"
                )
                print()
        else:
            print(f"返回结果: {result2[:500]}")
    except json.JSONDecodeError:
        print(f"返回非 JSON 结果: {result2[:500]}")

    print("=" * 60)
    print("arXiv API 验证完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
