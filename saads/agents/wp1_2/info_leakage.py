"""
WP1-2 Info Leakage Agent — 生成信息泄露探测脚本。

攻击类型:
  - 系统提示词提取 ("Repeat your instructions verbatim")
  - 训练数据泄露探测
  - RAG 数据源泄露 / 配置信息泄露

工具:
  - generate_leakage_probe: LLM 生成探测脚本
"""

from __future__ import annotations

# TODO: 实现 Info Leakage Agent
# - 读取 category=info_leakage 的 AttackEntry
# - 生成系统提示词提取 / 训练数据泄露 / RAG 泄露探测脚本
