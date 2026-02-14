"""
外部 API 工具 — NVD、GitHub GraphQL、arXiv 等数据源的封装。

供 WP1-1 情报采集智能体的各 Agent 调用。
"""

from __future__ import annotations

import json
import time
import logging

from langchain_core.tools import tool

logger = logging.getLogger("saads.tools.api_tools")

# ---------------------------------------------------------------------------
# 1. NVD (National Vulnerability Database)
# ---------------------------------------------------------------------------


@tool
def search_nvd(keyword: str, max_results: int = 10) -> str:
    """
    搜索 NVD (National Vulnerability Database) 中与关键词相关的 CVE。

    支持通过 NVD_API_KEY 环境变量配置 API key 以提升速率限制。
    无 key: 5 次/30秒; 有 key: 50 次/30秒。

    Args:
        keyword: 搜索关键词（如 "LLM", "prompt injection", "langchain"）
        max_results: 最大返回结果数（上限 20）

    Returns:
        JSON 格式的 CVE 列表，包含 cve_id, description, severity, cvss_score, published, lastModified
    """
    return _search_nvd_impl(keyword, max_results)


def _search_nvd_impl(keyword: str, max_results: int = 10) -> str:
    """search_nvd 的内部实现（方便验证脚本直接调用）。"""
    import httpx
    from saads.config import NVD_API_KEY

    url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {"keywordSearch": keyword, "resultsPerPage": min(max_results, 20)}

    headers = {}
    if NVD_API_KEY:
        headers["apiKey"] = NVD_API_KEY

    # 重试逻辑: 遇到 403 (rate limit) 最多重试 2 次
    last_error = None
    for attempt in range(3):
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.get(url, params=params, headers=headers)
                resp.raise_for_status()
                data = resp.json()

            vulnerabilities = data.get("vulnerabilities", [])
            results = []
            for item in vulnerabilities[:max_results]:
                cve = item.get("cve", {})

                # 提取英文描述
                descriptions = cve.get("descriptions", [])
                desc = next(
                    (d["value"] for d in descriptions if d.get("lang") == "en"),
                    "No description",
                )

                # 提取 CVSS v3.1 评分和严重性
                cvss_score = None
                severity = None
                metrics = cve.get("metrics", {})
                for metric_key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
                    metric_list = metrics.get(metric_key, [])
                    if metric_list:
                        cvss_data = metric_list[0].get("cvssData", {})
                        cvss_score = cvss_data.get("baseScore")
                        severity = cvss_data.get("baseSeverity")
                        break

                results.append(
                    {
                        "cve_id": cve.get("id", ""),
                        "description": desc[:500],
                        "severity": severity,
                        "cvss_score": cvss_score,
                        "published": cve.get("published", ""),
                        "lastModified": cve.get("lastModified", ""),
                        "source": "nvd",
                    }
                )
            return json.dumps(results, indent=2, ensure_ascii=False)

        except httpx.HTTPStatusError as e:
            last_error = e
            if e.response.status_code == 403 and attempt < 2:
                wait = 6 * (attempt + 1)
                logger.warning(
                    "NVD rate limit hit (attempt %d/3), waiting %ds...",
                    attempt + 1,
                    wait,
                )
                time.sleep(wait)
                continue
            return f"Error querying NVD: {e}"
        except httpx.HTTPError as e:
            return f"Error querying NVD: {e}"

    return f"Error querying NVD after 3 attempts: {last_error}"


# ---------------------------------------------------------------------------
# 2. GitHub Security Advisories (GraphQL API)
# ---------------------------------------------------------------------------

# 策略 A: securityVulnerabilities — 用 `package` 参数做服务端过滤
# 适用于包名搜索 (如 "langchain", "pytorch", "openai")
GITHUB_VULNS_BY_PACKAGE_QUERY = """
query($first: Int!, $after: String, $package: String!) {
  securityVulnerabilities(
    first: $first
    after: $after
    package: $package
    orderBy: {field: UPDATED_AT, direction: DESC}
  ) {
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      advisory {
        ghsaId
        summary
        description
        severity
        publishedAt
        permalink
        cvss {
          vectorString
          score
        }
        cwes(first: 5) {
          nodes {
            cweId
            name
          }
        }
        identifiers {
          type
          value
        }
      }
      package {
        ecosystem
        name
      }
      vulnerableVersionRange
    }
  }
}
"""

