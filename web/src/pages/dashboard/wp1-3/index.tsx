import React from 'react';
import { Result, Card, Row, Col, Typography, Tag, Space, Timeline } from 'antd';
import {
  ExperimentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const WP3Dashboard: React.FC = () => {
  const features = [
    {
      icon: <CloudServerOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: 'Env Manager',
      desc: 'Docker 沙盒创建/销毁，部署目标模型仿真',
    },
    {
      icon: <CodeOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: 'Payload Mutator',
      desc: '基于成功载荷生成变体（同义替换、编码变换）',
    },
    {
      icon: <ExperimentOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: 'Sandboxed Executor',
      desc: '在隔离容器中执行攻击，确保不影响外部环境',
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      title: 'Data Collector',
      desc: '采集 PCAP/系统日志/内存状态/交互记录',
    },
  ];

  const timeline = [
    { label: '环境准备', status: 'pending' },
    { label: '变异生成', status: 'pending' },
    { label: '隔离执行', status: 'pending' },
    { label: '全链路采集', status: 'pending' },
    { label: '自动标注', status: 'pending' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          <ExperimentOutlined style={{ marginRight: 8, color: '#722ed1' }} />
          WP1-3 沙盒模拟智能体
        </Title>
        <Text type="secondary">
          提供安全隔离环境，执行攻击脚本，采集多维度异常数据
        </Text>
      </div>

      <Result
        icon={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
        title="Coming Soon - 第二阶段开发中"
        subTitle="WP1-3 沙盒模拟智能体将在第二阶段（3.8 ~ 3.14）实现"
        extra={
          <Space>
            <Tag color="purple">Pipeline 架构</Tag>
            <Tag color="purple">Docker 隔离</Tag>
            <Tag color="purple">自动标注</Tag>
          </Space>
        }
      />

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24} lg={14}>
          <Card title="核心模块" bordered={false}>
            <Row gutter={[16, 16]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} key={index}>
                  <Card size="small" style={{ height: '100%' }}>
                    <Space align="start">
                      {feature.icon}
                      <div>
                        <Text strong>{feature.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {feature.desc}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Pipeline 流程" bordered={false}>
            <Timeline
              items={timeline.map(item => ({
                color: 'gray',
                dot: <ClockCircleOutlined />,
                children: (
                  <Space>
                    <Text>{item.label}</Text>
                    <Tag>待开发</Tag>
                  </Space>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Card title="预期产出" style={{ marginTop: 24 }} bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <Text strong>labeled_data/</Text>
                <Text type="secondary">标注数据集 (JSONL)</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Text strong>pcap/</Text>
                <Text type="secondary">网络流量 PCAP 文件</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#e3f2fd', borderColor: '#90caf9' }}>
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#7BA4D4' }} />
                <Text strong>syslog/</Text>
                <Text type="secondary">系统日志集合</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default WP3Dashboard;
