"""
Web 工具 — HTTP 请求和网页解析。

供 WP1-1 情报采集智能体的各 Agent 调用。
"""

from __future__ import annotations

from langchain_core.tools import tool


@tool
def fetch_url(url: str) -> str:
    """
    获取指定 URL 的内容。

    Args:
        url: 要请求的完整 URL

    Returns:
        响应的文本内容（截断到前 10000 字符）
    """
    import httpx

    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": "SAADS-Intel-Collector/0.1"})
            resp.raise_for_status()
            return resp.text[:10000]
    except httpx.HTTPError as e:
        return f"Error fetching {url}: {e}"


@tool
def parse_html(html: str, selector: str = "body") -> str:
    """
    使用 CSS 选择器解析 HTML 并提取文本内容。

    Args:
        html: HTML 字符串
        selector: CSS 选择器，默认 "body"

    Returns:
        匹配元素的纯文本内容
    """
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    elements = soup.select(selector)
    if not elements:
        return "No elements matched the selector."
    return "\n".join(el.get_text(strip=True) for el in elements)[:5000]
