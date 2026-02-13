import React from 'react';
import { Tooltip } from 'antd';
import './AgentArchitecture.css';

export interface ArchitectureNode {
  name: string;
  role: string;
  tools?: string[];
}

export interface AgentArchitectureProps {
  type: 'supervisor' | 'pipeline';
  components: ArchitectureNode[];
  color: string;
  reason?: string;
}

export const AgentArchitecture: React.FC<AgentArchitectureProps> = ({
  type,
  components,
  color,
  reason,
}) => {
  if (type === 'supervisor') {
    return (
      <div className="agent-architecture">
        {reason && (
          <div className="architecture-reason" style={{ borderLeftColor: color }}>
            💡 {reason}
          </div>
        )}
        <svg
          className="architecture-svg supervisor-svg"
          viewBox="0 0 600 480"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id={`arrow-${color.replace('#', '')}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <polygon points="0,0 8,4 0,8" fill={color} opacity="0.7" />
            </marker>
            <filter id={`glow-${color.replace('#', '')}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>

          {/* Background Circle */}
          <circle
            cx="300"
            cy="200"
            r="160"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.1"
            strokeDasharray="5 5"
          />

          {/* Central Supervisor Node */}
          <g className="arch-node supervisor-node">
            <circle cx="300" cy="200" r="50" fill={`url(#grad-${color.replace('#', '')})`} />
            <circle
              cx="300"
              cy="200"
              r="50"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              filter={`url(#glow-${color.replace('#', '')})`}
            />
            <circle cx="300" cy="200" r="42" fill="white" stroke={color} strokeWidth="1.5" />
            <text x="300" y="205" textAnchor="middle" className="node-text" fill={color}>
              {components[0]?.name || 'Supervisor'}
            </text>
          </g>

          {/* Sub-Agent Nodes */}
          {components.slice(1).map((comp, index) => {
            const total = components.length - 1;
            const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
            const radius = 145;
            const x = 300 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);

            return (
              <g key={index} className="arch-node sub-agent-node">
                {/* Connection Line */}
                <line
                  x1="300"
                  y1="200"
                  x2={x}
                  y2={y}
                  stroke={color}
                  strokeWidth="2"
                  strokeOpacity="0.25"
                  strokeDasharray="6 4"
                  markerEnd={`url(#arrow-${color.replace('#', '')})`}
                />

                {/* Node Circle */}
                <Tooltip title={comp.tools?.join(', ')}>
                  <g>
                    <circle cx={x} cy={y} r="38" fill={color} fillOpacity="0.08" />
                    <circle cx={x} cy={y} r="38" fill="white" stroke={color} strokeWidth="2" />
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      className="node-text-small"
                      fill="var(--text-primary)"
                    >
                      {comp.name}
                    </text>
                    {/* Role text below node */}
                    <text
                      x={x}
                      y={y + 55}
                      textAnchor="middle"
                      className="node-role-text"
                      fill="var(--text-secondary)"
                      style={{ fontSize: '11px', fontWeight: 400 }}
                    >
                      {comp.role}
                    </text>
                  </g>
                </Tooltip>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Pipeline Architecture
  return (
    <div className="agent-architecture">
      {reason && (
        <div className="architecture-reason" style={{ borderLeftColor: color }}>
          💡 {reason}
        </div>
      )}
      <svg
        className="architecture-svg pipeline-svg"
        viewBox="0 0 600 260"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id={`arrow-${color.replace('#', '')}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <polygon points="0,0 8,4 0,8" fill={color} opacity="0.7" />
          </marker>
          <linearGradient id={`grad-pipe-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
          </linearGradient>
        </defs>

        {/* Pipeline Background */}
        <rect
          x="10"
          y="50"
          width="580"
          height="100"
          rx="8"
          fill={`url(#grad-pipe-${color.replace('#', '')})`}
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.2"
          strokeDasharray="5 5"
        />

        {/* Pipeline Nodes */}
        {components.map((comp, index) => {
          const spacing = 520 / (components.length - 1 || 1);
          const x = 40 + index * spacing;
          const y = 100;

          return (
            <g key={index} className="arch-node pipeline-node">
              {/* Connection Arrow */}
              {index > 0 && (
                <line
                  x1={40 + (index - 1) * spacing + 55}
                  y1={y}
                  x2={x - 15}
                  y2={y}
                  stroke={color}
                  strokeWidth="2.5"
                  strokeOpacity="0.4"
                  markerEnd={`url(#arrow-${color.replace('#', '')})`}
                />
              )}

              {/* Node Rectangle */}
              <Tooltip title={comp.tools?.join(', ')}>
                <g>
                  <rect
                    x={x - 50}
                    y={y - 30}
                    width="100"
                    height="60"
                    rx="6"
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                  />
                  <rect
                    x={x - 50}
                    y={y - 30}
                    width="100"
                    height="60"
                    rx="6"
                    fill={color}
                    fillOpacity="0.05"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="node-text-small"
                    fill="var(--text-primary)"
                  >
                    {comp.name}
                  </text>
                  {/* Role text below node */}
                  <text
                    x={x}
                    y={y + 85}
                    textAnchor="middle"
                    className="node-role-text"
                    fill="var(--text-secondary)"
                    style={{ fontSize: '11px', fontWeight: 400 }}
                  >
                    {comp.role}
                  </text>
                </g>
              </Tooltip>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default AgentArchitecture;
