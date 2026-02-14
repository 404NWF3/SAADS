"""
WP1-2 Red Team Orchestrator — 从 attack_pool 选择攻击、分派生成任务。

Orchestrator 是 WP1-2 的核心决策节点：
1. 从 attack_pool 读取攻击条目
2. 按策略选择（优先覆盖率低的类别、高危条目）
3. 根据 category 字段分派给对应专家 Agent
4. 追踪 OWASP LLM Top 10 的攻击覆盖率
"""

from __future__ import annotations

# TODO: 实现 Red Team Orchestrator 节点逻辑
# - select_attacks(): 从 attack_pool 按策略选择攻击条目
# - assign_to_agents(): 按 category 分派给专家 Agent
# - track_coverage(): 追踪覆盖率
