"""
WP1-2 渗透测试智能体 (Penetration Testing Agent)

所属层次: 通用层
内部架构: Supervisor
核心任务: 针对情报库中的安全威胁，自动生成通用测试方案和测试脚本

设计原则:
  - WP1-2 是纯测试方案/脚本生成器
  - 不连接任何被测应用，不验证漏洞，不产出 VulnReport
  - 输入: attack_pool/ 中的攻击条目
  - 输出: test_scripts/ 中的测试方案和脚本
  - 漏洞验证、最终 CVSS 评分、接入被测应用均由 WP1-3（用户层）负责

内部 Agent:
  - Red Team Orchestrator: 从 attack_pool 选择攻击、分派生成任务、追踪覆盖率
  - Prompt Injection Agent: 生成提示词注入测试方案和脚本
  - Jailbreak Agent: 生成越狱测试方案和脚本
  - Info Leakage Agent: 生成信息泄露探测测试方案和脚本
  - Multimodal Attack Agent: 生成多模态攻击测试方案和脚本
  - Judge Agent: 评估测试方案质量、预估理论 CVSS 评分、生成通用修复建议
"""
