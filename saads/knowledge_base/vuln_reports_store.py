"""
漏洞报告知识库 (vuln_reports) 存储。

管理 data/vuln_reports/ 目录下的漏洞报告 JSON 文件。
"""

from __future__ import annotations

from pathlib import Path

from saads.config import VULN_REPORTS_DIR
from saads.knowledge_base.base import BaseKnowledgeStore
from saads.models.vuln_report import VulnReport


class VulnReportsStore(BaseKnowledgeStore[VulnReport]):
    """漏洞报告知识库 — 存储渗透测试产出的漏洞报告。"""

    def __init__(self, store_dir: Path | None = None) -> None:
        super().__init__(store_dir or VULN_REPORTS_DIR)

    def _get_id(self, item: VulnReport) -> str:
        return item.vuln_id

    def _model_class(self) -> type[VulnReport]:
        return VulnReport

    # ----- 漏洞报告专用方法 -----

    def get_confirmed(self) -> list[VulnReport]:
        """获取所有已确认的漏洞报告。"""
        return self.query(status="confirmed")

    def get_pending(self) -> list[VulnReport]:
        """获取所有待审核的漏洞报告。"""
        return self.query(status="pending")

    def get_by_attack_id(self, attack_id: str) -> list[VulnReport]:
        """根据来源攻击 ID 获取相关漏洞报告。"""
        return self.query(source_attack_id=attack_id)

    def severity_distribution(self) -> dict[str, int]:
        """获取各严重性等级的分布统计。"""
        return self.count_by_field("vulnerability.severity")

    def status_distribution(self) -> dict[str, int]:
        """获取各状态的分布统计。"""
        return self.count_by_field("status")
