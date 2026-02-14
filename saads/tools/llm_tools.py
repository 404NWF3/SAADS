"""
LLM 辅助工具 — 封装常见的 LLM 调用模式。
"""

from __future__ import annotations

from langchain_core.tools import tool


@tool
def summarize_text(text: str, focus: str = "security threats") -> str:
    """
    使用 LLM 对文本进行摘要提取。

    Args:
        text: 待摘要的文本
        focus: 提取的重点方向，默认为安全威胁

    Returns:
        摘要文本
    """
    from saads.config import get_fast_llm

    llm = get_fast_llm()
    response = llm.invoke(
        f"Please summarize the following text, focusing on {focus}. "
        f"Extract key security-relevant information, attack methods, "
        f"affected systems, and potential mitigations.\n\n"
        f"Text:\n{text[:8000]}"
    )
    return str(response.content or "")


@tool
def classify_attack_category(description: str) -> str:
    """
    使用 LLM 将攻击描述分类到 OWASP LLM Top 10 对应的攻击类别。

    Args:
        description: 攻击的文字描述

    Returns:
        分类结果（prompt_injection, jailbreak, info_leakage, multimodal, dos, agent_hijack 之一）
    """
    from saads.config import get_fast_llm

    llm = get_fast_llm()
    response = llm.invoke(
        "Classify the following attack description into exactly one of these categories:\n"
        "- prompt_injection: Direct or indirect prompt injection attacks\n"
        "- jailbreak: Jailbreak attacks (DAN, role-playing, encoding bypass)\n"
        "- info_leakage: Information leakage (system prompt, training data, RAG data)\n"
        "- multimodal: Multimodal attacks (adversarial images, audio, cross-modal)\n"
        "- dos: Denial of service attacks on AI systems\n"
        "- agent_hijack: AI agent hijacking and excessive agency exploitation\n\n"
        f"Attack description:\n{description[:3000]}\n\n"
        "Respond with ONLY the category name, nothing else."
    )
    category = str(response.content or "").strip().lower()
    valid = {
        "prompt_injection",
        "jailbreak",
        "info_leakage",
        "multimodal",
        "dos",
        "agent_hijack",
    }
    return category if category in valid else "prompt_injection"
