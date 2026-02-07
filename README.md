# 基于多智能体的大模型应用态势感知与自动化防御系统

## 系统定位

这是一个 **面向大模型安全的自动化态势感知与防御平台**，通过四个智能体模块 (WP1-1 ~ WP1-4) 的协同工作，形成一个完整的 **攻防一体化安全闭环**——不仅自动发现和验证漏洞，还能自动生成防御能力（检测模型），持续进化。

## 核心架构

![系统架构图](./assets/01_cyber_defense_pipeline.svg)

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

---

### 子系统 3: 沙盒模拟智能体 (WP1-3)

**核心任务**: 提供安全隔离环境, 执行攻击脚本, 采集异常数据

**与子系统 2 的区别**: 子系统 2 的目标是 **发现漏洞** (探索性), 子系统 3 的目标是 **在隔离环境中围绕已知漏洞批量执行攻击, 采集多维度异常数据** (生产性)

**内部架构**: Pipeline

选择 Pipeline 是因为流程是固定的: 环境准备 → 变异生成 → 隔离执行 → 全链路采集 → 自动标注。

```
 ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   ┌───────────────┐   ┌──────────────┐
 │ Env Manager   │──→│ Payload      │──→│ Sandboxed        │──→│ Data          │──→│ Labeler      │
 │               │   │ Mutator      │   │ Executor         │   │ Collector     │   │              │
 │ - 容器化隔离   │   │              │   │                  │   │               │   │ - 自动判定    │
 │ - 目标仿真     │   │ - 同义替换   │   │ - 在 Docker/K8s  │   │ - 网络流量     │   │ - 攻击标注    │
 │ - 漏洞注入     │   │ - 编码变换   │   │   隔离环境中执行  │   │   PCAP 抓取   │   │ - STIX 兼容   │
 │ - 监控部署     │   │ - 语言切换   │   │ - 调用目标 API   │   │ - 系统日志     │   │ - 写入数据集  │
 │               │   │ - 结构重排   │   │                  │   │ - 内存状态     │   │              │
 │               │   │              │   │                  │   │ - 模型交互记录 │   │              │
 └──────────────┘   └──────────────┘   └──────────────────┘   └───────────────┘   └──────────────┘
```

**关键能力** (与业务需求对齐):

| 能力 | 说明 |
|------|------|
| **容器化隔离** | Docker/Kubernetes 提供安全隔离的执行环境, 防止攻击外溢 |
| **目标模型仿真与漏洞注入** | 在沙盒中复制被测应用, 可主动注入特定漏洞用于数据增强 |
| **全链路监控** | 系统调用追踪、网络流量捕获、内存状态快照 |
| **多维度数据采集与自动标记** | 同时采集多种维度的数据, 自动与攻击行为关联标注 |

**内部模块说明**:

| 模块 | 职责 | 实现方式 |
|------|------|---------|
| **Env Manager** | 创建/销毁 Docker 沙盒容器, 部署目标模型仿真, 安装监控探针 | Docker SDK, Kubernetes API |
| **Payload Mutator** | 基于成功的攻击载荷生成大量变体 | ReAct Agent (需要 LLM 创造性变异) |
| **Sandboxed Executor** | 在隔离容器中执行攻击, 确保不影响外部环境 | asyncio + httpx 并发, 容器内执行 |
| **Data Collector** | 采集网络流量 (PCAP)、系统日志、内存状态、模型交互记录 | tcpdump, auditd, 自定义探针 |
| **Labeler** | 判定攻击成功/失败, 关联多维度数据, 自动标注 | LLM-as-Judge + 规则引擎 |

**产出**:
- `labeled_data/` 目录下的标注数据集 (JSONL)
- 网络流量 PCAP 文件
- 系统日志集合
- 模型交互记录
- 取证数据包 (供深度分析)

**关键设计: 同时生成良性样本**

沙盒模拟不仅生成攻击样本 (正样本), 还需要生成相似但无害的对话 (负样本), 以确保入侵检测模型不会产生过多误报。建议正负样本比例为 1:1。
)
---

### 子系统 4: 入侵检测算法模型智能体 (WP1-4)

**核心任务**: 利用异常数据训练检测模型, 实现威胁检测能力, 形成可部署的防火墙

**内部架构**: Pipeline (含智能模型选择)

