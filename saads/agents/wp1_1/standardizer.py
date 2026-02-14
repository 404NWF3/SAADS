"""
WP1-1 Standardizer Agent — 将原始情报标准化为 STIX 2.1 兼容的 AttackEntry。

职责:
  1. 使用 LLM 将 raw_intel 中的非结构化情报转为 AttackEntry JSON
  2. 去重 — 基于 attack_id 检查已存在的条目
  3. 写入 data/attack_pool/ 目录
  4. 返回标准化后的 AttackEntry 列表

工具:
  - get_fast_llm: 轻量 LLM 做分类和结构化提取
  - AttackPoolStore: 知识库存储

节点函数: standardizer_node(state) -> dict
  读取 state.raw_intel 中的原始情报列表，
  逐条使用 LLM 标准化为 AttackEntry，
  写入攻击池，返回 standardized_entries。
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime

from langchain_core.messages import HumanMessage

from saads.agents.wp1_1.state import IntelState
from saads.config import get_fast_llm
from saads.knowledge_base.attack_pool_store import AttackPoolStore
from saads.models.attack import AttackEntry
from saads.utils.logging import setup_logger

logger = setup_logger("wp1_1.standardizer")

# ---------------------------------------------------------------------------
# LLM 标准化提示词
# ---------------------------------------------------------------------------

STANDARDIZE_PROMPT = """\
You are an AI security intelligence analyst. Convert the following raw threat \
intelligence into a structured STIX 2.1-compatible attack entry.

Raw Intelligence:
{raw_json}

Convert this into the following JSON structure. Fill in ALL fields based on the \
information available. If a field cannot be determined, use reasonable defaults.

{{
    "attack_id": "<generate a unique ID: ATK-<category_prefix>-<short_hash>>",
    "category": "<exactly one of: prompt_injection, jailbreak, info_leakage, multimodal, dos, agent_hijack>",
    "subcategory": "<more specific type, e.g., indirect_injection, role_play_jailbreak, system_prompt_leak>",
    "stix_type": "attack-pattern",
    "source": {{
        "type": "<one of: arxiv, cve, nvd, blog, github, darkweb, threat_api>",
        "url": "<source URL if available, otherwise empty string>",
        "crawl_time": "{crawl_time}",
        "confidence": "<high/medium/low based on source reliability>"
    }},
    "attack_template": {{
        "name": "<concise attack name>",
        "description": "<1-2 sentence description of the attack technique>",
        "payload_template": "<example payload or template string>",
        "variables": {{}},
        "modality": "<text/image/audio>",
        "mutation_hints": ["<hint1>", "<hint2>"]
    }},
    "mitre_mapping": {{
        "tactic": "<MITRE ATT&CK tactic, e.g., Initial Access, Execution>",
        "technique": "<MITRE technique ID if known, e.g., T1059, otherwise descriptive name>"
    }},
    "metadata": {{
        "severity_estimate": "<critical/high/medium/low>",
        "target_type": ["<affected system types, e.g., ChatGPT, LangChain, GPT-4>"],
        "defense_bypass": ["<bypassed defenses, e.g., content_filter, safety_training>"],
        "effectiveness": null,
        "last_tested": null
    }},
    "status": "active"
}}

Rules:
1. The category MUST be exactly one of: prompt_injection, jailbreak, info_leakage, multimodal, dos, agent_hijack
2. Generate attack_id as: ATK-<2-letter category prefix>-<6 char hex hash of title>
   Category prefixes: PI=prompt_injection, JB=jailbreak, IL=info_leakage, MM=multimodal, DS=dos, AH=agent_hijack
3. source.type should match the _source_type field if present
4. payload_template should contain an actionable example (sanitized for research)
5. For severity_estimate, consider: critical=RCE/data_breach, high=safety_bypass, medium=information_disclosure, low=theoretical

