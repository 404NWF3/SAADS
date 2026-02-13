import React, { useEffect, useRef, useState } from 'react';
import './AgentShowcase.css';

interface LogEntry {
  source: string;
  className: string;
  messages: string[];
}

const LOG_DATA: LogEntry[] = [
  {
    source: 'CVE',
    className: 'source-cve',
    messages: [
      'CVE-2026-0031 LLM提示注入漏洞已录入攻击池',
      'CVE-2026-0188 模型权重泄露PoC发现',
      'CVE-2025-9821 RAG数据源污染漏洞确认',
    ],
  },
  {
    source: 'GIT',
    className: 'source-git',
    messages: [
      'github.com/security/llm-jailbreak PoC克隆完成',
      'HuggingFace 模型卡安全声明提取完毕',
      '新型越狱脚本 bypass-guardian-v3 标准化中',
    ],
  },
  {
    source: 'arXiv',
    className: 'source-arxiv',
    messages: [
      '论文摘要已提取: Adversarial Suffix Attacks',
      '论文解析: Multi-modal Injection via Image',
      '新论文: Token Smuggling Taxonomy 已索引',
    ],
  },
  {
    source: 'DARK',
    className: 'source-dark',
    messages: [
      'Telegram: 新型DAN变体流出 (高危)',
      '暗网论坛: LLM越狱工具包 v2.3 情报获取',
      '地下渠道: 企业模型系统提示泄露分析完毕',
    ],
  },
  {
    source: 'API',
    className: 'source-api',
    messages: [
      'VirusTotal: 恶意Payload IoC #4921 已收录',
      'AlienVault: LLM攻击TTP新增 7 条映射',
      'Shodan: 暴露模型API端点 +12 已记录',
    ],
  },
];

const OWASP_ITEMS = [
  '提示注入',
  '不安全输出处理',
  '训练数据投毒',
  '模型拒绝服务',
  '供应链漏洞',
  '敏感信息泄露',
  '不安全插件',
  '过度代理',
  '过度依赖',
  '模型窃取',
];

