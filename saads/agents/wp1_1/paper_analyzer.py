"""
WP1-1 Paper Analyzer Agent — 搜索并解析 AI 安全学术论文。

数据源:
  - arXiv (AI security 论文)

工具:
  - search_arxiv: 搜索论文
  - LLM (get_fast_llm): 从论文摘要中提取结构化攻击信息

节点函数: paper_analyzer_node(state) -> dict
  根据 state.collection_strategy 中的关键词搜索 arXiv 论文，
  使用 LLM 从摘要中提取攻击方法、影响范围等结构化信息，
  将结果追加到 state.raw_intel。
"""

from __future__ import annotations

import json

from langchain_core.messages import HumanMessage

from saads.agents.wp1_1.state import IntelState
from saads.tools.api_tools import _search_arxiv_impl
from saads.config import get_fast_llm
from saads.utils.logging import setup_logger

logger = setup_logger("wp1_1.paper_analyzer")

EXTRACT_PROMPT = """\
You are an AI security researcher. Analyze the following academic paper and extract security threat intelligence.

Paper title: {title}
Authors: {authors}
Categories: {categories}
Published: {published}

Abstract:
{summary}

Extract the following information as JSON:
{{
    "attack_type": "the type of attack described (e.g., prompt injection, jailbreak, data poisoning, etc.)",
    "attack_description": "1-2 sentence description of the attack method",
    "target_systems": ["list of AI systems or frameworks affected"],
    "severity_estimate": "critical/high/medium/low based on potential impact",
    "key_findings": ["list of 2-3 key findings from the paper"],
    "defense_suggestions": ["list of 1-2 suggested defenses if mentioned"],
    "relevance_score": <float 0-1, how relevant is this paper to LLM security>
}}

If the paper is NOT about AI/LLM security attacks, set relevance_score to 0.0 and leave other fields as empty strings/lists.
Respond with ONLY valid JSON, no markdown.
"""

# arXiv 分类中与 AI 安全相关的标签
SECURITY_RELEVANT_CATEGORIES = {
    "cs.CR",  # Cryptography and Security
    "cs.AI",  # Artificial Intelligence
    "cs.CL",  # Computation and Language
    "cs.LG",  # Machine Learning
    "cs.CV",  # Computer Vision
    "cs.SE",  # Software Engineering
}

# 更精确的搜索查询模板 — 使用 arXiv 布尔查询语法
# 多词概念用引号括起来, 用 AND 连接, 确保搜索精确
ARXIV_SEARCH_QUERIES = {
    "prompt_injection": 'all:"prompt injection" AND all:LLM',
    "jailbreak": 'all:jailbreak AND all:"language model"',
    "info_leakage": 'all:"information leakage" AND all:LLM',
    "multimodal": 'all:adversarial AND all:multimodal AND all:"language model"',
    "dos": 'all:"denial of service" AND all:AI',
    "agent_hijack": "all:agent AND all:hijack AND all:LLM",
    "general": "all:LLM AND all:security AND all:attack",
}


async def paper_analyzer_node(state: IntelState) -> dict:
    """
    Paper Analyzer Agent 节点。

    从 state.collection_strategy 读取:
      - keywords: list[str] — 搜索关键词
      - priority_categories: list[str] — 优先采集的攻击类别
      - max_per_source: int — 每次搜索最大结果数

    返回:
      - raw_intel: list[dict] — 从论文提取的结构化情报
    """
    strategy = state.get("collection_strategy", {})
    keywords = strategy.get("keywords", ["LLM security attack"])
    priority_categories = strategy.get("priority_categories", [])
    max_per_source = strategy.get("max_per_source", 5)

    # 构建搜索查询列表
    queries = []
    # 先从优先类别构建精确查询
    for cat in priority_categories:
        if cat in ARXIV_SEARCH_QUERIES:
            queries.append(ARXIV_SEARCH_QUERIES[cat])
    # 再加上通用关键词
    for kw in keywords:
        if kw not in queries:
            queries.append(kw)

    if not queries:
        queries = [ARXIV_SEARCH_QUERIES["general"]]

    llm = get_fast_llm()
    raw_intel: list[dict] = []

    for query in queries[:3]:  # 最多搜索 3 个查询
        logger.info("arXiv: searching '%s'", query)

        try:
            result = _search_arxiv_impl(query, max_results=max_per_source)
            papers = json.loads(result)

            if not isinstance(papers, list):
                logger.warning("arXiv: unexpected result for '%s'", query)
                continue

            logger.info("arXiv: got %d papers for '%s'", len(papers), query)

            for paper in papers:
                title = paper.get("title", "")
                summary = paper.get("summary", "")
                authors = ", ".join(paper.get("authors", [])[:5])
                categories = ", ".join(paper.get("categories", []))
                published = paper.get("published", "")

                # 使用 LLM 提取攻击信息
                prompt = EXTRACT_PROMPT.format(
                    title=title,
                    authors=authors,
                    categories=categories,
                    published=published,
                    summary=summary,
                )

                try:
                    resp = await llm.ainvoke([HumanMessage(content=prompt)])
                    resp_text = str(resp.content or "")

                    # 解析 JSON
                    json_start = resp_text.find("{")
                    json_end = resp_text.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        extracted = json.loads(resp_text[json_start:json_end])
                    else:
                        logger.warning(
                            "Paper: could not parse LLM response for '%s'", title[:50]
                        )
                        continue

                    # 过滤低相关性论文
                    relevance = float(extracted.get("relevance_score", 0))
                    if relevance < 0.3:
                        logger.info(
                            "Paper: skipping '%s' (relevance=%.1f)",
                            title[:50],
                            relevance,
                        )
                        continue

                    # 构建原始情报条目
                    intel_item = {
                        "title": title,
                        "description": extracted.get(
                            "attack_description", summary[:300]
                        ),
                        "attack_type": extracted.get("attack_type", ""),
                        "target_systems": extracted.get("target_systems", []),
                        "severity_estimate": extracted.get(
                            "severity_estimate", "medium"
                        ),
                        "key_findings": extracted.get("key_findings", []),
                        "defense_suggestions": extracted.get("defense_suggestions", []),
                        "relevance_score": relevance,
                        "authors": paper.get("authors", []),
                        "categories": paper.get("categories", []),
                        "url": paper.get("url", ""),
                        "pdf_url": paper.get("pdf_url", ""),
                        "published": published,
                        "_source_type": "arxiv",
                        "_keyword": query,
                        "source": "arxiv",
                    }
                    raw_intel.append(intel_item)
                    logger.info(
                        "Paper: extracted intel from '%s' (type=%s, relevance=%.1f)",
                        title[:50],
                        extracted.get("attack_type", "?"),
                        relevance,
                    )

                except Exception as e:
                    logger.error(
                        "Paper: LLM extraction failed for '%s': %s", title[:50], e
                    )

        except Exception as e:
            logger.error("arXiv: error searching '%s': %s", query, e)

    logger.info("Paper Analyzer: extracted %d intel items from papers", len(raw_intel))
    return {"raw_intel": raw_intel}
