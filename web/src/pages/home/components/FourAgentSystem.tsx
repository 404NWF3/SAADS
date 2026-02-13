import React, { useEffect, useRef } from 'react';
import { Card, Typography, Tag } from 'antd';
import { AgentArchitecture, TechBadge, ParticleFlowDiagram } from '../../../components/common';
import type { ArchitectureNode, TechCategory } from '../../../components/common';
import { AgentShowcase } from './AgentShowcase';
import './FourAgentSystem.css';

const { Title, Paragraph } = Typography;

interface TechHighlight {
  icon: string;
  title: string;
  description: string;
  category: TechCategory;
}

interface Metric {
  label: string;
  value: string;
  unit?: string;
}

interface AgentCardData {
  id: string;
  title: string;
  role: string;
  emoji: string;
  description: string;
  tags: string[];
  input: string;
  output: string;
  color: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  architecture: {
    type: 'supervisor' | 'pipeline';
    components: ArchitectureNode[];
    reason: string;
  };
  techHighlights: TechHighlight[];
  dataInterface: {
    inputFormat: string;
    outputFormat: string;
    keyFields: string[];
    inputExample?: string;
    outputExample?: string;
  };
  metrics?: Metric[];
}

const agents: AgentCardData[] = [
  {
    id: 'WP1-1',
    title: '情报采集智能体',
    role: '威胁发现者 · Supervisor 架构',
    emoji: '🔍',
    description: '实时从 CVE/NVD、GitHub PoC、arXiv 安全论文及暗网论坛多源采集原始威胁数据,经 LLM 提炼后标准化为 STIX 2.1 格式写入攻击技术池,为下游提供可直接执行的结构化情报。',
    tags: ['STIX 2.1', 'arXiv API', 'CVE / NVD', '暗网监控', 'Supervisor Agent'],
    input: '多源公开网络',
    output: 'attack_pool',
    color: '#C1440E',
    position: 'top',
    architecture: {
      type: 'supervisor',
      components: [
        { name: 'Intel Supervisor', role: '分析覆盖率,决定爬取策略', tools: ['知识库查询', '覆盖率统计'] },
        { name: 'Web Crawler', role: '爬取公开漏洞库与技术社区', tools: ['httpx', 'BeautifulSoup', 'GitHub API'] },
        { name: 'Paper Analyzer', role: '解析学术论文提取攻击方法', tools: ['PDF解析', 'LLM摘要'] },
        { name: 'Dark Web Agent', role: '采集暗网论坛威胁情报', tools: ['Tor代理', 'Telegram Bot'] },
        { name: 'Standardizer', role: '标准化为STIX 2.1格式', tools: ['JSON Schema', 'STIX序列化'] },
      ],
      reason: '爬取目标动态变化,需要Supervisor根据攻击池覆盖情况决定采集策略',
    },
    techHighlights: [
      { icon: '🏗️', title: 'Supervisor架构', description: '中心协调者动态分派采集任务', category: 'architecture' },
      { icon: '⚙️', title: 'STIX 2.1标准化', description: '威胁情报结构化为国际标准格式', category: 'technology' },
      { icon: '✨', title: '多源融合', description: '整合CVE/NVD/GitHub/arXiv/暗网5+数据源', category: 'capability' },
      { icon: '✨', title: '覆盖率驱动', description: '按OWASP LLM Top 10分类智能补充', category: 'capability' },
    ],
    dataInterface: {
      inputFormat: '原始威胁数据',
      outputFormat: 'STIX 2.1 JSON',
      keyFields: ['attack_id', 'category', 'payload_template', 'mitre_mapping', 'mutation_hints'],
      outputExample: `{
  "attack_id": "ATK-2026-0042",
  "category": "prompt_injection",
  "stix_type": "attack-pattern",
  "payload_template": "...",
  "mitre_mapping": {"tactic": "initial-access"}
}`,
    },
    metrics: [
      { label: '数据源', value: '5+', unit: '个' },
      { label: 'OWASP覆盖', value: '100', unit: '%' },
      { label: '更新频率', value: '实时' },
    ],
  },
  {
    id: 'WP1-2',
    title: '对抗检测智能体',
    role: '漏洞验证者 · Supervisor 架构',
    emoji: '⚔️',
    description: '从攻击池读取策略,遗传算法驱动 Prompt 自动变异进化,按 OWASP LLM Top 10 执行越狱、注入、多模态攻击,由 LLM-as-Judge 完成 CVSS 评分与修复建议生成。',
    tags: ['遗传算法', 'Jailbreak', 'CVSS 评分', '多模态攻击', 'LLM-as-Judge'],
    input: 'attack_pool',
    output: 'vuln_reports',
    color: '#2D3E8C',
    position: 'right',
    architecture: {
      type: 'supervisor',
      components: [
        { name: 'Red Team Orchestrator', role: '从攻击池选择任务并分派', tools: ['知识库读取', '任务调度'] },
        { name: 'Prompt Injection', role: '执行提示词注入攻击', tools: ['HTTP客户端', 'Payload模板库'] },
        { name: 'Jailbreak Agent', role: '执行越狱攻击', tools: ['越狱模板', '变异引擎'] },
        { name: 'Info Leakage', role: '探测信息泄露漏洞', tools: ['探测Prompt库'] },
        { name: 'Multimodal Attack', role: '执行多模态攻击', tools: ['图像处理', '音频处理'] },
        { name: 'Judge Agent', role: 'CVSS评分与修复建议', tools: ['LLM-as-Judge', 'CVSS计算器'] },
      ],
      reason: 'Orchestrator需按策略选择攻击任务,Judge结果需回传决定是否继续测试变体',
    },
    techHighlights: [
      { icon: '🏗️', title: 'Supervisor架构', description: '中心协调者统一追踪OWASP Top 10覆盖率', category: 'architecture' },
      { icon: '⚙️', title: '遗传算法变异', description: 'Prompt自动变异进化绕过防御', category: 'technology' },
      { icon: '⚙️', title: 'LLM-as-Judge', description: '大模型自动判定攻击成功并评分', category: 'technology' },
      { icon: '✨', title: 'CVSS自动评分', description: '符合CVSS 3.1标准的漏洞评分', category: 'capability' },
    ],
    dataInterface: {
      inputFormat: 'STIX 2.1 攻击模板',
      outputFormat: 'CVSS漏洞报告',
      keyFields: ['vuln_id', 'cvss_score', 'attack_vector', 'remediation', 'executable_script'],
      outputExample: `{
  "vuln_id": "VULN-2026-0018",
  "cvss_score": 9.1,
  "attack_vector": {"successful_payload": "..."},
  "remediation": {"suggestion": "..."}
}`,
    },
    metrics: [
      { label: 'OWASP覆盖', value: '10/10' },
      { label: '平均CVSS', value: '7.8' },
      { label: '成功率', value: '73', unit: '%' },
    ],
  },
  {
    id: 'WP1-3',
    title: '沙盒模拟智能体',
    role: '攻击执行者 · 容器化隔离',
    emoji: '🔬',
    description: '在 gVisor 内核级隔离容器中执行攻击脚本,全链路捕获 PCAP、系统调用与 IO 流,自动脱敏后生成高质量带标注训练样本,解决检测模型数据稀缺的核心难题。',
    tags: ['gVisor', 'eBPF 监控', 'PCAP 抓包', 'PII 脱敏', '自动标注'],
    input: 'vuln_reports',
    output: 'labeled_data',
    color: '#B5600A',
    position: 'bottom',
    architecture: {
      type: 'pipeline',
      components: [
        { name: 'Env Manager', role: '创建隔离容器环境', tools: ['Docker SDK', 'Kubernetes API'] },
        { name: 'Payload Mutator', role: '生成攻击载荷变体', tools: ['LLM变异', '编码转换'] },
        { name: 'Sandboxed Executor', role: '隔离执行攻击脚本', tools: ['asyncio', 'httpx'] },
        { name: 'Data Collector', role: '采集多维度数据', tools: ['tcpdump', 'eBPF', 'auditd'] },
        { name: 'Labeler', role: '自动判定并标注', tools: ['LLM-as-Judge', '规则引擎'] },
      ],
      reason: '流程固定:环境准备→变异→执行→采集→标注,适合Pipeline架构',
    },
    techHighlights: [
      { icon: '🏗️', title: 'Pipeline架构', description: '固定流水线确保数据质量一致性', category: 'architecture' },
      { icon: '⚙️', title: 'gVisor内核隔离', description: '内核级安全隔离防止攻击外溢', category: 'technology' },
      { icon: '⚙️', title: 'eBPF监控', description: '系统调用级全链路追踪', category: 'technology' },
      { icon: '✨', title: 'PII自动脱敏', description: '智能识别并脱敏敏感信息', category: 'capability' },
      { icon: '✨', title: '自动标注', description: '多维度数据自动关联标注', category: 'capability' },
    ],
    dataInterface: {
      inputFormat: 'CVSS漏洞报告',
      outputFormat: 'JSONL标注数据集',
      keyFields: ['sample_id', 'label', 'model_interaction', 'network_trace', 'features'],
      outputExample: `{
  "sample_id": "SAM-2026-0018-00142",
  "label": "malicious",
  "network_trace": {"pcap_path": "..."},
  "features": {"input_length": 2847}
}`,
    },
    metrics: [
      { label: '样本生成', value: '200', unit: '条/漏洞' },
      { label: '正负比例', value: '1:1' },
      { label: '标注准确率', value: '96', unit: '%' },
    ],
  },
  {
    id: 'WP1-4',
    title: '入侵检测智能体',
    role: '防御建设者 · MLOps 闭环',
    emoji: '🛡️',
    description: '消费标注数据增量微调 DeBERTa-v3 检测模型,Evidently AI 实时监控分布漂移,自动触发 LoRA 适配器更新,将防御结果反馈至情报层驱动下一轮攻击进化。',
    tags: ['DeBERTa-v3', 'LoRA 微调', '漂移检测', 'MLOps', '<200ms 延迟'],
    input: 'labeled_data',
    output: 'models + 反馈',
    color: '#1A6B5A',
    position: 'left',
    architecture: {
      type: 'pipeline',
      components: [
        { name: 'Data Loader', role: '加载数据与特征工程', tools: ['pandas', 'scikit-learn', 'scapy'] },
        { name: 'Meta Selector', role: '元学习推荐最优模型', tools: ['AutoML', '元学习算法'] },
        { name: 'Trainer', role: '训练检测模型', tools: ['PyTorch', 'XGBoost', 'LoRA'] },
        { name: 'Evaluator', role: '评估与可解释性分析', tools: ['SHAP', 'LIME', '评估指标'] },
        { name: 'Deployer', role: '部署为API防火墙', tools: ['ONNX', 'FastAPI', 'Docker'] },
      ],
      reason: '流程固定:加载→选模型→训练→评估→部署,适合Pipeline架构',
    },
    techHighlights: [
      { icon: '🏗️', title: 'MLOps闭环', description: '自动化模型训练部署监控反馈', category: 'architecture' },
      { icon: '⚙️', title: '元学习选择', description: '根据数据特征自动推荐最优模型', category: 'technology' },
      { icon: '⚙️', title: 'LoRA增量微调', description: '低秩适配器快速适应新攻击', category: 'technology' },
      { icon: '⚙️', title: 'SHAP可解释性', description: '检测决策全链路可追溯', category: 'technology' },
      { icon: '✨', title: '漂移检测', description: 'Evidently AI实时监控分布变化', category: 'capability' },
    ],
    dataInterface: {
      inputFormat: 'JSONL标注数据集',
      outputFormat: '检测模型 + 评估报告',
      keyFields: ['model_type', 'f1_score', 'auc', 'inference_latency', 'shap_values'],
      outputExample: `{
  "model_type": "DeBERTa-v3-LoRA",
  "f1_score": 0.94,
  "auc": 0.97,
  "inference_latency": "185ms"
}`,
    },
    metrics: [
      { label: 'F1 Score', value: '0.94' },
      { label: 'AUC', value: '0.97' },
      { label: '推理延迟', value: '<200', unit: 'ms' },
    ],
  },
];

