"""
SAADS — 多智能体 AI 系统态势感知与自动化防御系统

CLI 入口点。

用法:
    python main.py                  # 显示帮助
    python main.py run-all          # 运行完整 pipeline (WP1-1 → WP1-2)
    python main.py run-wp1-1        # 只运行情报采集智能体
    python main.py run-wp1-2        # 只运行渗透测试智能体
    python main.py stats            # 打印攻击池统计和 OWASP 覆盖率
    python main.py serve            # 启动 FastAPI 服务器
"""

from __future__ import annotations

import sys


def print_help() -> None:
    """打印帮助信息。"""
    print(
        """
SAADS - AI System Situational Awareness & Automated Defense System
==================================================================

Usage: python main.py <command>

Commands:
    run-all     Run the full pipeline (WP1-1 → WP1-2)
    run-wp1-1   Run only the Intelligence Collection Agent
    run-wp1-2   Run only the Penetration Testing Agent
    stats       Print attack pool statistics and OWASP coverage
    serve       Start the FastAPI API server

Options:
    --help      Show this help message
"""
    )


def cmd_stats() -> None:
    """打印攻击池统计和 OWASP 覆盖率。"""
    import json
    from saads.knowledge_base import AttackPoolStore, TestScriptsStore, VulnReportsStore
    from saads.utils.owasp_taxonomy import compute_coverage

    attack_pool = AttackPoolStore()
    test_scripts = TestScriptsStore()
    vuln_reports = VulnReportsStore()

    print("\n=== SAADS Knowledge Base Statistics ===\n")

    # 攻击池
    print(f"Attack Pool:    {attack_pool.count()} entries")
    cat_dist = attack_pool.category_distribution()
    if cat_dist:
        for cat, n in sorted(cat_dist.items()):
            print(f"  - {cat}: {n}")

    # 测试脚本
    print(f"\nTest Scripts:   {test_scripts.count()} scripts")
    script_dist = test_scripts.count_by_category()
    if script_dist:
        for cat, n in sorted(script_dist.items()):
            print(f"  - {cat}: {n}")

    # 漏洞报告
    print(f"\nVuln Reports:   {vuln_reports.count()} reports")
    status_dist = vuln_reports.status_distribution()
    if status_dist:
        for status, n in sorted(status_dist.items()):
            print(f"  - {status}: {n}")

    # OWASP 覆盖率
    categories_present = set(cat_dist.keys())
    coverage = compute_coverage(categories_present)
    summary = coverage.pop("summary", {})
    print(f"\n=== OWASP LLM Top 10 Coverage ===\n")
    print(
        f"Coverage: {summary.get('covered', 0)}/{summary.get('total', 10)} ({summary.get('coverage_pct', 0)}%)\n"
    )
    for owasp_id, info in sorted(coverage.items()):
        if isinstance(info, dict):
            status = "COVERED" if info.get("covered") else "  ---  "
            print(f"  {owasp_id}: [{status}] {info.get('name', '')}")

    print()


def cmd_run_wp1_1() -> None:
    """运行 WP1-1 情报采集智能体。"""
    import asyncio
    from saads.agents.wp1_1.graph import run_wp1_1
    from saads.config import OPENAI_API_KEY

    # 根据配置决定启用哪些模块
    enable_paper = bool(OPENAI_API_KEY)
    # standardizer_node 需要 LLM — 如果没有 OPENAI_API_KEY,
    # 只运行 dark_web (mock) + 使用 standardize_without_llm 的离线模式
    # 但完整图需要 LLM。如果没有 key, 提示用户。
    if not OPENAI_API_KEY:
        print("WARNING: OPENAI_API_KEY not set.")
        print("  - Paper Analyzer: DISABLED (needs LLM)")
        print("  - Standardizer: will use LLM — may fail without key")
        print("  Tip: Set OPENAI_API_KEY in .env for full functionality.\n")

    print("Starting WP1-1 Intelligence Collection Agent...\n")
    result = asyncio.run(
        run_wp1_1(
            enable_web_crawler=True,
            enable_paper_analyzer=enable_paper,
            enable_dark_web=True,
        )
    )

    # 打印结果摘要
    entries = result.get("standardized_entries", [])
    coverage = result.get("coverage_report", {})
    analysis = coverage.get("_analysis", {})
    iteration = result.get("iteration", 0)

    print(f"\n{'=' * 60}")
    print(f"WP1-1 Complete")
    print(f"{'=' * 60}")
    print(f"  Iterations:     {iteration}")
    print(f"  Entries added:  {len(entries)}")
    print(f"  OWASP coverage: {analysis.get('coverage_pct', 0.0):.1f}%")
    print(f"{'=' * 60}")


def cmd_run_wp1_2() -> None:
    """运行 WP1-2 渗透测试智能体。"""
    print("WP1-2 Penetration Testing Agent — Not yet implemented.")
    print("See saads/agents/wp1_2/graph.py for the planned implementation.")


def cmd_run_all() -> None:
    """运行完整 pipeline。"""
    print("Running full pipeline: WP1-1 → WP1-2\n")
    cmd_run_wp1_1()
    print()
    cmd_run_wp1_2()


def cmd_serve() -> None:
    """启动 FastAPI 服务器。"""
    print("FastAPI server — Not yet implemented.")
    print("This will be implemented in Phase 3.")


def main() -> None:
    """CLI 主入口。"""
    args = sys.argv[1:]

    if not args or "--help" in args:
        print_help()
        return

    command = args[0]

    commands = {
        "run-all": cmd_run_all,
        "run-wp1-1": cmd_run_wp1_1,
        "run-wp1-2": cmd_run_wp1_2,
        "stats": cmd_stats,
        "serve": cmd_serve,
    }

    fn = commands.get(command)
    if fn is None:
        print(f"Unknown command: {command}")
        print_help()
        sys.exit(1)

    fn()


if __name__ == "__main__":
    main()
