"""
漏洞报告数据模型

镜像前端 TypeScript 类型: web/src/types/index.ts 中的 VulnReport 及其子类型。
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TargetApplication(BaseModel):
    """被测目标应用信息。"""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    api_endpoint: str
    model: str
    has_system_prompt: bool = False
    has_tools: bool = False
    has_rag: bool = False


class AttackStep(BaseModel):
    """攻击步骤。"""

    model_config = ConfigDict(populate_by_name=True)

    step: int
    action: str
    input: str
    output: str


class AttackVector(BaseModel):
    """攻击向量 — 成功的攻击 payload 及步骤。"""

    model_config = ConfigDict(populate_by_name=True)

    successful_payload: str
    modality: Literal["text", "image", "audio"]
    attack_steps: list[AttackStep] = Field(default_factory=list)
    success_indicator: str


class Remediation(BaseModel):
    """修复建议。"""

    model_config = ConfigDict(populate_by_name=True)

    suggestion: str
    priority: Literal["immediate", "high", "medium", "low"]
    references: list[str] = Field(default_factory=list)


class Vulnerability(BaseModel):
    """漏洞详情。"""

    model_config = ConfigDict(populate_by_name=True)

    type: str
    subtype: str
    severity: Literal["critical", "high", "medium", "low"]
    cvss_score: float
    cvss_vector: str
    description: str
    attack_vector: AttackVector
    remediation: Remediation


class Reproduction(BaseModel):
    """漏洞复现信息。"""

    model_config = ConfigDict(populate_by_name=True)

    deterministic: bool
    success_rate: str
    environment_requirements: str
    mutation_variants_tested: int = 0


class ExecutableScript(BaseModel):
    """可执行的攻击脚本信息。"""

    model_config = ConfigDict(populate_by_name=True)

    language: str = "python"
    path: str
    description: str


class VulnReport(BaseModel):
    """
    漏洞报告。

    每条存储为一个 JSON 文件: data/vuln_reports/{vuln_id}.json
    """

    model_config = ConfigDict(populate_by_name=True)

    vuln_id: str
    source_attack_id: str
    target_application: TargetApplication
    vulnerability: Vulnerability
    reproduction: Reproduction
    executable_script: ExecutableScript
    timestamp: str
    status: Literal["confirmed", "pending", "rejected"] = "pending"
