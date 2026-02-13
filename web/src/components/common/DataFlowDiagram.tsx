import React, { useState } from 'react';
import { Collapse } from 'antd';
import './DataFlowDiagram.css';

const { Panel } = Collapse;

export interface DataFlowProps {
  inputFormat: string;
  outputFormat: string;
  keyFields: string[];
  color: string;
  inputExample?: string;
  outputExample?: string;
}

export const DataFlowDiagram: React.FC<DataFlowProps> = ({
  inputFormat,
  outputFormat,
  keyFields,
  color,
  inputExample,
  outputExample,
}) => {
  const [activeKey, setActiveKey] = useState<string | string[]>([]);

  return (
    <div className="data-flow-diagram">
      <svg
        className="data-flow-svg"
        viewBox="0 0 500 140"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id={`flow-arrow-${color.replace('#', '')}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <polygon points="0,0 8,4 0,8" fill={color} opacity="0.8" />
          </marker>
          <linearGradient id={`input-grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
          </linearGradient>
          <linearGradient id={`output-grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.08 }} />
          </linearGradient>
          <filter id={`shadow-${color.replace('#', '')}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Input Box */}
        <g filter={`url(#shadow-${color.replace('#', '')})`}>
          <rect
            x="10"
            y="35"
            width="140"
            height="70"
            rx="8"
            fill={`url(#input-grad-${color.replace('#', '')})`}
            stroke={color}
            strokeWidth="2"
          />
          <rect
            x="10"
            y="35"
            width="140"
            height="70"
            rx="8"
            fill="white"
            fillOpacity="0.9"
          />
          <rect
            x="10"
            y="35"
            width="140"
            height="70"
            rx="8"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
          <text x="80" y="58" textAnchor="middle" className="flow-label" fill={color}>
            输入
          </text>
          <text x="80" y="80" textAnchor="middle" className="flow-format" fill="var(--text-primary)">
            {inputFormat}
          </text>
        </g>

        {/* Arrow with animation */}
        <line
          x1="160"
          y1="70"
          x2="210"
          y2="70"
          stroke={color}
          strokeWidth="2.5"
          strokeOpacity="0.6"
          markerEnd={`url(#flow-arrow-${color.replace('#', '')})`}
        />
        <circle r="4" fill={color} fillOpacity="0.8">
          <animateMotion dur="2s" repeatCount="indefinite" path="M160,70 L210,70" />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Transform Box */}
        <g>
          <rect
            x="220"
            y="45"
            width="60"
            height="50"
            rx="6"
            fill={color}
            fillOpacity="0.12"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text x="250" y="75" textAnchor="middle" className="flow-transform" fill={color}>
            转换
          </text>
        </g>

        {/* Arrow with animation */}
        <line
          x1="290"
          y1="70"
          x2="340"
          y2="70"
          stroke={color}
          strokeWidth="2.5"
          strokeOpacity="0.6"
          markerEnd={`url(#flow-arrow-${color.replace('#', '')})`}
        />
        <circle r="4" fill={color} fillOpacity="0.8">
          <animateMotion dur="2s" repeatCount="indefinite" begin="1s" path="M290,70 L340,70" />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur="2s"
            repeatCount="indefinite"
            begin="1s"
          />
        </circle>

        {/* Output Box */}
        <g filter={`url(#shadow-${color.replace('#', '')})`}>
          <rect
            x="350"
            y="35"
            width="140"
            height="70"
            rx="8"
            fill={`url(#output-grad-${color.replace('#', '')})`}
            stroke={color}
            strokeWidth="2"
          />
          <rect
            x="350"
            y="35"
            width="140"
            height="70"
            rx="8"
            fill="white"
            fillOpacity="0.85"
          />
          <rect
            x="350"
            y="35"
            width="140"
            height="70"
            rx="8"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
          <text x="420" y="58" textAnchor="middle" className="flow-label" fill={color}>
            输出
          </text>
          <text x="420" y="80" textAnchor="middle" className="flow-format" fill="var(--text-primary)">
            {outputFormat}
          </text>
        </g>
      </svg>

      {/* Key Fields */}
      <div className="key-fields" style={{ borderColor: color }}>
        <div className="key-fields-title" style={{ color }}>
          关键字段
        </div>
        <div className="key-fields-list">
          {keyFields.map((field, index) => (
            <code key={index} className="key-field" style={{ borderColor: color, color }}>
              {field}
            </code>
          ))}
        </div>
      </div>

      {/* Examples */}
      {(inputExample || outputExample) && (
        <Collapse
          activeKey={activeKey}
          onChange={setActiveKey}
          ghost
          className="data-examples"
        >
          {inputExample && (
            <Panel header="📥 输入示例" key="input">
              <pre className="example-code">{inputExample}</pre>
            </Panel>
          )}
          {outputExample && (
            <Panel header="📤 输出示例" key="output">
              <pre className="example-code">{outputExample}</pre>
            </Panel>
          )}
        </Collapse>
      )}
    </div>
  );
};

export default DataFlowDiagram;
