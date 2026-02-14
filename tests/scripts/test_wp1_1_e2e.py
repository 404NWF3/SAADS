"""
=== SAADS WP1-1 验证脚本: 端到端 LangGraph 集成 ===

功能: 验证 WP1-1 完整 LangGraph 图的编译和运行

本脚本有三种运行模式:
  模式 1 (--compile-only): 仅验证图编译 — 不需要任何 API key
  模式 2 (--dark-web-only): 仅 dark_web mock 数据流 — 需要 OPENAI_API_KEY (standardizer 用)
  模式 3 (默认/--full): 完整采集流 — 需要 OPENAI_API_KEY, 可选 NVD/GitHub key

前置配置:
  1. 复制 .env.example 为 .env
  2. 模式 1: 无需配置
  3. 模式 2: OPENAI_API_KEY=sk-xxx
  4. 模式 3: OPENAI_API_KEY + (可选) NVD_API_KEY + GITHUB_TOKEN

运行方式:
  python tests/scripts/test_wp1_1_e2e.py --compile-only    # 仅编译测试
  python tests/scripts/test_wp1_1_e2e.py --dark-web-only   # dark_web + standardizer
  python tests/scripts/test_wp1_1_e2e.py --full             # 完整流程 (默认)

预期输出:
  - 模式 1: 图编译成功, 节点/边正确
  - 模式 2: dark_web → standardizer → 攻击池写入 (约 10-30 秒)
  - 模式 3: web_crawler + dark_web → standardizer → 攻击池 (约 1-3 分钟)
"""

import sys
import asyncio
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))


def test_compile():
    """模式 1: 仅验证图编译"""
    from saads.agents.wp1_1.graph import build_wp1_1_graph

    print("\n--- Test: Graph Compilation ---\n")

    # 编译完整图
    graph_full = build_wp1_1_graph(
        enable_web_crawler=True,
        enable_paper_analyzer=True,
        enable_dark_web=True,
    )
    print(f"  Full graph compiled: OK")

    # 编译最小图 (仅 dark_web)
    graph_min = build_wp1_1_graph(
        enable_web_crawler=False,
        enable_paper_analyzer=False,
        enable_dark_web=True,
    )
    print(f"  Minimal graph (dark_web only) compiled: OK")

    # 编译双节点图
    graph_duo = build_wp1_1_graph(
        enable_web_crawler=True,
        enable_paper_analyzer=False,
        enable_dark_web=True,
    )
    print(f"  Duo graph (web_crawler + dark_web) compiled: OK")

    # 验证图结构 — 使用 get_graph() 获取可视化信息
    try:
        graph_viz = graph_full.get_graph()
        node_names = [n.id for n in graph_viz.nodes.values()]
        print(f"\n  Nodes: {node_names}")

        edge_strs = []
        for edge in graph_viz.edges:
            edge_strs.append(f"{edge.source} -> {edge.target}")
        print(f"  Edges ({len(edge_strs)}):")
        for e in edge_strs:
            print(f"    {e}")
    except Exception as e:
        print(f"  (graph visualization not available: {e})")

    print(f"\n  [OK] Graph compilation test passed")
    return True


