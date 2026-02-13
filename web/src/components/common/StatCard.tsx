import React, { useState, useEffect, useRef } from 'react';
import { Typography, Space } from 'antd';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
  animate?: boolean;
  glowColor?: 'primary' | 'danger' | 'warning' | 'success';
}

/**
 * 统计卡片组件 - Anthropic 风格
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  icon,
  trend,
  color = '#6366f1',
  animate = true,
  glowColor = 'primary',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  // 数字滚动动画
  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const duration = 1500; // 动画持续时间
    const startValue = displayValue;
    const diff = value - startValue;

    const animateValue = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // 使用 easeOutQuart 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + diff * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateValue);
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animateValue);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animate]);

  const glowColors = {
    primary: 'rgba(99, 102, 241, 0.2)',
    danger: 'rgba(239, 68, 68, 0.2)',
    warning: 'rgba(245, 158, 11, 0.2)',
    success: 'rgba(16, 185, 129, 0.2)',
  };

  return (
    <div
      className="lift-on-hover glow-effect"
      style={{
        background: '#242424',
        border: `1px solid ${glowColors[glowColor]}`,
        borderRadius: '4px',
        padding: '20px',
        boxShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.05)',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 顶部标题行 */}
      <div style={{ marginBottom: '12px' }}>
        <Space size={8}>
          {icon && (
            <span style={{ color, fontSize: '16px' }}>
              {icon}
            </span>
          )}
          <Text style={{ color: '#a3a3a3', fontSize: '14px' }}>
            {title}
          </Text>
        </Space>
      </div>

      {/* 数值显示 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        {prefix && (
          <span style={{ color, fontSize: '20px' }}>
            {prefix}
          </span>
        )}
        <span
          className="stat-number"
          style={{
            color,
            fontSize: '32px',
            fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1,
          }}
        >
          {displayValue.toLocaleString()}
        </span>
        {suffix && (
          <span style={{ color: '#737373', fontSize: '14px', marginLeft: '4px' }}>
            {suffix}
          </span>
        )}
      </div>

      {/* 趋势指示 */}
      {trend && (
        <div style={{ marginTop: '12px' }}>
          <Space size={4}>
            <span
              style={{
                color: trend.isUp ? '#10b981' : '#ef4444',
                fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <Text style={{ color: '#525252', fontSize: '12px' }}>
              vs 昨日
            </Text>
          </Space>
        </div>
      )}

      {/* 底部装饰线 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
};

export default StatCard;