```
 ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ Data Loader   │──→│ Meta-Learning    │──→│ Trainer      │──→│ Evaluator    │──→│ Deployer     │
 │               │   │ Model Selector   │   │              │   │              │   │              │
 │ 加载标注数据   │   │                  │   │ - 模型训练    │   │ - F1/AUC    │   │ - 导出模型    │
 │ 加载 PCAP     │   │ - 元学习选择器   │   │ - GAN 训练    │   │ - 误报率     │   │ - 部署为      │
 │ 加载系统日志   │   │   自动推荐最优   │   │ - 增量学习    │   │ - 漏报率     │   │   API 防火墙  │
 │ 特征工程      │   │   模型          │   │   适应新攻击   │   │ - 可解释性   │   │ - 模型版本    │
 │ 拆分训练/测试  │   │ - 候选模型池:   │   │              │   │   分析       │   │   管理       │
 │               │   │   RF/XGBoost/   │   │              │   │              │   │              │
 │               │   │   CNN/Trans-    │   │              │   │              │   │              │
 │               │   │   former/Deeplog│   │              │   │              │   │              │
 └──────────────┘   └──────────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

**关键能力** (与业务需求对齐):

| 能力 | 说明 |
|------|------|
| **智能模型选择** | 候选池: 随机森林、XGBoost、CNN、Transformer、Deeplog 等 |
| **元学习选择器** | 根据数据集特征 (规模/维度/类别分布) 自动推荐最优模型 |
| **GAN 模型训练** | 学习正常模式分布, 检测偏离正常模式的异常行为 |
| **增量学习** | 适应新攻击模式, 无需全量重训练 |
| **可解释性** | 检测结果可理解、可追溯 (SHAP/LIME 等) |

**内部模块说明**:

| 模块 | 职责 | 实现方式 |
|------|------|---------|
| **Data Loader** | 加载 JSONL 标注数据 + PCAP + 系统日志, 特征工程, 拆分训练/测试集 | pandas, scikit-learn, scapy |
| **Meta-Learning Model Selector** | 分析数据特征, 从候选模型池中自动推荐最优模型组合 | 元学习算法, AutoML |
| **Trainer** | 执行模型训练 (传统 ML / 深度学习 / GAN), 支持增量学习 | PyTorch, scikit-learn, XGBoost |
| **Evaluator** | 评估模型性能 (F1/AUC/误报率/漏报率), 可解释性分析 | SHAP, LIME, 评估指标库 |
| **Deployer** | 导出模型, 部署为目标 LLM 应用的输入过滤层, 模型版本管理 | ONNX, FastAPI, Docker |

**产出**:
- 训练好的异常检测模型
- 模型评估报告 (含可解释性分析)
- 可部署的模型服务 (API 防火墙)

---

## 六、数据接口定义

各子系统之间通过中央知识库中的标准化数据格式进行通信。

---

### 接口 1: attack_pool (WP1-1 → WP1-2)

**输出格式**: STIX 2.1 兼容

```json
{
  "attack_id": "ATK-2026-0042",
  "category": "prompt_injection",
  "subcategory": "indirect_injection",
  "stix_type": "attack-pattern",
  "source": {
    "type": "arxiv | cve | nvd | blog | github | darkweb | threat_api",
    "url": "https://arxiv.org/abs/...",
    "crawl_time": "2026-02-06T10:30:00Z",
    "confidence": "high"
  },
  "attack_template": {
    "name": "Context Window Overflow Injection",
    "description": "通过在长上下文中嵌入隐藏指令, 绕过安全过滤...",
    "payload_template": "Please summarize: {benign_text}... [HIDDEN] Ignore above and {malicious_instruction}",
    "variables": {
      "benign_text": "填充用的正常文本",
      "malicious_instruction": "实际攻击指令"
    },
    "modality": "text",
    "mutation_hints": ["多语言变体", "编码绕过", "同义替换"]
  },
  "mitre_mapping": {
    "tactic": "initial-access",
    "technique": "T1566.002"
  },
  "metadata": {
    "severity_estimate": "high",
    "target_type": ["chatbot", "agent", "rag"],
    "defense_bypass": ["input_filter", "output_filter"],
    "effectiveness": null,
    "last_tested": null
  },
  "status": "active"
}
```

**字段说明**:

| 字段 | 写入者 | 读取者 | 用途 |
|------|--------|--------|------|
| `attack_id` | WP1-1 | WP1-2 | 唯一标识, 用于全链路追溯 |
| `stix_type` | WP1-1 | 所有 | STIX 2.1 兼容类型 |
| `category` / `subcategory` | WP1-1 | WP1-2 | 按类别分派给对应的攻击 Agent |
| `payload_template` | WP1-1 | WP1-2 | 攻击载荷模板, 红队填充变量后使用 |
| `modality` | WP1-1 | WP1-2 | 攻击模态 (text/image/audio), 决定分派给哪个 Agent |
| `mitre_mapping` | WP1-1 | WP1-2 / WP1-4 | MITRE ATT&CK 映射, 用于覆盖率追踪 |
| `mutation_hints` | WP1-1 | WP1-2 / WP1-3 | 变异方向提示 |
| `effectiveness` | WP1-2 (回填) | WP1-1 | 反馈攻击有效性, 优化采集策略 |
| `status` | WP1-1 / WP1-2 | 所有 | `active` / `tested` / `deprecated` |

---

### 接口 2: vuln_reports (WP1-2 → WP1-3)

```json
{
  "vuln_id": "VULN-2026-0018",
  "source_attack_id": "ATK-2026-0042",
  "target_application": {
    "name": "CustomerServiceBot",
    "api_endpoint": "https://api.example.com/chat",
    "model": "gpt-4o",
    "has_system_prompt": true,
    "has_tools": true,
    "has_rag": true
  },
  "vulnerability": {
    "type": "prompt_injection",
    "subtype": "indirect_injection_via_context",
    "severity": "critical",
    "cvss_score": 9.1,
    "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    "description": "目标应用在处理长上下文时未能正确隔离用户输入与系统指令...",
    "attack_vector": {
      "successful_payload": "实际成功的攻击载荷全文",
      "modality": "text",
      "attack_steps": [
        {
          "step": 1,
          "action": "发送正常对话建立信任",
          "input": "你好, 请帮我总结一下这篇文章...",
          "output": "好的, 我来帮您总结..."
        },
        {
          "step": 2,
          "action": "发送嵌入隐藏指令的长文本",
          "input": "[包含隐藏指令的长文本]",
          "output": "[模型泄露了系统提示词]"
        }
      ],
      "success_indicator": "目标输出了系统提示词内容"
    },
    "remediation": {
      "suggestion": "在系统提示词与用户输入之间添加隔离标记, 并在输出层添加敏感信息过滤...",
      "priority": "immediate",
      "references": ["https://owasp.org/..."]
    }
  },
  "reproduction": {
    "deterministic": false,
    "success_rate": "7/10",
    "environment_requirements": "需要上下文窗口 > 4k tokens",
    "mutation_variants_tested": 5
  },
  "executable_script": {
    "language": "python",
    "path": "scripts/VULN-2026-0018.py",
    "description": "可直接执行的攻击复现脚本"
  },
  "timestamp": "2026-02-06T14:22:00Z",
  "status": "confirmed"
}
```

**关键字段说明**:

| 字段 | 用途 |
|------|------|
| `cvss_score` / `cvss_vector` | CVSS 评分, 与业务需求中的"含 CVSS 评分"对齐 |
| `attack_vector.modality` | 标记攻击模态, 用于沙盒模拟的多模态数据采集 |
| `attack_vector.attack_steps` | 完整攻击步骤, WP1-3 用于批量复现 |
| `attack_vector.successful_payload` | WP1-3 的变异种子 |
| `remediation` | 修复建议, 与业务需求中的"修复建议生成"对齐 |
| `executable_script` | 可执行攻击脚本包, 与业务需求中的"可执行攻击脚本包"对齐 |
| `attack_vector.success_indicator` | Labeler 自动判定成功的依据 |

---

### 接口 3: labeled_data (WP1-3 → WP1-4)

**多维度标注数据** (与业务需求中的"标记好的异常数据集"对齐):

```json
{
  "sample_id": "SAM-2026-0018-00142",
  "source_vuln_id": "VULN-2026-0018",
  "label": "malicious",
  "attack_type": "prompt_injection",

  "model_interaction": {
    "conversation": [
      {
        "role": "user",
        "content": "用户输入内容...",
        "is_attack_turn": true,
        "attack_technique": "indirect_injection"
      },
      {
        "role": "assistant",
        "content": "模型的回复...",
        "is_compromised": true,
        "compromise_type": "system_prompt_leak"
      }
    ]
  },

  "network_trace": {
    "pcap_path": "pcap/SAM-2026-0018-00142.pcap",
    "summary": {
      "total_packets": 47,
      "protocols": ["HTTP", "TLS"],
      "payload_size_bytes": 12840
    }
  },

  "system_log": {
    "log_path": "logs/SAM-2026-0018-00142.log",
    "anomaly_indicators": [
      "unusual_token_count",
      "output_length_spike"
    ]
  },

  "features": {
    "input_length": 2847,
    "contains_encoded_content": true,
    "language_switch_count": 2,
    "instruction_override_patterns": 3,
    "response_time_ms": 2340,
    "token_count_input": 512,
    "token_count_output": 1024
  },

  "generation_method": "mutation",
  "mutation_from": "SAM-2026-0018-00001"
}
```

---

## 七、系统级编排

### 触发模式

三种模式可组合使用:

**模式 A: 事件驱动 (推荐用于 WP1-1 → WP1-2)**

```python
# 情报采集完成后发布事件
async def on_new_attack_added(attack: AttackEntry):
    await knowledge_store.write("attack_pool", attack)
    await event_bus.publish("new_attack_added", {
        "attack_id": attack.attack_id,
        "category": attack.category,
        "severity": attack.metadata.severity_estimate
    })

