"""
OWASP LLM Top 10 (2025) 分类常量及覆盖率计算工具。

参考: https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OwaspCategory:
    """OWASP LLM Top 10 分类条目。"""

    id: str
    name: str
    description: str
    # 与 AttackEntry.category 的映射关系
    related_attack_categories: tuple[str, ...]


# OWASP Top 10 for LLM Applications (2025 版本)
OWASP_LLM_TOP_10: list[OwaspCategory] = [
    OwaspCategory(
        id="LLM01",
        name="Prompt Injection",
        description="直接和间接提示词注入，操纵模型行为",
        related_attack_categories=("prompt_injection",),
    ),
    OwaspCategory(
        id="LLM02",
        name="Sensitive Information Disclosure",
        description="模型泄露敏感信息（训练数据、系统提示词、PII）",
        related_attack_categories=("info_leakage",),
    ),
    OwaspCategory(
        id="LLM03",
        name="Supply Chain Vulnerabilities",
        description="第三方组件、预训练模型、数据集的供应链风险",
        related_attack_categories=(),
    ),
    OwaspCategory(
        id="LLM04",
        name="Data and Model Poisoning",
        description="训练数据投毒和模型投毒",
        related_attack_categories=(),
    ),
    OwaspCategory(
        id="LLM05",
        name="Improper Output Handling",
        description="模型输出未经适当验证导致的下游安全问题",
        related_attack_categories=("prompt_injection", "agent_hijack"),
    ),
    OwaspCategory(
        id="LLM06",
        name="Excessive Agency",
        description="模型/Agent 被赋予过多权限，导致非预期操作",
        related_attack_categories=("agent_hijack",),
    ),
    OwaspCategory(
        id="LLM07",
        name="System Prompt Leakage",
        description="系统提示词泄露",
        related_attack_categories=("info_leakage",),
    ),
    OwaspCategory(
        id="LLM08",
        name="Vector and Embedding Weaknesses",
        description="向量数据库和嵌入系统的安全弱点",
        related_attack_categories=(),
    ),
    OwaspCategory(
        id="LLM09",
        name="Misinformation",
        description="模型生成虚假或误导性信息（幻觉）",
        related_attack_categories=("jailbreak",),
    ),
    OwaspCategory(
        id="LLM10",
        name="Unbounded Consumption",
        description="资源消耗不受限制导致的拒绝服务",
        related_attack_categories=("dos",),
    ),
]

# 快速查找映射
OWASP_BY_ID: dict[str, OwaspCategory] = {c.id: c for c in OWASP_LLM_TOP_10}


def compute_coverage(
    attack_categories_present: set[str],
) -> dict[str, dict]:
    """
    计算当前攻击池对 OWASP LLM Top 10 的覆盖率。

    Args:
        attack_categories_present: 攻击池中存在的 attack category 集合

    Returns:
        {
            "LLM01": {"name": "...", "covered": True, "related_categories": [...]},
            ...
            "summary": {"total": 10, "covered": 5, "coverage_pct": 50.0}
        }
    """
    results: dict[str, dict] = {}
    covered_count = 0

    for cat in OWASP_LLM_TOP_10:
        is_covered = bool(
            cat.related_attack_categories
            and any(
                rc in attack_categories_present for rc in cat.related_attack_categories
            )
        )
        if is_covered:
            covered_count += 1

        results[cat.id] = {
            "name": cat.name,
            "covered": is_covered,
            "related_categories": list(cat.related_attack_categories),
        }

    total = len(OWASP_LLM_TOP_10)
    results["summary"] = {
        "total": total,
        "covered": covered_count,
        "coverage_pct": round(covered_count / total * 100, 1) if total else 0.0,
    }

    return results
