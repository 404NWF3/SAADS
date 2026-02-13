import React from 'react';
import { Tooltip } from 'antd';
import './TechBadge.css';

export type TechCategory = 'architecture' | 'technology' | 'capability';

export interface TechBadgeProps {
  title: string;
  description?: string;
  category: TechCategory;
  icon?: string;
  color?: string;
}

const categoryIcons: Record<TechCategory, string> = {
  architecture: '🏗️',
  technology: '⚙️',
  capability: '✨',
};

const categoryColors: Record<TechCategory, string> = {
  architecture: '#2D3E8C',
  technology: '#B5600A',
  capability: '#1A6B5A',
};

export const TechBadge: React.FC<TechBadgeProps> = ({
  title,
  description,
  category,
  icon,
  color,
}) => {
  const badgeIcon = icon || categoryIcons[category];
  const badgeColor = color || categoryColors[category];

  const badge = (
    <div
      className={`tech-badge tech-badge-${category}`}
      style={{ '--badge-color': badgeColor } as React.CSSProperties}
    >
      <span className="tech-badge-icon">{badgeIcon}</span>
      <span className="tech-badge-title">{title}</span>
    </div>
  );

  if (description) {
    return (
      <Tooltip title={description} placement="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default TechBadge;
