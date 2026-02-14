"""
SAADS 配置管理

加载环境变量、初始化 LLM 实例、全局路径配置。
支持 OpenAI 及任何兼容 OpenAI API 格式的供应商（通过 OPENAI_BASE_URL 切换）。
"""

from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# 加载 .env
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# 项目路径
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

ATTACK_POOL_DIR = DATA_DIR / "attack_pool"
TEST_SCRIPTS_DIR = DATA_DIR / "test_scripts"
VULN_REPORTS_DIR = DATA_DIR / "vuln_reports"
BOM_KNOWLEDGE_DIR = DATA_DIR / "bom_knowledge"
LOGS_DIR = DATA_DIR / "logs"

# 确保运行时数据目录存在
for _dir in (
    ATTACK_POOL_DIR,
    TEST_SCRIPTS_DIR,
    TEST_SCRIPTS_DIR / "prompt_injection",
    TEST_SCRIPTS_DIR / "jailbreak",
    TEST_SCRIPTS_DIR / "info_leakage",
    TEST_SCRIPTS_DIR / "multimodal",
    VULN_REPORTS_DIR,
    BOM_KNOWLEDGE_DIR,
    LOGS_DIR,
):
    _dir.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# LLM 配置
# ---------------------------------------------------------------------------
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL: str | None = os.getenv("OPENAI_BASE_URL", None)
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

# 备用 Google 配置
GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

# ---------------------------------------------------------------------------
# 数据源 API Key
# ---------------------------------------------------------------------------
NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

# 新增数据源API Key
VIRUSTOTAL_API_KEY: str = os.getenv("VIRUSTOTAL_API_KEY", "")
ALIENVAULT_API_KEY: str = os.getenv("ALIENVAULT_API_KEY", "")
HF_TOKEN: str = os.getenv("HF_TOKEN", "")


@lru_cache(maxsize=1)
def get_llm():
    """
    获取 LangChain ChatOpenAI 实例（单例）。

    支持通过环境变量切换供应商:
      - OPENAI_BASE_URL: 设置后指向兼容 OpenAI API 的第三方服务
      - OPENAI_MODEL: 模型名称，默认 gpt-4o
    """
    from langchain_openai import ChatOpenAI

    kwargs = {
        "model": OPENAI_MODEL,
        "api_key": OPENAI_API_KEY,
        "temperature": 0.1,
    }
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL

    return ChatOpenAI(**kwargs)


@lru_cache(maxsize=1)
def get_fast_llm():
    """
    获取一个更快/更便宜的 LLM 实例，用于标准化、分类等简单任务。
    默认使用 OPENAI_FAST_MODEL 环境变量，回退到 gpt-4o-mini。
    """
    from langchain_openai import ChatOpenAI

    fast_model = os.getenv("OPENAI_FAST_MODEL", "gpt-4o-mini")
    kwargs = {
        "model": fast_model,
        "api_key": OPENAI_API_KEY,
        "temperature": 0.0,
    }
    if OPENAI_BASE_URL:
        kwargs["base_url"] = OPENAI_BASE_URL

    return ChatOpenAI(**kwargs)