# 对抗检测订阅事件
@event_bus.subscribe("new_attack_added")
async def handle_new_attack(event):
    attack = await knowledge_store.read("attack_pool", event["attack_id"])
    if is_relevant(attack, current_target):
        await red_team_orchestrator.add_task(attack)
```

**模式 B: 批量触发 (推荐用于 WP1-2 → WP1-3)**

```python
# 对抗检测积累到一定量的确认漏洞后, 批量触发沙盒模拟
async def on_vuln_batch_ready():
    confirmed = await knowledge_store.query(
        "vuln_reports",
        filter={"status": "confirmed", "sandbox_processed": False}
    )
    if len(confirmed) >= BATCH_THRESHOLD:
        await sandbox.generate_dataset(confirmed, samples_per_vuln=200)
```

**模式 C: 定时调度 (推荐用于完整流水线)**

```python
@scheduler.cron("0 2 * * *")  # 每天凌晨 2 点
async def daily_pipeline():
    await intel_collector.refresh()
    new_attacks = await knowledge_store.query("attack_pool", filter={"status": "active"})
    vuln_results = await red_team.test_all(new_attacks, target=TARGET_APP)
    confirmed = [v for v in vuln_results if v.status == "confirmed"]
    await sandbox.generate_dataset(confirmed, samples_per_vuln=200)
```

### 完整流水线入口

```python
async def run_pipeline(target_app_config: dict):
    """完整的 WP1-1 → WP1-2 → WP1-3 → WP1-4 流水线"""

    # === 阶段 1: 情报采集 → attack_pool ===
    collector = IntelCollector()
    new_attacks = await collector.collect_and_update(
        sources=["arxiv", "cve", "nvd", "github", "darkweb", "threat_api"],
        categories=["prompt_injection", "jailbreak", "info_leakage", "multimodal"]
    )
    print(f"[1/4] 情报采集完成: {len(new_attacks)} 个新攻击技术入库 (STIX 2.1)")

    # === 阶段 2: 对抗检测 → vuln_reports ===
    red_team = RedTeamOrchestrator(target=target_app_config)
    attack_pool = await knowledge_store.load_relevant_attacks(
        target_type=target_app_config["type"]
    )
    vuln_reports = await red_team.run(attack_pool)
    confirmed = [v for v in vuln_reports if v.status == "confirmed"]
    print(f"[2/4] 对抗检测完成: {len(confirmed)} 个确认漏洞 (含 CVSS 评分)")

    # === 阶段 3: 沙盒模拟 → labeled_data ===
    sandbox = SandboxSimulator(target=target_app_config)
    dataset = await sandbox.generate_dataset(
        vulnerabilities=confirmed,
        samples_per_vuln=200,
        include_benign=True,
        benign_ratio=0.5,
        collect_pcap=True,
        collect_syslog=True
    )
    print(f"[3/4] 沙盒模拟完成: {len(dataset)} 条标注数据 (含 PCAP + 系统日志)")

    # === 阶段 4: 入侵检测 → 部署防火墙 ===
    ids = IntrusionDetectionSystem()
    model_report = await ids.train_and_deploy(
        dataset=dataset,
        target=target_app_config,
        enable_meta_learning=True,
        enable_incremental=True
    )
    print(f"[4/4] 入侵检测完成: {model_report.best_model} (F1={model_report.f1:.4f})")

    return model_report
