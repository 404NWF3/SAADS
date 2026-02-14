"""
攻击池数据模型 (STIX 2.1 兼容)

镜像前端 TypeScript 类型: web/src/types/index.ts 中的 AttackEntry 及其子类型。
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AttackSource(BaseModel):
    """情报来源信息。"""

    model_config = ConfigDict(populate_by_name=True)

    type: Literal[
        "arxiv",
        "cve",
        "nvd",
        "blog",
        "github",
        "darkweb",
        "threat_api",
        "reddit",
        "hackernews",
        "exploitdb",
        "huggingface",
        "virustotal",
        "alienvault",
    ]
    url: str
    crawl_time: str
    confidence: Literal["high", "medium", "low"]


class AttackTemplate(BaseModel):
    """攻击模板 — 包含 payload 模板及变异提示。"""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    description: str
    payload_template: str
    variables: dict[str, str] = Field(default_factory=dict)
    modality: Literal["text", "image", "audio"]
    mutation_hints: list[str] = Field(default_factory=list)


class MitreMapping(BaseModel):
    """MITRE ATT&CK 映射。"""

    model_config = ConfigDict(populate_by_name=True)

    tactic: str
    technique: str


class AttackMetadata(BaseModel):
    """攻击条目的元数据。"""

    model_config = ConfigDict(populate_by_name=True)

    severity_estimate: Literal["critical", "high", "medium", "low"]
    target_type: list[str] = Field(default_factory=list)
    defense_bypass: list[str] = Field(default_factory=list)
    effectiveness: float | None = None
    last_tested: str | None = None


class AttackEntry(BaseModel):
    """
    攻击池中的一条标准化情报条目 (STIX 2.1 兼容)。

    每条存储为一个 JSON 文件: data/attack_pool/{attack_id}.json
    """

    model_config = ConfigDict(populate_by_name=True)

    attack_id: str
    category: Literal[
        "prompt_injection",
        "jailbreak",
        "info_leakage",
        "multimodal",
        "dos",
        "agent_hijack",
    ]
    subcategory: str
    stix_type: str = "attack-pattern"
    source: AttackSource
    attack_template: AttackTemplate
    mitre_mapping: MitreMapping
    metadata: AttackMetadata
    status: Literal["active", "tested", "deprecated"] = "active"
