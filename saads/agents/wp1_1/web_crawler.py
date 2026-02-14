"""
WP1-1 Web Crawler Agent — 爬取公开漏洞库、技术社区、安全博客。

数据源:
  - NVD (National Vulnerability Database) — CVE 搜索
  - GitHub Security Advisories — AI 框架安全公告
  - 安全博客 (OWASP, PortSwigger, Google Security, etc.)
  - Reddit — 技术社区讨论 (r/MachineLearning, r/netsec, etc.)
  - HackerNews — 技术新闻和讨论
  - Exploit-DB — 公开漏洞利用数据库
  - HuggingFace — 模型安全讨论
  - VirusTotal — 恶意payload检测
  - AlienVault OTX — 开放威胁情报

工具:
  - search_nvd
  - search_github_advisories
  - search_reddit
  - search_hackernews
  - search_exploitdb
  - search_huggingface
  - query_virustotal
  - search_alienvault_otx
  - fetch_url + parse_html

节点函数: web_crawler_node(state) -> dict
  读取 state.collection_strategy 中的关键词和目标数据源，
  调用对应 API 工具采集原始情报，追加到 state.raw_intel。
"""

from __future__ import annotations

import json
import time

from saads.agents.wp1_1.state import IntelState
from saads.tools.api_tools import (
    _search_nvd_impl,
    _search_github_advisories_impl,
    _search_reddit_impl,
    _search_hackernews_impl,
    _search_exploitdb_impl,
    _search_huggingface_impl,
    _query_virustotal_impl,
    _search_alienvault_otx_impl,
)
from saads.tools.web_tools import fetch_url, parse_html
from saads.utils.logging import setup_logger

logger = setup_logger("wp1_1.web_crawler")

# 安全博客 URL — 用于从公开安全资源采集情报
SECURITY_BLOG_SOURCES = [
    {
        "name": "OWASP Top 10 for LLM",
        "url": "https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/",
        "selector": "article, main, .content, body",
    },
    {
        "name": "PortSwigger Research",
        "url": "https://portswigger.net/research",
        "selector": "article, .blog-post, main",
    },
    {
        "name": "Google Security Blog",
        "url": "https://security.googleblog.com/",
        "selector": "article, .post-body, main",
    },
    {
        "name": "Microsoft Security Response Center",
        "url": "https://msrc.microsoft.com/blog/",
        "selector": "article, .entry-content, main",
    },
    {
        "name": "OpenAI Safety",
        "url": "https://openai.com/research/",
        "selector": "article, main, .content",
    },
    {
        "name": "NIST AI Risk Management",
        "url": "https://www.nist.gov/itl/ai-risk-management-framework",
        "selector": "article, .field-body, main",
    },
]

# Reddit Subreddits — AI/ML安全相关社区
SECURITY_SUBREDDITS = [
    "MachineLearning",
    "netsec",
    "artificial",
    "cybersecurity",
    "ArtificialInteligence",
]


