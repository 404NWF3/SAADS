# 基于多智能体的大模型应用态势感知与自动化防御系统

## 系统定位

这是一个 **面向大模型安全的自动化态势感知与防御平台**，通过四个智能体模块 (WP1-1 ~ WP1-4) 的协同工作，形成一个完整的 **攻防一体化安全闭环**——不仅自动发现和验证漏洞，还能自动生成防御能力（检测模型），持续进化。

## 核心架构

![系统架构图](./assets/01_cyber_defense_pipeline.png)

| 智能体 | 编号 | 角色定位 | 服务团队 |
|--------|------|----------|----------|
| **情报采集智能体** | WP1-1 | 威胁发现者 | 红队 |
| **对抗检测智能体** | WP1-2 | 漏洞验证者 | 红队 |
| **沙盒模拟智能体** | WP1-3 | 攻击执行者 | 算法团队 |
| **入侵检测智能体** | WP1-4 | 防御建设者 | 蓝队 |

### 核心设计原则

1. **系统层用 Pipeline + Event-Driven, 子系统内部各自选择最合适的 Agent 架构**
2. **智能体之间通过中央知识库解耦, 而非直接 Handoff** — 各子系统运行时间跨度差异巨大, 且需要独立运行/调试
3. **渐进式复杂度** — 先用文件系统 + JSON 跑通, 再演进为数据库 + 向量存储
4. **攻防一体闭环** — 蓝队防御结果反馈回红队, 驱动下一轮攻击进化



## 技术架构分层

| 层级 | 组成 |
|------|------|
| **应用层** | 四个智能体 (WP1-1 ~ WP1-4) + 安全运营智能助手 |
| **模型层** | 大语言模型 (攻击生成/评估)、多模态模型、向量模型、搜索引擎 |
| **数据层** | 数据采集、预处理、向量化、知识库 (知识问答、报警根因分析) |
| **中间层** | 资源管理 (Docker 容器/虚拟化)、AI 工具 (Dify)、安全模块 |
| **基础设施** | 计算 (CPU/GPU)、存储 (HBM/NVMe)、网络 (IB/RoCE) |


## 4 个子系统的详细设计

### 子系统 1: 情报采集智能体 (WP1-1)

**核心任务**: 实时采集、整合、分析面向大模型的安全威胁情报

**内部架构**: Supervisor

选择 Supervisor 是因为爬取目标是动态的, 需要 Supervisor 根据当前攻击池的覆盖情况决定"接下来去哪里找什么类型的攻击"。

![情报采集智能体架构图](./assets/02_Intelligence-Collection-Module.svg)

**数据来源** (与业务需求对齐):

| 来源 | 采集内容 |
|------|---------|
| **公开漏洞库** (CVE、NVD、MITRE ATT&CK) | 已知 LLM 相关 CVE、ATT&CK 战术映射 |
| **技术社区** (GitHub Security、HuggingFace、arXiv) | PoC 代码、安全论文、模型卡中的安全声明 |
| **暗网数据** (论坛、Telegram 群组) | 地下攻击工具、泄露的攻击手法 |
| **第三方情报 API** (VirusTotal、AlienVault 等) | 结构化威胁指标 (IoC)、关联分析 |

**内部 Agent 说明**:

| Agent | 职责 | 工具 |
|-------|------|------|
| **Intel Supervisor** | 分析攻击池覆盖率 (按 OWASP LLM Top 10 分类), 决定优先采集方向 | 知识库查询, 覆盖率统计 |
| **Web Crawler Agent** | 爬取公开漏洞库、技术社区、安全博客 | httpx, BeautifulSoup, GitHub API, HuggingFace API |
| **Paper Analyzer Agent** | 解析学术论文和安全报告, 提取攻击方法与 PoC | PDF 解析, LLM 摘要提取 |
| **Dark Web Agent** | 采集暗网论坛和 Telegram 群组中的攻击情报 | Tor 代理, Telegram Bot API |
| **Standardizer Agent** | 将原始情报标准化为 **STIX 2.1 兼容** 的 attack_pool schema, 去重 | JSON Schema 验证, 相似度检测, STIX 序列化 |

**产出**:
- `attack_pool/` 目录下的标准化攻击条目 (STIX 2.1 兼容 JSON)
- 实时告警 (高危新攻击技术发现时)
- 可操作的测试用例 (直接可被 WP1-2 消费)

---

### 子系统 2: 对抗检测智能体 (WP1-2) — 渗透/模糊测试

**核心任务**: 根据威胁情报自动生成并执行安全测试脚本, 验证漏洞存在性

**内部架构**: Supervisor

- Orchestrator 需要从 attack_pool **按策略选择** 攻击任务, 而非让 Agent 自行决定
- Judge Agent 的评估结果需要 **回传给 Orchestrator** 决定是否继续测试变体
- 攻击覆盖率 (OWASP LLM Top 10) 需要 Orchestrator 统一追踪

![对抗检测智能体架构图](./assets/03_Red-team-Orchestrator.svg)

**关键能力** (与业务需求对齐):

| 能力 | 说明 |
|------|------|
| **基于模板生成测试用例** | 参照 OWASP LLM Top 10 分类, 从 attack_pool 读取模板并实例化 |
| **攻击向量库管理** | 提示注入、数据泄露、拒绝服务、越狱、Agent 劫持等 |
| **多模态测试支持** | 文本、图像、音频三种模态的攻击能力 |
| **自动漏洞验证** | Judge Agent 自动判定, 支持多轮重试确认 |
| **修复建议生成** | Judge Agent 在确认漏洞后, 同步生成修复建议 |

**内部 Agent 说明**:

| Agent | 职责 | 工具 |
|-------|------|------|
| **Red Team Orchestrator** | 从 attack_pool 选择攻击、分派任务、追踪 OWASP Top 10 覆盖率 | 知识库读取, 任务调度 |
| **Prompt Injection Agent** | 执行直接/间接提示词注入攻击 | HTTP 客户端, Payload 模板库 |
| **Jailbreak Agent** | 执行越狱攻击 (DAN、角色扮演、编码绕过、token 走私) | HTTP 客户端, 越狱模板库, 变异引擎 |
| **Info Leakage Agent** | 探测系统提示词泄露、训练数据泄露、RAG 数据源泄露 | HTTP 客户端, 探测 Prompt 库 |
| **Multimodal Attack Agent** | 执行图像对抗样本、音频攻击、跨模态注入 | 图像处理库, 音频处理库, HTTP 客户端 |
| **Judge Agent** | 评估攻击结果, **CVSS 评分**, 生成漏洞报告 + **修复建议** | LLM-as-Judge, 规则引擎, CVSS 计算器 |

**产出**:
- `vuln_reports/` 目录下的漏洞报告 (含 CVSS 评分)
- 可执行攻击脚本包 (可复现的攻击步骤)
- 修复建议文档