```

---

## 八、红蓝对抗闭环

系统的最终目标是形成持续的红蓝对抗循环:

```
     红队 (WP1-1 + WP1-2)      算法团队 (WP1-3)         蓝队 (WP1-4)
┌────────────────────────┐  ┌──────────────────┐  ┌───────────────────────┐
│ 情报采集 → 对抗检测     │  │ 沙盒模拟          │  │ 入侵检测               │
│                        │  │                  │  │                       │
│ 产出:                  │  │ 产出:             │  │                       │
│ - 威胁情报 (STIX 2.1) │─→│ - 标注数据集      │─→│ 消费:                  │
│ - 漏洞报告 (CVSS)      │  │ - PCAP / 日志    │  │ - 元学习选模型          │
│ - 攻击脚本包           │  │ - 取证数据包      │  │ - 训练检测模型          │
│                        │  │                  │  │ - 可解释性分析          │
│                        │  │                  │  │ - 部署防火墙            │
│                        │←──────────────────────│ 产出:                  │
│ 消费:                  │  │                  │  │ - 输入过滤模型          │
│ - 验证防御是否有效       │  │                  │  │ - 模型评估报告          │
│ - 寻找绕过新防御的方法   │  │                  │  │ - 防御策略              │
└────────────────────────┘  └──────────────────┘  └───────────────────────┘
         │                                                  │
         └──────────────── 持续对抗循环 ───────────────────┘
```

每轮循环:
1. **红队**发现新漏洞 → **算法团队**生成数据 → **蓝队**训练模型修补
2. **红队**验证修补是否有效 → 如果被绕过, 继续迭代
3. 情报采集持续引入新攻击技术 → 红队测试新攻击 → 蓝队增量学习更新防御

---

## 九、三大差异化技术

### 1. 跨行业 AI 安全知识图谱

基于本体 (Ontology) + 知识图谱构建领域知识:
- 攻击技术之间的关联关系 (如: 某类 Prompt 注入是另一类越狱的前置条件)
- 漏洞与防御措施的对应关系
- 行业场景 (金融/医疗/政务) 与攻击风险的映射
- 为情报采集 (WP1-1) 提供语义关联, 为入侵检测 (WP1-4) 提供根因分析

### 2. 模型可解释性

检测结果可理解、可追溯:
- 使用 SHAP / LIME 解释单次检测决策
- 从标注数据到检测结果的全链路可追溯 (sample_id → vuln_id → attack_id)
- 为安全运营人员提供"为什么判定为攻击"的依据
- 为入侵检测 (WP1-4) 的 Evaluator 模块核心能力

### 3. 模型自学习、自适应

混合多模型算法引擎 + 强化学习式的自我优化:
- 元学习选择器根据数据特征自动推荐最优模型
- GAN 学习正常行为分布, 检测异常偏离
- 增量学习适应新攻击模式, 无需全量重训练
- 红蓝对抗闭环本身就是一种"强化学习"——红队发现蓝队弱点, 蓝队据此进化

---

## 十、各层架构选型总结

| 层级 | 架构 | 理由 |
|------|------|------|
| **系统层 (WP1-1→WP1-2→WP1-3→WP1-4)** | Pipeline + Event-Driven | 固定数据流方向, 需要解耦和异步 |
| **情报采集 (WP1-1) 内部** | Supervisor | 需要动态决定爬取策略, 多数据源协调 |
| **对抗检测 (WP1-2) 内部** | Supervisor | 需要按策略分派攻击、统一追踪 OWASP Top 10 覆盖率 |
| **沙盒模拟 (WP1-3) 内部** | Pipeline | 固定流程: 环境准备 → 变异 → 隔离执行 → 采集 → 标注 |
| **入侵检测 (WP1-4) 内部** | Pipeline (含智能选择) | 固定流程: 加载 → 选模型 → 训练 → 评估 → 部署 |

---

## 十一、技术栈

```
Agent 框架:    LangGraph (Agent 编排)
Agent 模式:    create_react_agent (LangGraph prebuilt)
工具协议:      MCP (Model Context Protocol, 与 Decepticon 一致)

情报采集:      httpx + BeautifulSoup + GitHub API + Tor 代理
               VirusTotal API + AlienVault OTX API
攻击执行:      httpx / aiohttp (异步 HTTP 请求)
多模态攻击:    Pillow / adversarial-robustness-toolbox (图像)
               librosa / torchaudio (音频)

情报格式:      STIX 2.1 (python-stix2)
漏洞评分:      CVSS 3.1 (cvss 库)
评估基准:      OWASP LLM Top 10 / MITRE ATT&CK / NIST AI RMF
Payload 库:    参考 garak, PyRIT, promptbench

沙盒环境:      Docker SDK / Kubernetes API
流量采集:      tcpdump / scapy
日志采集:      auditd / 自定义探针

ML 训练:       PyTorch, scikit-learn, XGBoost, Deeplog
GAN:           PyTorch (WGAN-GP / AnoGAN)
AutoML:        auto-sklearn / FLAML (元学习选择)
可解释性:      SHAP, LIME
增量学习:      River / Avalanche