const storePills = [
  { name: 'attack_pool', color: '#C1440E', top: '27%', left: '56%' },
  { name: 'vuln_reports', color: '#2D3E8C', top: '56%', left: '56%' },
  { name: 'labeled_data', color: '#B5600A', top: '56%', right: '56%' },
  { name: 'models', color: '#1A6B5A', top: '27%', right: '56%' },
];

export const FourAgentSystem: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Animate SVG dashes
    let offset = 0;
    const animateDashes = () => {
      offset -= 0.38;
      if (svgRef.current) {
        const lines = svgRef.current.querySelectorAll('line, path');
        lines.forEach((el) => {
          (el as SVGLineElement | SVGPathElement).style.strokeDashoffset = `${offset}`;
        });
      }
      requestAnimationFrame(animateDashes);
    };
    animateDashes();
  }, []);

  const scrollToCard = (index: number) => {
    const cards = document.querySelectorAll('.four-agent-card');
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      const el = cards[index] as HTMLElement;
      el.style.transition = 'background 0.1s';
      el.style.background = '#fff';
      setTimeout(() => {
        el.style.background = '';
      }, 1000);
    }
  };

  return (
    <>
      {/* Hero Visualization */}
      <div className="four-agent-hero">
        <div className="four-agent-stage-wrap">
          <div className="four-agent-stage">
            {/* SVG Layer */}
            <svg
              ref={svgRef}
              className="four-agent-svg"
              viewBox="0 0 740 740"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <marker
                  id="a-red"
                  markerWidth="7"
                  markerHeight="7"
                  refX="3.5"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0,0 7,3.5 0,7" fill="#C1440E" opacity="0.75" />
                </marker>
                <marker
                  id="a-blue"
                  markerWidth="7"
                  markerHeight="7"
                  refX="3.5"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0,0 7,3.5 0,7" fill="#2D3E8C" opacity="0.75" />
                </marker>
                <marker
                  id="a-amb"
                  markerWidth="7"
                  markerHeight="7"
                  refX="3.5"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0,0 7,3.5 0,7" fill="#B5600A" opacity="0.75" />
                </marker>
                <marker
                  id="a-teal"
                  markerWidth="7"
                  markerHeight="7"
                  refX="3.5"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0,0 7,3.5 0,7" fill="#1A6B5A" opacity="0.75" />
                </marker>
              </defs>

              {/* Orbit ring */}
              <circle
                cx="370"
                cy="370"
                r="228"
                fill="none"
                stroke="rgba(26,24,20,0.05)"
                strokeWidth="1"
                strokeDasharray="3 9"
              />

              {/* Data flow lines */}
              <line
                x1="370"
                y1="106"
                x2="370"
                y2="286"
                stroke="#C1440E"
                strokeWidth="1.5"
                strokeOpacity="0.22"
                strokeDasharray="6 5"
                markerEnd="url(#a-red)"
              />
              <line
                x1="454"
                y1="360"
                x2="632"
                y2="360"
                stroke="#2D3E8C"
                strokeWidth="1.5"
                strokeOpacity="0.22"
                strokeDasharray="6 5"
                markerEnd="url(#a-blue)"
              />
              <line
                x1="632"
                y1="380"
                x2="454"
                y2="380"
                stroke="#2D3E8C"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                strokeDasharray="4 7"
                markerEnd="url(#a-blue)"
              />
              <line
                x1="358"
                y1="454"
                x2="358"
                y2="632"
                stroke="#B5600A"
                strokeWidth="1.5"
                strokeOpacity="0.22"
                strokeDasharray="6 5"
                markerEnd="url(#a-amb)"
              />
              <line
                x1="380"
                y1="632"
                x2="380"
                y2="454"
                stroke="#B5600A"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                strokeDasharray="4 7"
                markerEnd="url(#a-amb)"
              />
              <line
                x1="286"
                y1="380"
                x2="108"
                y2="380"
                stroke="#1A6B5A"
                strokeWidth="1.5"
                strokeOpacity="0.22"
                strokeDasharray="6 5"
                markerEnd="url(#a-teal)"
              />
              <line
                x1="108"
                y1="360"
                x2="286"
                y2="360"
                stroke="#1A6B5A"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                strokeDasharray="4 7"
                markerEnd="url(#a-teal)"
              />
              <path
                d="M 86 355 C 36 210, 170 55, 330 50"
                fill="none"
                stroke="#1A6B5A"
                strokeWidth="1.5"
                strokeOpacity="0.18"
                strokeDasharray="5 8"
                markerEnd="url(#a-teal)"
              />

              {/* Animated packets */}
              <circle r="5" fill="#C1440E">
                <animateMotion dur="2.2s" repeatCount="indefinite" path="M370,106 L370,286" />
                <animate
                  attributeName="opacity"
                  values="0;0.88;0.88;0"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="5" fill="#2D3E8C">
                <animateMotion
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin="0.55s"
                  path="M454,360 L632,360"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.88;0.88;0"
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin="0.55s"
                />
              </circle>
              <circle r="4" fill="#2D3E8C">
                <animateMotion
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin="1.5s"
                  path="M632,380 L454,380"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.62;0.62;0"
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin="1.5s"
                />
              </circle>
              <circle r="5" fill="#B5600A">
                <animateMotion
                  dur="2.2s"
                  repeatCount="indefinite"
                  begin="1.1s"
                  path="M358,454 L358,632"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.88;0.88;0"
                  dur="2.2s"
                  repeatCount="indefinite"
                  begin="1.1s"
                />
              </circle>
              <circle r="4" fill="#B5600A">
                <animateMotion
                  dur="2.2s"
                  repeatCount="indefinite"
                  begin="2.1s"
                  path="M380,632 L380,454"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.62;0.62;0"
                  dur="2.2s"
                  repeatCount="indefinite"
                  begin="2.1s"
                />
              </circle>
              <circle r="5" fill="#1A6B5A">
                <animateMotion
                  dur="2.3s"
                  repeatCount="indefinite"
                  begin="1.8s"
                  path="M286,380 L108,380"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.88;0.88;0"
                  dur="2.3s"
                  repeatCount="indefinite"
                  begin="1.8s"
                />
              </circle>
              <circle r="4" fill="#1A6B5A">
                <animateMotion
                  dur="2.3s"
                  repeatCount="indefinite"
                  begin="2.7s"
                  path="M108,360 L286,360"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.62;0.62;0"
                  dur="2.3s"
                  repeatCount="indefinite"
                  begin="2.7s"
                />
              </circle>
              <circle r="5" fill="#1A6B5A">
                <animateMotion
                  dur="3.9s"
                  repeatCount="indefinite"
                  begin="0.9s"
                  path="M 86 355 C 36 210, 170 55, 330 50"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.78;0.78;0"
                  dur="3.9s"
                  repeatCount="indefinite"
                  begin="0.9s"
                />
              </circle>
            </svg>

            {/* Central Hub */}
            <div className="four-agent-hub">
              <div className="four-agent-hub-ring"></div>
              <div className="four-agent-hub-ring-2"></div>
              <div className="four-agent-hub-body">
                <div className="four-agent-hub-label">Central Store</div>
                <div className="four-agent-hub-dot"></div>
                <div className="four-agent-hub-title">
                  中央
                  <br />
                  知识库
                </div>
              </div>
            </div>

            {/* Store Pills */}
            {storePills.map((pill, index) => (
              <div
                key={index}
                className="four-agent-store-pill"
                style={{
                  top: pill.top,
                  left: pill.left,
                  right: pill.right,
                  '--pill-color': pill.color,
                  animationDelay: `${1.2 + index * 0.2}s`,
                } as React.CSSProperties}
              >
                {pill.name}
              </div>
            ))}

            {/* Agent Nodes */}
            {agents.map((agent, index) => (
              <div
                key={index}
                className={`four-agent-node four-agent-node-${agent.position}`}
                onClick={() => scrollToCard(index)}
                title="查看详情"
              >
                <div className="four-agent-node-circle">
                  {agent.emoji}
                  <div className="four-agent-node-badge"></div>
                </div>
                <div className="four-agent-node-label">
                  <div className="four-agent-node-id">{agent.id}</div>
                  <div className="four-agent-node-name">{agent.title.replace('智能体', '')}</div>
                  <div className="four-agent-node-role">
                    {agent.role.split('·')[0].trim()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Cue */}
        <a className="four-agent-scroll-cue" href="#agent-details">
          <span>智能体详解</span>
          <div className="four-agent-scroll-arrow"></div>
        </a>
      </div>

      {/* Agent Detail Cards - 使用新的精美展示组件 */}
      <AgentShowcase />

      {/* 保留后两个智能体的原有卡片 */}
      <div className="four-agent-details" id="agent-details-remaining">
        {/* 智能体3和4的介绍卡片已隐藏 */}
        {/* <div className="four-agent-grid">
          {agents
            .filter(agent => agent.id === 'WP1-3' || agent.id === 'WP1-4')
            .map((agent, index) => (
              <AgentCard key={index} agent={agent} index={index + 2} />
            ))}
        </div> */}
      </div>
    </>
  );
};

// Separate AgentCard component to properly use hooks
const AgentCard: React.FC<{ agent: AgentCardData; index: number }> = ({ agent, index }) => {
  return (
    <Card
      className="four-agent-card"
      style={{ '--card-color': agent.color } as React.CSSProperties}
      styles={{ body: { padding: '28px 28px' } }}
    >
      <div className="four-agent-card-bg-num">{(index + 1).toString().padStart(2, '0')}</div>
      <div className="four-agent-card-eyebrow">{agent.id} · {agent.role.split('·')[0].trim()}</div>
      <Title level={4} className="four-agent-card-title">
        {agent.title}
      </Title>
      <div className="four-agent-card-role">{agent.role}</div>
      <Paragraph className="four-agent-card-desc">{agent.description}</Paragraph>

      {/* Tech Highlights */}
      <div className="tech-highlights-section">
        <div className="section-title">技术亮点</div>
        <div className="tech-highlights-grid">
          {agent.techHighlights.map((highlight, i) => (
            <TechBadge
              key={i}
              title={highlight.title}
              description={highlight.description}
              category={highlight.category}
              icon={highlight.icon}
              color={agent.color}
            />
          ))}
        </div>
      </div>

      {/* Original Tags */}
      <div className="four-agent-card-tags">
        {agent.tags.map((tag, i) => (
          <Tag key={i} className="four-agent-tag">
            {tag}
          </Tag>
        ))}
      </div>

      {/* Metrics */}
      {agent.metrics && agent.metrics.length > 0 && (
        <div className="metrics-section">
          <div className="metrics-grid">
            {agent.metrics.map((metric, i) => (
              <div key={i} className="metric-item" style={{ borderColor: agent.color }}>
                <div className="metric-value" style={{ color: agent.color }}>
                  {metric.value}
                  {metric.unit && <span className="metric-unit">{metric.unit}</span>}
                </div>
                <div className="metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Section: Framework & Data Interface */}
      <div className="agent-card-bottom">
        {/* Left: Framework Architecture */}
        <div className="agent-card-section">
          <div className="agent-card-section-title">框架结构</div>
          <AgentArchitecture
            type={agent.architecture.type}
            components={agent.architecture.components}
            color={agent.color}
            reason={agent.architecture.reason}
          />
        </div>

        {/* Right: Data Interface */}
        <div className="agent-card-section">
          <div className="agent-card-section-title">数据接口</div>
          <ParticleFlowDiagram
            inputFormat={agent.dataInterface.inputFormat}
            outputFormat={agent.dataInterface.outputFormat}
            keyFields={agent.dataInterface.keyFields}
            color={agent.color}
            inputExample={agent.dataInterface.inputExample}
            outputExample={agent.dataInterface.outputExample}
          />
        </div>
      </div>

      {/* Original I/O */}
      <div className="four-agent-card-io">
        <div className="four-agent-io-item">
          输入 <span>{agent.input}</span>
        </div>
        <div className="four-agent-io-item">
          输出 <span>{agent.output}</span>
        </div>
      </div>
    </Card>
  );
};
