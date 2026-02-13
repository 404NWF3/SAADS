import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { DashboardLayout } from './components/layout';
import HomePage from './pages/home';
import DashboardOverview from './pages/dashboard';
import WP1Dashboard from './pages/dashboard/wp1-1';
import WP2Dashboard from './pages/dashboard/wp1-2';
import WP3Dashboard from './pages/dashboard/wp1-3';
import WP4Dashboard from './pages/dashboard/wp1-4';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          // ==================== Anthropic 理性人文主义 - 纸张感浅色主题 ====================
          colorPrimary: '#C1440E',          // 主色 - 深橘红 (与 FourAgent 一致)
          colorBgBase: '#FAF9F5',           // 基础背景 - 温暖米白
          colorBgContainer: '#FFFFFF',      // 容器背景 - 纯白
          colorBgElevated: '#FFFFFF',       // 悬浮背景
          colorBorder: 'rgba(26, 24, 20, 0.14)',           // 主边框 - 精密感
          colorBorderSecondary: 'rgba(26, 24, 20, 0.1)',   // 次级边框
          colorText: '#1A1818',             // 主文字 - 深炭黑
          colorTextSecondary: '#5A5955',    // 次级文字
          colorTextTertiary: '#87867F',     // 三级文字
          colorLink: '#C1440E',             // 链接色
          colorSuccess: '#1A6B5A',          // 成功色 - 青绿
          colorWarning: '#B5600A',          // 警告色 - 琥珀
          colorError: '#C17567',            // 错误色 - 柔和红
          colorInfo: '#2D3E8C',             // 信息色 - 深蓝
          borderRadius: 6,                  // 基础圆角
          fontFamily: "'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          // ==================== Layout 布局 ====================
          Layout: {
            headerBg: '#FAF9F5',
            bodyBg: '#FAF9F5',
            siderBg: '#FFFFFF',
          },
          // ==================== Menu 菜单 ====================
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: 'rgba(193, 68, 14, 0.08)',
            itemHoverBg: 'rgba(193, 68, 14, 0.04)',
            itemColor: '#5A5955',
            itemSelectedColor: '#C1440E',
            itemActiveBg: 'rgba(193, 68, 14, 0.08)',
          },
          // ==================== Card 卡片 ====================
          Card: {
            colorBgContainer: '#FFFFFF',
            colorBorderSecondary: 'rgba(26, 24, 20, 0.14)',
            borderRadiusLG: 6,
            boxShadow: '0 1px 3px rgba(20, 20, 19, 0.08), 0 0 0 1px rgba(26, 24, 20, 0.04)',
          },
          // ==================== Table 表格 ====================
          Table: {
            colorBgContainer: '#FFFFFF',
            headerBg: '#F2F0E9',
            rowHoverBg: 'rgba(193, 68, 14, 0.04)',
            borderColor: 'rgba(26, 24, 20, 0.14)',
            fontFamily: "'Lora', Georgia, serif",
          },
          // ==================== Button 按钮 ====================
          Button: {
            borderRadius: 4,
            controlHeight: 40,
            paddingContentHorizontal: 20,
            primaryShadow: '0 1px 2px rgba(20, 20, 19, 0.08), 0 0 0 1px rgba(26, 24, 20, 0.18)',
            fontWeight: 600,
          },
          // ==================== Tag 标签 ====================
          Tag: {
            borderRadiusSM: 4,
            fontFamily: "'Fira Code', monospace",
          },
          // ==================== Input 输入框 ====================
          Input: {
            colorBgContainer: '#FFFFFF',
            activeBorderColor: '#C1440E',
            hoverBorderColor: 'rgba(26, 24, 20, 0.2)',
          },
          // ==================== Select 选择器 ====================
          Select: {
            colorBgContainer: '#FFFFFF',
          },
          // ==================== Modal 弹窗 ====================
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            borderRadiusLG: 6,
          },
          // ==================== Drawer 抽屉 ====================
          Drawer: {
            colorBgElevated: '#FFFFFF',
          },
          // ==================== Typography 排版 ====================
          Typography: {
            fontFamilyCode: "'Fira Code', monospace",
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* 首页 - 项目介绍展示页 */}
          <Route path="/" element={<HomePage />} />

          {/* Dashboard - 仪表盘 */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="wp1-1" element={<WP1Dashboard />} />
            <Route path="wp1-2" element={<WP2Dashboard />} />
            <Route path="wp1-3" element={<WP3Dashboard />} />
            <Route path="wp1-4" element={<WP4Dashboard />} />
          </Route>

          {/* 其他路径重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
