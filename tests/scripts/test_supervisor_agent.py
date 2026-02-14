"""
=== SAADS WP1-1 验证脚本: Supervisor Agent ===

功能: 验证 Supervisor 能否分析覆盖率、生成采集策略、评估迭代结果

前置配置:
  1. 无需任何 API Key (纯逻辑测试)

运行方式:
  python tests/scripts/test_supervisor_agent.py

预期输出:
  - 空攻击池: 覆盖率 0%, 6 个缺失类别, 策略包含全部类别
  - 部分填充: 覆盖率提升, 策略聚焦缺失类别
  - 全满攻击池: 覆盖率达标, should_continue=False
  - 迭代决策: 正确判断停止条件
"""

import sys
import asyncio
import json
import shutil
import tempfile
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from saads.agents.wp1_1.supervisor import (
    _analyze_coverage,
    _generate_strategy,
    supervisor_plan_node,
    supervisor_eval_node,
    should_continue_collecting,
    MAX_ITERATIONS,
    TARGET_COVERAGE_PCT,
)
from saads.agents.wp1_1.standardizer import standardize_without_llm
from saads.agents.wp1_1.dark_web import MOCK_DARK_WEB_INTEL
from saads.knowledge_base.attack_pool_store import AttackPoolStore


def make_empty_state(**overrides) -> dict:
    """创建一个空的 IntelState dict"""
    state = {
        "messages": [],
        "collection_strategy": {},
        "raw_intel": [],
        "standardized_entries": [],
        "coverage_report": {},
        "iteration": 0,
        "should_continue": True,
    }
    state.update(overrides)
    return state


async def test_empty_pool():
    """Test 1: 空攻击池的分析和策略生成"""
    print("\n--- Test 1: 空攻击池 ---\n")

    tmp_dir = Path(tempfile.mkdtemp(prefix="saads_sv_empty_"))
    store = AttackPoolStore(store_dir=tmp_dir)

    coverage = _analyze_coverage(store)
    analysis = coverage.get("_analysis", {})

    print(f"  攻击池条目数: {analysis.get('total_entries', 0)}")
    print(f"  OWASP 覆盖率: {analysis.get('coverage_pct', 0)}%")
    print(f"  缺失类别: {analysis.get('missing_categories', [])}")

    assert analysis["total_entries"] == 0
    assert analysis["coverage_pct"] == 0.0
    assert len(analysis["missing_categories"]) == 6

    # 生成策略
    strategy = _generate_strategy(coverage)
    print(f"\n  生成的策略:")
    print(f"    priority_categories: {strategy['priority_categories']}")
    print(f"    target_sources: {strategy['target_sources']}")
    print(f"    keywords ({len(strategy['keywords'])}): {strategy['keywords'][:3]}...")

    assert len(strategy["priority_categories"]) == 6, "应优先全部 6 个缺失类别"
    assert len(strategy["keywords"]) > 0

    print(f"\n  [OK] 空攻击池分析正确")

    shutil.rmtree(tmp_dir, ignore_errors=True)


async def test_partial_pool():
    """Test 2: 部分填充攻击池"""
    print("\n--- Test 2: 部分填充攻击池 (仅 prompt_injection + jailbreak) ---\n")

    tmp_dir = Path(tempfile.mkdtemp(prefix="saads_sv_partial_"))
    store = AttackPoolStore(store_dir=tmp_dir)

    # 只写入 prompt_injection 和 jailbreak
    for raw_item in MOCK_DARK_WEB_INTEL:
        if raw_item.get("category") in ("prompt_injection", "jailbreak"):
            entry = standardize_without_llm(raw_item)
            if entry:
                store.put(entry)

    coverage = _analyze_coverage(store)
    analysis = coverage.get("_analysis", {})

    print(f"  攻击池条目数: {analysis.get('total_entries', 0)}")
    print(f"  类别分布: {analysis.get('category_counts', {})}")
    print(f"  OWASP 覆盖率: {analysis.get('coverage_pct', 0)}%")
    print(f"  缺失类别: {analysis.get('missing_categories', [])}")
    print(f"  薄弱类别: {analysis.get('weak_categories', [])}")

    assert analysis["total_entries"] == 6  # 3 PI + 3 JB
    assert "prompt_injection" in analysis["categories_present"]
    assert "jailbreak" in analysis["categories_present"]
    assert "multimodal" in analysis["missing_categories"]

    # 策略应该聚焦缺失类别
    strategy = _generate_strategy(coverage)
    print(f"\n  策略 priority_categories: {strategy['priority_categories']}")

    # 前 4 个应该是缺失的类别
    assert all(
        cat in strategy["priority_categories"] for cat in analysis["missing_categories"]
    ), "策略应包含所有缺失类别"

    print(f"  [OK] 部分填充分析正确，策略聚焦缺失类别")

    shutil.rmtree(tmp_dir, ignore_errors=True)


