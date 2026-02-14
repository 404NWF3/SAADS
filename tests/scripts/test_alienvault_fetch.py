#!/usr/bin/env python3
"""
测试 AlienVault OTX API 搜索功能。

验证 AlienVault 开放威胁情报交换平台集成。需要 ALIENVAULT_API_KEY 环境变量。
"""

import json
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from saads.tools.api_tools import _search_alienvault_otx_impl
from saads.config import ALIENVAULT_API_KEY


def test_alienvault_search():
    """测试 AlienVault OTX 搜索功能。"""
    print("=" * 80)
    print("测试 AlienVault OTX API 搜索")
    print("=" * 80)

    # 检查 API Key
    if not ALIENVAULT_API_KEY:
        print("\n⚠️  警告: 未设置 ALIENVAULT_API_KEY 环境变量")
        print("   请在 .env 文件中添加:")
        print("   ALIENVAULT_API_KEY=your-api-key-here")
        print("\n   获取免费 API Key: https://otx.alienvault.com/")
        return

    test_queries = [
        ("malware AI", 5),
        ("phishing", 5),
        ("ransomware", 5),
    ]

    for query, max_results in test_queries:
        print(f"\n{'=' * 80}")
        print(f"搜索威胁情报: '{query}' (max_results={max_results})")
        print("=" * 80)

        result = _search_alienvault_otx_impl(query, max_results)

        # 检查是否返回错误
        if result.startswith("Error"):
            print(f"❌ 错误: {result}")
            continue

        # 解析 JSON 结果
        try:
            data = json.loads(result)

            if "error" in data:
                print(f"⚠️  API 配置问题: {data.get('error')}")
                print(f"   提示: {data.get('note', '')}")
                continue

            print(f"✅ 成功获取 {len(data)} 条威胁情报\n")

            # 显示前 3 条结果的详情
            for idx, item in enumerate(data[:3], 1):
                print(f"\n🛡️  威胁情报 #{idx}:")
                print(f"  标题: {item.get('title', 'N/A')}")
                print(f"  作者: {item.get('author', 'N/A')}")
                print(f"  TLP 等级: {item.get('tlp', 'N/A')}")
                print(f"  IOC 数量: {item.get('indicator_count', 0)}")
                print(f"  创建时间: {item.get('created', 'N/A')}")
                print(f"  URL: {item.get('url', 'N/A')}")
                tags = item.get("tags", [])
                if tags:
                    print(f"  标签: {', '.join(tags[:5])}")
                desc = item.get("description", "")
                if desc:
                    print(f"  描述: {desc[:200]}...")

        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失败: {e}")
            print(f"原始响应: {result[:500]}")


def main():
    """主函数。"""
    print("\n🚀 开始测试 AlienVault OTX API\n")

    test_alienvault_search()

    print("\n" + "=" * 80)
    print("✅ AlienVault OTX API 测试完成")
    print("=" * 80)


if __name__ == "__main__":
    main()
