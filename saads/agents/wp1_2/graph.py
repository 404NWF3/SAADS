"""
WP1-2 渗透测试智能体 — LangGraph 图组装。

图结构:
  START → orchestrator → route_to_agents
      → {prompt_injection, jailbreak, info_leakage, multimodal}
      → judge → orchestrator (loop)
                       ↓
             coverage_sufficient → END

Orchestrator 是条件路由节点，按 category 分派给专家 Agent。
专家 Agent 生成测试方案/脚本后汇聚到 Judge 进行质量评估。
Judge 评估测试方案质量并预估理论 CVSS 评分后，回到 Orchestrator 决定是否继续。
合格的脚本保存到 test_scripts/ 知识库。

注意: WP1-2 不产出 VulnReport，不连接被测应用。
输出仅为 test_scripts/，漏洞验证由 WP1-3 负责。
"""

from __future__ import annotations

# TODO: 实现 LangGraph StateGraph 组装
# 1. 定义 StateGraph(RedTeamState)
# 2. 添加节点: orchestrator, prompt_injection, jailbreak, info_leakage, multimodal, judge
# 3. 添加边: orchestrator → route_to_agents (conditional)
# 4. 添加边: agents → judge
# 5. 添加边: judge → orchestrator (conditional loop)
# 6. 编译图: graph = builder.compile()