Respond with ONLY valid JSON, no markdown fences, no explanation.
"""

# 类别前缀映射
CATEGORY_PREFIX = {
    "prompt_injection": "PI",
    "jailbreak": "JB",
    "info_leakage": "IL",
    "multimodal": "MM",
    "dos": "DS",
    "agent_hijack": "AH",
}


def generate_attack_id(title: str, category: str) -> str:
    """生成 attack_id: ATK-<prefix>-<6 char hex>"""
    prefix = CATEGORY_PREFIX.get(category, "XX")
    hash_hex = hashlib.md5(title.encode()).hexdigest()[:6]
    return f"ATK-{prefix}-{hash_hex}"


async def standardizer_node(state: IntelState) -> dict:
    """
    Standardizer Agent 节点。

    读取 state.raw_intel 列表，逐条使用 LLM 标准化为 AttackEntry。
    去重后写入 attack_pool 知识库。

    返回:
      - standardized_entries: list[AttackEntry] — 标准化后的攻击条目
    """
    raw_intel = state.get("raw_intel", [])

    if not raw_intel:
        logger.warning("Standardizer: no raw_intel to process")
        return {"standardized_entries": []}

    logger.info("Standardizer: processing %d raw intel items", len(raw_intel))

    llm = get_fast_llm()
    store = AttackPoolStore()
    crawl_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")

    standardized: list[AttackEntry] = []
    skipped_dup = 0
    skipped_err = 0

    for i, raw_item in enumerate(raw_intel):
        title = raw_item.get("title") or raw_item.get("cve_id") or f"intel_{i}"
        logger.info(
            "Standardizer: [%d/%d] processing '%s'", i + 1, len(raw_intel), title[:60]
        )

        # --- 1. 预计算 attack_id 用于去重 ---
        # 先用 raw_item 中已有的 category 或猜测一个
        pre_category = raw_item.get("category", "prompt_injection")
        pre_id = generate_attack_id(title, pre_category)

        # 去重: 如果已存在就跳过
        if store.exists(pre_id):
            logger.info("Standardizer: skip duplicate '%s'", pre_id)
            skipped_dup += 1
            continue

        # --- 2. LLM 标准化 ---
        # 精简 raw_item 用于 prompt (避免超长)
        raw_for_prompt = {
            k: v
            for k, v in raw_item.items()
            if k not in ("_raw_html",) and v  # 排除空值和大字段
        }
        # 截断长文本字段
        for key in ("description", "summary", "abstract"):
            if key in raw_for_prompt and isinstance(raw_for_prompt[key], str):
                raw_for_prompt[key] = raw_for_prompt[key][:1500]

        raw_json = json.dumps(raw_for_prompt, indent=2, ensure_ascii=False, default=str)

        prompt = STANDARDIZE_PROMPT.format(
            raw_json=raw_json,
            crawl_time=crawl_time,
        )

        try:
            resp = await llm.ainvoke([HumanMessage(content=prompt)])
            resp_text = str(resp.content or "")

            # 解析 JSON — 容忍 LLM 可能输出 markdown fences
            json_text = resp_text.strip()
            # 去除 ```json ... ``` 包裹
            json_text = re.sub(r"^```(?:json)?\s*", "", json_text)
            json_text = re.sub(r"\s*```$", "", json_text)

            json_start = json_text.find("{")
            json_end = json_text.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                entry_data = json.loads(json_text[json_start:json_end])
            else:
                logger.warning(
                    "Standardizer: no JSON in LLM response for '%s'", title[:40]
                )
                skipped_err += 1
                continue

            # --- 3. 修正和验证 ---
            # 确保 category 合法
            valid_categories = set(CATEGORY_PREFIX.keys())
            if entry_data.get("category") not in valid_categories:
                entry_data["category"] = pre_category

            # 重新生成 attack_id (确保一致性)
            entry_data["attack_id"] = generate_attack_id(title, entry_data["category"])

            # 确保 source.type 与实际来源一致
            source_type = raw_item.get("_source_type", "threat_api")
            source_type_map = {
                "nvd": "nvd",
                "github": "github",
                "arxiv": "arxiv",
                "blog": "blog",
                "darkweb": "darkweb",
            }
            if "source" in entry_data:
                entry_data["source"]["type"] = source_type_map.get(
                    source_type, source_type
                )

            # --- 4. 验证并创建 AttackEntry ---
            entry = AttackEntry.model_validate(entry_data)

            # 再次检查去重 (LLM 可能修改了 category 导致不同的 ID)
            if store.exists(entry.attack_id):
                logger.info(
                    "Standardizer: skip duplicate (post-LLM) '%s'", entry.attack_id
                )
                skipped_dup += 1
                continue

            # --- 5. 写入知识库 ---
            store.put(entry)
            standardized.append(entry)
            logger.info(
                "Standardizer: saved '%s' (cat=%s, sev=%s)",
                entry.attack_id,
                entry.category,
                entry.metadata.severity_estimate,
            )

        except json.JSONDecodeError as e:
            logger.error("Standardizer: JSON parse error for '%s': %s", title[:40], e)
            skipped_err += 1
        except Exception as e:
            logger.error("Standardizer: error processing '%s': %s", title[:40], e)
            skipped_err += 1

    logger.info(
        "Standardizer: done — %d standardized, %d duplicates skipped, %d errors",
        len(standardized),
        skipped_dup,
        skipped_err,
    )

    return {"standardized_entries": standardized}


# ---------------------------------------------------------------------------
# 无 LLM 的回退标准化 (用于测试/离线场景)
# ---------------------------------------------------------------------------


def standardize_without_llm(raw_item: dict) -> AttackEntry | None:
    """
    不使用 LLM 的简单标准化 — 从 raw_item 字段直接映射。

    适用场景:
      - 暗网 mock 数据 (字段已接近 AttackEntry 结构)
      - 测试验证 (不需要 OPENAI_API_KEY)
      - LLM 不可用时的回退方案

    Returns:
        AttackEntry 或 None (如果关键字段缺失)
    """
    title = raw_item.get("title") or raw_item.get("cve_id") or ""
    if not title:
        return None

    # 推断 category
    category = raw_item.get("category", "prompt_injection")
    valid_categories = set(CATEGORY_PREFIX.keys())
    if category not in valid_categories:
        # 尝试从 attack_type 推断
        attack_type = raw_item.get("attack_type", "").lower()
        for cat in valid_categories:
            if cat.replace("_", " ") in attack_type or cat in attack_type:
                category = cat
                break
        else:
            category = "prompt_injection"

    attack_id = generate_attack_id(title, category)

    # 推断 source type
    source_type_raw = raw_item.get("_source_type", "threat_api")
    source_type_map = {
        "nvd": "nvd",
        "github": "github",
        "arxiv": "arxiv",
        "blog": "blog",
        "darkweb": "darkweb",
    }
    source_type = source_type_map.get(source_type_raw, "threat_api")

    # 推断 severity
    severity = raw_item.get("severity_estimate", "medium")
    if severity not in ("critical", "high", "medium", "low"):
        severity = "medium"

    # 推断 modality
    modality = "text"
    if category == "multimodal":
        desc_lower = (
            raw_item.get("description", "") + raw_item.get("attack_type", "")
        ).lower()
        if "audio" in desc_lower:
            modality = "audio"
        elif "image" in desc_lower or "visual" in desc_lower:
            modality = "image"

    description = raw_item.get("description", title)[:500]
    url = raw_item.get("url") or raw_item.get("thread_url", "")

    try:
        entry = AttackEntry(
            attack_id=attack_id,
            category=category,
            subcategory=raw_item.get("attack_type", category),
            stix_type="attack-pattern",
            source={
                "type": source_type,
                "url": url,
                "crawl_time": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "confidence": "medium" if source_type == "darkweb" else "high",
            },
            attack_template={
                "name": title[:100],
                "description": description,
                "payload_template": raw_item.get("payload_snippet", "N/A"),
                "variables": {},
                "modality": modality,
                "mutation_hints": raw_item.get("tags", [])[:5],
            },
            mitre_mapping={
                "tactic": "Initial Access",
                "technique": "LLM Attack",
            },
            metadata={
                "severity_estimate": severity,
                "target_type": raw_item.get("target_systems", []),
                "defense_bypass": [],
                "effectiveness": raw_item.get("relevance_score"),
                "last_tested": None,
            },
            status="active",
        )
        return entry
    except Exception as e:
        logger.error("standardize_without_llm: failed for '%s': %s", title[:40], e)
        return None