export const AgentShowcase: React.FC = () => {
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const [activeTab1, setActiveTab1] = useState(0);
  const [logs, setLogs] = useState<Array<{ timestamp: string; source: string; className: string; message: string }>>([]);
  const [pipelineCount1, setPipelineCount1] = useState(42);
  const [pipelineCount2, setPipelineCount2] = useState(38);
  const [metric1a, setMetric1a] = useState(0);
  const [metric1b, setMetric1b] = useState(0);
  const [metric1c, setMetric1c] = useState(0);

  // 添加日志
  const addLog = () => {
    const entry = LOG_DATA[Math.floor(Math.random() * LOG_DATA.length)];
    const message = entry.messages[Math.floor(Math.random() * entry.messages.length)];
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setLogs(prev => {
      const newLogs = [...prev, { timestamp, source: entry.source, className: entry.className, message }];
      return newLogs.slice(-80);
    });
  };

  // 初始化日志
  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      setTimeout(addLog, i * 80);
    }
    const interval = setInterval(addLog, 1300);
    return () => clearInterval(interval);
  }, []);

  // Pipeline 计数器
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelineCount1(prev => prev + Math.floor(Math.random() * 3));
      setPipelineCount2(prev => prev + Math.floor(Math.random() * 2));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // 指标动画
  useEffect(() => {
    const animateMetric = (setter: React.Dispatch<React.SetStateAction<number>>, target: number, duration: number, delay: number) => {
      setTimeout(() => {
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setter(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }, delay);
    };

    animateMetric(setMetric1a, 5, 900, 500);
    animateMetric(setMetric1b, 100, 1400, 650);
    animateMetric(setMetric1c, 42, 1200, 800);
  }, []);

  // Canvas 1 动画
  useEffect(() => {
    const canvas = canvas1Ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const wrapper = canvas.parentElement;
    if (!wrapper) return;

    let W = wrapper.clientWidth;
    let H = wrapper.clientHeight;
    canvas.width = W;
    canvas.height = H;

    interface Node {
      id: string;
      label: string[];
      x: number;
      y: number;
      r: number;
      color: string;
      gradient: string;
      note: string;
      hub?: boolean;
    }

    interface Packet {
      from: Node;
      to: Node;
      t: number;
      speed: number;
    }

    const NODES: Node[] = [
      { id: 'sup', label: ['Intel', 'Supervisor'], x: 0.5, y: 0.45, r: 34, color: '#cc4e1e', gradient: 'rgba(204,78,30,', note: '核心调度', hub: true },
      { id: 'web', label: ['Web', 'Crawler'], x: 0.5, y: 0.12, r: 24, color: '#2563eb', gradient: 'rgba(37,99,235,', note: '公开漏洞库' },
      { id: 'ppr', label: ['Paper', 'Analyzer'], x: 0.82, y: 0.3, r: 24, color: '#7c3aed', gradient: 'rgba(124,58,237,', note: '学术论文/PoC' },
      { id: 'drk', label: ['Dark Web', 'Agent'], x: 0.82, y: 0.65, r: 24, color: '#cc4e1e', gradient: 'rgba(204,78,30,', note: '暗网/Telegram' },
      { id: 'std', label: ['Standard-', 'izer'], x: 0.5, y: 0.82, r: 24, color: '#2d6a4f', gradient: 'rgba(45,106,79,', note: 'STIX 2.1标准化' },
      { id: 'api', label: ['API', 'Collector'], x: 0.18, y: 0.48, r: 24, color: '#3b5068', gradient: 'rgba(59,80,104,', note: 'VirusTotal/AV' },
    ];

    const EDGES = [
      { f: 'sup', t: 'web' }, { f: 'sup', t: 'ppr' }, { f: 'sup', t: 'drk' },
      { f: 'sup', t: 'std' }, { f: 'sup', t: 'api' }, { f: 'web', t: 'std' },
      { f: 'ppr', t: 'std' }, { f: 'drk', t: 'std' }, { f: 'api', t: 'std' },
    ];

    const packets: Packet[] = [];

    const spawnPacket = () => {
      const edge = EDGES[Math.floor(Math.random() * EDGES.length)];
      const from = NODES.find(n => n.id === edge.f)!;
      const to = NODES.find(n => n.id === edge.t)!;
      packets.push({ from, to, t: 0, speed: 0.005 + Math.random() * 0.007 });
    };

    setInterval(spawnPacket, 400);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#faf9f8';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(0,0,0,.032)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Edges
      EDGES.forEach(edge => {
        const from = NODES.find(n => n.id === edge.f)!;
        const to = NODES.find(n => n.id === edge.t)!;
        const fx = from.x * W, fy = from.y * H;
        const tx = to.x * W, ty = to.y * H;

        const gradient = ctx.createLinearGradient(fx, fy, tx, ty);
        gradient.addColorStop(0, from.color + '55');
        gradient.addColorStop(1, to.color + '55');

        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Packets
      packets.forEach(p => {
        p.t = Math.min(p.t + p.speed, 1);
        const fx = p.from.x * W, fy = p.from.y * H;
        const tx = p.to.x * W, ty = p.to.y * H;
        const x = fx + (tx - fx) * p.t;
        const y = fy + (ty - fy) * p.t;
        const alpha = p.t < 0.1 ? p.t / 0.1 : p.t > 0.9 ? (1 - p.t) / 0.1 : 1;

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.from.color;
        ctx.globalAlpha = alpha * 0.85;
        ctx.shadowColor = p.from.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      packets.splice(0, packets.length, ...packets.filter(p => p.t < 1));

      // Nodes
      NODES.forEach(node => {
        const x = node.x * W, y = node.y * H;

        const gradient = ctx.createRadialGradient(x, y, node.r * 0.4, x, y, node.r * 2.4);
        gradient.addColorStop(0, node.gradient + '.18)');
        gradient.addColorStop(1, node.gradient + '0)');

        ctx.beginPath();
        ctx.arc(x, y, node.r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = node.hub ? 2.5 : 1.8;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = node.hub ? node.color : '#3d3c3a';
        ctx.font = `${node.hub ? '600 11.5px' : '500 10px'} 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        node.label.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - 0.5) * 12);
        });

        ctx.fillStyle = 'rgba(61,60,58,.38)';
        ctx.font = "8.5px 'DM Mono', monospace";
        ctx.fillText(node.note, x, y + node.r + 11);
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      W = wrapper.clientWidth;
      H = wrapper.clientHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="agent-showcase-wrapper">
      {/* Pipeline */}
      <div className="agent-pipeline">
        <div className="pipeline-node pipeline-node-terra">
          <div className="pipeline-dot" style={{ background: 'var(--terra)' }}></div>
          WP1-1 情报采集
        </div>
        <div className="pipeline-arrow" style={{ maxWidth: '170px' }}>
          <div className="pipeline-packet packet-terra"></div>
          <div className="pipeline-label">
            <span>{pipelineCount1}</span>attack_pool/
          </div>
        </div>
        <div className="pipeline-node pipeline-node-slate">
          <div className="pipeline-dot" style={{ background: 'var(--slate)' }}></div>
          WP1-2 对抗检测
        </div>
        <div className="pipeline-arrow" style={{ maxWidth: '170px' }}>
          <div className="pipeline-packet packet-slate"></div>
          <div className="pipeline-label">
            <span>{pipelineCount2}</span>vuln_reports/
          </div>
        </div>
        <div className="pipeline-node">
          <div className="pipeline-dot" style={{ background: 'var(--green)' }}></div>
          WP1-3 沙盒模拟
        </div>
        <div className="pipeline-arrow">
          <div className="pipeline-packet packet-green"></div>
        </div>
        <div className="pipeline-node">
          <div className="pipeline-dot" style={{ background: 'var(--gold)' }}></div>
          WP1-4 入侵检测
        </div>
        <div className="pipeline-counter">
          队列积压: <b>{Math.max(0, pipelineCount1 - pipelineCount2)}</b> 条
        </div>
      </div>

      {/* WP1-1 Section */}
      <section className="agent-section fade-in visible" id="s1">
        <div className="section-anchor">01 / 情报采集智能体</div>
        <div className="agent-header">
          <div>
            <div className="agent-tag agent-tag-terra">
              <span className="agent-num num-terra">01</span>
              WP1-1 · 威胁发现者 · Supervisor 架构
            </div>
            <h1 className="agent-title">
              情报采集<em className="em-terra">智能体</em>
            </h1>
            <div className="agent-role">// Intel Collection Agent — Red Team</div>
            <p className="agent-desc">
              实时从 CVE/NVD、GitHub PoC、arXiv 安全论文及暗网论坛多源采集原始威胁数据，经 LLM 提炼后标准化为 STIX 2.1 格式写入攻击技术池，为下游提供可直接执行的结构化情报。Supervisor 根据当前攻击池覆盖情况动态决定采集策略，实现覆盖率驱动的自适应采集。
            </p>
            <div className="agent-tags">
              <span className="agent-tag-badge tag-terra">Supervisor 架构</span>
              <span className="agent-tag-badge tag-terra">STIX 2.1 标准化</span>
              <span className="agent-tag-badge tag-slate">多源融合</span>
              <span className="agent-tag-badge tag-green">覆盖率驱动</span>
              <span className="agent-tag-badge tag-gold">arXiv API</span>
              <span className="agent-tag-badge tag-terra">暗网监控</span>
            </div>
          </div>
          <div className="metrics-column">
            <div className="metric-card">
              <div className="metric-value mv-terra">{metric1a}+</div>
              <div className="metric-label">数据源数量</div>
            </div>
            <div className="metric-card">
              <div className="metric-value mv-green">{metric1b}%</div>
              <div className="metric-label">OWASP 覆盖率</div>
            </div>
            <div className="metric-card">
              <div className="metric-value mv-terra" style={{ fontSize: '22px' }}>{metric1c}</div>
              <div className="metric-label">攻击池条目数</div>
            </div>
          </div>
        </div>

        <div className="viz-grid">
          {/* Canvas */}
          <div className="viz-panel">
            <div className="panel-header">
              <div className="panel-title">
                框架结构<span className="panel-tag panel-tag-terra">动态数据流</span>
              </div>
              <div className="panel-status">● 采集中...</div>
            </div>
            <div className="canvas-box">
              <canvas ref={canvas1Ref}></canvas>
            </div>
          </div>

          {/* Viz Tabs */}
          <div className="viz-panel">
            <div className="viz-tabs">
              <button
                className={`viz-tab ${activeTab1 === 0 ? 'active-terra' : ''}`}
                onClick={() => setActiveTab1(0)}
              >
                实时情报流
              </button>
              <button
                className={`viz-tab ${activeTab1 === 1 ? 'active-terra' : ''}`}
                onClick={() => setActiveTab1(1)}
              >
                OWASP 覆盖
              </button>
              <button
                className={`viz-tab ${activeTab1 === 2 ? 'active-terra' : ''}`}
                onClick={() => setActiveTab1(2)}
              >
                攻击分布
              </button>
            </div>
            <div className="viz-panel-wrap">
              <div className={`viz-panel-content ${activeTab1 === 0 ? 'show' : ''}`}>
                <div className="log-feed">
                  {logs.map((log, i) => (
                    <div key={i} className="log-entry">
                      <span className="log-timestamp">{log.timestamp}</span>
                      <span className={`log-source ${log.className}`}>[{log.source}]</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`viz-panel-content ${activeTab1 === 1 ? 'show' : ''}`}>
                <OwaspCoverage />
              </div>
              <div className={`viz-panel-content ${activeTab1 === 2 ? 'show' : ''}`}>
                <AttackDistribution />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="agent-divider fade-in visible">
        <div className="divider-line"></div>
        <div className="divider-mid">
          <span>攻击池数据流转</span>
          <div className="divider-arrow">WP1-1 → attack_pool/ → WP1-2</div>
        </div>
        <div className="divider-line"></div>
      </div>

      {/* WP1-2 Section */}
      <WP2Section />
    </div>
  );
};

// WP1-2 Section Component
const WP2Section: React.FC = () => {
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const gaugeRef = useRef<HTMLCanvasElement>(null);
  const [activeTab2, setActiveTab2] = useState(0);
  const [metric2a, setMetric2a] = useState(0);
  const [metric2b, setMetric2b] = useState(0);
  const [metric2c, setMetric2c] = useState(0);

  // 指标动画
  useEffect(() => {
    const animateMetric = (setter: React.Dispatch<React.SetStateAction<number>>, target: number, duration: number, delay: number) => {
      setTimeout(() => {
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setter(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }, delay);
    };

    animateMetric(setMetric2a, 10, 1100, 500);
    animateMetric(setMetric2b, 78, 1500, 700);
    animateMetric(setMetric2c, 73, 1300, 900);
  }, []);

  // Canvas 2 动画 - WP1-2 对抗检测
  useEffect(() => {
    const canvas = canvas2Ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const wrapper = canvas.parentElement;
    if (!wrapper) return;

    let W = wrapper.clientWidth;
    let H = wrapper.clientHeight;
    canvas.width = W;
    canvas.height = H;

    interface Node {
      id: string;
      label: string[];
      x: number;
      y: number;
      r: number;
      color: string;
      gradient: string;
      note: string;
      hub?: boolean;
    }

    interface Packet {
      from: Node | { x: number; y: number };
      to: Node | { x: number; y: number };
      t: number;
      speed: number;
      phase: string;
      fromRaw?: boolean;
      toRaw?: boolean;
    }

    const CENTER: Node = { id: 'orch', label: ['Red Team', 'Orchestrator'], x: 0.5, y: 0.47, r: 36, color: '#3b5068', gradient: 'rgba(59,80,104,', note: '攻击调度中心', hub: true };
    const AGENTS: Node[] = [
      { id: 'inj', label: ['Prompt', 'Injection'], x: 0.5, y: 0.13, r: 24, color: '#dc2626', gradient: 'rgba(220,38,38,', note: '执行提示词注入攻击' },
      { id: 'jail', label: ['Jailbreak', 'Agent'], x: 0.83, y: 0.3, r: 24, color: '#cc4e1e', gradient: 'rgba(204,78,30,', note: '越狱/角色扮演/DAN' },
      { id: 'info', label: ['Info', 'Leakage'], x: 0.83, y: 0.66, r: 24, color: '#c4860a', gradient: 'rgba(196,134,10,', note: '系统提示/训练数据泄露' },
      { id: 'mm', label: ['Multimodal', 'Attack'], x: 0.5, y: 0.82, r: 24, color: '#7c3aed', gradient: 'rgba(124,58,237,', note: '图像/音频对抗样本' },
      { id: 'jdg', label: ['Judge', 'Agent'], x: 0.17, y: 0.47, r: 24, color: '#2d6a4f', gradient: 'rgba(45,106,79,', note: 'CVSS评分+修复建议' },
    ];

    const ALL = [CENTER, ...AGENTS];
    const IB = { x: 0.06, y: 0.08, w: 78, h: 36, label: 'attack_pool', sub: 'STIX 2.1', color: '#3b5068' };
    const OB = { x: 0.72, y: 0.80, w: 82, h: 36, label: 'vuln_reports', sub: 'CVSS JSON', color: '#2d6a4f' };

    const packets: Packet[] = [];
    let activeId: string | null = null;
    let jGlow = 0;

    const selectActive = () => {
      const pool = AGENTS.filter(a => a.id !== 'jdg');
      const ag = pool[Math.floor(Math.random() * pool.length)];
      activeId = ag.id;

      // Input packet
      packets.push({
        from: { x: IB.x + IB.w / W * 0.5, y: IB.y + IB.h / H * 0.5 },
        to: CENTER,
        t: 0,
        speed: 0.008,
        phase: 'in',
        fromRaw: true
      });

      // Attack packets
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          packets.push({ from: CENTER, to: ag, t: 0, speed: 0.009 + Math.random() * 0.007, phase: 'atk' });
        }, i * 140);
      }

      // Response packets to judge
      setTimeout(() => {
        const jdg = AGENTS.find(a => a.id === 'jdg')!;
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            packets.push({ from: ag, to: jdg, t: 0, speed: 0.007 + Math.random() * 0.006, phase: 'res' });
          }, i * 180);
        }
      }, 900);

      setTimeout(() => { jGlow = 1; }, 1400);

      // Output packet
      setTimeout(() => {
        const jdg = AGENTS.find(a => a.id === 'jdg')!;
        packets.push({
          from: jdg,
          to: { x: OB.x + OB.w / W * 0.5, y: OB.y + OB.h / H * 0.5 },
          t: 0,
          speed: 0.007,
          phase: 'out',
          toRaw: true
        });
      }, 1600);
    };

    const interval = setInterval(selectActive, 3800);
    setTimeout(selectActive, 700);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#faf9f8';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(0,0,0,.032)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Input/Output boxes
      const drawBox = (box: typeof IB | typeof OB, glow: number = 0) => {
        const bx = box.x * W, by = box.y * H;
        ctx.beginPath();
        ctx.roundRect(bx, by, box.w, box.h, 5);
        ctx.fillStyle = glow > 0.1 ? `rgba(45,106,79,${0.12})` : 'rgba(59,80,104,.07)';
        ctx.fill();
        ctx.strokeStyle = glow > 0.1 ? '#2d6a4f' : box.color + '99';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = box.color;
        ctx.font = "bold 10px 'DM Mono'";
        ctx.textAlign = 'center';
        ctx.fillText(box.label, bx + box.w / 2, by + box.h / 2 - 5);
        ctx.fillStyle = box.color + '80';
        ctx.font = "9px 'DM Mono'";
        ctx.fillText(box.sub, bx + box.w / 2, by + box.h / 2 + 8);
      };

      drawBox(IB);
      drawBox(OB, jGlow);
      jGlow = Math.max(0, jGlow - 0.011);

      // Edges
      ALL.forEach(from => {
        ALL.forEach(to => {
          if (from.id === 'orch' && to.id !== 'orch' && to.id !== 'jdg') {
            const fx = from.x * W, fy = from.y * H;
            const tx = to.x * W, ty = to.y * H;
            const isAct = to.id === activeId;
            const gradient = ctx.createLinearGradient(fx, fy, tx, ty);
            gradient.addColorStop(0, from.color + (isAct ? '99' : '2a'));
            gradient.addColorStop(1, to.color + (isAct ? '99' : '2a'));
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = isAct ? 2 : 1.2;
            ctx.setLineDash(isAct ? [] : [3, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      // Packets
      packets.forEach(p => {
        p.t = Math.min(p.t + p.speed, 1);
        const fx = p.fromRaw ? (p.from as any).x * W : (p.from as Node).x * W;
        const fy = p.fromRaw ? (p.from as any).y * H : (p.from as Node).y * H;
        const tx = p.toRaw ? (p.to as any).x * W : (p.to as Node).x * W;
        const ty = p.toRaw ? (p.to as any).y * H : (p.to as Node).y * H;
        const x = fx + (tx - fx) * p.t;
        const y = fy + (ty - fy) * p.t;
        const alpha = p.t < 0.1 ? p.t / 0.1 : p.t > 0.9 ? (1 - p.t) / 0.1 : 1;
        const col = p.phase === 'atk' || p.phase === 'in' ? '#3b5068' : '#2d6a4f';

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = alpha * 0.8;
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      packets.splice(0, packets.length, ...packets.filter(p => p.t < 1));

      // Nodes
      ALL.forEach(node => {
        const x = node.x * W, y = node.y * H;
        const isAct = node.id === activeId;

        const gradient = ctx.createRadialGradient(x, y, node.r * 0.3, x, y, node.r * (isAct || node.hub ? 2.8 : 2));
        gradient.addColorStop(0, node.gradient + (isAct || node.hub ? '.20)' : '.09)'));
        gradient.addColorStop(1, node.gradient + '0)');

        ctx.beginPath();
        ctx.arc(x, y, node.r * (isAct || node.hub ? 2.8 : 2), 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = node.hub ? 2.5 : (isAct ? 2.2 : 1.8);
        ctx.fill();
        ctx.stroke();

        if (isAct) {
          ctx.beginPath();
          ctx.arc(x, y, node.r + 7, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + '55';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.fillStyle = node.hub ? node.color : '#3d3c3a';
        ctx.font = `${node.hub ? '600 11.5px' : '500 10px'} 'DM Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        node.label.forEach((line, i) => {
          ctx.fillText(line, x, y + (i - 0.5) * 12);
        });

        if (node.note) {
          ctx.fillStyle = 'rgba(61,60,58,.35)';
          ctx.font = "8px 'DM Mono', monospace";
          ctx.fillText(node.note, x, y + node.r + 11);
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      W = wrapper.clientWidth;
      H = wrapper.clientHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="agent-section fade-in visible" id="s2">
      <div className="section-anchor">02 / 对抗检测智能体</div>
      <div className="agent-header">
        <div>
          <div className="agent-tag agent-tag-slate">
            <span className="agent-num num-slate">02</span>
            WP1-2 · 漏洞验证者 · Supervisor 架构
          </div>
          <h1 className="agent-title">
            对抗检测<em className="em-slate">智能体</em>
          </h1>
          <div className="agent-role">// Red Team Orchestrator — Adversarial Testing</div>
          <p className="agent-desc">
            从攻击池读取策略，遗传算法驱动 Prompt 自动变异进化，按 OWASP LLM Top 10 执行越狱、注入、多模态攻击，由 LLM-as-Judge 完成 CVSS 评分与修复建议生成。Orchestrator 统一追踪攻击覆盖率，Judge 结果回传决定是否继续测试变体。
          </p>
          <div className="agent-tags">
            <span className="agent-tag-badge tag-slate">Supervisor 架构</span>
            <span className="agent-tag-badge tag-slate">遗传算法变异</span>
            <span className="agent-tag-badge tag-gold">LLM-as-Judge</span>
            <span className="agent-tag-badge tag-terra">CVSS 自动评分</span>
            <span className="agent-tag-badge tag-slate">Jailbreak</span>
            <span className="agent-tag-badge tag-green">多模态攻击</span>
          </div>
        </div>
        <div className="metrics-column">
          <div className="metric-card">
            <div className="metric-value mv-slate">{metric2a}/10</div>
            <div className="metric-label">OWASP 覆盖</div>
          </div>
          <div className="metric-card">
            <div className="metric-value mv-terra">{(metric2b / 10).toFixed(1)}</div>
            <div className="metric-label">平均 CVSS 分</div>
          </div>
          <div className="metric-card">
            <div className="metric-value mv-green">{metric2c}%</div>
            <div className="metric-label">攻击成功率</div>
          </div>
        </div>
      </div>

      <div className="viz-grid">
        {/* Canvas */}
        <div className="viz-panel">
          <div className="panel-header">
            <div className="panel-title">
              框架结构<span className="panel-tag panel-tag-slate">攻击调度流</span>
            </div>
            <div className="panel-status">● 渗透测试中...</div>
          </div>
          <div className="canvas-box">
            <canvas ref={canvas2Ref}></canvas>
          </div>
        </div>

        {/* Viz Tabs */}
        <div className="viz-panel">
          <div className="viz-tabs">
            <button
              className={`viz-tab ${activeTab2 === 0 ? 'active-slate' : ''}`}
              onClick={() => setActiveTab2(0)}
            >
              CVSS 仪表盘
            </button>
            <button
              className={`viz-tab ${activeTab2 === 1 ? 'active-slate' : ''}`}
              onClick={() => setActiveTab2(1)}
            >
              漏洞时间线
            </button>
            <button
              className={`viz-tab ${activeTab2 === 2 ? 'active-slate' : ''}`}
              onClick={() => setActiveTab2(2)}
            >
              攻击成功率
            </button>
          </div>
          <div className="viz-panel-wrap">
            <div className={`viz-panel-content ${activeTab2 === 0 ? 'show' : ''}`}>
              <CVSSGauge />
            </div>
            <div className={`viz-panel-content ${activeTab2 === 1 ? 'show' : ''}`}>
              <VulnTimeline />
            </div>
            <div className={`viz-panel-content ${activeTab2 === 2 ? 'show' : ''}`}>
              <AttackSuccessRate />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// OWASP Coverage Component
const OwaspCoverage: React.FC = () => {
  const [completed, setCompleted] = useState<boolean[]>(new Array(10).fill(false));

  useEffect(() => {
    OWASP_ITEMS.forEach((_, i) => {
      setTimeout(() => {
        setCompleted(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 130);
    });
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
      {OWASP_ITEMS.map((item, i) => (
        <div
          key={i}
          className={`owasp-item ${completed[i] ? 'done' : ''}`}
          style={{
            background: completed[i] ? 'var(--green-lt)' : 'var(--cream-dark)',
            border: `1px solid ${completed[i] ? 'rgba(45,106,79,.25)' : 'var(--cream-border)'}`,
            borderRadius: '6px',
            padding: '9px 12px',
            position: 'relative',
            transition: 'all .3s',
          }}
        >
          <div style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)' }}>
            LLM{i < 9 ? `0${i + 1}` : '10'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '2px', lineHeight: 1.3 }}>
            {item}
          </div>
          <div
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '11px',
              fontWeight: 600,
              color: completed[i] ? 'var(--green)' : 'var(--ink-dim)',
            }}
          >
            {completed[i] ? '✓' : '○'}
          </div>
        </div>
      ))}
    </div>
  );
};

// Attack Distribution Component
const AttackDistribution: React.FC = () => {
  const data = [
    { label: '提示注入', value: 34, percent: 85, color: '#cc4e1e' },
    { label: '信息泄露', value: 24, percent: 60, color: '#7c3aed' },
    { label: '越狱攻击', value: 20, percent: 50, color: '#c4860a' },
    { label: '模型拒绝服务', value: 12, percent: 30, color: '#3b5068' },
    { label: '多模态攻击', value: 8, percent: 20, color: '#2d6a4f' },
    { label: '供应链', value: 4, percent: 10, color: '#2563eb' },
  ];

  const [widths, setWidths] = useState<number[]>(new Array(data.length).fill(0));

  useEffect(() => {
    data.forEach((d, i) => {
      setTimeout(() => {
        setWidths(prev => {
          const next = [...prev];
          next[i] = d.percent;
          return next;
        });
      }, 80 + i * 100);
    });
  }, []);

  return (
    <div>
      <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)', marginBottom: '14px', letterSpacing: '.06em' }}>
        // 按攻击类别分布（STIX 条目数）
      </p>
      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--ink-muted)' }}>{d.label}</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)' }}>{d.value}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--cream-dark)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '3px',
                background: d.color,
                width: `${widths[i]}%`,
                transition: 'width 1.6s cubic-bezier(.16,1,.3,1)',
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// CVSS Gauge Component
const CVSSGauge: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 270, H = 152;
    canvas.width = W;
    canvas.height = H;

    let currentValue = 0;
    const targetValue = 7.8;

    const animate = () => {
      currentValue = Math.min(currentValue + 0.065, targetValue);

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H * 0.9, r = H * 0.72;

      // Background arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,.07)';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Gradient arc
      const pct = currentValue / 10;
      const gradient = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      gradient.addColorStop(0, '#2d6a4f');
      gradient.addColorStop(0.5, '#c4860a');
      gradient.addColorStop(0.75, '#cc4e1e');
      gradient.addColorStop(1, '#dc2626');

      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * (1 + pct));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(204,78,30,.3)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Needle
      const angle = Math.PI * (1 + pct);
      const nx = cx + Math.cos(angle) * r * 0.83;
      const ny = cy + Math.sin(angle) * r * 0.83;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = '#3d3c3a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3d3c3a';
      ctx.fill();

      // Value text
      ctx.fillStyle = '#3d3c3a';
      ctx.font = "bold 25px 'DM Mono'";
      ctx.textAlign = 'center';
      ctx.fillText(currentValue.toFixed(1), cx, cy - 20);

      ctx.font = "10px 'DM Mono'";
      ctx.fillStyle = 'rgba(61,60,58,.4)';
      ctx.fillText('平均 CVSS 评分', cx, cy - 4);

      // Scale labels
      ['0', '5', '10'].forEach((label, i) => {
        const a = Math.PI * (1 + i * 0.5);
        ctx.font = "9px 'DM Mono'";
        ctx.fillStyle = 'rgba(61,60,58,.28)';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx + Math.cos(a) * (r + 16), cy + Math.sin(a) * (r + 16));
      });

      if (currentValue < targetValue) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Animate stats
    setTimeout(() => setStats({ critical: 3, high: 12, medium: 8, low: 2 }), 900);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0' }}>
      <canvas ref={canvasRef}></canvas>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '10px' }}>
        <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--cream-border)', borderRadius: '8px', padding: '11px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--mono)', color: '#b91c1c' }}>{stats.critical}</div>
          <div style={{ fontSize: '9px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', marginTop: '2px' }}>CRITICAL ≥9.0</div>
        </div>
        <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--cream-border)', borderRadius: '8px', padding: '11px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--mono)', color: '#cc4e1e' }}>{stats.high}</div>
          <div style={{ fontSize: '9px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', marginTop: '2px' }}>HIGH 7.0–9.0</div>
        </div>
        <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--cream-border)', borderRadius: '8px', padding: '11px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--mono)', color: '#c4860a' }}>{stats.medium}</div>
          <div style={{ fontSize: '9px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', marginTop: '2px' }}>MEDIUM 4.0–7.0</div>
        </div>
        <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--cream-border)', borderRadius: '8px', padding: '11px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--mono)', color: '#2d6a4f' }}>{stats.low}</div>
          <div style={{ fontSize: '9px', color: 'var(--ink-dim)', fontFamily: 'var(--mono)', marginTop: '2px' }}>LOW &lt;4.0</div>
        </div>
      </div>
    </div>
  );
};

