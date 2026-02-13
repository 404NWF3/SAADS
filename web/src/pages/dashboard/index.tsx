import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Space, Steps, Button, message, Progress, Tag, Tooltip } from 'antd';
import {
  RadarChartOutlined,
  BugOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import { attackPoolApi, vulnReportApi, sandboxApi, idsApi, pipelineApi } from '../../services/api';
import type { AttackPoolStats, VulnReportStats, SandboxStats, IDSStats, PipelineStatus } from '../../types';
import { GlowCard, StatCard, LogStream, TypewriterText } from '../../components/common';
import type { LogEntry } from '../../components/common';

const { Title, Text } = Typography;

const DashboardOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attackStats, setAttackStats] = useState<AttackPoolStats | null>(null);
  const [vulnStats, setVulnStats] = useState<VulnReportStats | null>(null);
  const [sandboxStats, setSandboxStats] = useState<SandboxStats | null>(null);
  const [idsStats, setIdsStats] = useState<IDSStats | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 模拟实时日志
  useEffect(() => {
    const initialLogs: LogEntry[] = [
      { id: '1', timestamp: new Date().toISOString(), level: 'info', agent: 'System', message: '系统初始化完成，所有智能体就绪' },
      { id: '2', timestamp: new Date().toISOString(), level: 'success', agent: 'WP1-1', message: '情报采集模块已连接 5 个数据源' },
      { id: '3', timestamp: new Date().toISOString(), level: 'debug', agent: 'WP1-2', message: '对抗检测引擎预热中...' },
    ];
    setLogs(initialLogs);

    // 模拟新日志推送
    const timer = setInterval(() => {
      const newMessages = [
        '扫描到新的威胁情报条目',
        '正在分析 payload 变体...',
        '检测到可疑的 prompt injection 模式',
        '漏洞验证任务已加入队列',
        '模型推理完成，置信度 94.2%',
      ];
      const levels: ('info' | 'success' | 'warning' | 'debug')[] = ['info', 'success', 'warning', 'debug'];
      const agents = ['WP1-1', 'WP1-2', 'WP1-3', 'WP1-4', 'System'];

      setLogs(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: levels[Math.floor(Math.random() * levels.length)],
          agent: agents[Math.floor(Math.random() * agents.length)],
          message: newMessages[Math.floor(Math.random() * newMessages.length)],
        },
      ].slice(-20)); // 保留最近20条
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attack, vuln, sandbox, ids, pipeline] = await Promise.all([
          attackPoolApi.getStats(),
          vulnReportApi.getStats(),
          sandboxApi.getStats(),
          idsApi.getStats(),
          pipelineApi.getStatus(),
        ]);
        setAttackStats(attack);
        setVulnStats(vuln);
        setSandboxStats(sandbox);
        setIdsStats(ids);
        setPipelineStatus(pipeline);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTriggerPipeline = async () => {
    setTriggering(true);
    try {
      const result = await pipelineApi.trigger();
      if (result.success) {
        message.success(result.message);
        setLogs(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: 'success',
            agent: 'System',
            message: '流水线已触发，开始执行...',
          },
        ]);
      }
    } catch {
      message.error('触发流水线失败');
    } finally {
      setTriggering(false);
    }
  };

  const getStepStatus = (status: string): 'wait' | 'process' | 'finish' | 'error' => {
    switch (status) {
      case 'completed':
        return 'finish';
      case 'running':
        return 'process';
      case 'failed':
        return 'error';
      default:
        return 'wait';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'running':
        return <SyncOutlined spin style={{ color: 'var(--dashboard-accent)' }} />;
      case 'failed':
        return <WarningOutlined style={{ color: '#ef4444' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#525252' }} />;
    }
  };

  // 攻击类别分布图配置
  const categoryData = attackStats
    ? Object.entries(attackStats.by_category).map(([type, value]) => ({
        type: type.replace('_', ' ').toUpperCase(),
        value,
      }))
    : [];

  const categoryConfig = {
    data: categoryData,
    xField: 'type',
    yField: 'value',
    color: 'var(--dashboard-accent)',
    label: {
      position: 'top' as const,
      style: {
        fill: '#a3a3a3',
        fontSize: 11,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        style: {
          fill: '#737373',
          fontSize: 10,
        },
      },
      line: {
        style: {
          stroke: 'var(--dashboard-border-hover)',
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: '#737373',
        },
      },
      grid: {
        line: {
          style: {
            stroke: 'var(--dashboard-border)',
          },
        },
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  // 漏洞严重级别饼图配置
  const severityData = vulnStats
    ? Object.entries(vulnStats.by_severity).map(([severity, count]) => ({
        type: severity.toUpperCase(),
        value: count,
      }))
    : [];

  const severityConfig = {
    data: severityData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.65,
    color: ['#ef4444', '#6189BD', '#7BA4D4', '#22c55e'],
    label: {
      type: 'outer' as const,
      content: '{name}: {value}',
      style: {
        fill: '#a3a3a3',
        fontSize: 11,
      },
    },
    legend: {
      position: 'bottom' as const,
      itemName: {
        style: {
          fill: '#a3a3a3',
        },
      },
    },
    statistic: {
      title: {
        content: '总计',
        style: {
          color: '#737373',
          fontSize: '12px',
        },
      },
      content: {
        content: vulnStats?.total.toString() || '0',
        style: {
          color: '#f5f5f5',
          fontSize: '24px',
          fontFamily: "'JetBrains Mono', monospace",
        },
      },
    },
  };

  return (
    <div className="fade-in" style={{ background: 'var(--dashboard-bg-primary)', minHeight: '100vh', padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Space align="center" size={12}>
          <ThunderboltOutlined style={{ fontSize: 24, color: 'var(--dashboard-accent)' }} />
          <Title
            level={3}
            style={{
              margin: 0,
              color: '#f5f5f5',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            系统总览
          </Title>
        </Space>
        <div style={{ marginTop: 8, marginLeft: 36 }}>
          <TypewriterText
            text="多智能体大模型安全态势感知与自动化防御系统运行状态"
            speed={25}
            className="text-secondary"
          />
        </div>
      </div>

      {/* 四个子系统核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="WP1-1 攻击技术池"
            value={attackStats?.total || 0}
            suffix="个"
            icon={<RadarChartOutlined />}
            color="#6366f1"
            glowColor="primary"
            trend={{ value: 12, isUp: true }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="WP1-2 确认漏洞"
            value={vulnStats?.confirmed || 0}
            suffix={`/ ${vulnStats?.total || 0}`}
            icon={<BugOutlined />}
            color="#ef4444"
            glowColor="danger"
            trend={{ value: 8, isUp: true }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="WP1-3 标注样本"
            value={sandboxStats?.total_samples || 0}
            suffix="条"
            icon={<ExperimentOutlined />}
            color="#a855f7"
            glowColor="primary"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="WP1-4 已部署模型"
            value={idsStats?.deployed_models || 0}
            suffix="个"
            icon={<SafetyCertificateOutlined />}
            color="#10b981"
            glowColor="success"
          />
        </Col>
      </Row>

      {/* 实时日志流 */}
      <GlowCard
        title={
          <Space>
            <span className="status-indicator active" />
            <Text style={{ color: '#f5f5f5', fontFamily: "'JetBrains Mono', monospace" }}>
              实时日志流
            </Text>
          </Space>
        }
        style={{ marginBottom: 24 }}
        loading={loading}
      >
        <LogStream logs={logs} maxHeight={200} />
      </GlowCard>

      {/* Pipeline 状态 */}
      <GlowCard
        title={
          <Text style={{ color: '#f5f5f5' }}>流水线状态</Text>
        }
        extra={
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={triggering}
            onClick={handleTriggerPipeline}
            style={{
              background: 'linear-gradient(135deg, var(--dashboard-accent) 0%, var(--dashboard-accent-light) 100%)',
              border: 'none',
              boxShadow: '0 0 20px var(--dashboard-glow)',
            }}
          >
            触发运行
          </Button>
        }
        style={{ marginBottom: 24 }}
        loading={loading}
      >
        <Steps
          current={pipelineStatus?.stages.findIndex(s => s.status === 'running') ?? -1}
          items={pipelineStatus?.stages.map(stage => ({
            title: (
              <Text style={{ color: '#f5f5f5', fontSize: 13 }}>{stage.name}</Text>
            ),
            status: getStepStatus(stage.status),
            icon: getStepIcon(stage.status),
            description: (
              <Text style={{ color: '#737373', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                {stage.status === 'completed'
                  ? `完成于 ${new Date(stage.completed_at!).toLocaleTimeString()}`
                  : stage.status === 'running'
                  ? `进度 ${stage.progress}%`
                  : '等待中'}
              </Text>
            ),
          })) || []}
        />
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Text style={{ color: '#525252', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            上次运行: {pipelineStatus?.last_run ? new Date(pipelineStatus.last_run).toLocaleString() : '-'}
            {' | '}
            累计运行: {pipelineStatus?.total_runs || 0} 次
          </Text>
        </div>
      </GlowCard>

      {/* 数据可视化 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <GlowCard
            title={<Text style={{ color: '#f5f5f5' }}>攻击技术类别分布</Text>}
            loading={loading}
          >
            {categoryData.length > 0 && <Column {...categoryConfig} height={300} />}
          </GlowCard>
        </Col>
        <Col xs={24} lg={12}>
          <GlowCard
            title={<Text style={{ color: '#f5f5f5' }}>漏洞严重级别分布</Text>}
            loading={loading}
          >
            {severityData.length > 0 && <Pie {...severityConfig} height={300} />}
          </GlowCard>
        </Col>
      </Row>

      {/* OWASP LLM Top 10 覆盖率 */}
      <GlowCard
        title={<Text style={{ color: '#f5f5f5' }}>OWASP LLM Top 10 覆盖率</Text>}
        style={{ marginTop: 16 }}
        loading={loading}
      >
        <Row gutter={[16, 16]}>
          {vulnStats?.owasp_coverage.map((item, index) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={index}>
              <Tooltip title={item.category}>
                <div
                  className="lift-on-hover"
                  style={{
                    padding: '16px',
                    background: 'var(--dashboard-bg-elevated)',
                    border: '1px solid var(--dashboard-border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Text
                    ellipsis
                    style={{
                      color: '#a3a3a3',
                      fontSize: 12,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    {item.category}
                  </Text>
                  <Progress
                    percent={Math.round((item.covered / item.total) * 100)}
                    format={() => (
                      <span style={{ color: '#f5f5f5', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {item.covered}/{item.total}
                      </span>
                    )}
                    strokeColor={
                      item.covered / item.total >= 0.8
                        ? '#10b981'
                        : item.covered / item.total >= 0.5
                        ? '#7BA4D4'
                        : '#ef4444'
                    }
                    trailColor="var(--dashboard-border)"
                  />
                </div>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </GlowCard>

      {/* 全局样式覆盖 */}
      <style>{`
        .text-secondary {
          color: #a3a3a3;
          font-size: 14px;
        }
        
        /* Steps 样式覆盖 */
        .ant-steps .ant-steps-item-title {
          color: #f5f5f5 !important;
        }
        .ant-steps .ant-steps-item-description {
          color: #737373 !important;
        }
        .ant-steps .ant-steps-item-tail::after {
          background: var(--dashboard-border) !important;
        }
        .ant-steps .ant-steps-item-process .ant-steps-item-tail::after {
          background: linear-gradient(90deg, var(--dashboard-accent) 0%, var(--dashboard-border) 100%) !important;
        }
        
        /* Progress 样式覆盖 */
        .ant-progress-text {
          color: #f5f5f5 !important;
        }
        
        /* Card loading 样式 */
        .ant-card-loading-content {
          background: linear-gradient(90deg, var(--dashboard-bg-secondary) 25%, var(--dashboard-bg-tertiary) 50%, var(--dashboard-bg-secondary) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default DashboardOverview;
