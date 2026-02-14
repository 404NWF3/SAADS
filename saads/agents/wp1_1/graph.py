"""
WP1-1 情报采集智能体 — LangGraph 图组装。

图结构 (带迭代循环):

  START → supervisor_plan → fan_out_collectors
       ├→ web_crawler ─┐
       ├→ paper_analyzer ─┤→ merge_raw_intel → standardizer → supervisor_eval
       └→ dark_web ────┘                                          │
                                                        ┌─────────┤
                                                        │ continue │ end
                                                        ↓         ↓
                                                supervisor_plan   END

节点:
  - supervisor_plan: 分析覆盖率, 生成采集策略
  - web_crawler: 爬取 NVD/GitHub/博客
  - paper_analyzer: 搜索 arXiv 论文
  - dark_web: 暗网 mock 数据
  - standardizer: 原始情报 → AttackEntry
  - supervisor_eval: 评估覆盖率, 决定是否继续

运行方式:
  from saads.agents.wp1_1.graph import build_wp1_1_graph
  graph = build_wp1_1_graph()
  result = await graph.ainvoke(initial_state)
"""

from __future__ import annotations

from langgraph.graph import StateGraph, START, END

from saads.agents.wp1_1.state import IntelState
from saads.agents.wp1_1.supervisor import (
    supervisor_plan_node,
    supervisor_eval_node,
    should_continue_collecting,
)
from saads.agents.wp1_1.web_crawler import web_crawler_node
from saads.agents.wp1_1.paper_analyzer import paper_analyzer_node
from saads.agents.wp1_1.dark_web import dark_web_node
from saads.agents.wp1_1.standardizer import standardizer_node
from saads.utils.logging import setup_logger

logger = setup_logger("wp1_1.graph")


# ---------------------------------------------------------------------------
# 合并节点: 将 3 个 collector 的 raw_intel 合并
# ---------------------------------------------------------------------------


async def merge_raw_intel_node(state: IntelState) -> dict:
    """
    合并多个采集 Agent 的结果。

    由于 LangGraph 使用列表追加语义 (add_messages 模式),
    raw_intel 已经由各节点自动合并。此节点只做日志记录。
    """
    raw_intel = state.get("raw_intel", [])
    logger.info("Merge: total raw_intel = %d items", len(raw_intel))

    # 按 source_type 统计
    by_source: dict[str, int] = {}
    for item in raw_intel:
        src = item.get("_source_type", "unknown")
        by_source[src] = by_source.get(src, 0) + 1

    logger.info("Merge: by source = %s", by_source)
    return {}  # 不修改 state, raw_intel 已由上游节点合并


# ---------------------------------------------------------------------------
# 图构建
# ---------------------------------------------------------------------------


def build_wp1_1_graph(
    enable_web_crawler: bool = True,
    enable_paper_analyzer: bool = True,
    enable_dark_web: bool = True,
):
    """
    构建 WP1-1 情报采集智能体的 LangGraph。

    Args:
        enable_web_crawler: 是否启用 Web Crawler (需要网络, NVD 速率限制)
        enable_paper_analyzer: 是否启用 Paper Analyzer (需要 OPENAI_API_KEY)
        enable_dark_web: 是否启用 Dark Web (mock 数据)

    Returns:
        编译后的 LangGraph 可执行对象
    """
    builder = StateGraph(IntelState)

    # --- 添加节点 ---
    builder.add_node("supervisor_plan", supervisor_plan_node)
    builder.add_node("supervisor_eval", supervisor_eval_node)
    builder.add_node("standardizer", standardizer_node)

    # 动态添加采集节点
    collector_nodes = []
    if enable_web_crawler:
        builder.add_node("web_crawler", web_crawler_node)
        collector_nodes.append("web_crawler")
    if enable_paper_analyzer:
        builder.add_node("paper_analyzer", paper_analyzer_node)
        collector_nodes.append("paper_analyzer")
    if enable_dark_web:
        builder.add_node("dark_web", dark_web_node)
        collector_nodes.append("dark_web")

    if not collector_nodes:
        raise ValueError("At least one collector must be enabled")

    # --- 添加边 ---
    # START → supervisor_plan
    builder.add_edge(START, "supervisor_plan")

    # supervisor_plan → 所有采集节点 (并行 fan-out)
    for node_name in collector_nodes:
        builder.add_edge("supervisor_plan", node_name)

    # 所有采集节点 → standardizer (fan-in)
    for node_name in collector_nodes:
        builder.add_edge(node_name, "standardizer")

    # standardizer → supervisor_eval
    builder.add_edge("standardizer", "supervisor_eval")

    # supervisor_eval → 条件路由
    builder.add_conditional_edges(
        "supervisor_eval",
        should_continue_collecting,
        {
            "continue": "supervisor_plan",
            "end": END,
        },
    )

    # --- 编译 ---
    graph = builder.compile()
    logger.info(
        "WP1-1 graph compiled: %d collector nodes, iterative loop enabled",
        len(collector_nodes),
    )

    return graph


# ---------------------------------------------------------------------------
# 快捷运行函数
# ---------------------------------------------------------------------------


async def run_wp1_1(
    enable_web_crawler: bool = True,
    enable_paper_analyzer: bool = False,  # 默认关闭 (需要 OPENAI_API_KEY)
    enable_dark_web: bool = True,
) -> dict:
    """
    运行 WP1-1 情报采集智能体。

    Args:
        enable_web_crawler: 启用 NVD/GitHub 采集
        enable_paper_analyzer: 启用 arXiv 论文分析 (需要 LLM)
        enable_dark_web: 启用暗网 mock 数据

    Returns:
        最终的 IntelState
    """
    logger.info("=" * 60)
    logger.info("Starting WP1-1 Intelligence Collection Agent")
    logger.info(
        "  web_crawler=%s, paper_analyzer=%s, dark_web=%s",
        enable_web_crawler,
        enable_paper_analyzer,
        enable_dark_web,
    )
    logger.info("=" * 60)

    graph = build_wp1_1_graph(
        enable_web_crawler=enable_web_crawler,
        enable_paper_analyzer=enable_paper_analyzer,
        enable_dark_web=enable_dark_web,
    )

    # 初始状态
    initial_state: dict = {
        "messages": [],
        "collection_strategy": {},
        "raw_intel": [],
        "standardized_entries": [],
        "coverage_report": {},
        "iteration": 0,
        "should_continue": True,
    }

    # 运行图
    result = await graph.ainvoke(initial_state)

    # 日志总结
    entries = result.get("standardized_entries", [])
    coverage = result.get("coverage_report", {})
    analysis = coverage.get("_analysis", {})

    logger.info("=" * 60)
    logger.info("WP1-1 completed after %d iterations", result.get("iteration", 0))
    logger.info("  Standardized entries: %d", len(entries))
    logger.info("  OWASP coverage: %.1f%%", analysis.get("coverage_pct", 0.0))
    logger.info("=" * 60)

    return result