# 策略 B: securityAdvisories — 获取最新公告，客户端过滤
# 适用于通用关键词 (如 "LLM", "prompt injection")
GITHUB_ADVISORIES_QUERY = """
query($first: Int!, $after: String) {
  securityAdvisories(
    first: $first
    after: $after
    orderBy: {field: PUBLISHED_AT, direction: DESC}
  ) {
    totalCount
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      ghsaId
      summary
      description
      severity
      publishedAt
      permalink
      cvss {
        vectorString
        score
      }
      cwes(first: 5) {
        nodes {
          cweId
          name
        }
      }
      identifiers {
        type
        value
      }
      vulnerabilities(first: 5) {
        nodes {
          package {
            ecosystem
            name
          }
          vulnerableVersionRange
        }
      }
    }
  }
}
"""

# 已知的 AI/ML 包名 — 当关键词匹配这些包名时，使用策略 A (服务端过滤)
KNOWN_AI_PACKAGES = {
    "langchain",
    "llama-index",
    "llamaindex",
    "openai",
    "pytorch",
    "torch",
    "tensorflow",
    "transformers",
    "huggingface",
    "vllm",
    "fastchat",
    "gradio",
    "streamlit",
    "chromadb",
    "pinecone",
    "weaviate",
    "autogpt",
    "auto-gpt",
    "babyagi",
    "guidance",
    "semantic-kernel",
    "litellm",
    "ollama",
    "lmstudio",
    "langflow",
    "flowise",
}


@tool
def search_github_advisories(keyword: str, max_results: int = 10) -> str:
    """
    通过 GitHub GraphQL API 搜索安全公告。

    需要 GITHUB_TOKEN 环境变量（Personal Access Token）。
    无 token 无法使用 GraphQL API。

    搜索策略:
      - 如果关键词是已知 AI/ML 包名 → 使用 securityVulnerabilities(package:) 服务端过滤
      - 否则 → 使用 securityAdvisories 获取最新公告 + 客户端关键词过滤

    Args:
        keyword: 搜索关键词（如 "langchain", "LLM", "prompt injection"）
        max_results: 最大返回结果数（上限 30）

    Returns:
        JSON 格式的安全公告列表
    """
    return _search_github_advisories_impl(keyword, max_results)


def _search_github_advisories_impl(keyword: str, max_results: int = 10) -> str:
    """search_github_advisories 的内部实现。

    Smart dispatch: tokenizes the keyword into words, routes known package names
    to Strategy A (server-side package search) and remaining words to Strategy B
    (client-side keyword filter). Results are merged and deduplicated by ghsa_id.
    """
    import httpx
    from saads.config import GITHUB_TOKEN

    if not GITHUB_TOKEN:
        return json.dumps(
            {
                "error": "GITHUB_TOKEN not configured. Set it in .env to use GitHub GraphQL API."
            },
            ensure_ascii=False,
        )

    # Tokenize keyword into individual words
    words = keyword.lower().strip().split()

    # Partition words into known package names vs general keywords
    package_words = [w for w in words if w in KNOWN_AI_PACKAGES]
    filter_words = [w for w in words if w not in KNOWN_AI_PACKAGES]

    all_results: list[dict] = []

    # Strategy A: server-side package search for each known package name
    for pkg in package_words:
        pkg_results_json = _search_by_package(pkg, max_results, GITHUB_TOKEN)
        try:
            pkg_results = json.loads(pkg_results_json)
            if isinstance(pkg_results, list):
                all_results.extend(pkg_results)
        except json.JSONDecodeError:
            pass

    # Strategy B: client-side keyword filter for remaining words
    # (skip if we already have enough results AND there are no filter words)
    if filter_words or not package_words:
        # If no filter words, use all original words for filtering
        search_words = filter_words if filter_words else words
        filter_results_json = _search_advisories_with_filter(
            search_words, max_results, GITHUB_TOKEN
        )
        try:
            filter_results = json.loads(filter_results_json)
            if isinstance(filter_results, list):
                all_results.extend(filter_results)
        except json.JSONDecodeError:
            pass

    # Deduplicate by ghsa_id
    seen: set[str] = set()
    deduped: list[dict] = []
    for item in all_results:
        ghsa = item.get("ghsa_id", "")
        if ghsa and ghsa in seen:
            continue
        seen.add(ghsa)
        deduped.append(item)

    return json.dumps(deduped[:max_results], indent=2, ensure_ascii=False)


