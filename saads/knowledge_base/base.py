"""
知识库基类 — 文件系统 + JSON 存储的抽象接口。

所有知识库 Store 继承此基类，提供统一的 CRUD + 查询操作。
"""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseKnowledgeStore(ABC, Generic[T]):
    """
    基于文件系统 + JSON 的知识库存储基类。

    每条数据存储为一个独立的 JSON 文件：{store_dir}/{id}.json
    子类需要实现 _get_id() 和 _model_class() 方法。
    """

    def __init__(self, store_dir: Path) -> None:
        self.store_dir = store_dir
        self.store_dir.mkdir(parents=True, exist_ok=True)

    @abstractmethod
    def _get_id(self, item: T) -> str:
        """从数据对象中提取唯一 ID。"""
        ...

    @abstractmethod
    def _model_class(self) -> type[T]:
        """返回 Pydantic 模型类。"""
        ...

    def _id_to_path(self, item_id: str) -> Path:
        """将 ID 转换为文件路径。"""
        # 清理 ID 中的特殊字符，确保安全的文件名
        safe_id = item_id.replace("/", "_").replace("\\", "_")
        return self.store_dir / f"{safe_id}.json"

    # ----- CRUD 操作 -----

    def list_all(self) -> list[T]:
        """列出所有条目。"""
        items: list[T] = []
        model_cls = self._model_class()
        for json_file in sorted(self.store_dir.glob("*.json")):
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
                items.append(model_cls.model_validate(data))
            except (json.JSONDecodeError, Exception):
                continue  # 跳过损坏的文件
        return items

    def get_by_id(self, item_id: str) -> T | None:
        """根据 ID 获取单条数据。"""
        path = self._id_to_path(item_id)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return self._model_class().model_validate(data)
        except (json.JSONDecodeError, Exception):
            return None

    def put(self, item: T) -> None:
        """写入/更新一条数据。"""
        item_id = self._get_id(item)
        path = self._id_to_path(item_id)
        path.write_text(
            item.model_dump_json(indent=2, by_alias=True),
            encoding="utf-8",
        )

    def delete(self, item_id: str) -> bool:
        """删除一条数据。返回是否成功。"""
        path = self._id_to_path(item_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def exists(self, item_id: str) -> bool:
        """检查条目是否存在。"""
        return self._id_to_path(item_id).exists()

    def count(self) -> int:
        """统计条目总数。"""
        return len(list(self.store_dir.glob("*.json")))

    # ----- 查询操作 -----

    def query(self, **filters: object) -> list[T]:
        """
        简单过滤查询。

        filters 的 key 是字段名，value 是期望的值。
        支持嵌套字段用双下划线分隔，如 source__type="cve"。
        """
        all_items = self.list_all()
        if not filters:
            return all_items

        results: list[T] = []
        for item in all_items:
            if self._match_filters(item, filters):
                results.append(item)
        return results

    def count_by_field(self, field: str) -> dict[str, int]:
        """
        按指定字段分组统计。

        Args:
            field: 字段名，支持嵌套（如 "source.type", "metadata.severity_estimate"）

        Returns:
            {字段值: 计数} 的字典
        """
        counts: dict[str, int] = {}
        for item in self.list_all():
            value = self._get_nested_value(item, field)
            if value is not None:
                key = str(value)
                counts[key] = counts.get(key, 0) + 1
        return counts

    # ----- 内部辅助方法 -----

    @staticmethod
    def _match_filters(item: BaseModel, filters: dict[str, object]) -> bool:
        """检查条目是否匹配所有过滤条件。"""
        for key, expected in filters.items():
            # 支持双下划线分隔的嵌套字段
            field_path = key.replace("__", ".")
            actual = BaseKnowledgeStore._get_nested_value(item, field_path)
            if actual != expected:
                return False
        return True

    @staticmethod
    def _get_nested_value(item: BaseModel, field_path: str) -> object:
        """获取嵌套字段值。field_path 如 "source.type"。"""
        parts = field_path.split(".")
        current: object = item
        for part in parts:
            if isinstance(current, BaseModel):
                current = getattr(current, part, None)
            elif isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current