async def test_full_pool():
    """Test 3: 全满攻击池"""
    print("\n--- Test 3: 全满攻击池 (全部 6 类) ---\n")

    tmp_dir = Path(tempfile.mkdtemp(prefix="saads_sv_full_"))
    store = AttackPoolStore(store_dir=tmp_dir)

    # 写入全部 mock 数据
    for raw_item in MOCK_DARK_WEB_INTEL:
        entry = standardize_without_llm(raw_item)
        if entry:
            store.put(entry)

    coverage = _analyze_coverage(store)
    analysis = coverage.get("_analysis", {})

    print(f"  攻击池条目数: {analysis.get('total_entries', 0)}")
    print(f"  类别分布: {analysis.get('category_counts', {})}")
    print(f"  OWASP 覆盖率: {analysis.get('coverage_pct', 0)}%")
    print(f"  缺失类别: {analysis.get('missing_categories', [])}")

    assert analysis["total_entries"] == 14
    assert len(analysis["missing_categories"]) == 0
    assert analysis["coverage_pct"] >= 60.0

    print(f"  [OK] 全满攻击池覆盖率达标")

    shutil.rmtree(tmp_dir, ignore_errors=True)


async def test_plan_node():
    """Test 4: supervisor_plan_node"""
    print("\n--- Test 4: supervisor_plan_node ---\n")

    state = make_empty_state(iteration=0)
    result = await supervisor_plan_node(state)

    print(f"  iteration: {result.get('iteration')}")
    print(f"  strategy keys: {list(result.get('collection_strategy', {}).keys())}")
    print(
        f"  coverage keys: {[k for k in result.get('coverage_report', {}).keys() if not k.startswith('_')][:5]}..."
    )

    assert result["iteration"] == 1
    assert "priority_categories" in result["collection_strategy"]
    assert "target_sources" in result["collection_strategy"]
    assert "keywords" in result["collection_strategy"]
    assert "summary" in result["coverage_report"]

    print(f"  [OK] supervisor_plan_node 输出正确")


async def test_eval_node():
    """Test 5: supervisor_eval_node + 停止条件"""
    print("\n--- Test 5: supervisor_eval_node 迭代决策 ---\n")

    # 场景 A: 第 1 轮迭代, 覆盖率低 -> 继续
    state_a = make_empty_state(
        iteration=1,
        coverage_report={"_analysis": {"coverage_pct": 20.0, "total_entries": 3}},
    )
    result_a = await supervisor_eval_node(state_a)
    print(f"  场景 A (iter=1, 20%): should_continue={result_a['should_continue']}")
    assert result_a["should_continue"] is True, "应继续采集"

    # 场景 B: 达到最大迭代次数 -> 停止
    state_b = make_empty_state(
        iteration=MAX_ITERATIONS,
        coverage_report={"_analysis": {"coverage_pct": 30.0, "total_entries": 5}},
    )
    result_b = await supervisor_eval_node(state_b)
    print(
        f"  场景 B (iter={MAX_ITERATIONS}, 30%): should_continue={result_b['should_continue']}"
    )
    assert result_b["should_continue"] is False, "应停止 (达到最大迭代)"

    print(f"  [OK] 迭代决策逻辑正确")


async def test_routing():
    """Test 6: should_continue_collecting 路由函数"""
    print("\n--- Test 6: should_continue_collecting 路由函数 ---\n")

    state_continue = make_empty_state(should_continue=True)
    state_stop = make_empty_state(should_continue=False)

    r1 = should_continue_collecting(state_continue)
    r2 = should_continue_collecting(state_stop)

    print(f"  should_continue=True  -> '{r1}'")
    print(f"  should_continue=False -> '{r2}'")

    assert r1 == "continue"
    assert r2 == "end"

    print(f"  [OK] 路由函数正确")


async def main():
    print("=" * 60)
    print("SAADS — Supervisor Agent 验证")
    print("=" * 60)
    print(f"\n  MAX_ITERATIONS: {MAX_ITERATIONS}")
    print(f"  TARGET_COVERAGE_PCT: {TARGET_COVERAGE_PCT}%")

    await test_empty_pool()
    await test_partial_pool()
    await test_full_pool()
    await test_plan_node()
    await test_eval_node()
    await test_routing()

    print(f"\n{'=' * 60}")
    print("Supervisor Agent 验证完成!")
    print(f"{'=' * 60}")
    print(f"  全部 6 个测试通过: PASS")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
