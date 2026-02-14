"""
测试脚本知识库 (test_scripts) 存储。

管理 data/test_scripts/ 目录下的攻击脚本文件。
脚本按类别存储在子目录中: prompt_injection/, jailbreak/, info_leakage/, multimodal/
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from saads.config import TEST_SCRIPTS_DIR


class TestScript(BaseModel):
    """测试脚本元数据。"""

    model_config = ConfigDict(populate_by_name=True)

    script_id: str
    source_attack_id: str
    category: Literal["prompt_injection", "jailbreak", "info_leakage", "multimodal"]
    name: str
    description: str
    language: str = "python"
    script_content: str = ""
    payload_corpus: list[str] = Field(default_factory=list)
    created_at: str = ""


class TestScriptsStore:
    """
    测试脚本知识库。

    结构:
        data/test_scripts/
        ├── prompt_injection/
        │   ├── {script_id}.json      (元数据)
        │   └── {script_id}.py        (脚本文件)
        ├── jailbreak/
        ├── info_leakage/
        └── multimodal/
    """

    def __init__(self, store_dir: Path | None = None) -> None:
        self.store_dir = store_dir or TEST_SCRIPTS_DIR
        self.store_dir.mkdir(parents=True, exist_ok=True)

    def _category_dir(self, category: str) -> Path:
        """获取类别子目录。"""
        d = self.store_dir / category
        d.mkdir(parents=True, exist_ok=True)
        return d

    def list_all(self) -> list[TestScript]:
        """列出所有测试脚本元数据。"""
        scripts: list[TestScript] = []
        for category_dir in self.store_dir.iterdir():
            if category_dir.is_dir():
                for json_file in sorted(category_dir.glob("*.json")):
                    try:
                        data = json.loads(json_file.read_text(encoding="utf-8"))
                        scripts.append(TestScript.model_validate(data))
                    except (json.JSONDecodeError, Exception):
                        continue
        return scripts

    def get_by_id(self, script_id: str, category: str) -> TestScript | None:
        """根据 ID 和类别获取脚本元数据。"""
        path = self._category_dir(category) / f"{script_id}.json"
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return TestScript.model_validate(data)
        except (json.JSONDecodeError, Exception):
            return None

    def put(self, script: TestScript) -> None:
        """保存测试脚本（元数据 JSON + 脚本文件）。"""
        category_dir = self._category_dir(script.category)

        # 保存元数据
        meta_path = category_dir / f"{script.script_id}.json"
        meta_path.write_text(
            script.model_dump_json(indent=2, by_alias=True),
            encoding="utf-8",
        )

        # 如果有脚本内容，保存为 .py 文件
        if script.script_content:
            ext = ".py" if script.language == "python" else f".{script.language}"
            script_path = category_dir / f"{script.script_id}{ext}"
            script_path.write_text(script.script_content, encoding="utf-8")

    def delete(self, script_id: str, category: str) -> bool:
        """删除脚本及其元数据。"""
        category_dir = self._category_dir(category)
        deleted = False
        for f in category_dir.glob(f"{script_id}.*"):
            f.unlink()
            deleted = True
        return deleted

    def list_by_category(self, category: str) -> list[TestScript]:
        """按类别列出脚本。"""
        scripts: list[TestScript] = []
        category_dir = self._category_dir(category)
        for json_file in sorted(category_dir.glob("*.json")):
            try:
                data = json.loads(json_file.read_text(encoding="utf-8"))
                scripts.append(TestScript.model_validate(data))
            except (json.JSONDecodeError, Exception):
                continue
        return scripts

    def count(self) -> int:
        """统计总脚本数。"""
        return sum(
            1 for d in self.store_dir.iterdir() if d.is_dir() for _ in d.glob("*.json")
        )

    def count_by_category(self) -> dict[str, int]:
        """按类别统计脚本数量。"""
        counts: dict[str, int] = {}
        for d in self.store_dir.iterdir():
            if d.is_dir():
                n = len(list(d.glob("*.json")))
                if n > 0:
                    counts[d.name] = n
        return counts
