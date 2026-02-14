#!/usr/bin/env python3
"""
综合测试所有新增数据源的集成。

测试以下数据源:
- Reddit (免费)
- HackerNews (免费)
- Exploit-DB (免费)
- HuggingFace (免费)
- VirusTotal (需要API Key)
- AlienVault OTX (需要API Key)
"""

import json
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from saads.tools.api_tools import (
    _search_reddit_impl,
    _search_hackernews_impl,
    _search_exploitdb_impl,
    _search_huggingface_impl,
    _query_virustotal_impl,
    _search_alienvault_otx_impl,
)
from saads.config import VIRUSTOTAL_API_KEY, ALIENVAULT_API_KEY


def test_source(name, func, *args):
    """通用测试函数。"""
    print(f"\n{'=' * 80}")
    print(f"🧪 测试 {name}")
    print("=" * 80)

    try:
        result = func(*args)

        if result.startswith("Error"):
            print(f"❌ 错误: {result}")
            return False

        data = json.loads(result)

        if isinstance(data, dict) and "error" in data:
            print(f"⚠️  配置问题: {data.get('error')}")
            print(f"   {data.get('note', '')}")
            return False

        if isinstance(data, list):
            print(f"✅ 成功获取 {len(data)} 条结果")
            if len(data) > 0:
                print(f"   示例: {data[0].get('title', 'N/A')[:60]}...")
            return True
        else:
            print(f"⚠️  未预期的响应格式")
            return False

    except Exception as e:
        print(f"❌ 异常: {e}")
        return False


def main():
    """主测试函数。"""
    print("\n" + "=" * 80)
    print("🚀 SAADS 新增数据源集成测试")
    print("=" * 80)

    results = {}

    # 1. Reddit (免费)
    results["Reddit"] = test_source(
        "Reddit", _search_reddit_impl, "MachineLearning", "LLM security", 3
    )

    # 2. HackerNews (免费)
    results["HackerNews"] = test_source(
        "HackerNews", _search_hackernews_impl, "AI security", 3
    )

    # 3. Exploit-DB (免费)
    results["Exploit-DB"] = test_source(
        "Exploit-DB", _search_exploitdb_impl, "python", 3
    )

    # 4. HuggingFace (免费)
    results["HuggingFace"] = test_source(
        "HuggingFace", _search_huggingface_impl, "security", 3
    )

    # 5. VirusTotal (需要API Key)
    if VIRUSTOTAL_API_KEY:
        results["VirusTotal"] = test_source(
            "VirusTotal",
            _query_virustotal_impl,
            "http://www.eicar.org/download/eicar.com.txt",
            "url",
        )
    else:
        print(f"\n{'=' * 80}")
        print("⏭️  跳过 VirusTotal (未配置 API Key)")
        print("=" * 80)
        results["VirusTotal"] = None

    # 6. AlienVault OTX (需要API Key)
    if ALIENVAULT_API_KEY:
        results["AlienVault OTX"] = test_source(
            "AlienVault OTX", _search_alienvault_otx_impl, "malware", 3
        )
    else:
        print(f"\n{'=' * 80}")
        print("⏭️  跳过 AlienVault OTX (未配置 API Key)")
        print("=" * 80)
        results["AlienVault OTX"] = None

    # 汇总结果
    print("\n" + "=" * 80)
    print("📊 测试结果汇总")
    print("=" * 80)

    success_count = sum(1 for v in results.values() if v is True)
    failed_count = sum(1 for v in results.values() if v is False)
    skipped_count = sum(1 for v in results.values() if v is None)

    for source, result in results.items():
        if result is True:
            status = "✅ 通过"
        elif result is False:
            status = "❌ 失败"
        else:
            status = "⏭️  跳过"
        print(f"  {source:20s}: {status}")

    print("\n" + "=" * 80)
    print(f"总计: {success_count} 通过, {failed_count} 失败, {skipped_count} 跳过")
    print("=" * 80)

    # 配置提示
    if not VIRUSTOTAL_API_KEY or not ALIENVAULT_API_KEY:
        print("\n💡 获取免费API Key:")
        if not VIRUSTOTAL_API_KEY:
            print("  VirusTotal: https://www.virustotal.com/gui/join-us")
        if not ALIENVAULT_API_KEY:
            print("  AlienVault: https://otx.alienvault.com/")

    print("\n✅ 集成测试完成!\n")

    # 返回退出码
    sys.exit(0 if failed_count == 0 else 1)


if __name__ == "__main__":
    main()
