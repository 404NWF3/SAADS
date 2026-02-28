import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Space,
  Drawer,
  Descriptions,
  Button,
  Input,
  Select,
  Timeline,
  Alert,
} from 'antd';
import {
  BugOutlined,
  SearchOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Radar, Bar } from '@ant-design/charts';
import { vulnReportApi } from '../../../services/api';
import type { VulnReport, VulnReportStats } from '../../../types';
import type { ColumnsType } from 'antd/es/table';
import '../dashboard.css';

const { Text, Paragraph } = Typography;

const WP2Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [vulnReports, setVulnReports] = useState<VulnReport[]>([]);
  const [stats, setStats] = useState<VulnReportStats | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<VulnReport | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vulnList, vulnStats] = await Promise.all([
          vulnReportApi.getList(),
          vulnReportApi.getStats(),
        ]);
        setVulnReports(vulnList);
        setStats(vulnStats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#b91c1c';
      case 'high':
        return '#cc4e1e';
      case 'medium':
        return '#c4860a';
      case 'low':
        return '#2d6a4f';
      default:
        return '#7a7774';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleOutlined style={{ color: 'var(--dash-green)' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: 'var(--dash-gold)' }} />;
      case 'rejected':
        return <CloseCircleOutlined style={{ color: 'var(--dash-red)' }} />;
      default:
        return null;
    }
  };

  interface CVSSLevel {
    text: string;
    color: string;
  }

  const getCVSSLevel = (score: number): CVSSLevel => {
    if (score >= 9.0) return { text: 'Critical', color: '#b91c1c' };
    if (score >= 7.0) return { text: 'High', color: '#cc4e1e' };
    if (score >= 4.0) return { text: 'Medium', color: '#c4860a' };
    return { text: 'Low', color: '#2d6a4f' };
  };

  const columns: ColumnsType<VulnReport> = [
    {
      title: '漏洞 ID',
      dataIndex: 'vuln_id',
      key: 'vuln_id',
      width: 150,
      render: (id: string) => (
        <Text
          code
          style={{
            background: 'var(--dash-slate-lt)',
            border: '1px solid rgba(59, 80, 104, 0.2)',
            color: 'var(--dash-slate)',
            fontFamily: "var(--dash-mono)",
            fontSize: 11,
          }}
        >
          {id}
        </Text>
      ),
    },
    {
      title: '目标应用',
      dataIndex: ['target_application', 'name'],
      key: 'target',
      ellipsis: true,
      render: (name: string, record: VulnReport) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: 'var(--dash-ink)' }}>{name}</Text>
          <Text style={{ fontSize: 12, color: 'var(--dash-ink-muted)' }}>
            {record.target_application.model}
          </Text>
        </Space>
      ),
    },
    {
      title: '漏洞类型',
      dataIndex: ['vulnerability', 'type'],
      key: 'type',
      width: 140,
      render: (type: string) => (
        <span className="dash-tag dash-tag-slate">
          {type.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      title: 'CVSS',
      dataIndex: ['vulnerability', 'cvss_score'],
      key: 'cvss',
      width: 100,
      render: (score: number) => {
        const level = getCVSSLevel(score);
        return (
          <Space>
            <Text strong style={{ color: level.color, fontFamily: 'var(--dash-mono)' }}>
              {score.toFixed(1)}
            </Text>
            <span
              className="dash-tag"
              style={{
                background: `${level.color}15`,
                borderColor: `${level.color}40`,
                color: level.color,
              }}
            >
              {level.text}
            </span>
          </Space>
        );
      },
      sorter: (a, b) => a.vulnerability.cvss_score - b.vulnerability.cvss_score,
      defaultSortOrder: 'descend',
    },
    {
      title: '严重级别',
      dataIndex: ['vulnerability', 'severity'],
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <span
          className="dash-tag"
          style={{
            background: `${getSeverityColor(severity)}15`,
            borderColor: `${getSeverityColor(severity)}40`,
            color: getSeverityColor(severity),
          }}
        >
          {severity.toUpperCase()}
        </span>
      ),
    },
    {
      title: '成功率',
      dataIndex: ['reproduction', 'success_rate'],
      key: 'success_rate',
      width: 100,
      render: (rate: string) => <Text style={{ fontFamily: 'var(--dash-mono)', color: 'var(--dash-ink-muted)' }}>{rate}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Text style={{ color: 'var(--dash-ink-muted)' }}>{status}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: VulnReport) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedVuln(record);
            setDrawerVisible(true);
          }}
          style={{ color: 'var(--dash-slate)' }}
        >
          详情
        </Button>
      ),
    },
  ];

  const filteredVulns = vulnReports.filter(vuln => {
    const matchSearch =
      !searchText ||
      vuln.vuln_id.toLowerCase().includes(searchText.toLowerCase()) ||
      vuln.target_application.name.toLowerCase().includes(searchText.toLowerCase());
    const matchSeverity = !severityFilter || vuln.vulnerability.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  // OWASP 雷达图配置
  const radarData = stats?.owasp_coverage.map(item => ({
    name: item.category.replace('LLM', '').substring(0, 20),
    value: Math.round((item.covered / item.total) * 100),
  })) || [];

  const radarConfig = {
    data: radarData,
    xField: 'name',
    yField: 'value',
    meta: {
      value: {
        min: 0,
        max: 100,
      },
    },
    area: {
      style: {
        fillOpacity: 0.3,
        fill: '#3b5068',
      },
    },
    point: {
      size: 3,
      style: {
        fill: '#3b5068',
      },
    },
    xAxis: {
      label: {
        style: {
          fill: '#7a7774',
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
            stroke: '#e8e4de',
          },
        },
      },
    },
  };

  // CVSS 分布图配置
  const cvssData = stats?.cvss_distribution || [];
  const cvssConfig = {
    data: cvssData,
    xField: 'range',
    yField: 'count',
    color: ({ range }: { range: string }) => {
      if (range === '9-10') return '#b91c1c';
      if (range === '7-9') return '#cc4e1e';
      if (range === '5-7') return '#c4860a';
      if (range === '3-5') return '#2d6a4f';
      return '#3b5068';
    },
    label: {
      position: 'top' as const,
      style: {
        fill: '#7a7774',
      },
    },
    xAxis: {
      label: {
        style: {
          fill: '#7a7774',
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
  };

  return (
    <div className="dashboard-page dash-fade-in">
      {/* 页面标题 */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <BugOutlined className="dashboard-title-icon" style={{ color: 'var(--dash-slate)' }} />
          <h3>WP1-2 渗透测试智能体</h3>
        </div>
        <div className="dashboard-subtitle">
          根据威胁情报自动生成并执行安全测试脚本，验证漏洞存在性
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#3b5068' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <BugOutlined style={{ marginRight: 6 }} />
              漏洞报告总数
            </div>
            <div className="dash-stat-value">{stats?.total || 0}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#2d6a4f' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              已确认
            </div>
            <div className="dash-stat-value">{stats?.confirmed || 0}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#b91c1c' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <WarningOutlined style={{ marginRight: 6 }} />
              严重/高危
            </div>
            <div className="dash-stat-value">
              {(stats?.by_severity.critical || 0) + (stats?.by_severity.high || 0)}
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#c4860a' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              待处理
            </div>
            <div className="dash-stat-value">{stats?.pending || 0}</div>
          </div>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">OWASP LLM Top 10 覆盖率</div>
            </div>
            <div className="dash-panel-body">
              <div className="dash-chart-container">
                {radarData.length > 0 && <Radar {...radarConfig} height={300} />}
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">CVSS 评分分布</div>
            </div>
            <div className="dash-panel-body">
              <div className="dash-chart-container">
                {cvssData.length > 0 && <Bar {...cvssConfig} height={300} />}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 漏洞列表 */}
      <div className="dash-panel">
        <div className="dash-panel-header">
          <div className="dash-panel-title">
            <BugOutlined className="dash-panel-title-icon" style={{ color: 'var(--dash-slate)' }} />
            漏洞报告列表
          </div>
          <div className="dash-panel-extra">
            <Space>
              <Input
                placeholder="搜索 ID 或应用名"
                prefix={<SearchOutlined style={{ color: 'var(--dash-ink-dim)' }} />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="严重级别"
                value={severityFilter}
                onChange={setSeverityFilter}
                style={{ width: 120 }}
                allowClear
              >
                <Select.Option value="critical">Critical</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="low">Low</Select.Option>
              </Select>
            </Space>
          </div>
        </div>
        <div className="dash-panel-body">
          <Table
            columns={columns}
            dataSource={filteredVulns}
            rowKey="vuln_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => (
                <Text style={{ color: 'var(--dash-ink-muted)', fontSize: 12 }}>
                  共 {total} 条记录
                </Text>
              ),
            }}
            scroll={{ x: 1100 }}
          />
        </div>
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <BugOutlined style={{ color: 'var(--dash-slate)' }} />
            <span style={{ color: 'var(--dash-ink)' }}>
              {selectedVuln?.vuln_id || '漏洞详情'}
            </span>
          </Space>
        }
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedVuln && (
          <div>
            {/* CVSS 评分卡片 */}
            <div
              style={{
                marginBottom: 24,
                padding: 20,
                background: `linear-gradient(135deg, ${getSeverityColor(selectedVuln.vulnerability.severity)}10 0%, ${getSeverityColor(selectedVuln.vulnerability.severity)}05 100%)`,
                border: `1px solid ${getSeverityColor(selectedVuln.vulnerability.severity)}30`,
                borderRadius: 12,
              }}
            >
              <Row align="middle" gutter={24}>
                <Col>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: getSeverityColor(selectedVuln.vulnerability.severity),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 24,
                      fontWeight: 'bold',
                      fontFamily: 'var(--dash-mono)',
                    }}
                  >
                    {selectedVuln.vulnerability.cvss_score.toFixed(1)}
                  </div>
                </Col>
                <Col flex={1}>
                  <h4 style={{ marginBottom: 4, color: getSeverityColor(selectedVuln.vulnerability.severity), fontFamily: 'var(--dash-serif)' }}>
                    {getCVSSLevel(selectedVuln.vulnerability.cvss_score).text} Severity
                  </h4>
                  <Text code style={{ fontSize: 12, background: 'var(--dash-cream-dark)' }}>
                    {selectedVuln.vulnerability.cvss_vector}
                  </Text>
                </Col>
              </Row>
            </div>

            {/* 基本信息 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>基本信息</h4>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="漏洞 ID" span={2}>
                <Text code style={{ background: 'var(--dash-slate-lt)', color: 'var(--dash-slate)' }}>{selectedVuln.vuln_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="关联攻击 ID">
                <Text code style={{ background: 'var(--dash-terra-lt)', color: 'var(--dash-terra)' }}>{selectedVuln.source_attack_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Space>
                  {getStatusIcon(selectedVuln.status)}
                  {selectedVuln.status}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="漏洞类型">
                <span className="dash-tag dash-tag-slate">{selectedVuln.vulnerability.type}</span>
              </Descriptions.Item>
              <Descriptions.Item label="子类型">
                {selectedVuln.vulnerability.subtype}
              </Descriptions.Item>
              <Descriptions.Item label="发现时间" span={2}>
                <Text style={{ fontFamily: 'var(--dash-mono)', color: 'var(--dash-ink-muted)' }}>
                  {new Date(selectedVuln.timestamp).toLocaleString()}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {/* 目标应用 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>目标应用</h4>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="应用名称">
                {selectedVuln.target_application.name}
              </Descriptions.Item>
              <Descriptions.Item label="模型">
                {selectedVuln.target_application.model}
              </Descriptions.Item>
              <Descriptions.Item label="API 端点" span={2}>
                <Text code style={{ background: 'var(--dash-cream-dark)', color: 'var(--dash-ink-muted)' }}>{selectedVuln.target_application.api_endpoint}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="特性">
                <Space>
                  {selectedVuln.target_application.has_system_prompt && <span className="dash-tag dash-tag-slate">System Prompt</span>}
                  {selectedVuln.target_application.has_tools && <span className="dash-tag dash-tag-gold">Tools</span>}
                  {selectedVuln.target_application.has_rag && <span className="dash-tag dash-tag-green">RAG</span>}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* 漏洞描述 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>漏洞描述</h4>
            <Paragraph style={{ marginBottom: 24, color: 'var(--dash-ink-muted)' }}>
              {selectedVuln.vulnerability.description}
            </Paragraph>

            {/* 攻击步骤 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>攻击步骤</h4>
            <Timeline
              style={{ marginBottom: 24 }}
              items={selectedVuln.vulnerability.attack_vector.attack_steps.map(step => ({
                color: step.step === selectedVuln.vulnerability.attack_vector.attack_steps.length ? '#b91c1c' : '#3b5068',
                children: (
                  <div>
                    <Text strong style={{ color: 'var(--dash-ink)' }}>步骤 {step.step}: {step.action}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text style={{ color: 'var(--dash-ink-muted)', fontSize: 12 }}>输入:</Text>
                      <pre
                        style={{
                          background: 'var(--dash-cream-dark)',
                          padding: 8,
                          borderRadius: 6,
                          marginTop: 4,
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
                          color: 'var(--dash-ink)',
                          border: '1px solid var(--dash-cream-border)',
                        }}
                      >
                        {step.input}
                      </pre>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text style={{ color: 'var(--dash-ink-muted)', fontSize: 12 }}>输出:</Text>
                      <pre
                        style={{
                          background: 'rgba(185, 28, 28, 0.05)',
                          padding: 8,
                          borderRadius: 6,
                          marginTop: 4,
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
                          color: 'var(--dash-ink)',
                          border: '1px solid rgba(185, 28, 28, 0.2)',
                        }}
                      >
                        {step.output}
                      </pre>
                    </div>
                  </div>
                ),
              }))}
            />

            {/* 成功 Payload */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>
              <CodeOutlined style={{ marginRight: 8 }} />
              成功 Payload
            </h4>
            <pre className="dash-code-block" style={{ marginBottom: 24 }}>
              {selectedVuln.vulnerability.attack_vector.successful_payload}
            </pre>

            {/* 复现信息 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>复现信息</h4>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="成功率">
                <Text strong style={{ fontFamily: 'var(--dash-mono)' }}>{selectedVuln.reproduction.success_rate}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="确定性">
                <span className={`dash-tag ${selectedVuln.reproduction.deterministic ? 'dash-tag-green' : 'dash-tag-slate'}`}>
                  {selectedVuln.reproduction.deterministic ? '确定性' : '概率性'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="变体测试数" span={2}>
                {selectedVuln.reproduction.mutation_variants_tested} 个
              </Descriptions.Item>
              <Descriptions.Item label="环境要求" span={2}>
                {selectedVuln.reproduction.environment_requirements}
              </Descriptions.Item>
            </Descriptions>

            {/* 修复建议 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginBottom: 12 }}>
              <SafetyOutlined style={{ marginRight: 8 }} />
              修复建议
            </h4>
            <Alert
              message={`优先级: ${selectedVuln.vulnerability.remediation.priority.toUpperCase()}`}
              description={selectedVuln.vulnerability.remediation.suggestion}
              type={
                selectedVuln.vulnerability.remediation.priority === 'immediate'
                  ? 'error'
                  : selectedVuln.vulnerability.remediation.priority === 'high'
                    ? 'warning'
                    : 'info'
              }
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div>
              <Text style={{ color: 'var(--dash-ink-muted)' }}>参考资料:</Text>
              <ul style={{ marginTop: 8 }}>
                {selectedVuln.vulnerability.remediation.references.map((ref, index) => (
                  <li key={index}>
                    <a href={ref} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dash-slate)' }}>
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* 可执行脚本 */}
            <h4 style={{ color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)', marginTop: 24, marginBottom: 12 }}>
              <CodeOutlined style={{ marginRight: 8 }} />
              可执行脚本
            </h4>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="语言">
                <span className="dash-tag dash-tag-slate">{selectedVuln.executable_script.language}</span>
              </Descriptions.Item>
              <Descriptions.Item label="路径">
                <Text code style={{ background: 'var(--dash-cream-dark)', color: 'var(--dash-ink-muted)' }}>{selectedVuln.executable_script.path}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedVuln.executable_script.description}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default WP2Dashboard;
