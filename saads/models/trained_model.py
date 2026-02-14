"""
训练模型数据模型 — WP1-4 入侵检测智能体的产出。

镜像前端 TypeScript 类型: web/src/types/index.ts 中的 TrainedModel 及其子类型。
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ModelMetrics(BaseModel):
    """模型评估指标。"""

    model_config = ConfigDict(populate_by_name=True)

    f1_score: float = 0.0
    auc: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    false_positive_rate: float = 0.0
    false_negative_rate: float = 0.0


class TrainedModel(BaseModel):
    """
    训练完成的检测模型。

    由 WP1-4 训练产出，支持 ONNX/TF/PyTorch 格式。
    """

    model_config = ConfigDict(populate_by_name=True)

    model_id: str
    model_type: Literal[
        "random_forest", "xgboost", "cnn", "transformer", "deeplog", "gan"
    ]
    version: str = "1.0.0"
    trained_at: str
    metrics: ModelMetrics = Field(default_factory=ModelMetrics)
    feature_importance: dict[str, float] = Field(default_factory=dict)
    status: Literal["training", "evaluating", "deployed", "archived"] = "training"
