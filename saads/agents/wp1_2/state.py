"""
WP1-2 渗透测试智能体 — LangGraph 状态定义。

WP1-2 是通用层的纯测试方案/脚本生成器：
  - 从 attack_pool/ 读取攻击条目
  - 生成通用测试方案 + 测试脚本
  - 写入 test_scripts/
  - 不连接任何被测应用，不验证漏洞，不产出 VulnReport
"""

from __future__ import annotations

from typing import Annotated, TypedDict

from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages

from saads.models.attack import AttackEntry


class TestPlanEvaluation(BaseModel):
    """Judge Agent 对测试方案的质量评估结果。"""

    script_id: str
    source_attack_id: str
    quality_score: float = Field(ge=0.0, le=1.0, description="脚本质量评分 0~1")
    estimated_cvss: float = Field(
        ge=0.0, le=10.0, description="基于攻击类型的理论预估 CVSS 评分"
    )
    completeness: float = Field(ge=0.0, le=1.0, description="测试方案完整性评分")
    feasibility: float = Field(ge=0.0, le=1.0, description="可执行性评分")
    remediation_hints: list[str] = Field(
        default_factory=list, description="通用修复建议（非针对特定应用）"
    )
    feedback: str = Field(default="", description="LLM 给出的改进建议")


class RedTeamState(TypedDict):
    """渗透测试智能体的全局状态。"""

    # LangGraph 消息列表
    messages: Annotated[list, add_messages]

    # Orchestrator 从 attack_pool 选中的攻击条目
    selected_attacks: list[AttackEntry]

    # 攻击分派映射: {agent_name: [attack_entries]}
    attack_assignment: dict

    # 各 Agent 生成的脚本结果
    generated_scripts: list[dict]

    # Judge Agent 的评估结果（测试方案质量评估，非漏洞报告）
    evaluation_results: list[TestPlanEvaluation]

    # OWASP Top 10 攻击覆盖率
    coverage_report: dict

    # 当前迭代轮次
    iteration: int