async def web_crawler_node(state: IntelState) -> dict:
    """
    Web Crawler Agent 节点。

    从 state.collection_strategy 读取采集参数:
      - keywords: list[str] — 搜索关键词
      - target_sources: list[str] — 目标数据源 ("nvd", "github", "blog")
      - max_per_source: int — 每个源最大采集数

    返回:
      - raw_intel: list[dict] — 原始情报列表，追加到已有数据
    """
    strategy = state.get("collection_strategy", {})
    keywords = strategy.get("keywords", ["LLM security", "prompt injection"])
    target_sources = strategy.get("target_sources", ["nvd", "github"])
    max_per_source = strategy.get("max_per_source", 5)

    raw_intel: list[dict] = []

    # --- 1. NVD 采集 ---
    if "nvd" in target_sources:
        for kw in keywords:
            logger.info("NVD: searching '%s'", kw)
            try:
                result = _search_nvd_impl(kw, max_results=max_per_source)
                items = json.loads(result)
                if isinstance(items, list):
                    for item in items:
                        item["_source_type"] = "nvd"
                        item["_keyword"] = kw
                    raw_intel.extend(items)
                    logger.info("NVD: got %d results for '%s'", len(items), kw)
                else:
                    logger.warning(
                        "NVD: unexpected response for '%s': %s", kw, result[:200]
                    )
            except Exception as e:
                logger.error("NVD: error searching '%s': %s", kw, e)

            # NVD 礼貌性等待（无 key 时 6 秒限制）
            time.sleep(2)

    # --- 2. GitHub Advisories 采集 ---
    if "github" in target_sources:
        for kw in keywords:
            logger.info("GitHub: searching '%s'", kw)
            try:
                result = _search_github_advisories_impl(kw, max_results=max_per_source)
                items = json.loads(result)
                if isinstance(items, dict) and "error" in items:
                    logger.warning("GitHub: %s", items["error"])
                elif isinstance(items, list):
                    for item in items:
                        item["_source_type"] = "github"
                        item["_keyword"] = kw
                    raw_intel.extend(items)
                    logger.info("GitHub: got %d results for '%s'", len(items), kw)
                else:
                    logger.warning("GitHub: unexpected response for '%s'", kw)
            except Exception as e:
                logger.error("GitHub: error searching '%s': %s", kw, e)

    # --- 3. 安全博客采集 ---
    if "blog" in target_sources:
        for blog in SECURITY_BLOG_SOURCES:
            logger.info("Blog: fetching '%s'", blog["name"])
            try:
                html = fetch_url.invoke({"url": blog["url"]})
                if html and not html.startswith("Error"):
                    text = parse_html.invoke(
                        {"html": html, "selector": blog["selector"]}
                    )
                    if text and not text.startswith("No elements"):
                        raw_intel.append(
                            {
                                "title": blog["name"],
                                "description": text[:2000],
                                "url": blog["url"],
                                "_source_type": "blog",
                                "_keyword": "security_blog",
                                "source": "blog",
                            }
                        )
                        logger.info(
                            "Blog: got content from '%s' (%d chars)",
                            blog["name"],
                            len(text),
                        )
                    else:
                        logger.warning(
                            "Blog: no content matched selector for '%s'", blog["name"]
                        )
                else:
                    logger.warning(
                        "Blog: failed to fetch '%s': %s",
                        blog["name"],
                        html[:200] if html else "empty",
                    )
            except Exception as e:
                logger.error("Blog: error fetching '%s': %s", blog["name"], e)

    # --- 4. Reddit 采集 ---
    if "reddit" in target_sources:
        for subreddit in SECURITY_SUBREDDITS:
            for kw in keywords:
                logger.info("Reddit: searching r/%s for '%s'", subreddit, kw)
                try:
                    result = _search_reddit_impl(subreddit, kw, limit=max_per_source)
                    items = json.loads(result)
                    if isinstance(items, list):
                        for item in items:
                            item["_source_type"] = "reddit"
                            item["_keyword"] = kw
                        raw_intel.extend(items)
                        logger.info(
                            "Reddit: got %d results from r/%s for '%s'",
                            len(items),
                            subreddit,
                            kw,
                        )
                    else:
                        logger.warning(
                            "Reddit: unexpected response from r/%s: %s",
                            subreddit,
                            result[:200],
                        )
                except Exception as e:
                    logger.error("Reddit: error searching r/%s: %s", subreddit, e)

                # 礼貌性等待
                time.sleep(1)

    # --- 5. HackerNews 采集 ---
    if "hackernews" in target_sources:
        for kw in keywords:
            logger.info("HackerNews: searching '%s'", kw)
            try:
                result = _search_hackernews_impl(kw, max_results=max_per_source)
                items = json.loads(result)
                if isinstance(items, list):
                    for item in items:
                        item["_source_type"] = "hackernews"
                        item["_keyword"] = kw
                    raw_intel.extend(items)
                    logger.info("HackerNews: got %d results for '%s'", len(items), kw)
                else:
                    logger.warning(
                        "HackerNews: unexpected response for '%s': %s", kw, result[:200]
                    )
            except Exception as e:
                logger.error("HackerNews: error searching '%s': %s", kw, e)

    # --- 6. Exploit-DB 采集 ---
    if "exploitdb" in target_sources:
        for kw in keywords:
            logger.info("Exploit-DB: searching '%s'", kw)
            try:
                result = _search_exploitdb_impl(kw, max_results=max_per_source)
                items = json.loads(result)
                if isinstance(items, list):
                    for item in items:
                        item["_source_type"] = "exploitdb"
                        item["_keyword"] = kw
                    raw_intel.extend(items)
                    logger.info("Exploit-DB: got %d results for '%s'", len(items), kw)
                else:
                    logger.warning(
                        "Exploit-DB: unexpected response for '%s': %s", kw, result[:200]
                    )
            except Exception as e:
                logger.error("Exploit-DB: error searching '%s': %s", kw, e)

    # --- 7. HuggingFace 采集 ---
    if "huggingface" in target_sources:
        for kw in keywords:
            logger.info("HuggingFace: searching '%s'", kw)
            try:
                result = _search_huggingface_impl(kw, max_results=max_per_source)
                items = json.loads(result)
                if isinstance(items, list):
                    for item in items:
                        item["_source_type"] = "huggingface"
                        item["_keyword"] = kw
                    raw_intel.extend(items)
                    logger.info("HuggingFace: got %d results for '%s'", len(items), kw)
                else:
                    logger.warning(
                        "HuggingFace: unexpected response for '%s': %s",
                        kw,
                        result[:200],
                    )
            except Exception as e:
                logger.error("HuggingFace: error searching '%s': %s", kw, e)

    # --- 8. VirusTotal 采集 (可选，用于验证payload) ---
    if "virustotal" in target_sources:
        # VirusTotal主要用于验证已知的URL/payload，这里记录为可用
        logger.info("VirusTotal: API available for payload verification")
        raw_intel.append(
            {
                "title": "VirusTotal API Integration",
                "description": "VirusTotal API is available for URL/file hash verification",
                "url": "https://www.virustotal.com/",
                "_source_type": "virustotal",
                "_keyword": "api_integration",
                "source": "virustotal",
            }
        )

    # --- 9. AlienVault OTX 采集 ---
    if "alienvault" in target_sources:
        for kw in keywords:
            logger.info("AlienVault OTX: searching '%s'", kw)
            try:
                result = _search_alienvault_otx_impl(kw, max_results=max_per_source)
                items = json.loads(result)
                if isinstance(items, list):
                    for item in items:
                        item["_source_type"] = "alienvault"
                        item["_keyword"] = kw
                    raw_intel.extend(items)
                    logger.info(
                        "AlienVault OTX: got %d results for '%s'", len(items), kw
                    )
                elif isinstance(items, dict) and "error" in items:
                    logger.warning("AlienVault OTX: %s", items["error"])
                else:
                    logger.warning(
                        "AlienVault OTX: unexpected response for '%s': %s",
                        kw,
                        result[:200],
                    )
            except Exception as e:
                logger.error("AlienVault OTX: error searching '%s': %s", kw, e)

    logger.info("Web Crawler: collected %d raw intel items total", len(raw_intel))

    return {"raw_intel": raw_intel}
