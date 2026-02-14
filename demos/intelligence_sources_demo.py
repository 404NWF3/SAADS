#!/usr/bin/env python3
"""
演示脚本：展示如何使用扩展的情报源

本脚本演示:
1. 如何单独调用新增的数据源API
2. 如何配置Web Crawler使用特定数据源
3. 如何查看采集结果的统计信息
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))


def demo_api_calls():
    """演示单独调用各个API"""
    print("=" * 80)
    print("📚 演示 1: 单独调用新增API")
    print("=" * 80)

    from saads.tools.api_tools import (
        _search_reddit_impl,
        _search_hackernews_impl,
        _search_exploitdb_impl,
    )
    import json

    # 1. Reddit 示例
    print("\n🔍 Reddit 搜索示例:")
    print("-" * 80)
    result = _search_reddit_impl("MachineLearning", "LLM", 3)
    if not result.startswith("Error"):
        data = json.loads(result)
        print(f"✅ 找到 {len(data)} 条 Reddit 帖子")
        if data:
            print(f"   示例标题: {data[0].get('title', 'N/A')[:60]}...")

    # 2. HackerNews 示例
    print("\n📰 HackerNews 搜索示例:")
    print("-" * 80)
    result = _search_hackernews_impl("AI security", 3)
    if not result.startswith("Error"):
        data = json.loads(result)
        print(f"✅ 找到 {len(data)} 条 HackerNews 故事")
        if data:
            print(f"   示例标题: {data[0].get('title', 'N/A')[:60]}...")

    # 3. Exploit-DB 示例
    print("\n💣 Exploit-DB 搜索示例:")
    print("-" * 80)
    result = _search_exploitdb_impl("python", 3)
    if not result.startswith("Error"):
        data = json.loads(result)
        print(f"✅ 找到 {len(data)} 条漏洞利用")
        if data:
            print(f"   示例标题: {data[0].get('title', 'N/A')[:60]}...")


async def demo_web_crawler_integration():
    """演示Web Crawler集成使用"""
    print("\n" + "=" * 80)
    print("🕷️  演示 2: Web Crawler 集成使用")
    print("=" * 80)

    from saads.agents.wp1_1.web_crawler import web_crawler_node

    # 构造测试状态
    test_state = {
        "collection_strategy": {
            "keywords": ["LLM security"],
            "target_sources": ["reddit", "hackernews"],  # 只使用新源
            "max_per_source": 3,
        },
        "raw_intel": [],
    }

    print("\n📋 配置:")
    print(f"  关键词: {test_state['collection_strategy']['keywords']}")
    print(f"  数据源: {test_state['collection_strategy']['target_sources']}")
    print(f"  每源最大数: {test_state['collection_strategy']['max_per_source']}")

    print("\n🚀 开始采集...")
    result = await web_crawler_node(test_state)

    raw_intel = result.get("raw_intel", [])
    print(f"\n✅ 采集完成! 共获取 {len(raw_intel)} 条原始情报")

    # 统计各来源数量
    from collections import Counter

    sources = Counter(item.get("_source_type", "unknown") for item in raw_intel)
    print("\n📊 来源统计:")
    for source, count in sources.items():
        print(f"  {source}: {count} 条")

    # 显示前3条示例
    print("\n📝 情报示例:")
    for idx, item in enumerate(raw_intel[:3], 1):
        print(f"\n  [{idx}] {item.get('title', 'N/A')[:70]}")
        print(f"      来源: {item.get('_source_type', 'N/A')}")
        print(f"      URL: {item.get('url', 'N/A')[:70]}...")


def demo_supervisor_strategy():
    """演示Supervisor策略配置"""
    print("\n" + "=" * 80)
    print("🎯 演示 3: Supervisor 策略配置")
    print("=" * 80)

    from saads.agents.wp1_1.supervisor import CATEGORY_SOURCES

    print("\n各攻击类别推荐的数据源配置:\n")
    for category, sources in CATEGORY_SOURCES.items():
        print(f"📌 {category}:")
        print(f"   推荐数据源: {', '.join(sources)}")
        print(f"   数据源数量: {len(sources)}")

    print("\n💡 提示:")
    print("  - Supervisor 会根据当前攻击池覆盖率动态选择数据源")
    print("  - 可以在 supervisor.py 中调整每个类别的数据源优先级")


def demo_data_model():
    """演示数据模型更新"""
    print("\n" + "=" * 80)
    print("📋 演示 4: 数据模型扩展")
    print("=" * 80)

    from saads.models.attack import AttackSource

    print("\n支持的情报来源类型:\n")

    # 通过类型注解获取所有支持的类型
    import typing

    source_types = typing.get_args(AttackSource.__annotations__["type"])

    for idx, source_type in enumerate(source_types, 1):
        emoji = {
            "arxiv": "📄",
            "nvd": "🛡️",
            "github": "🐙",
            "darkweb": "🕵️",
            "reddit": "🤖",
            "hackernews": "📰",
            "exploitdb": "💣",
            "huggingface": "🤗",
            "virustotal": "🦠",
            "alienvault": "👽",
            "blog": "📝",
            "cve": "🔒",
            "threat_api": "🌐",
        }.get(source_type, "📌")

        status = (
            "🆕"
            if source_type
            in [
                "reddit",
                "hackernews",
                "exploitdb",
                "huggingface",
                "virustotal",
                "alienvault",
            ]
            else ""
        )

        print(f"  {idx:2d}. {emoji} {source_type:15s} {status}")

    print(f"\n✅ 共支持 {len(source_types)} 种情报来源类型")


def main():
    """主函数"""
    print("\n" + "=" * 80)
    print("🎉 SAADS 情报源扩展功能演示")
    print("=" * 80)
    print("\n本演示展示新增的6个数据源和扩展功能的使用方法")
    print("演示内容:")
    print("  1. 单独调用新增API")
    print("  2. Web Crawler 集成使用")
    print("  3. Supervisor 策略配置")
    print("  4. 数据模型扩展")

    try:
        # 演示1: API调用
        demo_api_calls()

        # 演示2: Web Crawler (异步)
        asyncio.run(demo_web_crawler_integration())

        # 演示3: Supervisor策略
        demo_supervisor_strategy()

        # 演示4: 数据模型
        demo_data_model()

        print("\n" + "=" * 80)
        print("✅ 演示完成!")
        print("=" * 80)
        print("\n💡 下一步:")
        print("  - 运行完整情报采集: python main.py run-wp1-1")
        print("  - 运行测试脚本: python tests/scripts/test_all_new_sources.py")
        print("  - 查看文档: INTELLIGENCE_SOURCES_UPDATE.md")
        print()

    except Exception as e:
        print(f"\n❌ 演示过程中出现错误: {e}")
        print("   这可能是由于:")
        print("   1. 网络连接问题")
        print("   2. 依赖包未安装（运行: pip install -r requirements.txt）")
        print("   3. API服务暂时不可用")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