async def test_dark_web_only():
    """模式 2: dark_web only 流程"""
    from saads.agents.wp1_1.graph import build_wp1_1_graph

    print("\n--- Test: Dark Web Only Flow ---\n")
    print(
        "  This test runs: supervisor_plan → dark_web → standardizer → supervisor_eval"
    )
    print("  It requires OPENAI_API_KEY for the standardizer node.\n")

    graph = build_wp1_1_graph(
        enable_web_crawler=False,
        enable_paper_analyzer=False,
        enable_dark_web=True,
    )

    initial_state = {
        "messages": [],
        "collection_strategy": {},
        "raw_intel": [],
        "standardized_entries": [],
        "coverage_report": {},
        "iteration": 0,
        "should_continue": True,
    }

    print("  Running graph...\n")

    try:
        result = await graph.ainvoke(initial_state)

        entries = result.get("standardized_entries", [])
        coverage = result.get("coverage_report", {})
        analysis = coverage.get("_analysis", {})
        iteration = result.get("iteration", 0)

        print(f"\n  Results:")
        print(f"    Iterations completed: {iteration}")
        print(f"    Standardized entries: {len(entries)}")
        print(f"    OWASP coverage: {analysis.get('coverage_pct', 0.0):.1f}%")
        print(f"    Categories present: {analysis.get('categories_present', [])}")
        print(f"    Raw intel collected: {len(result.get('raw_intel', []))}")

        if entries:
            print(f"\n  Sample entries:")
            for e in entries[:5]:
                print(
                    f"    {e.attack_id} | {e.category} | {e.metadata.severity_estimate}"
                )

        print(f"\n  [OK] Dark web only flow completed")
        return True

    except Exception as e:
        print(f"\n  [ERROR] Flow failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_full():
    """模式 3: 完整流程"""
    from saads.agents.wp1_1.graph import run_wp1_1
    from saads.config import OPENAI_API_KEY, NVD_API_KEY, GITHUB_TOKEN

    print("\n--- Test: Full WP1-1 Flow ---\n")
    print(f"  OPENAI_API_KEY: {'set' if OPENAI_API_KEY else 'NOT SET'}")
    print(f"  NVD_API_KEY:    {'set' if NVD_API_KEY else 'not set (optional)'}")
    print(f"  GITHUB_TOKEN:   {'set' if GITHUB_TOKEN else 'not set (optional)'}")

    if not OPENAI_API_KEY:
        print("\n  [SKIP] OPENAI_API_KEY required for full flow")
        return False

    enable_paper = bool(OPENAI_API_KEY)
    print(f"  paper_analyzer: {'enabled' if enable_paper else 'disabled'}")
    print(f"\n  Running full WP1-1 pipeline (this may take 1-3 minutes)...\n")

    try:
        result = await run_wp1_1(
            enable_web_crawler=True,
            enable_paper_analyzer=enable_paper,
            enable_dark_web=True,
        )

        entries = result.get("standardized_entries", [])
        coverage = result.get("coverage_report", {})
        analysis = coverage.get("_analysis", {})
        iteration = result.get("iteration", 0)

        print(f"\n  Final Results:")
        print(f"    Iterations: {iteration}")
        print(f"    Entries: {len(entries)}")
        print(f"    OWASP coverage: {analysis.get('coverage_pct', 0.0):.1f}%")
        print(f"    Category distribution: {analysis.get('category_counts', {})}")

        print(f"\n  [OK] Full WP1-1 flow completed")
        return True

    except Exception as e:
        print(f"\n  [ERROR] Full flow failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def main():
    print("=" * 60)
    print("SAADS — WP1-1 端到端集成验证")
    print("=" * 60)

    args = sys.argv[1:]
    mode = "full"
    if "--compile-only" in args:
        mode = "compile"
    elif "--dark-web-only" in args:
        mode = "dark-web"
    elif "--full" in args:
        mode = "full"

    print(f"  Mode: {mode}")

    # 模式 1: 编译测试 (始终运行)
    compile_ok = test_compile()

    if mode == "compile":
        print(f"\n{'=' * 60}")
        print(f"  Result: {'PASS' if compile_ok else 'FAIL'}")
        print(f"{'=' * 60}")
        return

    # 模式 2: dark_web only
    if mode in ("dark-web", "full"):
        from saads.config import OPENAI_API_KEY

        if OPENAI_API_KEY:
            dw_ok = await test_dark_web_only()
        else:
            print("\n--- Dark Web Only Flow --- [SKIP: no OPENAI_API_KEY]")
            dw_ok = None

    # 模式 3: 完整流程
    if mode == "full":
        full_ok = await test_full()
    else:
        full_ok = None

    print(f"\n{'=' * 60}")
    print("WP1-1 端到端验证完成!")
    print(f"{'=' * 60}")
    print(f"  Graph compilation:   {'PASS' if compile_ok else 'FAIL'}")
    if mode in ("dark-web", "full"):
        status = "PASS" if dw_ok else ("SKIP" if dw_ok is None else "FAIL")
        print(f"  Dark web only flow:  {status}")
    if mode == "full":
        status = "PASS" if full_ok else ("SKIP" if full_ok is None else "FAIL")
        print(f"  Full flow:           {status}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
