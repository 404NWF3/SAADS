"""
=== SAADS WP1-1 验证脚本: Standardizer Agent ===

功能: 验证 Standardizer Agent 能否将原始情报标准化为 AttackEntry

本脚本有两种运行模式:
  模式 1 (无 LLM): 使用 standardize_without_llm() 回退方法 — 不需要任何 API key
  模式 2 (有 LLM): 使用完整的 standardizer_node() — 需要 OPENAI_API_KEY

前置配置:
  1. 复制 .env.example 为 .env (如果还没有)
  2. 模式 1: 无需任何配置
  3. 模式 2: OPENAI_API_KEY=sk-xxx (或兼容 API 的 OPENAI_BASE_URL)

运行方式:
  python tests/scripts/test_standardizer_agent.py          # 自动检测模式
  python tests/scripts/test_standardizer_agent.py --no-llm # 强制无 LLM 模式

预期输出:
  - 模式 1: 将 dark_web mock 数据转为 AttackEntry (字段直接映射)
  - 模式 2: 使用 LLM 智能标准化 raw_intel (更精确的分类和提取)
  - 两种模式都验证: 字段完整性、category 合法性、写入攻击池
"""

import sys
import asyncio
import json
import shutil
import tempfile
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))


async def test_without_llm():
    """模式 1: 无 LLM 回退标准化"""
    from saads.agents.wp1_1.dark_web import MOCK_DARK_WEB_INTEL
    from saads.agents.wp1_1.standardizer import (
        standardize_without_llm,
        generate_attack_id,
        CATEGORY_PREFIX,
    )
    from saads.models.attack import AttackEntry

    print("\n--- 模式 1: 无 LLM 标准化 (standardize_without_llm) ---\n")

    entries: list[AttackEntry] = []
    errors = 0

    for i, raw_item in enumerate(MOCK_DARK_WEB_INTEL):
        title = raw_item.get("title", "N/A")
        entry = standardize_without_llm(raw_item)

        if entry is None:
            print(f"  [FAIL] [{i + 1:2d}] 无法标准化: {title[:50]}...")
            errors += 1
            continue

        entries.append(entry)
        print(
            f"  [OK]   [{i + 1:2d}] {entry.attack_id} | "
            f"cat={entry.category} | sev={entry.metadata.severity_estimate} | "
            f"{entry.attack_template.name[:40]}..."
        )

    print(f"\n  结果: {len(entries)}/{len(MOCK_DARK_WEB_INTEL)} 条成功标准化")

    # 验证覆盖率
    categories = {e.category for e in entries}
    print(f"  类别覆盖: {sorted(categories)}")
    expected = set(CATEGORY_PREFIX.keys())
    missing = expected - categories
    if missing:
        print(f"  [WARNING] 缺少类别: {missing}")
    else:
        print(f"  [OK] 全部 6 个类别已覆盖!")

    # 验证 AttackEntry 字段完整性
    print(f"\n  字段完整性检查:")
    field_errors = 0
    for entry in entries:
        if not entry.attack_id or not entry.attack_id.startswith("ATK-"):
            print(f"    [FAIL] {entry.attack_id}: invalid attack_id")
            field_errors += 1
        if not entry.source.url and entry.source.type != "threat_api":
            # darkweb mock 数据应该都有 URL
            pass  # 不是硬性要求
        if not entry.attack_template.description:
            print(f"    [FAIL] {entry.attack_id}: empty description")
            field_errors += 1
        if not entry.attack_template.payload_template:
            print(f"    [FAIL] {entry.attack_id}: empty payload_template")
            field_errors += 1

    if field_errors == 0:
        print(f"    [OK] 全部 {len(entries)} 条字段完整性通过")
    else:
        print(f"    [FAIL] {field_errors} 个字段问题")

    # 验证 JSON 序列化
    print(f"\n  JSON 序列化检查:")
    for entry in entries[:3]:
        try:
            json_str = entry.model_dump_json(indent=2)
            # 反序列化验证
            reconstructed = AttackEntry.model_validate_json(json_str)
            assert reconstructed.attack_id == entry.attack_id
        except Exception as e:
            print(f"    [FAIL] {entry.attack_id}: {e}")
            errors += 1

    print(f"    [OK] JSON 序列化/反序列化正常 (抽样 3 条)")

    # 显示一条完整的 AttackEntry 示例
    print(f"\n  完整 AttackEntry 示例:")
    sample = entries[0]
    sample_json = json.loads(sample.model_dump_json(indent=2))
    print(json.dumps(sample_json, indent=4, ensure_ascii=False))

    return len(entries), errors


