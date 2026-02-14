"""
WP1-1 情报采集智能体 (Intelligence Collection Agent)

所属层次: 通用层
内部架构: Supervisor
核心任务: 监控各类主流 AI 系统，自动化采集、分析各类安全威胁情报，标注受影响的 AI BOM 组件

内部 Agent:
  - Intel Supervisor: 分析覆盖率，决定采集策略
  - Web Crawler Agent: 爬取 CVE/NVD、GitHub、HuggingFace 等公开源
  - Paper Analyzer Agent: 解析学术论文和安全报告
  - Dark Web Agent: 采集暗网论坛和 Telegram 群组情报 (初期为 placeholder)
  - Standardizer Agent: 标准化为 STIX 2.1 兼容 schema，去重，标注 AI BOM
"""
