import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Space,
  Statistic,
  Drawer,
  Descriptions,
  Button,
  Input,
  Select,
  Timeline,
  Divider,
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

const { Title, Text, Paragraph } = Typography;

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
        return '#cf1322';
      case 'high':
        return '#6189BD';
      case 'medium':
        return '#7BA4D4';
      case 'low':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const getSeverityTag = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'blue',
      medium: 'cyan',
      low: 'green',
    };
    return <Tag color={colors[severity] || 'default'}>{severity.toUpperCase()}</Tag>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#7BA4D4' }} />;
      case 'rejected':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return null;
    }
  };

  const getCVSSLevel = (score: number) => {
    if (score >= 9.0) return { text: 'Critical', color: '#cf1322' };
    if (score >= 7.0) return { text: 'High', color: '#6189BD' };
    if (score >= 4.0) return { text: 'Medium', color: '#7BA4D4' };
    return { text: 'Low', color: '#52c41a' };
  };

  const columns: ColumnsType<VulnReport> = [
    {
      title: '漏洞 ID',
      dataIndex: 'vuln_id',
      key: 'vuln_id',
      width: 150,
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: '目标应用',
      dataIndex: ['target_application', 'name'],
      key: 'target',
      ellipsis: true,
      render: (name: string, record: VulnReport) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
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
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
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
            <Text strong style={{ color: level.color }}>
              {score.toFixed(1)}
            </Text>
            <Tag color={level.color}>{level.text}</Tag>
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
      render: (severity: string) => getSeverityTag(severity),
    },
    {
      title: '成功率',
      dataIndex: ['reproduction', 'success_rate'],
      key: 'success_rate',
      width: 100,
      render: (rate: string) => <Text>{rate}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Text>{status}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: VulnReport) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedVuln(record);
            setDrawerVisible(true);
          }}
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
      },
    },
    point: {
      size: 3,
    },
  };

  // CVSS 分布图配置
  const cvssData = stats?.cvss_distribution || [];
  const cvssConfig = {
    data: cvssData,
    xField: 'range',
    yField: 'count',
    color: ({ range }: { range: string }) => {
      if (range === '9-10') return '#cf1322';
      if (range === '7-9') return '#6189BD';
      if (range === '5-7') return '#7BA4D4';
      if (range === '3-5') return '#52c41a';
      return '#1890ff';
    },
    label: {
      position: 'top' as const,
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          <BugOutlined style={{ marginRight: 8, color: '#f5222d' }} />
          WP1-2 对抗检测智能体
        </Title>
        <Text type="secondary">
          根据威胁情报自动生成并执行安全测试脚本，验证漏洞存在性
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="漏洞报告总数"
              value={stats?.total || 0}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="已确认"
              value={stats?.confirmed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="严重/高危"
              value={(stats?.by_severity.critical || 0) + (stats?.by_severity.high || 0)}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#6189BD' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理"
              value={stats?.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#7BA4D4' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="OWASP LLM Top 10 覆盖率" loading={loading}>
            {radarData.length > 0 && <Radar {...radarConfig} height={300} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="CVSS 评分分布" loading={loading}>
            {cvssData.length > 0 && <Bar {...cvssConfig} height={300} />}
          </Card>
        </Col>
      </Row>

      {/* 漏洞列表 */}
      <Card
        title="漏洞报告列表"
        extra={
          <Space>
            <Input
              placeholder="搜索 ID 或应用名"
              prefix={<SearchOutlined />}
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
        }
      >
        <Table
          columns={columns}
          dataSource={filteredVulns}
          rowKey="vuln_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <BugOutlined />
            {selectedVuln?.vuln_id || '漏洞详情'}
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
            <Card
              style={{
                marginBottom: 24,
                background: `linear-gradient(135deg, ${getSeverityColor(selectedVuln.vulnerability.severity)}15 0%, ${getSeverityColor(selectedVuln.vulnerability.severity)}05 100%)`,
                border: `1px solid ${getSeverityColor(selectedVuln.vulnerability.severity)}40`,
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
                    }}
                  >
                    {selectedVuln.vulnerability.cvss_score.toFixed(1)}
                  </div>
                </Col>
                <Col flex={1}>
                  <Title level={4} style={{ marginBottom: 4, color: getSeverityColor(selectedVuln.vulnerability.severity) }}>
                    {getCVSSLevel(selectedVuln.vulnerability.cvss_score).text} Severity
                  </Title>
                  <Text code style={{ fontSize: 12 }}>
                    {selectedVuln.vulnerability.cvss_vector}
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* 基本信息 */}
            <Title level={5}>基本信息</Title>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="漏洞 ID" span={2}>
                <Text code>{selectedVuln.vuln_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="关联攻击 ID">
                <Text code>{selectedVuln.source_attack_id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Space>
                  {getStatusIcon(selectedVuln.status)}
                  {selectedVuln.status}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="漏洞类型">
                <Tag color="blue">{selectedVuln.vulnerability.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="子类型">
                {selectedVuln.vulnerability.subtype}
              </Descriptions.Item>
              <Descriptions.Item label="发现时间" span={2}>
                {new Date(selectedVuln.timestamp).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {/* 目标应用 */}
            <Title level={5}>目标应用</Title>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="应用名称">
                {selectedVuln.target_application.name}
              </Descriptions.Item>
              <Descriptions.Item label="模型">
                {selectedVuln.target_application.model}
              </Descriptions.Item>
              <Descriptions.Item label="API 端点" span={2}>
                <Text code>{selectedVuln.target_application.api_endpoint}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="特性">
                <Space>
                  {selectedVuln.target_application.has_system_prompt && <Tag>System Prompt</Tag>}
                  {selectedVuln.target_application.has_tools && <Tag>Tools</Tag>}
                  {selectedVuln.target_application.has_rag && <Tag>RAG</Tag>}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {/* 漏洞描述 */}
            <Title level={5}>漏洞描述</Title>
            <Paragraph style={{ marginBottom: 24 }}>
              {selectedVuln.vulnerability.description}
            </Paragraph>

            {/* 攻击步骤 */}
            <Title level={5}>攻击步骤</Title>
            <Timeline
              style={{ marginBottom: 24 }}
              items={selectedVuln.vulnerability.attack_vector.attack_steps.map(step => ({
                color: step.step === selectedVuln.vulnerability.attack_vector.attack_steps.length ? 'red' : 'blue',
                children: (
                  <div>
                    <Text strong>步骤 {step.step}: {step.action}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">输入:</Text>
                      <pre
                        style={{
                          background: '#f5f5f5',
                          padding: 8,
                          borderRadius: 4,
                          marginTop: 4,
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {step.input}
                      </pre>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">输出:</Text>
                      <pre
                        style={{
                          background: '#fff1f0',
                          padding: 8,
                          borderRadius: 4,
                          marginTop: 4,
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
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
            <Title level={5}>
              <CodeOutlined /> 成功 Payload
            </Title>
            <pre
              style={{
                background: '#282c34',
                color: '#abb2bf',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 13,
                marginBottom: 24,
              }}
            >
              {selectedVuln.vulnerability.attack_vector.successful_payload}
            </pre>

            {/* 复现信息 */}
            <Title level={5}>复现信息</Title>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="成功率">
                <Text strong>{selectedVuln.reproduction.success_rate}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="确定性">
                <Tag color={selectedVuln.reproduction.deterministic ? 'green' : 'blue'}>
                  {selectedVuln.reproduction.deterministic ? '确定性' : '概率性'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="变体测试数" span={2}>
                {selectedVuln.reproduction.mutation_variants_tested} 个
              </Descriptions.Item>
              <Descriptions.Item label="环境要求" span={2}>
                {selectedVuln.reproduction.environment_requirements}
              </Descriptions.Item>
            </Descriptions>

            {/* 修复建议 */}
            <Title level={5}>
              <SafetyOutlined /> 修复建议
            </Title>
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
              <Text type="secondary">参考资料:</Text>
              <ul style={{ marginTop: 8 }}>
                {selectedVuln.vulnerability.remediation.references.map((ref, index) => (
                  <li key={index}>
                    <a href={ref} target="_blank" rel="noopener noreferrer">
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <Divider />

            {/* 可执行脚本 */}
            <Title level={5}>
              <CodeOutlined /> 可执行脚本
            </Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="语言">
                {selectedVuln.executable_script.language}
              </Descriptions.Item>
              <Descriptions.Item label="路径">
                <Text code>{selectedVuln.executable_script.path}</Text>
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
