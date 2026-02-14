"""Pydantic 数据模型 — 镜像前端 TypeScript 类型定义，确保前后端 schema 一致。"""

from saads.models.attack import (
    AttackEntry,
    AttackMetadata,
    AttackSource,
    AttackTemplate,
    MitreMapping,
)
from saads.models.vuln_report import (
    AttackStep,
    AttackVector,
    ExecutableScript,
    Remediation,
    Reproduction,
    TargetApplication,
    Vulnerability,
    VulnReport,
)
from saads.models.labeled_sample import (
    ConversationTurn,
    Features,
    LabeledSample,
    ModelInteraction,
    NetworkTrace,
    SystemLog,
)
from saads.models.trained_model import (
    ModelMetrics,
    TrainedModel,
)

__all__ = [
    # attack
    "AttackEntry",
    "AttackMetadata",
    "AttackSource",
    "AttackTemplate",
    "MitreMapping",
    # vuln_report
    "AttackStep",
    "AttackVector",
    "ExecutableScript",
    "Remediation",
    "Reproduction",
    "TargetApplication",
    "Vulnerability",
    "VulnReport",
    # labeled_sample
    "ConversationTurn",
    "Features",
    "LabeledSample",
    "ModelInteraction",
    "NetworkTrace",
    "SystemLog",
    # trained_model
    "ModelMetrics",
    "TrainedModel",
]
