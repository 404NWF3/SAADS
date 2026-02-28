import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Row, Col, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SafetyCertificateOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { FourAgentSystem, AttackShowcase } from './components';

const { Title, Paragraph, Text } = Typography;

// ==================== 粒子背景组件 ====================
const ParticleBackground: React.FC = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${6 + Math.random() * 4}s`,
    tx: `${(Math.random() - 0.5) * 200}px`,
    ty: `${-100 - Math.random() * 150}px`,
    r: `${Math.random() * 360}deg`,
  }));

  return (
    <div className="hero-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--tx': p.tx,
            '--ty': p.ty,
            '--r': p.r,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// ==================== 滚动动画Hook ====================
const useScrollAnimation = () => {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-scroll-id');
            if (id) {
              setVisibleElements((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const registerElement = useCallback((element: HTMLElement | null, id: string) => {
    if (element && observerRef.current) {
      element.setAttribute('data-scroll-id', id);
      observerRef.current.observe(element);
    }
  }, []);

  return { visibleElements, registerElement };
};

// ==================== 数字动画组件 ====================
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 2000, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const progress = Math.min((Date.now() - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(value * easeOutQuart));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span ref={ref} className="number-animate">
      {displayValue}{suffix}
    </span>
  );
};

// ==================== 主页面组件 ====================
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { visibleElements, registerElement } = useScrollAnimation();

  const techStack = [
    {
      name: 'LangGraph',
      desc: 'Agent 编排框架，支持多智能体状态机',
      icon: '🔗',
      tag: 'Agent',
      color: '#3b6fe8',
      delay: 0.05
    },
    {
      name: 'MCP',
      desc: '模型上下文协议，工具统一接入标准',
      icon: '🔌',
      tag: 'Protocol',
      color: '#7c4dff',
      delay: 0.1
    },
    {
      name: 'STIX 2.1',
      desc: '威胁情报格式标准，结构化 IoC 交换',
      icon: '📋',
      tag: 'Standard',
      color: '#0097a7',
      delay: 0.15
    },
    {
      name: 'CVSS 3.1',
      desc: '通用漏洞评分系统，量化风险等级',
      icon: '⚠️',
      tag: 'Security',
      color: '#c94b3a',
      delay: 0.2
    },
    {
      name: 'Docker / K8s',
      desc: '容器化沙盒环境，隔离攻击执行',
      icon: '🐳',
      tag: 'Infra',
      color: '#2e7d32',
      delay: 0.25
    },
    {
      name: 'PyTorch',
      desc: 'ML 模型训练，入侵检测模型构建',
      icon: '🔥',
      tag: 'ML',
      color: '#e65100',
      delay: 0.3
    },
    {
      name: 'SHAP / LIME',
      desc: '模型可解释性分析，攻击溯源支持',
      icon: '🔍',
      tag: 'XAI',
      color: '#6a1b9a',
      delay: 0.35
    },
    {
      name: 'React + Ant Design',
      desc: '前端展示层，实时态势感知 Dashboard',
      icon: '⚛️',
      tag: 'Frontend',
      color: '#00695c',
      delay: 0.4
    },
  ];

  const teamMembers = [
    {
      name: '成员 A',
      role: '基础设施 + WP1-1 核心',
      subtitle: '情报采集智能体负责人',
      skills: ['Docker', 'LangGraph', 'STIX 2.1', '爬虫'],
      color: '#c94b3a',
      gradient: 'linear-gradient(135deg,#c94b3a,#e07060)',
      delay: 0.1
    },
    {
      name: '成员 B',
      role: 'Agent 开发 + WP1-2 核心',
      subtitle: '红队对抗检测负责人',
      skills: ['Python', 'LangGraph', 'CVSS', '渗透测试'],
      color: '#2d4a8a',
      gradient: 'linear-gradient(135deg,#2d4a8a,#4a6ec4)',
      delay: 0.2
    },
    {
      name: '成员 C',
      role: '展示网站 + Dashboard',
      subtitle: '前端与可视化负责人',
      skills: ['React', 'Ant Design', 'SHAP', '数据可视化'],
      color: '#b07d2e',
      gradient: 'linear-gradient(135deg,#b07d2e,#d4a44c)',
      delay: 0.3
    },
  ];

  const stats = [
    { label: '检测样本', value: 156, suffix: '+' },
    { label: '高危漏洞', value: 42, suffix: '个' },
    { label: '防御成功率', value: 98, suffix: '%' },
    { label: '智能体协作', value: 4, suffix: '个' },
  ];

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* ==================== Hero Section ==================== */}
      <div className="hero-bg" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 50px',
        position: 'relative'
      }}>
        {/* 网格背景 */}
        <div className="hero-grid" />

        {/* 粒子效果 */}
        <ParticleBackground />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', textAlign: 'center', width: '100%' }}>
          {/* Logo Icon */}
          <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 90,
                height: 90,
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(217,119,6,0.2) 0%, rgba(217,119,6,0.05) 100%)',
                border: '1px solid rgba(217,119,6,0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 50, color: '#6189BD' }} />
            </div>
          </div>

          {/* 主标题 */}
          <div className="animate-fade-in-up delay-200">
            <Title
              style={{
                color: '#141413',
                fontSize: 72,
                fontWeight: 800,
                marginBottom: 20,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              多智能体大模型
              <br />
              安全态势感知
            </Title>
          </div>

          {/* 副标题 */}
          <div className="animate-fade-in-up delay-200">
            <Paragraph
              style={{
                color: '#5A5955',
                fontSize: 24,
                maxWidth: 800,
                margin: '0 auto 40px',
                lineHeight: 1.6,
              }}
            >
              基于四个智能体模块的协同博弈，构建
              <Text strong style={{ color: '#141413' }}> 攻防一体化 </Text>
              的安全闭环。
              <br />
              自动发现漏洞，生成防御策略，持续进化。
            </Paragraph>
          </div>

          {/* CTA 按钮 */}
          <div className="animate-fade-in-up delay-400">
            <Space size={20}>
              <button
                className="btn-anthropic"
                onClick={() => navigate('/dashboard')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RocketOutlined />
                  进入控制台
                </span>
              </button>
              <button
                className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <GithubOutlined />
                查看源码
              </button>
            </Space>
          </div>

          {/* 统计数据 */}
          <div className="animate-fade-in-up delay-500" style={{ marginTop: 60 }}>
            <Row gutter={[48, 24]} justify="center">
              {stats.map((stat, index) => (
                <Col key={index}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} duration={5000} />
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{stat.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

      </div>

      {/* ==================== Architecture Section ==================== */}
      <div style={{ padding: '60px 50px 60px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            ref={(el) => registerElement(el, 'arch-title')}
            className={`scroll-animate ${visibleElements.has('arch-title') ? 'visible' : ''}`}
            style={{ textAlign: 'center', marginBottom: 30 }}
          >
            {/* 顶部小标签 */}
            <div style={{ 
              color: 'var(--color-primary)', 
              fontSize: 12, 
              fontWeight: 600, 
              letterSpacing: '0.1em',
              marginBottom: 24,
              fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase'
            }}>
              AI SECURITY · AGENTIC PLATFORM
            </div>
            
            {/* 主标题 - 四智能体闭环协同 */}
            <Title level={1} style={{ 
              marginBottom: 32, 
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.2,
            }}>
              <span style={{ color: 'var(--text-primary)' }}>四智能体</span>
              <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>闭环协同</span>
            </Title>
            
            {/* 描述文字 */}
            <Paragraph style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 20, 
              maxWidth: 1000, 
              margin: '0 auto',
              lineHeight: 1.8,
              fontWeight: 400,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}>
              情报、测试、沙盒、检测——四个自治智能体围绕中央知识库持续协作，构建攻防一体的自进化安全闭环
            </Paragraph>
          </div>
        </div>
      </div>


      {/* Four Agent System Visualization */}
      <FourAgentSystem />


      {/* ==================== Attack Showcase - Live Simulation ==================== */}
      <AttackShowcase />


      {/* ==================== Tech Stack Section ==================== */}
      <div style={{ padding: '96px 5% 80px', background: 'var(--bg-primary)', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Badge */}
          <div
            ref={(el) => registerElement(el, 'tech-badge')}
            className={`scroll-animate ${visibleElements.has('tech-badge') ? 'visible' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              border: '1px solid var(--border)',
              borderRadius: 20,
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              background: 'var(--card-bg)',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent-red)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            技术栈
          </div>

          {/* Title */}
          <div
            ref={(el) => registerElement(el, 'tech-title')}
            className={`scroll-animate ${visibleElements.has('tech-title') ? 'visible' : ''}`}
          >
            <Title
              level={2}
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontWeight: 900,
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              现代化技术架构
            </Title>
            <Paragraph
              style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                fontWeight: 300,
                letterSpacing: '0.04em',
                marginBottom: 52,
              }}
            >
              基于主流 AI Agent 框架和安全标准构建
            </Paragraph>
          </div>

          {/* Tech Grid */}
          <div
            ref={(el) => registerElement(el, 'tech-stack')}
            className={`scroll-animate ${visibleElements.has('tech-stack') ? 'visible' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              maxWidth: 900,
              margin: '0 auto',
            }}
          >
            {techStack.map((tech, index) => (
              <div
                key={index}
                className={`tech-card ${visibleElements.has('tech-stack') ? 'visible' : ''}`}
                style={{
                  '--accent-color': tech.color,
                  animationDelay: `${tech.delay}s`,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '22px 18px',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'default',
                } as React.CSSProperties}
              >
                {/* Top accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: tech.color,
                    borderRadius: '14px 14px 0 0',
                  }}
                />

                <div style={{ fontSize: 22, marginBottom: 10 }}>{tech.icon}</div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 5,
                  }}
                >
                  {tech.name}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  {tech.desc}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: `color-mix(in srgb, ${tech.color} 12%, transparent)`,
                    color: tech.color,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  {tech.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== Team Section ==================== */}
      <div style={{ padding: '80px 5% 0', background: 'var(--bg-primary)', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Badge */}
          <div
            ref={(el) => registerElement(el, 'team-badge')}
            className={`scroll-animate ${visibleElements.has('team-badge') ? 'visible' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              border: '1px solid var(--border)',
              borderRadius: 20,
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'var(--text-secondary)',
              background: 'var(--card-bg)',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent-red)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            团队
          </div>

          {/* Title */}
          <div
            ref={(el) => registerElement(el, 'team-title')}
            className={`scroll-animate ${visibleElements.has('team-title') ? 'visible' : ''}`}
          >
            <Title
              level={2}
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontWeight: 900,
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              三人协作，全栈均等
            </Title>
            <Paragraph
              style={{
                fontSize: 15,
                color: 'var(--text-secondary)',
                fontWeight: 300,
                letterSpacing: '0.04em',
                marginBottom: 52,
              }}
            >
              每位成员独当一面，端到端负责
            </Paragraph>
          </div>

          {/* Team Grid */}
          <div
            ref={(el) => registerElement(el, 'team-members')}
            className={`scroll-animate ${visibleElements.has('team-members') ? 'visible' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 20,
              maxWidth: 820,
              margin: '0 auto',
            }}
          >
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`team-card ${visibleElements.has('team-members') ? 'visible' : ''}`}
                style={{
                  '--member-color': member.color,
                  animationDelay: `${member.delay}s`,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 18,
                  padding: '36px 24px 28px',
                  textAlign: 'left',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                } as React.CSSProperties}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Noto Serif SC', serif",
                    fontWeight: 700,
                    fontSize: 22,
                    color: '#fff',
                    marginBottom: 18,
                    position: 'relative',
                    background: member.gradient,
                    borderColor: member.color,
                  }}
                >
                  {member.name.slice(-1)}
                  <div
                    style={{
                      content: '""',
                      position: 'absolute',
                      inset: -3,
                      borderRadius: '50%',
                      border: `2px solid ${member.color}`,
                      opacity: 0.25,
                    }}
                  />
                </div>

                {/* Name */}
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {member.name}
                </div>

                {/* Role */}
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {member.role}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                    lineHeight: 1.5,
                  }}
                >
                  {member.subtitle}
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {member.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="skill-tag"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        padding: '3px 9px',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        background: 'var(--warm-bg)',
                        letterSpacing: '0.04em',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== CTA Section ==================== */}
      <div
        style={{
          marginTop: 72,
          position: 'relative',
          padding: '100px 5%',
          textAlign: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #16213e 0%, #1a2a55 40%, #7b3a5a 100%)',
          clipPath: 'polygon(0 6%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      >
        {/* Floating blobs */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            background: '#3b6fe8',
            top: -150,
            left: -100,
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.18,
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            background: '#c94b7a',
            bottom: -100,
            right: -80,
            borderRadius: '50%',
            filter: 'blur(80px)',
            opacity: 0.18,
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '-3s',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 20,
              fontSize: 12,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.07)',
              marginBottom: 28,
              backdropFilter: 'blur(4px)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#5de8b5',
                animation: 'pulse 2s infinite',
              }}
            />
            开始探索
          </div>

          {/* Title */}
          <Title
            level={2}
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              color: '#fff',
              letterSpacing: '-0.02em',
              marginBottom: 14,
            }}
          >
            进入实时攻防态势中心
          </Title>

          {/* Subtitle */}
          <Paragraph
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 300,
              marginBottom: 48,
              letterSpacing: '0.04em',
            }}
          >
            查看四个智能体的协同运行状态，实时监控威胁态势
          </Paragraph>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 36px',
              border: '1.5px solid rgba(255,255,255,0.8)',
              borderRadius: 50,
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              transition: 'background 0.25s ease, border-color 0.25s ease, transform 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = '#fff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            进入 Dashboard
            <ArrowRightOutlined />
          </button>

          {/* Stats Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 60,
              marginTop: 64,
              flexWrap: 'wrap',
            }}
          >
            {[
              { num: '4', label: '智能体模块' },
              { num: '10', label: 'OWASP 覆盖' },
              { num: '24/7', label: '持续运行' },
              { num: '∞', label: '攻防闭环' },
            ].map((stat, index) => (
              <React.Fragment key={index}>
                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '2rem',
                      fontWeight: 600,
                      color: '#fff',
                      display: 'block',
                    }}
                  >
                    {stat.num}
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                      letterSpacing: '0.06em',
                      marginTop: 4,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
                {index < 3 && (
                  <div
                    style={{
                      width: 1,
                      background: 'rgba(255,255,255,0.12)',
                      alignSelf: 'stretch',
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== Footer ==================== */}
      <div style={{ padding: '32px 50px', background: 'var(--text-primary)', textAlign: 'center' }}>
        <Text style={{ color: 'var(--text-muted)' }}>
          2026 多智能体大模型安全态势感知与自动化防御系统
        </Text>
      </div>
    </div>
  );
};

export default HomePage;