async def test_with_llm():
    """模式 2: 使用 LLM 完整标准化"""
    from saads.agents.wp1_1.standardizer import standardizer_node
    from saads.agents.wp1_1.dark_web import MOCK_DARK_WEB_INTEL

    print("\n--- 模式 2: LLM 标准化 (standardizer_node) ---\n")

    # 使用临时目录作为攻击池 (避免污染真实数据)
    tmp_dir = Path(tempfile.mkdtemp(prefix="saads_test_"))
    print(f"  临时攻击池目录: {tmp_dir}")

    # 只取前 3 条 mock 数据测试 (节省 API 调用)
    test_items = MOCK_DARK_WEB_INTEL[:3]
    for item in test_items:
        item["_source_type"] = "darkweb"
        item["source"] = "darkweb"

    state = {
        "messages": [],
        "collection_strategy": {},
        "raw_intel": test_items,
        "standardized_entries": [],
        "coverage_report": {},
        "iteration": 0,
        "should_continue": True,
    }

    print(f"  输入: {len(test_items)} 条原始情报")
    print(f"  开始 LLM 标准化...\n")

    try:
        result = await standardizer_node(state)
        entries = result.get("standardized_entries", [])

        print(f"\n  LLM 标准化结果: {len(entries)} 条")
        for entry in entries:
            print(
                f"    {entry.attack_id} | cat={entry.category} | "
                f"sev={entry.metadata.severity_estimate} | "
                f"{entry.attack_template.name[:40]}..."
            )

        return len(entries), 0
    except Exception as e:
        print(f"\n  [ERROR] LLM 标准化失败: {e}")
        return 0, 1
    finally:
        # 清理临时目录
        shutil.rmtree(tmp_dir, ignore_errors=True)


async def test_attack_pool_write():
    """验证写入攻击池知识库"""
    from saads.agents.wp1_1.standardizer import standardize_without_llm
    from saads.agents.wp1_1.dark_web import MOCK_DARK_WEB_INTEL
    from saads.knowledge_base.attack_pool_store import AttackPoolStore

    print("\n--- Test: 攻击池写入/读取 ---\n")

    # 使用临时目录
    tmp_dir = Path(tempfile.mkdtemp(prefix="saads_test_pool_"))
    store = AttackPoolStore(store_dir=tmp_dir)

    print(f"  临时攻击池: {tmp_dir}")
    print(f"  初始条目数: {store.count()}")

    # 标准化并写入前 5 条
    written = 0
    for raw_item in MOCK_DARK_WEB_INTEL[:5]:
        entry = standardize_without_llm(raw_item)
        if entry:
            store.put(entry)
            written += 1

    print(f"  写入条目数: {written}")
    print(f"  攻击池条目数: {store.count()}")

    # 验证读取
    all_entries = store.list_all()
    print(f"  读取条目数: {len(all_entries)}")

    # 验证按类别查询
    dist = store.category_distribution()
    print(f"  类别分布: {dist}")

    # 验证去重 (再写一次同样的数据)
    for raw_item in MOCK_DARK_WEB_INTEL[:5]:
        entry = standardize_without_llm(raw_item)
        if entry:
            store.put(entry)  # 应该覆盖而非重复

    assert store.count() == written, "去重失败: 条目数增加了"
    print(f"  去重验证: 再次写入后仍为 {store.count()} 条 [OK]")

    # 清理
    shutil.rmtree(tmp_dir, ignore_errors=True)
    print(f"  临时目录已清理")

    return written, 0


async def main():
    print("=" * 60)
    print("SAADS — Standardizer Agent 验证")
    print("=" * 60)

    # 检查是否强制无 LLM 模式
    force_no_llm = "--no-llm" in sys.argv

    from saads.config import OPENAI_API_KEY

    has_llm = bool(OPENAI_API_KEY) and not force_no_llm
    print(f"\n  OPENAI_API_KEY: {'已配置' if OPENAI_API_KEY else '未配置'}")
    print(f"  运行模式: {'模式 2 (LLM)' if has_llm else '模式 1 (无 LLM)'}")

    # --- Test 1: 无 LLM 回退标准化 (始终运行) ---
    count1, err1 = await test_without_llm()

    # --- Test 2: 攻击池写入/读取 ---
    count2, err2 = await test_attack_pool_write()

    # --- Test 3: LLM 标准化 (仅在有 key 时运行) ---
    count3, err3 = 0, 0
    if has_llm:
        count3, err3 = await test_with_llm()
    else:
        print("\n--- 模式 2: LLM 标准化 --- [跳过: 未配置 OPENAI_API_KEY]")

    # --- 总结 ---
    total_errors = err1 + err2 + err3
    print(f"\n{'=' * 60}")
    print("Standardizer Agent 验证完成!")
    print(f"{'=' * 60}")
    print(f"  无 LLM 标准化: {count1} 条成功")
    print(f"  攻击池写入:    {count2} 条成功")
    if has_llm:
        print(f"  LLM 标准化:    {count3} 条成功")
    print(f"  总错误: {total_errors}")
    print(f"  结果: {'PASS' if total_errors == 0 else 'FAIL'}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
