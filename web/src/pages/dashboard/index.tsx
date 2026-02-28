import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Space, Button, message, Progress, Tooltip } from 'antd';
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
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import { attackPoolApi, vulnReportApi, sandboxApi, idsApi, pipelineApi } from '../../services/api';
import type { AttackPoolStats, VulnReportStats, SandboxStats, IDSStats, PipelineStatus } from '../../types';
import type { LogEntry } from '../../components/common';
import './dashboard.css';

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

  const getStepStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'running':
        return 'running';
      case 'failed':
        return 'failed';
      case 'idle':
        return 'idle';
      default:
        return 'idle';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined />;
      case 'running':
        return <SyncOutlined spin />;
      case 'failed':
        return <WarningOutlined />;
      default:
        return <ClockCircleOutlined />;
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
    color: '#cc4e1e',
    label: {
      position: 'top' as const,
      style: {
        fill: '#7a7774',
        fontSize: 11,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        style: {
          fill: '#7a7774',
          fontSize: 10,
        },
      },
      line: {
        style: {
          stroke: '#e8e4de',
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: '#7a7774',
        },
      },
      grid: {
        line: {
          style: {
            stroke: '#f2f0ec',
          },
        },
      },
    },
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
  };

  // 漏洞严重级别饼图配置
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const severityColors: Record<string, string> = {
    CRITICAL: '#b91c1c',  // 深红色 - 危急
    HIGH: '#cc4e1e',      // 橙红色 - 高危
    MEDIUM: '#c4860a',    // 橙黄色 - 中危
    LOW: '#2d6a4f',       // 绿色 - 低危
  };

  const severityData = vulnStats
    ? severityOrder
      .filter(severity => vulnStats.by_severity[severity] !== undefined)
      .map(severity => ({
        type: severity.toUpperCase(),
        value: vulnStats.by_severity[severity],
      }))
    : [];

  const severityConfig = {
    data: severityData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.65,
    color: (datum: { type: string }) => severityColors[datum.type] || '#7a7774',
    label: {
      type: 'outer' as const,
      content: (datum: { type: string; value: number }) => `${datum.type}: ${datum.value}`,
      style: {
        fill: '#7a7774',
        fontSize: 11,
      },
    },
    legend: {
      position: 'bottom' as const,
      itemName: {
        style: {
          fill: '#3d3c3a',
        },
      },
    },
    tooltip: {
      formatter: (datum: { type: string; value: number }) => ({
        name: datum.type,
        value: `${datum.value} 个漏洞`,
      }),
    },
    statistic: {
      title: {
        content: '总计',
        style: {
          color: '#7a7774',
          fontSize: '12px',
        },
      },
      content: {
        content: vulnStats?.total.toString() || '0',
        style: {
          color: '#1a1917',
          fontSize: '24px',
          fontFamily: "'DM Mono', monospace",
        },
      },
    },
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAgentClass = (agent: string | undefined): string => {
    if (!agent) return 'system';
    const map: Record<string, string> = {
      'WP1-1': 'wp1-1',
      'WP1-2': 'wp1-2',
      'WP1-3': 'wp1-3',
      'WP1-4': 'wp1-4',
      'System': 'system',
    };
    return map[agent] || 'system';
  };

  return (
    <div className="dashboard-page dash-fade-in">
      {/* 页面标题 */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <ThunderboltOutlined className="dashboard-title-icon" />
          <h3>系统总览</h3>
        </div>
        <div className="dashboard-subtitle">
          多智能体大模型安全态势感知与自动化防御系统运行状态
        </div>
      </div>

      {/* 四个子系统核心指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#cc4e1e' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <RadarChartOutlined style={{ marginRight: 6 }} />
              WP1-1 攻击技术池
            </div>
            <div className="dash-stat-value">
              {attackStats?.total || 0}
              <span className="dash-stat-suffix">个</span>
            </div>
            <div className="dash-stat-trend up">
              <ArrowUpOutlined /> +12%
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#b91c1c' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <BugOutlined style={{ marginRight: 6 }} />
              WP1-2 确认漏洞
            </div>
            <div className="dash-stat-value">
              {vulnStats?.confirmed || 0}
              <span className="dash-stat-suffix">/ {vulnStats?.total || 0}</span>
            </div>
            <div className="dash-stat-trend up">
              <ArrowUpOutlined /> +8%
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#c4860a' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <ExperimentOutlined style={{ marginRight: 6 }} />
              WP1-3 标注样本
            </div>
            <div className="dash-stat-value">
              {sandboxStats?.total_samples || 0}
              <span className="dash-stat-suffix">条</span>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#2d6a4f' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <SafetyCertificateOutlined style={{ marginRight: 6 }} />
              WP1-4 已部署模型
            </div>
            <div className="dash-stat-value">
              {idsStats?.deployed_models || 0}
              <span className="dash-stat-suffix">个</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* 实时日志流 */}
      <div className="dash-panel" style={{ marginBottom: 24 }}>
        <div className="dash-panel-header">
          <div className="dash-panel-title">
            <span className="dash-status-dot active" />
            实时日志流
          </div>
        </div>
        <div className="dash-panel-body">
          <div className="dash-log-feed">
            {logs.map(log => (
              <div key={log.id} className="dash-log-entry">
                <span className="dash-log-timestamp">{formatTime(log.timestamp)}</span>
                <span className={`dash-log-agent ${getAgentClass(log.agent)}`}>{log.agent}</span>
                <span className={`dash-log-level ${log.level}`}>{log.level}</span>
                <span className="dash-log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline 状态 */}
      <div className="dash-panel" style={{ marginBottom: 24 }}>
        <div className="dash-panel-header">
          <div className="dash-panel-title">
            <RocketOutlined className="dash-panel-title-icon" />
            流水线状态
          </div>
          <div className="dash-panel-extra">
            <button
              className="dash-btn-primary"
              onClick={handleTriggerPipeline}
              disabled={triggering}
            >
              {triggering ? <SyncOutlined spin style={{ marginRight: 6 }} /> : <RocketOutlined style={{ marginRight: 6 }} />}
              触发运行
            </button>
          </div>
        </div>
        <div className="dash-panel-body">
          <div className="dash-pipeline">
            {pipelineStatus?.stages.map((stage, index) => (
              <React.Fragment key={stage.name}>
                <div className={`dash-pipeline-node ${getStepStatus(stage.status)}`}>
                  <div className="dash-pipeline-icon">
                    {getStepIcon(stage.status)}
                  </div>
                  <div className="dash-pipeline-label">{stage.name}</div>
                  <div className="dash-pipeline-status">
                    {stage.status === 'completed' && stage.completed_at
                      ? `完成于 ${new Date(stage.completed_at).toLocaleTimeString()}`
                      : stage.status === 'running'
                        ? `进度 ${stage.progress}%`
                        : '等待中'}
                  </div>
                </div>
                {index < pipelineStatus.stages.length - 1 && (
                  <div className="dash-pipeline-arrow" />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#b0ada8', fontFamily: "'DM Mono', monospace" }}>
            上次运行: {pipelineStatus?.last_run ? new Date(pipelineStatus.last_run).toLocaleString() : '-'}
            {' | '}
            累计运行: {pipelineStatus?.total_runs || 0} 次
          </div>
        </div>
      </div>

      {/* 数据可视化 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">攻击技术类别分布</div>
            </div>
            <div className="dash-panel-body">
              <div className="dash-chart-container">
                {categoryData.length > 0 && <Column {...categoryConfig} height={300} />}
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">漏洞严重级别分布</div>
            </div>
            <div className="dash-panel-body">
              <div className="dash-chart-container">
                {severityData.length > 0 ? (
                  <Pie {...severityConfig} height={300} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#7a7774' }}>
                    正在加载漏洞数据...
                  </div>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* OWASP LLM Top 10 覆盖率 */}
      <div className="dash-panel" style={{ marginTop: 16 }}>
        <div className="dash-panel-header">
          <div className="dash-panel-title">OWASP LLM Top 10 覆盖率</div>
        </div>
        <div className="dash-panel-body">
          <Row gutter={[16, 16]}>
            {vulnStats?.owasp_coverage.map((item, index) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                <Tooltip title={item.category}>
                  <div className="dash-coverage-item">
                    <span className="dash-coverage-label">{item.category}</span>
                    <Progress
                      percent={Math.round((item.covered / item.total) * 100)}
                      format={() => (
                        <span style={{ color: '#1a1917', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                          {item.covered}/{item.total}
                        </span>
                      )}
                      strokeColor={
                        item.covered / item.total >= 0.8
                          ? '#2d6a4f'
                          : item.covered / item.total >= 0.5
                            ? '#c4860a'
                            : '#b91c1c'
                      }
                      trailColor="#f2f0ec"
                    />
                  </div>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