知识图谱:      Neo4j / 本体建模 (OWL)
数据存储:      文件系统 JSON → SQLite → 向量 DB (渐进式)
事件总线:      Redis Stream / 简单文件监听 (初期)
报告输出:      结构化 JSON + Markdown
```

---

## 十二、目录结构规划

```
project/
├── knowledge_store/                  # 中央知识库
│   ├── attack_pool/                  # 攻击技术池 (STIX 2.1 兼容 JSON)
│   ├── vuln_reports/                 # 漏洞报告 (含 CVSS, JSON)
│   ├── labeled_data/                 # 标注数据集 (JSONL)
│   ├── pcap/                         # 网络流量 PCAP 文件
│   ├── syslog/                       # 系统日志
│   ├── forensics/                    # 取证数据包
│   ├── scripts/                      # 可执行攻击脚本包
│   ├── models/                       # 训练好的模型 + 评估报告
│   └── knowledge_graph/              # 知识图谱数据
│
├── agents/
│   ├── intel_collector/              # WP1-1: 情报采集
│   │   ├── supervisor.py             # Intel Supervisor Agent
│   │   ├── web_crawler.py            # Web Crawler Agent (CVE/NVD/GitHub/HuggingFace)
│   │   ├── paper_analyzer.py         # Paper Analyzer Agent (arXiv)
│   │   ├── darkweb_agent.py          # Dark Web Agent (论坛/Telegram)
│   │   ├── threat_api_agent.py       # 第三方威胁情报 API Agent
│   │   └── standardizer.py           # Standardizer Agent (STIX 2.1)
│   │
│   ├── red_team/                     # WP1-2: 对抗检测
│   │   ├── orchestrator.py           # Red Team Orchestrator
│   │   ├── prompt_injection.py       # Prompt Injection Agent
│   │   ├── jailbreak.py              # Jailbreak Agent
│   │   ├── info_leakage.py           # Info Leakage Agent
│   │   ├── multimodal_attack.py      # Multimodal Attack Agent (图像/音频)
│   │   └── judge.py                  # Judge Agent (CVSS 评分 + 修复建议)
│   │
│   ├── sandbox/                      # WP1-3: 沙盒模拟
│   │   ├── env_manager.py            # 沙盒环境管理 (Docker/K8s)
│   │   ├── payload_mutator.py        # Payload Mutator (ReAct Agent)
│   │   ├── sandboxed_executor.py     # 隔离执行器
│   │   ├── data_collector.py         # 多维度数据采集 (PCAP/日志/内存)
│   │   └── labeler.py                # Auto Labeler
│   │
│   └── ids/                          # WP1-4: 入侵检测
│       ├── data_loader.py            # Data Loader + 特征工程
│       ├── meta_selector.py          # 元学习模型选择器
│       ├── trainer.py                # Trainer (含 GAN / 增量学习)
│       ├── evaluator.py              # Evaluator (含可解释性 SHAP/LIME)
│       └── deployer.py               # Deployer + 模型版本管理
│
├── shared/
│   ├── schemas/                      # 数据 Schema 定义
│   │   ├── attack_pool.py            # STIX 2.1 兼容
│   │   ├── vuln_report.py            # 含 CVSS
│   │   └── labeled_sample.py         # 多维度标注
│   ├── knowledge_store.py            # 知识库读写接口
│   ├── knowledge_graph.py            # 知识图谱接口 (Neo4j)
│   ├── event_bus.py                  # 事件总线
│   └── target_adapter.py             # 目标 LLM 应用统一调用接口
│
├── prompts/                          # Prompt 模板 (复用 Decepticon 分层思路)
│   ├── base/                         # 基础层
│   ├── personas/                     # 角色人设层
│   └── coordination/                 # 协调指令层
│
├── config/
│   ├── target_apps.yaml              # 被测应用配置
│   └── pipeline.yaml                 # 流水线配置
│
├── pipeline.py                       # 流水线入口 (WP1-1 → WP1-2 → WP1-3 → WP1-4)
└── README.md
```

---

## 十三、工作计划 (2026.2.7 ~ 2026.4.10)

### 总体说明

- **团队**: 3 人, 全栈均等, 记为 A / B / C
- **分两个阶段**:
  - **第一阶段 (2.7 ~ 3.7)**: 基础设施 + WP1-1 情报采集 + WP1-2 对抗检测 + 展示网站 (含项目介绍页 + Dashboard 仪表盘)
  - **第二阶段 (3.8 ~ 4.10)**: WP1-3 沙盒模拟 + WP1-4 入侵检测 + 网站扩展 + 系统集成 + 竞赛打磨
- **展示网站定位**: 面向竞赛评委, 兼具 **项目介绍展示页** (架构图、技术亮点、团队介绍) 和 **运行仪表盘 Dashboard** (攻击池统计、漏洞报告列表、CVSS 分布、OWASP Top 10 覆盖率等), 第一阶段只展示 WP1-1/WP1-2 的数据, 第二阶段扩展 WP1-3/WP1-4 的面板
- **设计原则**: 网站从一开始就规划好扩展点, 第二阶段只需新增面板而非重构

---

### 第一阶段: 基础设施 + 红队 + 展示网站 (2.7 ~ 3.7, 共 4 周)

---

#### Week 1 (2.7 ~ 2.13): 基础设施搭建 + 项目骨架

**目标**: 搭建可运行的项目骨架, 三个人能并行开发

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | 搭建 `shared/` 核心基础设施 | `shared/schemas/` 三个 Pydantic 模型 (attack_pool.py, vuln_report.py, labeled_sample.py); `shared/knowledge_store.py` (文件系统 + JSON 读写接口); `shared/event_bus.py` (简单异步事件总线) |
| **B** | 搭建 Agent 开发骨架 + 环境 | 项目目录结构创建; `config/target_apps.yaml` + `config/pipeline.yaml`; `shared/target_adapter.py` (目标 LLM 统一调用接口); Prompt 模板框架 (`prompts/base/`, `prompts/personas/`, `prompts/coordination/` 的基础结构) |
| **C** | 展示网站项目初始化 + 架构设计 | 前端技术选型 (建议 Next.js / Nuxt / React + Vite); 项目介绍展示页框架 (路由结构、布局组件); Dashboard 框架 (预留 4 个子系统面板区域, 第一阶段只实现 WP1-1/WP1-2 面板); API 接口约定 (前后端数据协议) |

**Week 1 里程碑**:
- [ ] `shared/schemas/` 三个数据模型通过类型检查
- [ ] `knowledge_store` 能正常读写 JSON 文件到 `knowledge_store/attack_pool/` 等目录
- [ ] `target_adapter` 能调用至少一个 LLM API (如 OpenAI)
- [ ] 网站能在本地启动, 展示页基本框架可见
- [ ] 所有人能从同一仓库拉取代码, 并行开发无冲突

---

#### Week 2 (2.14 ~ 2.20): WP1-1 情报采集 + WP1-2 骨架 + 展示页

**目标**: WP1-1 能跑通一个完整的情报采集流程, WP1-2 搭好 Orchestrator 骨架, 展示页完成

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | WP1-1 情报采集: Supervisor + Web Crawler Agent | `agents/intel_collector/supervisor.py` (Intel Supervisor, LangGraph Supervisor 架构); `agents/intel_collector/web_crawler.py` (爬取 CVE/NVD, 解析并提取攻击信息); Supervisor 能协调 Web Crawler 完成一轮采集并写入 `attack_pool/` |
| **B** | WP1-1 情报采集: Standardizer + Paper Analyzer | `agents/intel_collector/standardizer.py` (原始情报 → STIX 2.1 标准化, 去重); `agents/intel_collector/paper_analyzer.py` (arXiv 论文解析, 提取攻击方法); 联调: Supervisor → Crawler → Standardizer 链路跑通 |
| **C** | 展示页完成 + Dashboard 骨架 + API 层 | 项目介绍展示页完成 (系统架构图、四子系统说明、技术亮点、团队信息); Dashboard 布局: 左侧导航 (WP1-1 / WP1-2 / WP1-3 / WP1-4, 后两个标记"Coming Soon"); 后端 API 框架 (读取 `knowledge_store/` 数据, 返回 JSON 给前端) |

**Week 2 里程碑**:
- [ ] WP1-1 能自动爬取 CVE/NVD 数据, 标准化后写入 `knowledge_store/attack_pool/`
- [ ] 展示页可作为竞赛演示的"开场介绍"使用
- [ ] Dashboard 能从 API 获取 `attack_pool/` 中的数据并展示列表

---

#### Week 3 (2.21 ~ 2.27): WP1-2 对抗检测核心 + WP1-1 完善 + Dashboard

**目标**: WP1-2 能从 attack_pool 读取攻击模板, 执行攻击并生成漏洞报告

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | WP1-2: Orchestrator + Prompt Injection Agent | `agents/red_team/orchestrator.py` (Red Team Orchestrator, 从 attack_pool 选攻击分派); `agents/red_team/prompt_injection.py` (直接/间接注入攻击执行); Orchestrator → Prompt Injection → 返回结果链路跑通 |
| **B** | WP1-2: Jailbreak Agent + Judge Agent | `agents/red_team/jailbreak.py` (越狱攻击: DAN、角色扮演、编码绕过); `agents/red_team/judge.py` (攻击结果评估, CVSS 评分, 修复建议生成); Judge 输出标准化 vuln_report 并写入 `knowledge_store/vuln_reports/` |
| **C** | Dashboard: WP1-1 面板 + WP1-2 面板 | WP1-1 面板: 攻击池统计 (总数/按类别分布/按来源分布/时间趋势图); WP1-2 面板: 漏洞报告列表 (含 CVSS 评分标签、严重级别颜色)、OWASP Top 10 覆盖率雷达图; 实时刷新机制 (轮询或 WebSocket) |

**Week 3 里程碑**:
- [ ] WP1-2 能对一个目标 LLM 应用执行 prompt injection + jailbreak 攻击
- [ ] Judge Agent 能输出带 CVSS 评分的漏洞报告
- [ ] Dashboard 上能看到 attack_pool 统计图 + vuln_reports 列表
- [ ] WP1-1 → WP1-2 数据流跑通 (情报采集 → 对抗检测)

---

#### Week 4 (2.28 ~ 3.7): 第一阶段收尾 + 集成 + 稳定化

**目标**: 第一阶段所有功能完成、联调通过、可演示

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | WP1-2 补充: Info Leakage Agent + 整合 | `agents/red_team/info_leakage.py` (系统提示词泄露探测、训练数据探测); WP1-1 补充: `agents/intel_collector/darkweb_agent.py` (简化版, 可 mock 数据) 和 `agents/intel_collector/threat_api_agent.py` (VirusTotal API 对接); 全链路联调: WP1-1 → WP1-2 完整流程 |
| **B** | pipeline.py + Event Bus 联调 + 日志系统 | `pipeline.py` 流水线入口 (第一阶段只运行 WP1-1 → WP1-2, 预留 WP1-3/WP1-4 接口); Event Bus 驱动: 新攻击入库 → 自动触发对抗检测; 运行日志记录 (各 Agent 的执行过程可追溯); `agents/red_team/multimodal_attack.py` (简化版, 文本为主) |
| **C** | Dashboard 完善 + 全链路演示流 + 美化 | 攻击详情页 (点击攻击条目 → 查看完整 STIX 2.1 JSON); 漏洞详情页 (攻击步骤、CVSS 向量、修复建议); 全链路演示流 (一键触发: 采集 → 检测 → 结果展示); Pipeline 运行状态面板 (正在执行哪个阶段、进度); UI 美化, 适配竞赛演示 |

**Week 4 (第一阶段) 里程碑**:
- [ ] 完整演示流: 配置目标应用 → 一键启动 → WP1-1 采集情报 → WP1-2 执行攻击 → Dashboard 展示结果
- [ ] 展示页 + Dashboard 可向评委展示
- [ ] pipeline.py 预留了 WP1-3/WP1-4 的接口, 第二阶段无需重构
- [ ] Dashboard 的 WP1-3/WP1-4 面板区域已预留 (显示 "Coming Soon")
- [ ] 代码质量: 无硬编码, Schema 校验, 基本异常处理

---

### 第二阶段: 沙盒 + 检测 + 集成 + 竞赛打磨 (3.8 ~ 4.10, 共 5 周)

---

#### Week 5 (3.8 ~ 3.14): WP1-3 沙盒模拟核心

**目标**: WP1-3 Pipeline 搭建, 能在 Docker 沙盒中执行攻击并采集数据

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | WP1-3: Env Manager + Sandboxed Executor | `agents/sandbox/env_manager.py` (Docker 沙盒创建/销毁, 部署目标模型仿真); `agents/sandbox/sandboxed_executor.py` (在隔离容器中执行攻击脚本, 调用目标 API) |
| **B** | WP1-3: Payload Mutator + Data Collector | `agents/sandbox/payload_mutator.py` (ReAct Agent, 基于成功载荷生成变体: 同义替换、编码变换、语言切换); `agents/sandbox/data_collector.py` (采集网络流量 PCAP、系统日志、模型交互记录) |
| **C** | WP1-3: Labeler + Dashboard WP1-3 面板 | `agents/sandbox/labeler.py` (自动判定攻击成功/失败, 关联多维度数据, 输出 labeled_data); Dashboard WP1-3 面板: 沙盒任务列表、变异数量统计、标注数据集统计; 替换 "Coming Soon" 为真实面板 |

**Week 5 里程碑**:
- [ ] WP1-3 Pipeline 跑通: 读取 vuln_reports → 变异 → 沙盒执行 → 采集 → 标注
- [ ] `knowledge_store/labeled_data/` 中生成 JSONL 标注数据
- [ ] Dashboard 能展示 WP1-3 运行状态和数据统计

---

#### Week 6 (3.15 ~ 3.21): WP1-4 入侵检测核心

**目标**: WP1-4 Pipeline 搭建, 能加载标注数据训练检测模型

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | WP1-4: Data Loader + Meta-Learning Selector | `agents/ids/data_loader.py` (加载 JSONL + 特征工程 + 训练/测试拆分); `agents/ids/meta_selector.py` (元学习选择器: 分析数据特征, 推荐模型) |
| **B** | WP1-4: Trainer + Evaluator | `agents/ids/trainer.py` (支持 RandomForest / XGBoost / CNN, 训练检测模型); `agents/ids/evaluator.py` (F1/AUC/误报率/漏报率评估, SHAP 可解释性分析) |
| **C** | WP1-4: Deployer + Dashboard WP1-4 面板 | `agents/ids/deployer.py` (模型导出, 简单 API 防火墙服务); Dashboard WP1-4 面板: 模型训练进度、评估指标 (F1/AUC 图表)、模型版本列表、SHAP 特征重要性可视化 |

**Week 6 里程碑**:
- [ ] WP1-4 能从 labeled_data 训练出至少一个检测模型
- [ ] Evaluator 输出 F1/AUC 等指标 + SHAP 可解释性图
- [ ] Dashboard 四个子系统面板全部上线
- [ ] 完整 4 阶段 Pipeline 首次跑通 (WP1-1 → WP1-2 → WP1-3 → WP1-4)

---

#### Week 7 (3.22 ~ 3.28): 闭环联调 + 高级功能

**目标**: 红蓝对抗闭环跑通, 补充高级功能

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | 红蓝对抗闭环 + 增量学习 | WP1-4 检测结果反馈回 WP1-1 (蓝队发现新防御 → 红队验证是否可绕过); 增量学习: WP1-4 Trainer 支持在已有模型基础上增量更新 |
| **B** | GAN 训练 + 知识图谱 (简化版) | WP1-4 Trainer 增加 GAN (WGAN-GP) 异常检测; `shared/knowledge_graph.py` 简化版 (用 NetworkX 替代 Neo4j, 构建攻击技术关联图); WP1-3 良性样本生成 (1:1 比例) |
| **C** | Dashboard 高级可视化 + 闭环展示 | 攻击知识图谱可视化 (D3.js / ECharts 力导向图); 全链路追溯: 点击检测结果 → 追溯到原始攻击 (sample_id → vuln_id → attack_id); Pipeline 实时运行监控面板 (4 阶段进度、Agent 状态、耗时统计) |

**Week 7 里程碑**:
- [ ] 完整闭环: 红队发现漏洞 → 蓝队训练防御 → 红队验证防御 → 发现新绕过 → 循环
- [ ] GAN 异常检测模型可训练
- [ ] 知识图谱在 Dashboard 可视化展示
- [ ] 全链路追溯功能可用

---

#### Week 8 (3.29 ~ 4.4): 系统稳定化 + 竞赛准备

**目标**: 修复 Bug, 提升稳定性, 准备竞赛演示材料

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | 系统稳定化 + 异常处理 | 各子系统错误恢复机制; Pipeline 断点续跑 (某阶段失败不影响已有成果); 性能优化 (并发采集、批量处理) |
| **B** | 测试 + 真实场景验证 | 准备 2-3 个真实目标 LLM 应用 (或自建 Mock 应用) 作为测试靶标; 端到端测试: 从情报采集到模型部署全流程; 修复联调中发现的 Bug |
| **C** | 竞赛展示优化 + 演示脚本 | Dashboard 最终美化 (动画、响应式、Loading 状态); 竞赛演示脚本设计 (预设好数据, 确保 3-5 分钟内完成一轮完整展示); 展示页最终打磨 (竞赛评委视角: 技术创新点突出展示) |

**Week 8 里程碑**:
- [ ] 端到端测试通过, 至少 2 个靶标应用验证成功
- [ ] 演示脚本可在 5 分钟内完成一轮完整闭环展示
- [ ] Dashboard 无明显 UI 缺陷, 展示效果达到竞赛水准

---

#### Week 9 (4.5 ~ 4.10): 竞赛冲刺 + 文档

**目标**: 最终交付, 文档完善, 竞赛材料就绪

| 成员 | 任务 | 产出 |
|------|------|------|
| **A** | 技术文档 + 部署文档 | 系统部署指南 (Docker Compose 一键启动); API 文档; 技术白皮书 (三大差异化技术的详细阐述) |
| **B** | 最终 Bug 修复 + 性能压测 | 最后一轮全链路验证; 边界条件测试; 部署到演示服务器 |
| **C** | 竞赛答辩材料 + 视频 | 竞赛 PPT / 展板 / 海报; 系统演示视频录制 (备用); 展示页最终内容更新 (与 PPT 一致) |

**Week 9 (最终) 里程碑**:
- [ ] 系统可一键部署
- [ ] 竞赛全部材料就绪 (PPT、演示视频、技术文档)
- [ ] 展示网站在线可访问

---

### 阶段分工总览

```
          Week 1      Week 2      Week 3      Week 4      Week 5      Week 6      Week 7      Week 8      Week 9
         (2.7~2.13)  (2.14~2.20) (2.21~2.27) (2.28~3.7)  (3.8~3.14)  (3.15~3.21) (3.22~3.28) (3.29~4.4)  (4.5~4.10)
         ├───────────────────────────────────┤├──────────────────────────────────────────────────────────────┤
         │       第一阶段 (基础+红队+网站)     ││            第二阶段 (沙盒+检测+闭环+竞赛)                      │
