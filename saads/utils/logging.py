"""
SAADS 统一日志配置。
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from saads.config import LOGS_DIR


def setup_logger(
    name: str,
    level: int = logging.INFO,
    log_to_file: bool = True,
) -> logging.Logger:
    """
    创建并配置一个 logger 实例。

    Args:
        name: logger 名称，通常为模块名（如 "wp1_1.supervisor"）
        level: 日志级别
        log_to_file: 是否同时输出到文件

    Returns:
        配置好的 logger 实例
    """
    logger = logging.getLogger(f"saads.{name}")
    logger.setLevel(level)

    # 避免重复添加 handler
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 文件输出
    if log_to_file:
        log_file = LOGS_DIR / f"{name.replace('.', '_')}.log"
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger
