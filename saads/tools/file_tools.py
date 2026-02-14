"""
知识库文件操作工具。

供各智能体通过 LangGraph @tool 访问知识库。
"""

from __future__ import annotations

import json

from langchain_core.tools import tool

from saads.knowledge_base.attack_pool_store import AttackPoolStore
from saads.knowledge_base.test_scripts_store import TestScriptsStore
from saads.knowledge_base.vuln_reports_store import VulnReportsStore

# 单例实例
_attack_pool = AttackPoolStore()
_test_scripts = TestScriptsStore()
_vuln_reports = VulnReportsStore()


@tool
def list_attack_pool(category: str | None = None) -> str:
    """
    列出攻击池中的条目。

    Args:
        category: 可选的攻击类别过滤（prompt_injection, jailbreak, info_leakage, multimodal, dos, agent_hijack）

    Returns:
        JSON 格式的攻击条目列表
    """
    if category:
        entries = _attack_pool.get_by_category(category)
    else:
        entries = _attack_pool.list_all()
    return json.dumps(
        [e.model_dump() for e in entries],
        indent=2,
        ensure_ascii=False,
    )


@tool
def get_attack_pool_stats() -> str:
    """
    获取攻击池的统计信息（总数、按类别分布、按严重性分布、按来源分布）。

    Returns:
        JSON 格式的统计信息
    """
    stats = {
        "total": _attack_pool.count(),
        "by_category": _attack_pool.category_distribution(),
        "by_severity": _attack_pool.severity_distribution(),
        "by_source": _attack_pool.source_distribution(),
    }
    return json.dumps(stats, indent=2, ensure_ascii=False)


@tool
def save_attack_entry(attack_entry_json: str) -> str:
    """
    保存一条攻击情报到攻击池。

    Args:
        attack_entry_json: AttackEntry 的 JSON 字符串

    Returns:
        保存结果的确认信息
    """
    from saads.models.attack import AttackEntry

    try:
        data = json.loads(attack_entry_json)
        entry = AttackEntry.model_validate(data)
        _attack_pool.put(entry)
        return f"Successfully saved attack entry: {entry.attack_id}"
    except Exception as e:
        return f"Error saving attack entry: {e}"


@tool
def list_test_scripts(category: str | None = None) -> str:
    """
    列出测试脚本库中的脚本。

    Args:
        category: 可选的类别过滤

    Returns:
        JSON 格式的脚本元数据列表
    """
    if category:
        scripts = _test_scripts.list_by_category(category)
    else:
        scripts = _test_scripts.list_all()
    return json.dumps(
        [s.model_dump() for s in scripts],
        indent=2,
        ensure_ascii=False,
    )


@tool
def save_test_script(test_script_json: str) -> str:
    """
    保存一个测试脚本到脚本库。

    Args:
        test_script_json: TestScript 的 JSON 字符串

    Returns:
        保存结果的确认信息
    """
    from saads.knowledge_base.test_scripts_store import TestScript

    try:
        data = json.loads(test_script_json)
        script = TestScript.model_validate(data)
        _test_scripts.put(script)
        return f"Successfully saved test script: {script.script_id}"
    except Exception as e:
        return f"Error saving test script: {e}"


@tool
def save_vuln_report(vuln_report_json: str) -> str:
    """
    保存一份漏洞报告。

    注意: 此工具仅供 WP1-3（用户层漏洞验证智能体）使用。
    WP1-2（通用层渗透测试智能体）不应调用此工具，因为 WP1-2
    不连接被测应用、不验证漏洞、不产出 VulnReport。

    Args:
        vuln_report_json: VulnReport 的 JSON 字符串

    Returns:
        保存结果的确认信息
    """
    from saads.models.vuln_report import VulnReport

    try:
        data = json.loads(vuln_report_json)
        report = VulnReport.model_validate(data)
        _vuln_reports.put(report)
        return f"Successfully saved vuln report: {report.vuln_id}"
    except Exception as e:
        return f"Error saving vuln report: {e}"