def _search_by_package(package_name: str, max_results: int, token: str) -> str:
    """策略 A: 通过 securityVulnerabilities(package:) 服务端搜索。"""
    import httpx

    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"bearer {token}",
        "Content-Type": "application/json",
    }

    results = []
    cursor = None
    pages_fetched = 0

    while len(results) < max_results and pages_fetched < 3:
        variables: dict = {
            "first": min(max_results * 2, 50),
            "package": package_name,
        }
        if cursor:
            variables["after"] = cursor

        payload = {
            "query": GITHUB_VULNS_BY_PACKAGE_QUERY,
            "variables": variables,
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            if "errors" in data:
                return json.dumps(
                    {"error": f"GraphQL errors: {data['errors']}"},
                    ensure_ascii=False,
                )

            vuln_data = data.get("data", {}).get("securityVulnerabilities", {})
            nodes = vuln_data.get("nodes", [])
            page_info = vuln_data.get("pageInfo", {})

            for node in nodes:
                adv = node.get("advisory", {})
                pkg = node.get("package", {})

                cve_id = None
                for ident in adv.get("identifiers", []):
                    if ident.get("type") == "CVE":
                        cve_id = ident.get("value")
                        break

                cwes = [
                    n.get("cweId", "") for n in adv.get("cwes", {}).get("nodes", [])
                ]

                cvss_info = adv.get("cvss") or {}
                pkg_str = f"{pkg.get('ecosystem', '')}:{pkg.get('name', '')}"

                results.append(
                    {
                        "ghsa_id": adv.get("ghsaId", ""),
                        "cve_id": cve_id,
                        "summary": adv.get("summary", "")[:300],
                        "severity": adv.get("severity", ""),
                        "cvss_score": cvss_info.get("score"),
                        "published_at": adv.get("publishedAt", ""),
                        "html_url": adv.get("permalink", ""),
                        "cwes": cwes,
                        "affected_packages": [pkg_str],
                        "vulnerable_range": node.get("vulnerableVersionRange", ""),
                        "source": "github",
                    }
                )

                if len(results) >= max_results:
                    break

            pages_fetched += 1
            if not page_info.get("hasNextPage"):
                break
            cursor = page_info.get("endCursor")

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return json.dumps(
                    {"error": "GITHUB_TOKEN is invalid or expired."},
                    ensure_ascii=False,
                )
            return json.dumps(
                {"error": f"HTTP error querying GitHub GraphQL: {e}"},
                ensure_ascii=False,
            )
        except httpx.HTTPError as e:
            return json.dumps(
                {"error": f"Error querying GitHub GraphQL: {e}"},
                ensure_ascii=False,
            )

    return json.dumps(results[:max_results], indent=2, ensure_ascii=False)


def _search_advisories_with_filter(
    keywords: str | list[str], max_results: int, token: str
) -> str:
    """策略 B: 获取最新 advisories + 客户端关键词过滤。

    keywords can be a single string or a list of words.
    Matches if ANY word appears in the advisory text.
    """
    import httpx

    # Normalize keywords to a list of lowercase words
    if isinstance(keywords, str):
        word_list = keywords.lower().strip().split()
    else:
        word_list = [w.lower().strip() for w in keywords]

    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"bearer {token}",
        "Content-Type": "application/json",
    }

    results = []
    cursor = None
    pages_fetched = 0
    max_pages = 5

    while len(results) < max_results and pages_fetched < max_pages:
        variables: dict = {
            "first": 100,
        }
        if cursor:
            variables["after"] = cursor

        payload = {
            "query": GITHUB_ADVISORIES_QUERY,
            "variables": variables,
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()

            if "errors" in data:
                return json.dumps(
                    {"error": f"GraphQL errors: {data['errors']}"},
                    ensure_ascii=False,
                )

            advisories_data = data.get("data", {}).get("securityAdvisories", {})
            nodes = advisories_data.get("nodes", [])
            page_info = advisories_data.get("pageInfo", {})

            for adv in nodes:
                summary = adv.get("summary", "")
                desc = adv.get("description", "")

                # 客户端关键词过滤: match if ANY word appears
                searchable = (summary + " " + desc).lower()
                # 也检查包名
                pkg_names = []
                for vuln in adv.get("vulnerabilities", {}).get("nodes", []):
                    pkg = vuln.get("package", {})
                    if pkg:
                        pkg_names.append(pkg.get("name", "").lower())
                searchable += " " + " ".join(pkg_names)

                if not any(word in searchable for word in word_list):
                    continue

                cve_id = None
                for ident in adv.get("identifiers", []):
                    if ident.get("type") == "CVE":
                        cve_id = ident.get("value")
                        break

                cwes = [
                    n.get("cweId", "") for n in adv.get("cwes", {}).get("nodes", [])
                ]

                packages = []
                for vuln in adv.get("vulnerabilities", {}).get("nodes", []):
                    pkg = vuln.get("package", {})
                    if pkg:
                        packages.append(
                            f"{pkg.get('ecosystem', '')}:{pkg.get('name', '')}"
                        )

                cvss_info = adv.get("cvss") or {}

                results.append(
                    {
                        "ghsa_id": adv.get("ghsaId", ""),
                        "cve_id": cve_id,
                        "summary": summary[:300],
                        "severity": adv.get("severity", ""),
                        "cvss_score": cvss_info.get("score"),
                        "published_at": adv.get("publishedAt", ""),
                        "html_url": adv.get("permalink", ""),
                        "cwes": cwes,
                        "affected_packages": packages,
                        "source": "github",
                    }
                )

                if len(results) >= max_results:
                    break

            pages_fetched += 1
            if not page_info.get("hasNextPage"):
                break
            cursor = page_info.get("endCursor")

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return json.dumps(
                    {"error": "GITHUB_TOKEN is invalid or expired."},
                    ensure_ascii=False,
                )
            return json.dumps(
                {"error": f"HTTP error querying GitHub GraphQL: {e}"},
                ensure_ascii=False,
            )
        except httpx.HTTPError as e:
            return json.dumps(
                {"error": f"Error querying GitHub GraphQL: {e}"},
                ensure_ascii=False,
            )

    return json.dumps(results[:max_results], indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# 3. arXiv 论文搜索
# ---------------------------------------------------------------------------


@tool
def search_arxiv(query: str, max_results: int = 10) -> str:
    """
    搜索 arXiv 上的 AI 安全相关论文。

    无需 API key，但建议请求间隔 ≥ 3 秒（arXiv 礼貌性要求）。

    Args:
        query: 搜索查询（如 "prompt injection attack LLM"）
        max_results: 最大返回结果数（上限 30）

    Returns:
        JSON 格式的论文列表（标题、摘要、作者、分类、链接）
    """
    return _search_arxiv_impl(query, max_results)


def _search_arxiv_impl(query: str, max_results: int = 10) -> str:
    """search_arxiv 的内部实现。

    Query handling:
      - If the query already contains arXiv operators (AND, OR, all:, ti:, abs:),
        it is passed through as-is.
      - Otherwise, individual words are joined with AND using all: prefix,
        and multi-word quoted phrases are preserved.
        e.g. 'prompt injection LLM' -> 'all:"prompt injection" AND all:LLM'
             (caller can also pass pre-formatted queries)
    """
    import httpx
    import re

    # Check if query already uses arXiv search syntax
    has_operators = any(
        op in query for op in ("AND", "OR", "all:", "ti:", "abs:", "au:")
    )

    if has_operators:
        search_query = query
    else:
        # Build a proper AND query from plain keywords
        # Preserve quoted phrases, AND the rest as individual terms
        # Split on quoted phrases first, then tokenize unquoted parts
        parts = []
        # Extract quoted phrases
        tokens = re.findall(r'"[^"]+"|[\S]+', query)
        for token in tokens:
            if token.startswith('"'):
                parts.append(f"all:{token}")
            else:
                parts.append(f"all:{token}")
        search_query = " AND ".join(parts)

    url = "https://export.arxiv.org/api/query"
    params = {
        "search_query": search_query,
        "start": 0,
        "max_results": min(max_results, 30),
        "sortBy": "lastUpdatedDate",
        "sortOrder": "descending",
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()

        # arXiv 返回 Atom XML
        from xml.etree import ElementTree

        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "arxiv": "http://arxiv.org/schemas/atom",
        }
        root = ElementTree.fromstring(resp.text)

        results = []
        for entry in root.findall("atom:entry", ns):
            title_el = entry.find("atom:title", ns)
            summary_el = entry.find("atom:summary", ns)
            link_el = entry.find("atom:id", ns)
            published_el = entry.find("atom:published", ns)

            # 提取作者列表
            authors = []
            for author_el in entry.findall("atom:author", ns):
                name_el = author_el.find("atom:name", ns)
                if name_el is not None and name_el.text:
                    authors.append(name_el.text.strip())

            # 提取分类
            categories = []
            primary_cat_el = entry.find("arxiv:primary_category", ns)
            if primary_cat_el is not None:
                categories.append(primary_cat_el.get("term", ""))
            for cat_el in entry.findall("atom:category", ns):
                term = cat_el.get("term", "")
                if term and term not in categories:
                    categories.append(term)

            # 提取 PDF 链接
            pdf_url = ""
            for link_node in entry.findall("atom:link", ns):
                if link_node.get("title") == "pdf":
                    pdf_url = link_node.get("href", "")
                    break

            results.append(
                {
                    "title": (title_el.text or "").strip().replace("\n", " ")
                    if title_el is not None
                    else "",
                    "summary": (summary_el.text or "").strip()[:800]
                    if summary_el is not None
                    else "",
                    "authors": authors,
                    "categories": categories,
                    "url": (link_el.text or "").strip() if link_el is not None else "",
                    "pdf_url": pdf_url,
                    "published": (published_el.text or "").strip()
                    if published_el is not None
                    else "",
                    "source": "arxiv",
                }
            )
        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying arXiv: {e}"


# ---------------------------------------------------------------------------
# 4. Reddit (RSS feed — .json endpoints return 403 since 2023)
# ---------------------------------------------------------------------------


@tool
def search_reddit(subreddit: str, query: str, limit: int = 10) -> str:
    """
    搜索Reddit特定subreddit中的帖子（通过RSS feed）。

    Reddit 自 2023 年起封禁了未认证的 .json 端点 (403)，
    因此本工具使用公开 RSS (.rss) 端点 + Atom XML 解析。

    Args:
        subreddit: subreddit名称（如 "MachineLearning", "netsec"）
        query: 搜索关键词
        limit: 最大返回结果数（RSS 最多约 25 条）

    Returns:
        JSON格式的Reddit帖子列表
    """
    return _search_reddit_impl(subreddit, query, limit)


def _search_reddit_impl(subreddit: str, query: str, limit: int = 10) -> str:
    """search_reddit的内部实现 — 使用 RSS/Atom feed。"""
    try:
        import httpx
        import xml.etree.ElementTree as ET
        from datetime import datetime

        # RSS search endpoint (公开，不需要认证)
        url = f"https://www.reddit.com/r/{subreddit}/search.rss"
        params = {
            "q": query,
            "restrict_sr": "on",
            "sort": "new",
            "limit": min(limit, 25),  # RSS 通常最多 ~25 条
            "t": "year",  # 过去一年
        }

        headers = {
            # Reddit 要求自定义 User-Agent，否则返回 429
            "User-Agent": "SAADS/1.0 (security research; +https://github.com/saads)",
        }

        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            resp = client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            xml_text = resp.text

        # 解析 Atom XML
        # Atom 命名空间
        ns = {
            "atom": "http://www.w3.org/2005/Atom",
        }

        root = ET.fromstring(xml_text)
        entries = root.findall("atom:entry", ns)

        results = []
        for entry in entries[:limit]:
            title_el = entry.find("atom:title", ns)
            link_el = entry.find("atom:link", ns)
            updated_el = entry.find("atom:updated", ns)
            content_el = entry.find("atom:content", ns)
            author_el = entry.find("atom:author/atom:name", ns)
            category_el = entry.find("atom:category", ns)

            title = title_el.text if title_el is not None else ""
            link = link_el.get("href", "") if link_el is not None else ""
            updated = updated_el.text if updated_el is not None else ""
            author = author_el.text if author_el is not None else ""

            # 内容是 HTML，提取纯文本摘要
            description = ""
            if content_el is not None and content_el.text:
                import re

                # 去掉 HTML 标签，取前 500 字符作为描述
                description = re.sub(r"<[^>]+>", " ", content_el.text)
                description = re.sub(r"\s+", " ", description).strip()[:500]

            results.append(
                {
                    "title": title,
                    "description": description,
                    "url": link,
                    "published": updated,
                    "author": author,
                    "subreddit": subreddit,
                    "source": "reddit",
                }
            )

        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying Reddit: {e}"


# ---------------------------------------------------------------------------
# 5. HackerNews API
# ---------------------------------------------------------------------------


@tool
def search_hackernews(query: str, max_results: int = 10) -> str:
    """
    搜索HackerNews中与关键词相关的故事和讨论。

    使用Algolia HN Search API。

    Args:
        query: 搜索关键词
        max_results: 最大返回结果数

    Returns:
        JSON格式的HackerNews故事列表
    """
    return _search_hackernews_impl(query, max_results)


def _search_hackernews_impl(query: str, max_results: int = 10) -> str:
    """search_hackernews的内部实现。"""
    try:
        import httpx

        # 使用Algolia的HN Search API
        url = "https://hn.algolia.com/api/v1/search"
        params = {
            "query": query,
            "tags": "story",
            "hitsPerPage": max_results,
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for hit in data.get("hits", [])[:max_results]:
            results.append(
                {
                    "title": hit.get("title", ""),
                    "description": hit.get("story_text", "") or hit.get("title", ""),
                    "url": hit.get("url", "")
                    or f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
                    "points": hit.get("points", 0),
                    "author": hit.get("author", ""),
                    "created_at": hit.get("created_at", ""),
                    "num_comments": hit.get("num_comments", 0),
                    "source": "hackernews",
                }
            )

        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying HackerNews: {e}"


# ---------------------------------------------------------------------------
# 6. Exploit-DB (placeholder — no public REST API available)
# ---------------------------------------------------------------------------


@tool
def search_exploitdb(keyword: str, max_results: int = 10) -> str:
    """
    搜索Exploit-DB中的公开漏洞利用代码。

    注意: Exploit-DB 没有公开 REST API，搜索页面是 JS 渲染的。
    本工具返回一个指向搜索页面的占位结果，供人工跟进。
    如需自动化访问，可使用 searchsploit CLI 工具或 GitLab CSV 镜像。

    Args:
        keyword: 搜索关键词
        max_results: 最大返回结果数

    Returns:
        JSON格式的搜索引导信息
    """
    return _search_exploitdb_impl(keyword, max_results)


def _search_exploitdb_impl(keyword: str, max_results: int = 10) -> str:
    """search_exploitdb的内部实现 — 占位符，返回搜索引导。"""
    try:
        import urllib.parse

        encoded_kw = urllib.parse.quote_plus(keyword)

        # Exploit-DB 没有公开 REST API:
        #   - 搜索页面 (exploit-db.com/search) 是 JS 渲染的，httpx 无法获取内容
        #   - CSV 镜像在 GitLab 上 (>5MB)，对 LLM 安全主题相关性低
        #   - searchsploit CLI 需要本地安装 (Kali/apt)
        # 因此返回一个引导结果，供后续人工或 CLI 工具跟进。

        results = [
            {
                "title": f"Exploit-DB search: {keyword}",
                "description": (
                    f"Exploit-DB does not provide a public REST API. "
                    f"Use the web search page or the 'searchsploit' CLI tool "
                    f"to search for exploits matching '{keyword}'. "
                    f"Note: Exploit-DB primarily covers traditional software "
                    f"vulnerabilities and has limited LLM/AI security coverage."
                ),
                "url": f"https://www.exploit-db.com/search?q={encoded_kw}",
                "source": "exploitdb",
                "note": "placeholder — no automated API available",
            }
        ]

        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying Exploit-DB: {e}"


# ---------------------------------------------------------------------------
# 7. HuggingFace (Models API + Daily Papers)
# ---------------------------------------------------------------------------


@tool
def search_huggingface(query: str, max_results: int = 10) -> str:
    """
    搜索HuggingFace安全相关模型和每日论文。

    使用两个公开 API（无需认证）:
      - /api/models?search= — 搜索安全相关模型
      - /api/daily_papers — 获取每日论文并按关键词过滤

    可选: 设置 HF_TOKEN 环境变量以提升速率限制。

    Args:
        query: 搜索关键词
        max_results: 最大返回结果数

    Returns:
        JSON格式的模型和论文列表
    """
    return _search_huggingface_impl(query, max_results)


def _search_huggingface_impl(query: str, max_results: int = 10) -> str:
    """search_huggingface的内部实现 — Models API + Daily Papers。"""
    try:
        import httpx
        import os

        headers = {"User-Agent": "SAADS/1.0"}
        hf_token = os.getenv("HF_TOKEN", "")
        if hf_token:
            headers["Authorization"] = f"Bearer {hf_token}"

        results = []

        with httpx.Client(timeout=30.0) as client:
            # --- Part A: 搜索安全相关模型 ---
            models_url = "https://huggingface.co/api/models"
            models_params = {
                "search": query,
                "sort": "lastModified",
                "direction": "-1",
                "limit": max_results,
            }
            try:
                resp = client.get(models_url, params=models_params, headers=headers)
                resp.raise_for_status()
                models = resp.json()

                for m in models[:max_results]:
                    model_id = m.get("id", "")
                    results.append(
                        {
                            "title": model_id,
                            "description": (
                                f"HuggingFace model: {model_id}. "
                                f"Tags: {', '.join(m.get('tags', [])[:10])}. "
                                f"Downloads: {m.get('downloads', 0)}. "
                                f"Likes: {m.get('likes', 0)}."
                            ),
                            "url": f"https://huggingface.co/{model_id}",
                            "author": m.get("author", ""),
                            "last_modified": m.get("lastModified", ""),
                            "downloads": m.get("downloads", 0),
                            "likes": m.get("likes", 0),
                            "tags": m.get("tags", [])[:10],
                            "item_type": "model",
                            "source": "huggingface",
                        }
                    )
            except Exception as e:
                logger.warning("HuggingFace Models API error: %s", e)

            # --- Part B: 搜索每日论文 (客户端关键词过滤) ---
            papers_url = "https://huggingface.co/api/daily_papers"
            try:
                resp = client.get(papers_url, params={"limit": 100}, headers=headers)
                resp.raise_for_status()
                papers = resp.json()

                # 客户端关键词过滤 — daily_papers API 没有搜索参数
                query_words = query.lower().split()
                for p in papers:
                    paper_info = p.get("paper", {})
                    title = paper_info.get("title", "")
                    summary = paper_info.get("summary", "")
                    combined = f"{title} {summary}".lower()

                    # 任一关键词匹配
                    if any(w in combined for w in query_words):
                        paper_id = paper_info.get("id", "")
                        results.append(
                            {
                                "title": title,
                                "description": summary[:500],
                                "url": f"https://huggingface.co/papers/{paper_id}",
                                "published": p.get("publishedAt", ""),
                                "upvotes": p.get("paper", {}).get("upvotes", 0),
                                "item_type": "paper",
                                "source": "huggingface",
                            }
                        )
            except Exception as e:
                logger.warning("HuggingFace Daily Papers API error: %s", e)

        # 限制总结果数
        results = results[:max_results]

        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying HuggingFace: {e}"


# ---------------------------------------------------------------------------
# 8. VirusTotal API
# ---------------------------------------------------------------------------


@tool
def query_virustotal(resource: str, resource_type: str = "url") -> str:
    """
    查询VirusTotal以获取URL/文件哈希的安全分析结果。

    需要环境变量: VIRUSTOTAL_API_KEY

    Args:
        resource: URL或文件哈希
        resource_type: "url" 或 "file"

    Returns:
        JSON格式的分析结果
    """
    return _query_virustotal_impl(resource, resource_type)


def _query_virustotal_impl(resource: str, resource_type: str = "url") -> str:
    """query_virustotal的内部实现。"""
    try:
        import httpx
        from saads.config import VIRUSTOTAL_API_KEY

        if not VIRUSTOTAL_API_KEY:
            return json.dumps(
                {
                    "error": "VIRUSTOTAL_API_KEY not configured",
                    "note": "Set VIRUSTOTAL_API_KEY in .env file",
                }
            )

        if resource_type == "url":
            # URL扫描
            scan_url = "https://www.virustotal.com/vtapi/v2/url/report"
            params = {"apikey": VIRUSTOTAL_API_KEY, "resource": resource}
        else:
            # 文件哈希查询
            scan_url = "https://www.virustotal.com/vtapi/v2/file/report"
            params = {"apikey": VIRUSTOTAL_API_KEY, "resource": resource}

        with httpx.Client(timeout=30.0) as client:
            resp = client.get(scan_url, params=params)
            resp.raise_for_status()
            data = resp.json()

        # 提取关键信息
        result = {
            "resource": resource,
            "scan_date": data.get("scan_date", ""),
            "positives": data.get("positives", 0),
            "total": data.get("total", 0),
            "permalink": data.get("permalink", ""),
            "source": "virustotal",
        }

        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying VirusTotal: {e}"


# ---------------------------------------------------------------------------
# 9. AlienVault OTX (Open Threat Exchange)
# ---------------------------------------------------------------------------


@tool
def search_alienvault_otx(query: str, max_results: int = 10) -> str:
    """
    搜索AlienVault OTX威胁情报。

    需要环境变量: ALIENVAULT_API_KEY

    Args:
        query: 搜索关键词（IOC、域名、IP等）
        max_results: 最大返回结果数

    Returns:
        JSON格式的威胁情报
    """
    return _search_alienvault_otx_impl(query, max_results)


def _search_alienvault_otx_impl(query: str, max_results: int = 10) -> str:
    """search_alienvault_otx的内部实现。"""
    try:
        import httpx
        from saads.config import ALIENVAULT_API_KEY

        if not ALIENVAULT_API_KEY:
            return json.dumps(
                {
                    "error": "ALIENVAULT_API_KEY not configured",
                    "note": "Set ALIENVAULT_API_KEY in .env file",
                }
            )

        # 搜索Pulses（威胁情报包）
        url = "https://otx.alienvault.com/api/v1/search/pulses"
        params = {
            "q": query,
            "limit": max_results,
        }

        headers = {
            "X-OTX-API-KEY": ALIENVAULT_API_KEY,
            "User-Agent": "SAADS Intelligence Collector 1.0",
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for pulse in data.get("results", [])[:max_results]:
            results.append(
                {
                    "title": pulse.get("name", ""),
                    "description": pulse.get("description", "")[:500],
                    "author": pulse.get("author_name", ""),
                    "created": pulse.get("created", ""),
                    "modified": pulse.get("modified", ""),
                    "tlp": pulse.get("TLP", ""),
                    "tags": pulse.get("tags", []),
                    "indicator_count": len(pulse.get("indicators", [])),
                    "url": f"https://otx.alienvault.com/pulse/{pulse.get('id', '')}",
                    "source": "alienvault",
                }
            )

        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error querying AlienVault OTX: {e}"
