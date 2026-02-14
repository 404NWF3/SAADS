"""
WP1-1 Intel Supervisor — 分析攻击池覆盖率，决定采集策略。

Supervisor 是 WP1-1 的核心决策节点，负责两个阶段:

阶段 1 — 策略生成 (supervisor_plan_node):
  1. 读取 attack_pool 现有条目
  2. 使用 owasp_taxonomy.compute_coverage() 分析 OWASP LLM Top 10 覆盖率
  3. 识别覆盖率最低/缺失的攻击类别
  4. 生成采集策略: priority_categories, target_sources, keywords, max_per_source

阶段 2 — 评估决策 (supervisor_eval_node):
  1. 接收 Standardizer 返回的标准化结果
  2. 重新计算覆盖率
  3. 决定是否继续迭代 (should_continue)
  4. 如果继续，更新采集策略聚焦于仍缺失的类别

决策规则:
  - 最大迭代次数: MAX_ITERATIONS (默认 3)
  - 覆盖率目标: TARGET_COVERAGE_PCT (默认 60%)
  - 如果本轮新增 0 条且已迭代 >= 2 次，停止
"""

from __future__ import annotations

from saads.agents.wp1_1.state import IntelState
from saads.knowledge_base.attack_pool_store import AttackPoolStore
from saads.utils.logging import setup_logger
from saads.utils.owasp_taxonomy import compute_coverage, OWASP_LLM_TOP_10

logger = setup_logger("wp1_1.supervisor")

# ---------------------------------------------------------------------------
# 配置常量
# ---------------------------------------------------------------------------
MAX_ITERATIONS = 3
TARGET_COVERAGE_PCT = 60.0

# 每个攻击类别对应的推荐搜索关键词
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "prompt_injection": [
        "prompt injection attack LLM",
        "indirect prompt injection RAG",
    ],
    "jailbreak": [
        "jailbreak large language model",
        "LLM safety bypass technique",
    ],
    "info_leakage": [
        "system prompt extraction",
        "training data leakage LLM",
    ],
    "multimodal": [
        "adversarial image attack vision language model",
        "multimodal LLM adversarial",
    ],
    "dos": [
        "denial of service AI model",
        "LLM resource exhaustion attack",
    ],
    "agent_hijack": [
        "AI agent hijacking tool use",
        "LangChain agent exploitation",
    ],
}

# 每个攻击类别推荐的数据源
CATEGORY_SOURCES: dict[str, list[str]] = {
    "prompt_injection": [
        "nvd",
        "github",
        "arxiv",
        "darkweb",
        "reddit",
        "hackernews",
        "huggingface",
        "alienvault",
    ],
    "jailbreak": [
        "arxiv",
        "darkweb",
        "reddit",
        "hackernews",
        "huggingface",
    ],
    "info_leakage": [
        "nvd",
        "github",
        "darkweb",
        "exploitdb",
        "alienvault",
    ],
    "multimodal": [
        "arxiv",
        "darkweb",
        "reddit",
        "huggingface",
    ],
    "dos": [
        "nvd",
        "github",
        "exploitdb",
        "alienvault",
    ],
    "agent_hijack": [
        "github",
        "arxiv",
        "darkweb",
        "hackernews",
        "huggingface",
    ],
}


def _analyze_coverage(store: AttackPoolStore | None = None) -> dict:
    """
    分析攻击池的 OWASP LLM Top 10 覆盖率。

    Returns:
        coverage_report: compute_coverage() 的输出 + 额外的分析信息
    """
    if store is None:
        store = AttackPoolStore()

    all_entries = store.list_all()
    categories_present = {e.category for e in all_entries}
    category_counts = store.category_distribution()

    coverage = compute_coverage(categories_present)
    summary = coverage.get("summary", {})

    # 识别缺失和薄弱的类别
    uncovered_owasp = []
    for cat in OWASP_LLM_TOP_10:
        info = coverage.get(cat.id, {})
        if not info.get("covered", False) and cat.related_attack_categories:
            uncovered_owasp.append(
                {
                    "owasp_id": cat.id,
                    "name": cat.name,
                    "missing_categories": list(cat.related_attack_categories),
                }
            )

    # 所有 6 个 attack categories 中缺失的
    all_categories = {
        "prompt_injection",
        "jailbreak",
        "info_leakage",
        "multimodal",
        "dos",
        "agent_hijack",
    }
    missing_categories = all_categories - categories_present

    # 薄弱类别 (数量 < 3)
    weak_categories = [
        cat
        for cat in all_categories
        if category_counts.get(cat, 0) < 3 and cat not in missing_categories
    ]

    analysis = {
        "total_entries": len(all_entries),
        "categories_present": sorted(categories_present),
        "category_counts": category_counts,
        "coverage_pct": summary.get("coverage_pct", 0.0),
        "owasp_covered": summary.get("covered", 0),
        "owasp_total": summary.get("total", 10),
        "missing_categories": sorted(missing_categories),
        "weak_categories": sorted(weak_categories),
        "uncovered_owasp": uncovered_owasp,
    }

    return {**coverage, "_analysis": analysis}


