import React from 'react';
import { Result, Card, Row, Col, Typography, Tag, Space, Timeline, Progress } from 'antd';
import {
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  LineChartOutlined,
  DeploymentUnitOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const WP4Dashboard: React.FC = () => {
  const features = [
    {
      icon: <RobotOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: 'Meta-Learning Selector',
      desc: '元学习选择器，自动推荐最优模型',
    },
    {
      icon: <LineChartOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: 'Trainer',
      desc: '支持 RF/XGBoost/CNN/Transformer/GAN',
    },
    {
      icon: <BulbOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: 'Evaluator',
      desc: 'F1/AUC/误报率评估 + SHAP 可解释性',
    },
    {
      icon: <DeploymentUnitOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      title: 'Deployer',
      desc: '导出模型，部署为 API 防火墙',
    },
  ];

  const timeline = [
    { label: '数据加载 + 特征工程', status: 'pending' },
    { label: '元学习模型选择', status: 'pending' },
    { label: '模型训练', status: 'pending' },
    { label: '评估 + 可解释性分析', status: 'pending' },
    { label: '部署防火墙', status: 'pending' },
  ];

  const modelCandidates = [
    { name: 'Random Forest', type: '传统 ML' },
    { name: 'XGBoost', type: '传统 ML' },
    { name: 'CNN', type: '深度学习' },
    { name: 'Transformer', type: '深度学习' },
    { name: 'Deeplog', type: '日志检测' },
    { name: 'WGAN-GP', type: 'GAN 异常检测' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          WP1-4 入侵检测算法模型智能体
        </Title>
        <Text type="secondary">
          利用异常数据训练检测模型，实现威胁检测能力，形成可部署的防火墙
        </Text>
      </div>

      <Result
        icon={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
        title="Coming Soon - 第二阶段开发中"
        subTitle="WP1-4 入侵检测智能体将在第二阶段（3.15 ~ 3.21）实现"
        extra={
          <Space>
            <Tag color="green">元学习选模型</Tag>
            <Tag color="green">GAN 检测</Tag>
            <Tag color="green">SHAP 可解释</Tag>
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

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="候选模型池" bordered={false}>
            <Row gutter={[8, 8]}>
              {modelCandidates.map((model, index) => (
                <Col xs={12} sm={8} key={index}>
                  <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                    <Text strong>{model.name}</Text>
                    <br />
                    <Tag color="green" style={{ marginTop: 4 }}>
                      {model.type}
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="评估指标 (预览)" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>F1 Score</Text>
                <Progress percent={0} status="active" strokeColor="#52c41a" />
              </div>
              <div>
                <Text>AUC</Text>
                <Progress percent={0} status="active" strokeColor="#1890ff" />
              </div>
              <div>
                <Text>Precision</Text>
                <Progress percent={0} status="active" strokeColor="#722ed1" />
              </div>
              <div>
                <Text>Recall</Text>
                <Progress percent={0} status="active" strokeColor="#7BA4D4" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="预期产出" style={{ marginTop: 24 }} bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <Text strong>训练好的检测模型</Text>
                <Text type="secondary">支持多种模型架构</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Text strong>模型评估报告</Text>
                <Text type="secondary">含 SHAP 可解释性分析</Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#e3f2fd', borderColor: '#90caf9' }}>
              <Space direction="vertical">
                <CheckCircleOutlined style={{ fontSize: 24, color: '#7BA4D4' }} />
                <Text strong>API 防火墙服务</Text>
                <Text type="secondary">可直接部署使用</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default WP4Dashboard;
