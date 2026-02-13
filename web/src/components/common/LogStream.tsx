import React, { useState, useEffect, useRef } from 'react';
import { Typography, Tag, Space } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BugOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  agent?: string;
  message: string;
}

interface LogStreamProps {
  logs: LogEntry[];
  maxHeight?: number;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  typewriterEffect?: boolean;
}

/**
 * 实时日志流组件 - 显示 Agent 工作日志
 */
const LogStream: React.FC<LogStreamProps> = ({
  logs,
  maxHeight = 400,
  autoScroll = true,
  showTimestamp = true,
  typewriterEffect = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedLogs, setDisplayedLogs] = useState<LogEntry[]>([]);
  const [typingIndex, setTypingIndex] = useState(-1);
  const [typingText, setTypingText] = useState('');

  // 处理打字机效果
  useEffect(() => {
    if (!typewriterEffect) {
      setDisplayedLogs(logs);
      return;
    }

    if (logs.length > displayedLogs.length) {
      const newLog = logs[displayedLogs.length];
      setTypingIndex(displayedLogs.length);
      setTypingText('');

      let charIndex = 0;
      const timer = setInterval(() => {
        if (charIndex < newLog.message.length) {
          setTypingText(newLog.message.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(timer);
          setDisplayedLogs(prev => [...prev, newLog]);
          setTypingIndex(-1);
        }
      }, 15);

      return () => clearInterval(timer);
    }
  }, [logs, displayedLogs.length, typewriterEffect]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedLogs, typingText, autoScroll]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#7BA4D4' }} />;
      case 'error':
        return <BugOutlined style={{ color: '#ef4444' }} />;
      case 'debug':
        return <LoadingOutlined style={{ color: '#6366f1' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#3b82f6' }} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#7BA4D4';
      case 'error':
        return '#ef4444';
      case 'debug':
        return '#6366f1';
      default:
        return '#3b82f6';
    }
  };

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'WP1-1': 'blue',
      'WP1-2': 'red',
      'WP1-3': 'purple',
      'WP1-4': 'green',
      'System': 'default',
    };
    return colors[agent] || 'default';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight,
        overflowY: 'auto',
        background: '#0d1117',
        borderRadius: '4px',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        lineHeight: 1.8,
      }}
    >
      {displayedLogs.map((log, index) => (
        <div
          key={log.id}
          style={{
            marginBottom: '8px',
            opacity: index === displayedLogs.length - 1 && typingIndex === -1 ? 1 : 0.9,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <Space size={8} align="start">
            {showTimestamp && (
              <Text style={{ color: '#525252', fontSize: '12px' }}>
                {formatTimestamp(log.timestamp)}
              </Text>
            )}
            {getLevelIcon(log.level)}
            {log.agent && (
              <Tag
                color={getAgentColor(log.agent)}
                style={{ fontSize: '11px', padding: '0 6px' }}
              >
                {log.agent}
              </Tag>
            )}
            <Text style={{ color: getLevelColor(log.level) }}>
              {log.message}
            </Text>
          </Space>
        </div>
      ))}
      
      {/* 正在输入的日志 */}
      {typingIndex >= 0 && logs[typingIndex] && (
        <div style={{ marginBottom: '8px' }}>
          <Space size={8} align="start">
            {showTimestamp && (
              <Text style={{ color: '#525252', fontSize: '12px' }}>
                {formatTimestamp(logs[typingIndex].timestamp)}
              </Text>
            )}
            {getLevelIcon(logs[typingIndex].level)}
            {logs[typingIndex].agent && (
              <Tag
                color={getAgentColor(logs[typingIndex].agent)}
                style={{ fontSize: '11px', padding: '0 6px' }}
              >
                {logs[typingIndex].agent}
              </Tag>
            )}
            <Text style={{ color: getLevelColor(logs[typingIndex].level) }}>
              {typingText}
              <span className="typewriter-cursor" />
            </Text>
          </Space>
        </div>
      )}
    </div>
  );
};

export default LogStream;