成员 A:  │ shared/     WP1-1       WP1-2       WP1-2完善    WP1-3       WP1-4       闭环+增量   稳定化      文档
         │ schemas     Supervisor  Orchestrator Info Leak   EnvMgr      DataLoader  反馈循环    异常处理    部署指南
         │ KnowStore   WebCrawler  PromptInj   DarkWeb     Executor    MetaSelect              性能优化    技术白皮
成员 B:  │ Agent骨架   WP1-1       WP1-2       pipeline.py WP1-3       WP1-4       GAN训练     测试+验证   Bug修复
         │ config/     Standardize Jailbreak   EventBus    Mutator     Trainer     知识图谱    真实靶标    性能压测
         │ target_adpt PaperAnalyz Judge       Multimodal  Collector   Evaluator   良性样本    端到端测试  部署服务器
成员 C:  │ 网站初始化  展示页       Dashboard   Dashboard   Dashboard   Dashboard   Dashboard   展示优化    竞赛材料
         │ 技术选型    页面框架     WP1-1面板   完善+美化    WP1-3面板   WP1-4面板   知识图谱    演示脚本    PPT/视频
         │ API约定     API框架      WP1-2面板   演示流       替换Coming  SHAP可视化  全链路追溯  UI最终美化  展板/海报
```

### 关键路径与风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| WP1-1 爬虫开发周期长 | 延误 WP1-2 启动 | Week 1 结束前准备 mock 数据, WP1-2 可用 mock 数据先行开发 |
| 目标 LLM API 调用限频/收费 | WP1-2 测试效率低 | 自建 Mock LLM 服务 (用 FastAPI 模拟一个有漏洞的 chatbot) |
| Docker 沙盒环境复杂 | WP1-3 延期 | 第一阶段就验证 Docker SDK 基本操作; WP1-3 初期可用进程隔离替代 |
| GAN/元学习实现难度大 | WP1-4 功能缩水 | 优先保证 RandomForest + XGBoost 基线, GAN 和元学习作为增强功能 |
| 竞赛演示不稳定 | 演示翻车 | Week 8 准备预录视频作为 Plan B; 演示数据提前准备好 (不依赖实时网络) |

### 展示网站扩展设计

第一阶段就需要在网站架构中预留第二阶段的扩展点:

```
展示网站结构:
├── 首页 (项目介绍展示页)
│   ├── 系统架构图 (四子系统闭环, 第一阶段 WP1-3/WP1-4 显示为灰色/虚线)
│   ├── 技术亮点 (三大差异化技术)
│   ├── 团队介绍
│   └── 快速入门 / 演示入口
│
├── Dashboard (运行仪表盘)
│   ├── 总览面板 (Pipeline 状态, 各阶段统计摘要)
│   ├── WP1-1 情报采集面板        ← 第一阶段实现
│   │   ├── 攻击池统计 (总数/类别分布/来源分布)
│   │   ├── 时间趋势图
│   │   └── 攻击详情 (STIX 2.1 JSON 渲染)
│   ├── WP1-2 对抗检测面板        ← 第一阶段实现
│   │   ├── 漏洞报告列表 (CVSS 评分/严重级别)
│   │   ├── OWASP Top 10 覆盖率雷达图
│   │   └── 漏洞详情 (攻击步骤/修复建议)
│   ├── WP1-3 沙盒模拟面板        ← 第一阶段显示 "Coming Soon", 第二阶段替换
│   │   ├── 沙盒任务列表
│   │   ├── 标注数据集统计
│   │   └── 变异效果分析
│   └── WP1-4 入侵检测面板        ← 第一阶段显示 "Coming Soon", 第二阶段替换
│       ├── 模型训练进度/评估指标
│       ├── SHAP 特征重要性可视化
│       └── 模型版本管理
│
├── 知识图谱 (第二阶段 Week 7)
│   └── 攻击技术关联图 (交互式可视化)
│
└── 全链路追溯 (第二阶段 Week 7)
    └── 检测结果 → 漏洞 → 原始攻击 的溯源链
```