// Vulnerability Timeline Component
const VulnTimeline: React.FC = () => {
  const vulns = [
    { id: 'VULN-2026-0142', severity: 'c', score: 9.8, vector: '提示注入', desc: '系统提示词完全泄露，攻击者可获取完整上下文' },
    { id: 'VULN-2026-0138', severity: 'c', score: 9.4, vector: '越狱攻击', desc: 'DAN变体成功绕过安全过滤器，执行任意有害指令' },
    { id: 'VULN-2026-0121', severity: 'h', score: 8.7, vector: 'RAG注入', desc: '外部文档污染RAG数据源，模型输出被操控' },
    { id: 'VULN-2026-0115', severity: 'h', score: 8.1, vector: '训练数据', desc: '重复查询逆向提取训练数据片段' },
    { id: 'VULN-2026-0098', severity: 'h', score: 7.9, vector: '多模态', desc: '对抗图像样本绕过内容审核，注入恶意指令' },
    { id: 'VULN-2026-0087', severity: 'h', score: 7.6, vector: '拒绝服务', desc: '特定token序列导致推理时间异常增加' },
    { id: 'VULN-2026-0071', severity: 'm', score: 6.4, vector: '信息泄露', desc: 'API返回内部调试信息暴露架构细节' },
    { id: 'VULN-2026-0064', severity: 'm', score: 5.8, vector: '间接注入', desc: '通过电子邮件内容实现间接提示注入' },
  ];

  const [visible, setVisible] = useState<boolean[]>(new Array(vulns.length).fill(false));

  useEffect(() => {
    vulns.forEach((_, i) => {
      setTimeout(() => {
        setVisible(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 280);
    });
  }, []);

  const severityMap = {
    c: { class: 'vuln-critical', color: '#b91c1c', label: 'CRITICAL' },
    h: { class: 'vuln-high', color: '#cc4e1e', label: 'HIGH' },
    m: { class: 'vuln-medium', color: '#c4860a', label: 'MEDIUM' },
  };

  return (
    <div style={{ height: '308px', overflowY: 'auto' }}>
      {vulns.map((v, i) => {
        const sev = severityMap[v.severity as keyof typeof severityMap];
        return visible[i] ? (
          <div
            key={i}
            style={{
              padding: '10px 13px',
              borderLeft: `3px solid ${sev.color}`,
              marginBottom: '8px',
              borderRadius: '0 6px 6px 0',
              background: 'var(--cream-dark)',
              cursor: 'pointer',
              transition: 'all .18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cream-dark)'; }}
          >
            <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', fontWeight: 600, color: sev.color }}>
              {v.id}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)' }}>
                CVSS: <b style={{ color: 'var(--ink-muted)' }}>{v.score}</b>
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)' }}>
                向量: <b style={{ color: 'var(--ink-muted)' }}>{v.vector}</b>
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)' }}>
                <b style={{ color: 'var(--ink-muted)' }}>{sev.label}</b>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '4px', lineHeight: 1.55 }}>
              {v.desc}
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
};

// Attack Success Rate Component
const AttackSuccessRate: React.FC = () => {
  const data = [
    { label: '越狱攻击成功率', value: '76%', percent: 76, color: '#dc2626' },
    { label: '提示注入成功率', value: '73%', percent: 73, color: '#cc4e1e' },
    { label: '信息泄露成功率', value: '68%', percent: 68, color: '#c4860a' },
    { label: '多模态攻击成功率', value: '52%', percent: 52, color: '#7c3aed' },
    { label: '拒绝服务成功率', value: '45%', percent: 45, color: '#3b5068' },
    { label: '供应链成功率', value: '31%', percent: 31, color: '#2d6a4f' },
  ];

  const [widths, setWidths] = useState<number[]>(new Array(data.length).fill(0));

  useEffect(() => {
    data.forEach((d, i) => {
      setTimeout(() => {
        setWidths(prev => {
          const next = [...prev];
          next[i] = d.percent;
          return next;
        });
      }, 80 + i * 100);
    });
  }, []);

  return (
    <div>
      <p style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)', marginBottom: '14px', letterSpacing: '.06em' }}>
        // 按攻击向量成功率分布
      </p>
      {data.map((d, i) => (
        <div key={i} style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--ink-muted)' }}>{d.label}</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--ink-dim)' }}>{d.value}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--cream-dark)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--cream-border)' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '3px',
                background: d.color,
                width: `${widths[i]}%`,
                transition: 'width 1.6s cubic-bezier(.16,1,.3,1)',
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
