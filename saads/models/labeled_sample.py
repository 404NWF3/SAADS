"""
标注数据模型 — WP1-3 沙盒模拟智能体采集的数据。

镜像前端 TypeScript 类型: web/src/types/index.ts 中的 LabeledSample 及其子类型。
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ConversationTurn(BaseModel):
    """模型交互中的一轮对话。"""

    model_config = ConfigDict(populate_by_name=True)

    role: Literal["user", "assistant"]
    content: str
    is_attack_turn: bool | None = None
    attack_technique: str | None = None
    is_compromised: bool | None = None
    compromise_type: str | None = None


class ModelInteraction(BaseModel):
    """模型交互记录。"""

    model_config = ConfigDict(populate_by_name=True)

    conversation: list[ConversationTurn] = Field(default_factory=list)


class NetworkTrace(BaseModel):
    """网络抓包信息。"""

    model_config = ConfigDict(populate_by_name=True)

    pcap_path: str
    summary: dict = Field(default_factory=dict)
    # summary 包含: total_packets, protocols, payload_size_bytes


class SystemLog(BaseModel):
    """系统日志信息。"""

    model_config = ConfigDict(populate_by_name=True)

    log_path: str
    anomaly_indicators: list[str] = Field(default_factory=list)


class Features(BaseModel):
    """提取的特征向量 — 供入侵检测模型训练使用。"""

    model_config = ConfigDict(populate_by_name=True)

    input_length: int = 0
    contains_encoded_content: bool = False
    language_switch_count: int = 0
    instruction_override_patterns: int = 0
    response_time_ms: float = 0.0
    token_count_input: int = 0
    token_count_output: int = 0


class LabeledSample(BaseModel):
    """
    标注后的数据样本。

    由 WP1-3 沙盒采集并标记，供 WP1-4 入侵检测模型训练。
    """

    model_config = ConfigDict(populate_by_name=True)

    sample_id: str
    source_vuln_id: str
    label: Literal["malicious", "benign"]
    attack_type: str
    model_interaction: ModelInteraction
    network_trace: NetworkTrace
    system_log: SystemLog
    features: Features
    generation_method: Literal["mutation", "original", "synthetic"]
    mutation_from: str | None = None
