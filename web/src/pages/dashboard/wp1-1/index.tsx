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
  ArrowUpOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { attackPoolApi } from '../../../services/api';
import type { AttackEntry, AttackPoolStats } from '../../../types';
import type { ColumnsType } from 'antd/es/table';
import '../dashboard.css';

const { Text, Paragraph } = Typography;

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

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      prompt_injection: '#cc4e1e',
      jailbreak: '#b91c1c',
      info_leakage: '#3b5068',
      multimodal: '#7c3aed',
      dos: '#0891b2',
      agent_hijack: '#c4860a',
    };
    return colors[category] || '#7a7774';
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
            background: 'var(--dash-terra-lt)',
            border: '1px solid rgba(204, 78, 30, 0.2)',
            color: 'var(--dash-terra)',
            fontFamily: "var(--dash-mono)",
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
          <Text strong style={{ color: 'var(--dash-ink)' }}>{name}</Text>
        </Tooltip>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => (
        <span
          className="dash-tag"
          style={{
            background: `${getCategoryColor(category)}15`,
            borderColor: `${getCategoryColor(category)}40`,
            color: getCategoryColor(category),
          }}
        >
          {category.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      title: '严重级别',
      dataIndex: ['metadata', 'severity_estimate'],
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
      title: '来源',
      dataIndex: ['source', 'type'],
      key: 'source',
      width: 100,
      render: (type: string) => (
        <Space>
          <span style={{ color: 'var(--dash-terra)' }}>{getSourceIcon(type)}</span>
          <Text style={{ color: 'var(--dash-ink-muted)', fontSize: 12 }}>{type.toUpperCase()}</Text>
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
                background: 'var(--dash-cream-border)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${eff * 100}%`,
                  height: '100%',
                  background: eff >= 0.6 ? 'var(--dash-green)' : eff >= 0.4 ? 'var(--dash-gold)' : 'var(--dash-red)',
                  borderRadius: 2,
                }}
              />
            </div>
            <Text
              style={{
                color: eff >= 0.6 ? 'var(--dash-green)' : eff >= 0.4 ? 'var(--dash-gold)' : 'var(--dash-ink-muted)',
                fontFamily: "var(--dash-mono)",
                fontSize: 11,
              }}
            >
              {(eff * 100).toFixed(0)}%
            </Text>
          </div>
        ) : (
          <Text style={{ color: 'var(--dash-ink-dim)' }}>-</Text>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusColors: Record<string, { bg: string; color: string }> = {
          active: { bg: 'var(--dash-green-lt)', color: 'var(--dash-green)' },
          tested: { bg: 'var(--dash-slate-lt)', color: 'var(--dash-slate)' },
          deprecated: { bg: 'var(--dash-cream-dark)', color: 'var(--dash-ink-dim)' },
        };
        const style = statusColors[status] || statusColors.deprecated;
        return (
          <span
            className="dash-tag"
            style={{
              background: style.bg,
              borderColor: 'transparent',
              color: style.color,
            }}
          >
            {status}
          </span>
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
          style={{ color: 'var(--dash-terra)' }}
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
    color: '#cc4e1e',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: '#cc4e1e',
        stroke: '#ffffff',
        lineWidth: 2,
      },
    },
    area: {
      style: {
        fill: 'l(270) 0:rgba(204, 78, 30, 0.05) 1:rgba(204, 78, 30, 0.3)',
      },
    },
    xAxis: {
      label: {
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
  };

  // 来源分布配置
  const sourceColors: Record<string, string> = {
    ARXIV: '#cc4e1e',      // 学术论文 - 橙红色
    GITHUB: '#3d3c3a',     // 代码仓库 - 深灰色
    CVE: '#b91c1c',        // CVE漏洞 - 红色
    NVD: '#c4860a',        // NVD数据库 - 金色
    BLOG: '#3b5068',       // 博客文章 - 蓝灰色
    DARKWEB: '#7c3aed',    // 暗网情报 - 紫色
    THREAT_API: '#2d6a4f', // 威胁API - 绿色
  };

  const sourceData = stats
    ? Object.entries(stats.by_source)
      .map(([type, value]) => ({
        type: type.toUpperCase(),
        value,
      }))
      .sort((a, b) => b.value - a.value) // 按数量降序排列
    : [];

  const sourceConfig = {
    data: sourceData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.85,
    color: (datum: { type: string }) => sourceColors[datum.type] || '#7a7774',
    label: {
      type: 'spider' as const,
      content: (datum: { type: string; value: number }) => `${datum.type}: ${datum.value}`,
      style: {
        fill: '#7a7774',
        fontSize: 10,
      },
    },
    legend: {
      position: 'right' as const,
      itemName: {
        style: {
          fill: '#3d3c3a',
          fontSize: 11,
        },
      },
    },
    tooltip: {
      formatter: (datum: { type: string; value: number }) => ({
        name: datum.type,
        value: `${datum.value} 条情报`,
      }),
    },
  };

  return (
    <div className="dashboard-page dash-fade-in">
      {/* 页面标题 */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <RadarChartOutlined className="dashboard-title-icon" />
          <h3>WP1-1 情报采集智能体</h3>
        </div>
        <div className="dashboard-subtitle">
          实时采集、整合、分析面向大模型的安全威胁情报
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#cc4e1e' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <RadarChartOutlined style={{ marginRight: 6 }} />
              攻击技术总数
            </div>
            <div className="dash-stat-value">{stats?.total || 0}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#b91c1c' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <WarningOutlined style={{ marginRight: 6 }} />
              严重级别
            </div>
            <div className="dash-stat-value">
              {stats?.by_severity.critical || 0}
              <span className="dash-stat-suffix">/ {stats?.by_severity.high || 0} 高</span>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#2d6a4f' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <SyncOutlined style={{ marginRight: 6 }} />
              今日新增
            </div>
            <div className="dash-stat-value">
              {stats?.recent_trend[stats.recent_trend.length - 1]?.count || 0}
            </div>
            <div className="dash-stat-trend up">
              <ArrowUpOutlined /> +15%
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="dash-stat-card" style={{ '--card-accent': '#3b5068' } as React.CSSProperties}>
            <div className="dash-stat-title">
              <GlobalOutlined style={{ marginRight: 6 }} />
              数据来源
            </div>
            <div className="dash-stat-value">
              {Object.keys(stats?.by_source || {}).length}
              <span className="dash-stat-suffix">个渠道</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">采集趋势 (近7天)</div>
            </div>
            <div className="dash-panel-body">
              <div className="dash-chart-container">
                {stats && <Line {...trendConfig} height={250} />}
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="dash-panel">
            <div className="dash-panel-header">
              <div className="dash-panel-title">来源分布</div>
            </div>
            <div className="dash-panel-body">
              <div className="dash-chart-container">
                {sourceData.length > 0 && <Pie {...sourceConfig} height={250} />}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 攻击列表 */}
      <div className="dash-panel">
        <div className="dash-panel-header">
          <div className="dash-panel-title">
            <ThunderboltOutlined className="dash-panel-title-icon" />
            攻击技术池
          </div>
          <div className="dash-panel-extra">
            <Space>
              <Input
                placeholder="搜索 ID 或名称"
                prefix={<SearchOutlined style={{ color: 'var(--dash-ink-dim)' }} />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="类别筛选"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: 160 }}
                allowClear
              >
                <Select.Option value="prompt_injection">Prompt Injection</Select.Option>
                <Select.Option value="jailbreak">Jailbreak</Select.Option>
                <Select.Option value="info_leakage">Info Leakage</Select.Option>
                <Select.Option value="multimodal">Multimodal</Select.Option>
                <Select.Option value="dos">DoS</Select.Option>
                <Select.Option value="agent_hijack">Agent Hijack</Select.Option>
              </Select>
            </Space>
          </div>
        </div>
        <div className="dash-panel-body">
          <Table
            columns={columns}
            dataSource={filteredAttacks}
            rowKey="attack_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => (
                <Text style={{ color: 'var(--dash-ink-muted)', fontSize: 12 }}>
                  共 {total} 条记录
                </Text>
              ),
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <RadarChartOutlined style={{ color: 'var(--dash-terra)' }} />
            <span style={{ color: 'var(--dash-ink)' }}>
              {selectedAttack?.attack_template.name || '攻击详情'}
            </span>
          </Space>
        }
        placement="right"
        width={680}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedAttack && (
          <div>
            <Descriptions
              column={1}
              bordered
              size="small"
            >
              <Descriptions.Item label="攻击 ID">
                <Text
                  code
                  style={{
                    background: 'var(--dash-terra-lt)',
                    border: '1px solid rgba(204, 78, 30, 0.2)',
                    color: 'var(--dash-terra)',
                  }}
                >
                  {selectedAttack.attack_id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="STIX 类型">
                <Text style={{ color: 'var(--dash-ink-muted)' }}>{selectedAttack.stix_type}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="类别">
                <Space>
                  <Tag color={getCategoryColor(selectedAttack.category)}>
                    {selectedAttack.category}
                  </Tag>
                  <Tag style={{ background: 'var(--dash-cream-dark)', color: 'var(--dash-ink-muted)', border: 'none' }}>
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
                <Tag style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: 'none' }}>
                  {selectedAttack.attack_template.modality.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标类型">
                {selectedAttack.metadata.target_type.map(t => (
                  <Tag key={t} style={{ background: 'var(--dash-cream-dark)', color: 'var(--dash-ink-muted)', marginRight: 4, border: 'none' }}>
                    {t}
                  </Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 24, color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)' }}>
              攻击描述
            </h4>
            <Paragraph style={{ color: 'var(--dash-ink-muted)' }}>
              {selectedAttack.attack_template.description}
            </Paragraph>

            <h4 style={{ marginTop: 24, color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)' }}>
              Payload 模板
            </h4>
            <pre className="dash-code-block">
              {selectedAttack.attack_template.payload_template}
            </pre>

            <h4 style={{ marginTop: 24, color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)' }}>
              变量说明
            </h4>
            <Descriptions
              column={1}
              bordered
              size="small"
            >
              {Object.entries(selectedAttack.attack_template.variables).map(([key, value]) => (
                <Descriptions.Item
                  key={key}
                  label={
                    <Text code style={{ color: 'var(--dash-terra)', background: 'transparent' }}>
                      {`{${key}}`}
                    </Text>
                  }
                >
                  {value}
                </Descriptions.Item>
              ))}
            </Descriptions>

            <h4 style={{ marginTop: 24, color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)' }}>
              变异提示
            </h4>
            <Space wrap>
              {selectedAttack.attack_template.mutation_hints.map((hint, index) => (
                <Tag
                  key={index}
                  style={{
                    background: 'var(--dash-terra-lt)',
                    border: '1px solid rgba(204, 78, 30, 0.25)',
                    color: 'var(--dash-terra)',
                  }}
                >
                  {hint}
                </Tag>
              ))}
            </Space>

            <h4 style={{ marginTop: 24, color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)' }}>
              MITRE ATT&CK 映射
            </h4>
            <Descriptions
              column={2}
              bordered
              size="small"
            >
              <Descriptions.Item label="战术">
                {selectedAttack.mitre_mapping.tactic}
              </Descriptions.Item>
              <Descriptions.Item label="技术">
                {selectedAttack.mitre_mapping.technique}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 24, color: 'var(--dash-ink)', fontFamily: 'var(--dash-serif)' }}>
              来源信息
            </h4>
            <Descriptions
              column={1}
              bordered
              size="small"
            >
              <Descriptions.Item label="来源类型">
                <Space>
                  <span style={{ color: 'var(--dash-terra)' }}>{getSourceIcon(selectedAttack.source.type)}</span>
                  <Text style={{ color: 'var(--dash-ink-muted)' }}>{selectedAttack.source.type.toUpperCase()}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="来源 URL">
                <a
                  href={selectedAttack.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--dash-terra)' }}
                >
                  {selectedAttack.source.url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="采集时间">
                <Text style={{ fontFamily: "var(--dash-mono)", color: 'var(--dash-ink-muted)' }}>
                  {new Date(selectedAttack.source.crawl_time).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                <Tag color={selectedAttack.source.confidence === 'high' ? '#2d6a4f' : '#c4860a'}>
                  {selectedAttack.source.confidence.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default WP1Dashboard;
