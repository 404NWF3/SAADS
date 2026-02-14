"""
WP1-2 Prompt Injection Agent — 生成提示词注入攻击脚本。

攻击类型:
  - 直接注入 (Ignore previous instructions...)
  - 间接注入 (通过外部数据源注入)
  - 上下文窗口溢出
  - 指令覆盖

工具:
  - generate_injection_script: LLM 基于 AttackEntry 的 payload_template 生成可执行 Python 脚本
  - mutation_engine: 变异 payload
"""

from __future__ import annotations

# TODO: 实现 Prompt Injection Agent
# - 读取 category=prompt_injection 的 AttackEntry
# - 使用 LLM + payload 模板库生成可执行 Python 脚本
# - 输出脚本到 generated_scripts
