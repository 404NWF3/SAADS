"""
WP1-1 情报采集智能体 — LangGraph 状态定义。
"""

from __future__ import annotations

from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages

from saads.models.attack import AttackEntry


class IntelState(TypedDict):
    """情报采集智能体的全局状态。"""

    # LangGraph 消息列表（Agent 之间的对话记录）
    messages: Annotated[list, add_messages]

    # Supervisor 生成的采集策略
    # {"priority_categories": [...], "target_sources": [...], "keywords": [...]}
    collection_strategy: dict

    # 各 Crawler Agent 返回的原始情报数据
    raw_intel: list[dict]

    # Standardizer Agent 标准化后的攻击条目
    standardized_entries: list[AttackEntry]

    # OWASP LLM Top 10 覆盖率报告
    coverage_report: dict

    # 当前迭代轮次
    iteration: int

    # 是否继续采集（由 Supervisor 决定）
    should_continue: bool
