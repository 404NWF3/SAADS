import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Badge } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  RadarChartOutlined,
  BugOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GithubOutlined,
  BellOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '总览',
    },
    {
      key: '/dashboard/wp1-1',
      icon: <RadarChartOutlined />,
      label: 'WP1-1 情报采集',
    },
    {
      key: '/dashboard/wp1-2',
      icon: <BugOutlined />,
      label: 'WP1-2 对抗检测',
    },
    {
      key: '/dashboard/wp1-3',
      icon: <ExperimentOutlined />,
      label: 'WP1-3 沙盒模拟',
    },
    {
      key: '/dashboard/wp1-4',
      icon: <SafetyCertificateOutlined />,
      label: 'WP1-4 入侵检测',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, var(--dashboard-bg-secondary) 0%, var(--dashboard-bg-primary) 100%)',
          borderRight: '1px solid var(--dashboard-border)',
        }}
        width={260}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid var(--dashboard-border)',
            background: 'var(--dashboard-bg-elevated)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--dashboard-accent) 0%, var(--dashboard-accent-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--dashboard-glow)',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 20, color: '#fff' }} />
          </div>
          {!collapsed && (
            <div style={{ marginLeft: 12 }}>
              <Text
                style={{
                  color: '#f5f5f5',
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '0.5px',
                }}
              >
                LLM Security
              </Text>
              <div>
                <Text
                  style={{
                    color: '#6366f1',
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  v1.0.0-beta
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 0,
            marginTop: 8,
          }}
        />

        {/* 底部状态指示 */}
        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 20,
              padding: '12px 16px',
              background: 'var(--dashboard-bg-elevated)',
              border: '1px solid var(--dashboard-border)',
              borderRadius: '4px',
            }}
          >
            <Space size={8}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <Text style={{ color: '#a3a3a3', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                System Online
              </Text>
            </Space>
          </div>
        )}
      </Sider>

      {/* 主内容区 */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'all 0.2s ease',
          background: 'var(--dashboard-bg-primary)',
        }}
      >
        {/* 顶部导航栏 */}
        <Header
          className="blueprint-grid"
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--dashboard-border)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(10px)',
            background: 'var(--dashboard-bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 16,
                width: 48,
                height: 48,
                color: '#a3a3a3',
              }}
            />
            <div style={{ marginLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#f5f5f5',
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1,
                  textAlign: 'center',
                }}
              >
                Multi-Agent LLM Security Awareness System
              </Text>
            </div>
          </div>

          <Space size={12}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: '#a3a3a3' }}
              />
            </Badge>
            <Button
              type="text"
              icon={<SettingOutlined />}
              style={{ color: '#a3a3a3' }}
            />
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{ color: '#a3a3a3' }}
            >
              首页
            </Button>
            <Button
              type="text"
              icon={<GithubOutlined />}
              href="https://github.com"
              target="_blank"
              style={{ color: '#a3a3a3' }}
            >
              GitHub
            </Button>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          className="blueprint-grid"
          style={{
            margin: 0,
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: 'var(--dashboard-bg-primary)',
          }}
        >
          <div
            style={{
              background: 'var(--dashboard-bg-secondary)',
              border: '1px solid var(--dashboard-border)',
              borderRadius: '4px',
              padding: 24,
              minHeight: 'calc(100vh - 64px - 48px)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* 全局样式覆盖 */}
      <style>{`
        /* Ant Design Menu 暗色主题覆盖 */
        .ant-menu-dark {
          background: transparent !important;
        }
        .ant-menu-dark .ant-menu-item {
          margin: 4px 12px !important;
          border-radius: 4px !important;
          color: #a3a3a3 !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 13px !important;
        }
        .ant-menu-dark .ant-menu-item:hover {
          background: var(--dashboard-bg-elevated) !important;
          color: #f5f5f5 !important;
        }
        .ant-menu-dark .ant-menu-item-selected {
          background: var(--dashboard-bg-elevated) !important;
          color: var(--dashboard-accent) !important;
          border-left: 3px solid var(--dashboard-accent) !important;
        }
        .ant-menu-dark .ant-menu-item-selected::after {
          display: none !important;
        }
        .ant-menu-dark .ant-menu-item .anticon {
          font-size: 16px !important;
        }
        
        /* Badge 样式 */
        .ant-badge .ant-badge-count {
          background: var(--dashboard-accent) !important;
          box-shadow: 0 0 10px var(--dashboard-glow) !important;
        }

        /* Button 悬停效果 */
        .ant-btn-text:hover {
          background: var(--dashboard-bg-elevated) !important;
          color: var(--dashboard-accent) !important;
        }
      `}</style>
    </Layout>
  );
};

export default DashboardLayout;
