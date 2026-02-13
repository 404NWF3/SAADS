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
  Tooltip,
} from 'antd';
import {
  RadarChartOutlined,
  SearchOutlined,
  EyeOutlined,
  SyncOutlined,
  GlobalOutlined,
  FileTextOutlined,
  GithubOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { attackPoolApi } from '../../../services/api';
import type { AttackEntry, AttackPoolStats } from '../../../types';
import type { ColumnsType } from 'antd/es/table';
import { GlowCard, StatCard, TypewriterText } from '../../../components/common';

const { Title, Text, Paragraph } = Typography;

const WP1Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [attacks, setAttacks] = useState<AttackEntry[]>([]);
  const [stats, setStats] = useState<AttackPoolStats | null>(null);
  const [selectedAttack, setSelectedAttack] = useState<AttackEntry | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attackList, attackStats] = await Promise.all([
          attackPoolApi.getList(),
          attackPoolApi.getStats(),
        ]);
        setAttacks(attackList);
        setStats(attackStats);
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
        return '#ef4444';
      case 'high':
        return '#6189BD';
      case 'medium':
        return '#7BA4D4';
      case 'low':
        return '#22c55e';
      default:
        return '#525252';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      prompt_injection: '#6366f1',
      jailbreak: '#ef4444',
      info_leakage: '#6189BD',
      multimodal: '#a855f7',
      dos: '#06b6d4',
      agent_hijack: '#ec4899',
    };
    return colors[category] || '#525252';
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'arxiv':
        return <FileTextOutlined />;
      case 'github':
        return <GithubOutlined />;
      case 'cve':
      case 'nvd':
        return <WarningOutlined />;
      case 'darkweb':
        return <GlobalOutlined />;
      default:
        return <GlobalOutlined />;
    }
  };

  const columns: ColumnsType<AttackEntry> = [
    {
      title: 'ID',
      dataIndex: 'attack_id',
      key: 'attack_id',
      width: 140,
      render: (id: string) => (
        <Text
          code
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: '#6366f1',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}
        >
          {id}
        </Text>
      ),
    },
    {
      title: '攻击名称',
      dataIndex: ['attack_template', 'name'],
      key: 'name',
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name}>
          <Text strong style={{ color: '#f5f5f5' }}>{name}</Text>
        </Tooltip>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => (
        <Tag
          style={{
            background: `${getCategoryColor(category)}20`,
            border: `1px solid ${getCategoryColor(category)}40`,
            color: getCategoryColor(category),
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}
        >
          {category.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '严重级别',
      dataIndex: ['metadata', 'severity_estimate'],
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag
          style={{
            background: `${getSeverityColor(severity)}20`,
            border: `1px solid ${getSeverityColor(severity)}40`,
            color: getSeverityColor(severity),
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}
        >
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: ['source', 'type'],
      key: 'source',
      width: 100,
      render: (type: string) => (
        <Space>
          <span style={{ color: '#6366f1' }}>{getSourceIcon(type)}</span>
          <Text style={{ color: '#a3a3a3', fontSize: 12 }}>{type.toUpperCase()}</Text>
        </Space>
      ),
    },
    {
      title: '有效性',
      dataIndex: ['metadata', 'effectiveness'],
      key: 'effectiveness',
      width: 100,
      render: (eff: number | null) =>
        eff !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 4,
                background: 'rgba(99, 102, 241, 0.2)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${eff * 100}%`,
                  height: '100%',
                  background: eff >= 0.6 ? '#10b981' : eff >= 0.4 ? '#7BA4D4' : '#ef4444',
                  borderRadius: 2,
                }}
              />
            </div>
            <Text
              style={{
                color: eff >= 0.6 ? '#10b981' : eff >= 0.4 ? '#7BA4D4' : '#a3a3a3',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
              }}
            >
              {(eff * 100).toFixed(0)}%
            </Text>
          </div>
        ) : (
          <Text style={{ color: '#525252' }}>-</Text>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusColors: Record<string, { bg: string; color: string }> = {
          active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
          tested: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' },
          deprecated: { bg: 'rgba(82, 82, 82, 0.2)', color: '#525252' },
        };
        const style = statusColors[status] || statusColors.deprecated;
        return (
          <Tag
            style={{
              background: style.bg,
              border: `1px solid ${style.color}40`,
              color: style.color,
              fontSize: 10,
            }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: AttackEntry) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedAttack(record);
            setDrawerVisible(true);
          }}
          style={{ color: '#6366f1' }}
        >
          详情
        </Button>
      ),
    },
  ];

  const filteredAttacks = attacks.filter(attack => {
    const matchSearch =
      !searchText ||
      attack.attack_id.toLowerCase().includes(searchText.toLowerCase()) ||
      attack.attack_template.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = !categoryFilter || attack.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // 趋势图配置
  const trendConfig = {
    data: stats?.recent_trend || [],
    xField: 'date',
    yField: 'count',
    smooth: true,
    color: '#6366f1',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#6366f1',
        stroke: '#1A1A1A',
        lineWidth: 2,
      },
    },
    area: {
      style: {
        fill: 'l(270) 0:rgba(99, 102, 241, 0.1) 1:rgba(99, 102, 241, 0.4)',
      },
    },
    xAxis: {
      label: {
        style: {
          fill: '#737373',
          fontSize: 10,
        },
      },
      line: {
        style: {
          stroke: 'rgba(99, 102, 241, 0.2)',
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
            stroke: 'rgba(99, 102, 241, 0.1)',
          },
        },
      },
    },
  };

  // 来源分布配置
  const sourceData = stats
    ? Object.entries(stats.by_source).map(([type, value]) => ({
        type: type.toUpperCase(),
        value,
      }))
    : [];

  const sourceConfig = {
    data: sourceData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    color: ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981'],
    label: {
      type: 'outer' as const,
      content: '{name}: {value}',
      style: {
        fill: '#a3a3a3',
        fontSize: 11,
      },
    },
    legend: {
      position: 'right' as const,
      itemName: {
        style: {
          fill: '#a3a3a3',
        },
      },
    },
  };

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Space align="center" size={12}>
          <RadarChartOutlined style={{ fontSize: 24, color: '#6366f1' }} />
          <Title
            level={3}
            style={{
              margin: 0,
              color: '#f5f5f5',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            WP1-1 情报采集智能体
          </Title>
        </Space>
        <div style={{ marginTop: 8, marginLeft: 36 }}>
          <TypewriterText
            text="实时采集、整合、分析面向大模型的安全威胁情报"
            speed={25}
            className="text-secondary"
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <StatCard
            title="攻击技术总数"
            value={stats?.total || 0}
            icon={<RadarChartOutlined />}
            color="#6366f1"
            glowColor="primary"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="严重级别"
            value={stats?.by_severity.critical || 0}
            suffix={`/ ${stats?.by_severity.high || 0} 高`}
            icon={<WarningOutlined />}
            color="#ef4444"
            glowColor="danger"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="今日新增"
            value={stats?.recent_trend[stats.recent_trend.length - 1]?.count || 0}
            icon={<SyncOutlined />}
            color="#10b981"
            glowColor="success"
            trend={{ value: 15, isUp: true }}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="数据来源"
            value={Object.keys(stats?.by_source || {}).length}
            suffix="个渠道"
            icon={<GlobalOutlined />}
            color="#a855f7"
            glowColor="primary"
          />
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <GlowCard
            title={<Text style={{ color: '#f5f5f5' }}>采集趋势 (近7天)</Text>}
            loading={loading}
          >
            {stats && <Line {...trendConfig} height={250} />}
          </GlowCard>
        </Col>
        <Col xs={24} lg={10}>
          <GlowCard
            title={<Text style={{ color: '#f5f5f5' }}>来源分布</Text>}
            loading={loading}
          >
            {sourceData.length > 0 && <Pie {...sourceConfig} height={250} />}
          </GlowCard>
        </Col>
      </Row>

      {/* 攻击列表 */}
      <GlowCard
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#6366f1' }} />
            <Text style={{ color: '#f5f5f5' }}>攻击技术池</Text>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索 ID 或名称"
              prefix={<SearchOutlined style={{ color: '#525252' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                width: 200,
                background: '#1A1A1A',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
              allowClear
            />
            <Select
              placeholder="类别筛选"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 160 }}
              allowClear
              dropdownStyle={{ background: '#242424' }}
            >
              <Select.Option value="prompt_injection">Prompt Injection</Select.Option>
              <Select.Option value="jailbreak">Jailbreak</Select.Option>
              <Select.Option value="info_leakage">Info Leakage</Select.Option>
              <Select.Option value="multimodal">Multimodal</Select.Option>
              <Select.Option value="dos">DoS</Select.Option>
              <Select.Option value="agent_hijack">Agent Hijack</Select.Option>
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredAttacks}
          rowKey="attack_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => (
              <Text style={{ color: '#737373', fontSize: 12 }}>
                共 {total} 条记录
              </Text>
            ),
          }}
          scroll={{ x: 1000 }}
          rowClassName={() => 'custom-table-row'}
        />
      </GlowCard>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <RadarChartOutlined style={{ color: '#6366f1' }} />
            <Text style={{ color: '#f5f5f5' }}>
              {selectedAttack?.attack_template.name || '攻击详情'}
            </Text>
          </Space>
        }
        placement="right"
        width={680}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        styles={{
          header: {
            background: '#1A1A1A',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
          },
          body: {
            background: '#1A1A1A',
            padding: 24,
          },
        }}
      >
        {selectedAttack && (
          <div>
            <Descriptions
              column={1}
              bordered
              size="small"
              labelStyle={{ color: '#a3a3a3', background: '#242424', width: 120 }}
              contentStyle={{ color: '#f5f5f5', background: '#1A1A1A' }}
            >
              <Descriptions.Item label="攻击 ID">
                <Text
                  code
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: '#6366f1',
                  }}
                >
                  {selectedAttack.attack_id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="STIX 类型">
                <Text style={{ color: '#a3a3a3' }}>{selectedAttack.stix_type}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="类别">
                <Space>
                  <Tag color={getCategoryColor(selectedAttack.category)}>
                    {selectedAttack.category}
                  </Tag>
                  <Tag style={{ background: '#242424', color: '#a3a3a3' }}>
                    {selectedAttack.subcategory}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="严重级别">
                <Tag color={getSeverityColor(selectedAttack.metadata.severity_estimate)}>
                  {selectedAttack.metadata.severity_estimate.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="攻击模态">
                <Tag style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                  {selectedAttack.attack_template.modality.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标类型">
                {selectedAttack.metadata.target_type.map(t => (
                  <Tag key={t} style={{ background: '#242424', color: '#a3a3a3', marginRight: 4 }}>
                    {t}
                  </Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, color: '#f5f5f5' }}>
              攻击描述
            </Title>
            <Paragraph style={{ color: '#a3a3a3' }}>
              {selectedAttack.attack_template.description}
            </Paragraph>

            <Title level={5} style={{ marginTop: 24, color: '#f5f5f5' }}>
              Payload 模板
            </Title>
            <pre className="code-block">
              {selectedAttack.attack_template.payload_template}
            </pre>

            <Title level={5} style={{ marginTop: 24, color: '#f5f5f5' }}>
              变量说明
            </Title>
            <Descriptions
              column={1}
              bordered
              size="small"
              labelStyle={{ color: '#a3a3a3', background: '#242424' }}
              contentStyle={{ color: '#f5f5f5', background: '#1A1A1A' }}
            >
              {Object.entries(selectedAttack.attack_template.variables).map(([key, value]) => (
                <Descriptions.Item
                  key={key}
                  label={
                    <Text code style={{ color: '#6366f1', background: 'transparent' }}>
                      {`{${key}}`}
                    </Text>
                  }
                >
                  {value}
                </Descriptions.Item>
              ))}
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, color: '#f5f5f5' }}>
              变异提示
            </Title>
            <Space wrap>
              {selectedAttack.attack_template.mutation_hints.map((hint, index) => (
                <Tag
                  key={index}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#6366f1',
                  }}
                >
                  {hint}
                </Tag>
              ))}
            </Space>

            <Title level={5} style={{ marginTop: 24, color: '#f5f5f5' }}>
              MITRE ATT&CK 映射
            </Title>
            <Descriptions
              column={2}
              bordered
              size="small"
              labelStyle={{ color: '#a3a3a3', background: '#242424' }}
              contentStyle={{ color: '#f5f5f5', background: '#1A1A1A' }}
            >
              <Descriptions.Item label="战术">
                {selectedAttack.mitre_mapping.tactic}
              </Descriptions.Item>
              <Descriptions.Item label="技术">
                {selectedAttack.mitre_mapping.technique}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 24, color: '#f5f5f5' }}>
              来源信息
            </Title>
            <Descriptions
              column={1}
              bordered
              size="small"
              labelStyle={{ color: '#a3a3a3', background: '#242424' }}
              contentStyle={{ color: '#f5f5f5', background: '#1A1A1A' }}
            >
              <Descriptions.Item label="来源类型">
                <Space>
                  <span style={{ color: '#6366f1' }}>{getSourceIcon(selectedAttack.source.type)}</span>
                  <Text style={{ color: '#a3a3a3' }}>{selectedAttack.source.type.toUpperCase()}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="来源 URL">
                <a
                  href={selectedAttack.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#6366f1' }}
                >
                  {selectedAttack.source.url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="采集时间">
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", color: '#a3a3a3' }}>
                  {new Date(selectedAttack.source.crawl_time).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                <Tag color={selectedAttack.source.confidence === 'high' ? '#10b981' : '#7BA4D4'}>
                  {selectedAttack.source.confidence.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* 样式覆盖 */}
      <style>{`
        .text-secondary {
          color: #a3a3a3;
          font-size: 14px;
        }
        
        /* Table 样式覆盖 */
        .ant-table {
          background: transparent !important;
        }
        .ant-table-thead > tr > th {
          background: rgba(99, 102, 241, 0.05) !important;
          color: #a3a3a3 !important;
          border-bottom: 1px solid rgba(99, 102, 241, 0.2) !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 12px !important;
        }
        .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1) !important;
          color: #f5f5f5 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(99, 102, 241, 0.05) !important;
        }
        .custom-table-row {
          transition: all 0.2s ease;
        }
        
        /* Input 样式 */
        .ant-input {
          background: #1A1A1A !important;
          border-color: rgba(99, 102, 241, 0.2) !important;
          color: #f5f5f5 !important;
        }
        .ant-input:hover, .ant-input:focus {
          border-color: rgba(99, 102, 241, 0.4) !important;
        }
        .ant-input::placeholder {
          color: #525252 !important;
        }
        
        /* Select 样式 */
        .ant-select-selector {
          background: #1A1A1A !important;
          border-color: rgba(99, 102, 241, 0.2) !important;
          color: #f5f5f5 !important;
        }
        
        /* Pagination 样式 */
        .ant-pagination-item {
          background: #242424 !important;
          border-color: rgba(99, 102, 241, 0.2) !important;
        }
        .ant-pagination-item a {
          color: #a3a3a3 !important;
        }
        .ant-pagination-item-active {
          border-color: #6366f1 !important;
        }
        .ant-pagination-item-active a {
          color: #6366f1 !important;
        }
        
        /* Code block */
        .code-block {
          background: #0d1117;
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 4px;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #e6edf3;
          overflow-x: auto;
          line-height: 1.6;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default WP1Dashboard;
