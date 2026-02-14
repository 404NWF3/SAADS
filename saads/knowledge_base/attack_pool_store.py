"""
攻击池知识库 (attack_pool) 存储。

管理 data/attack_pool/ 目录下的 STIX 2.1 兼容 JSON 文件。
"""

from __future__ import annotations

from pathlib import Path

from saads.config import ATTACK_POOL_DIR
from saads.knowledge_base.base import BaseKnowledgeStore
from saads.models.attack import AttackEntry


class AttackPoolStore(BaseKnowledgeStore[AttackEntry]):
    """攻击池知识库 — 存储标准化的攻击情报条目。"""

    def __init__(self, store_dir: Path | None = None) -> None:
        super().__init__(store_dir or ATTACK_POOL_DIR)

    def _get_id(self, item: AttackEntry) -> str:
        return item.attack_id

    def _model_class(self) -> type[AttackEntry]:
        return AttackEntry

    # ----- 攻击池专用方法 -----

    def get_by_category(self, category: str) -> list[AttackEntry]:
        """按攻击类别筛选。"""
        return self.query(category=category)

    def get_active(self) -> list[AttackEntry]:
        """获取所有状态为 active 的条目。"""
        return self.query(status="active")

    def category_distribution(self) -> dict[str, int]:
        """获取各攻击类别的分布统计。"""
        return self.count_by_field("category")

    def severity_distribution(self) -> dict[str, int]:
        """获取各严重性等级的分布统计。"""
        return self.count_by_field("metadata.severity_estimate")

    def source_distribution(self) -> dict[str, int]:
        """获取各数据来源的分布统计。"""
        return self.count_by_field("source.type")
