import React from 'react';
import { Card } from 'antd';
import type { CardProps } from 'antd';

interface GlowCardProps extends CardProps {
  glowColor?: 'primary' | 'danger' | 'warning' | 'success';
  enableGlow?: boolean;
  children: React.ReactNode;
}

/**
 * 流光特效卡片 - GitHub 风格蓝紫色流光
 */
const GlowCard: React.FC<GlowCardProps> = ({
  glowColor = 'primary',
  enableGlow = true,
  children,
  className = '',
  style,
  ...props
}) => {
  const glowColors = {
    primary: 'rgba(99, 102, 241, 0.3)',
    danger: 'rgba(239, 68, 68, 0.3)',
    warning: 'rgba(245, 158, 11, 0.3)',
    success: 'rgba(16, 185, 129, 0.3)',
  };

  const borderColors = {
    primary: 'rgba(99, 102, 241, 0.2)',
    danger: 'rgba(239, 68, 68, 0.2)',
    warning: 'rgba(245, 158, 11, 0.2)',
    success: 'rgba(16, 185, 129, 0.2)',
  };

  const cardStyle: React.CSSProperties = {
    background: '#242424',
    border: `1px solid ${borderColors[glowColor]}`,
    borderRadius: '4px',
    boxShadow: 'inset 0 0 20px rgba(99, 102, 241, 0.05)',
    transition: 'all 0.25s ease',
    ...style,
  };

  const glowStyle = enableGlow ? `
    .glow-card-${glowColor} {
      position: relative;
      overflow: hidden;
    }
    .glow-card-${glowColor}::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        ${glowColors[glowColor]} 50%,
        rgba(168, 85, 247, 0.3) 60%,
        transparent 70%
      );
      animation: shimmer 3s infinite;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1;
    }
    .glow-card-${glowColor}:hover::before {
      opacity: 1;
    }
    .glow-card-${glowColor}:hover {
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
    }
    .glow-card-${glowColor} .ant-card-body {
      position: relative;
      z-index: 2;
    }
  ` : '';

  return (
    <>
      {enableGlow && <style>{glowStyle}</style>}
      <Card
        className={`anthropic-card ${enableGlow ? `glow-card-${glowColor}` : ''} ${className}`}
        style={cardStyle}
        {...props}
      >
        {children}
      </Card>
    </>
  );
};

export default GlowCard;