def _generate_strategy(coverage_report: dict) -> dict:
    """
    根据覆盖率分析生成采集策略。

    Returns:
        collection_strategy dict:
            priority_categories, target_sources, keywords, max_per_source
    """
    analysis = coverage_report.get("_analysis", {})
    missing = analysis.get("missing_categories", [])
    weak = analysis.get("weak_categories", [])

    # 优先级: 缺失类别 > 薄弱类别
    priority_categories = missing + [c for c in weak if c not in missing]

    if not priority_categories:
        # 所有类别都有了，但可能需要增加深度
        priority_categories = sorted(
            analysis.get("category_counts", {}).keys(),
            key=lambda c: analysis.get("category_counts", {}).get(c, 0),
        )[:3]

    # 聚合关键词和数据源
    keywords = []
    target_sources = set()

    for cat in priority_categories:
        kws = CATEGORY_KEYWORDS.get(cat, [])
        keywords.extend(kws)
        srcs = CATEGORY_SOURCES.get(cat, ["nvd", "arxiv"])
        target_sources.update(srcs)

    # 去重关键词
    seen = set()
    unique_keywords = []
    for kw in keywords:
        if kw not in seen:
            seen.add(kw)
            unique_keywords.append(kw)

    strategy = {
        "priority_categories": priority_categories,
        "target_sources": sorted(target_sources),
        "keywords": unique_keywords[:8],  # 限制关键词数量
        "max_per_source": 5,
    }

    return strategy


async def supervisor_plan_node(state: IntelState) -> dict:
    """
    Supervisor 策略规划节点 — 在采集开始前运行。

    分析当前攻击池覆盖率，生成采集策略。

    返回:
      - collection_strategy: dict — 采集策略
      - coverage_report: dict — 覆盖率报告
      - iteration: int — 当前迭代次数 (+1)
    """
    iteration = state.get("iteration", 0) + 1
    logger.info("Supervisor Plan: iteration %d/%d", iteration, MAX_ITERATIONS)

    # 分析覆盖率
    coverage_report = _analyze_coverage()
    analysis = coverage_report.get("_analysis", {})

    logger.info(
        "Supervisor Plan: attack_pool has %d entries, "
        "coverage %.1f%% (%d/%d OWASP categories)",
        analysis.get("total_entries", 0),
        analysis.get("coverage_pct", 0.0),
        analysis.get("owasp_covered", 0),
        analysis.get("owasp_total", 10),
    )

    if analysis.get("missing_categories"):
        logger.info(
            "Supervisor Plan: missing categories: %s", analysis["missing_categories"]
        )
    if analysis.get("weak_categories"):
        logger.info("Supervisor Plan: weak categories: %s", analysis["weak_categories"])

    # 生成策略
    strategy = _generate_strategy(coverage_report)

    logger.info("Supervisor Plan: strategy generated")
    logger.info("  priority_categories: %s", strategy["priority_categories"])
    logger.info("  target_sources: %s", strategy["target_sources"])
    logger.info(
        "  keywords (%d): %s", len(strategy["keywords"]), strategy["keywords"][:3]
    )

    return {
        "collection_strategy": strategy,
        "coverage_report": coverage_report,
        "iteration": iteration,
    }


async def supervisor_eval_node(state: IntelState) -> dict:
    """
    Supervisor 评估节点 — 在标准化完成后运行。

    重新计算覆盖率，决定是否继续采集迭代。

    返回:
      - should_continue: bool — 是否继续迭代
      - coverage_report: dict — 最新覆盖率报告
    """
    iteration = state.get("iteration", 0)
    prev_coverage = state.get("coverage_report", {})
    prev_analysis = prev_coverage.get("_analysis", {})
    prev_pct = prev_analysis.get("coverage_pct", 0.0)

    logger.info("Supervisor Eval: evaluating iteration %d results", iteration)

    # 重新分析覆盖率
    coverage_report = _analyze_coverage()
    analysis = coverage_report.get("_analysis", {})
    current_pct = analysis.get("coverage_pct", 0.0)

    logger.info(
        "Supervisor Eval: coverage %.1f%% -> %.1f%% (%d entries)",
        prev_pct,
        current_pct,
        analysis.get("total_entries", 0),
    )

    # 决策逻辑
    should_continue = True
    reason = ""

    # 条件 1: 达到最大迭代次数
    if iteration >= MAX_ITERATIONS:
        should_continue = False
        reason = f"reached max iterations ({MAX_ITERATIONS})"

    # 条件 2: 覆盖率已达标
    elif current_pct >= TARGET_COVERAGE_PCT:
        should_continue = False
        reason = (
            f"coverage target reached ({current_pct:.1f}% >= {TARGET_COVERAGE_PCT}%)"
        )

    # 条件 3: 本轮没有新增条目 (连续无进展)
    elif iteration >= 2 and analysis.get("total_entries", 0) == prev_analysis.get(
        "total_entries", 0
    ):
        should_continue = False
        reason = "no new entries in this iteration"

    else:
        reason = (
            f"continuing — coverage {current_pct:.1f}% < {TARGET_COVERAGE_PCT}%, "
            f"missing: {analysis.get('missing_categories', [])}"
        )

    logger.info("Supervisor Eval: should_continue=%s (%s)", should_continue, reason)

    return {
        "should_continue": should_continue,
        "coverage_report": coverage_report,
    }


def should_continue_collecting(state: IntelState) -> str:
    """
    LangGraph 条件路由函数。

    在 supervisor_eval_node 之后调用，决定是回到 supervisor_plan_node
    继续下一轮采集，还是结束流程。

    Returns:
        "continue" or "end"
    """
    if state.get("should_continue", False):
        return "continue"
    return "end"
