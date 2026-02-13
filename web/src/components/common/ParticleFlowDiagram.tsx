import React, { useRef, useEffect, useState } from 'react';
import { Collapse } from 'antd';
import './ParticleFlowDiagram.css';

const { Panel } = Collapse;

export interface DataFlowProps {
  inputFormat: string;
  outputFormat: string;
  keyFields: string[];
  color: string;
  inputExample?: string;
  outputExample?: string;
}

interface Particle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  progress: number;
  speed: number;
}

// 三次贝塞尔曲线计算
const cubicBezier = (t: number, p0: number, p1: number, p2: number, p3: number): number => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

// 计算粒子路径位置
const calculatePosition = (progress: number, canvasWidth: number, canvasHeight: number) => {
  const startX = canvasWidth * 0.3;
  const endX = canvasWidth * 0.7;
  const centerY = canvasHeight * 0.5;

  // 控制点创建轻微向上的弧线
  const cp1x = startX + (endX - startX) * 0.3;
  const cp1y = centerY - 15;
  const cp2x = startX + (endX - startX) * 0.7;
  const cp2y = centerY - 15;

  return {
    x: cubicBezier(progress, startX, cp1x, cp2x, endX),
    y: cubicBezier(progress, centerY, cp1y, cp2y, centerY)
  };
};

// 将十六进制颜色转换为 RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const ParticleFlowDiagram: React.FC<DataFlowProps> = ({
  inputFormat,
  outputFormat,
  keyFields,
  color,
  inputExample,
  outputExample,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const [activeKey, setActiveKey] = useState<string | string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 canvas 尺寸
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateCanvasSize();

    // 响应式调整
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    // 检查是否偏好减少动画
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return () => {
        resizeObserver.disconnect();
      };
    }

    const rgb = hexToRgb(color);

    // 生成新粒子
    const spawnParticle = (timestamp: number) => {
      if (timestamp - lastSpawnTimeRef.current < 400) return;

      const particle: Particle = {
        x: 0,
        y: 0,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 2,
        progress: 0,
        speed: 0.008 + Math.random() * 0.004
      };

      particlesRef.current.push(particle);
      lastSpawnTimeRef.current = timestamp;
    };

    // 更新粒子
    const updateParticle = (particle: Particle) => {
      particle.progress += particle.speed;

      if (particle.progress >= 1) {
        particle.life = 0;
        return;
      }

      const pos = calculatePosition(particle.progress, canvas.width, canvas.height);
      particle.x = pos.x;
      particle.y = pos.y;

      // 淡入淡出效果
      if (particle.progress < 0.15) {
        particle.life = particle.progress / 0.15;
      } else if (particle.progress > 0.85) {
        particle.life = (1 - particle.progress) / 0.15;
      } else {
        particle.life = 1;
      }
    };

    // 渲染粒子
    const renderParticle = (particle: Particle) => {
      const opacity = Math.max(0, Math.min(1, particle.life));

      // 发光效果
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity * 0.8})`;

      // 绘制粒子
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    };

    // 动画循环
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 生成新粒子
      if (particlesRef.current.length < 25) {
        spawnParticle(timestamp);
      }

      // 更新和渲染所有粒子
      particlesRef.current.forEach(particle => {
        updateParticle(particle);
        if (particle.life > 0) {
          renderParticle(particle);
        }
      });

      // 移除死亡粒子
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // 清理
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      particlesRef.current = [];
    };
  }, [color]);

  return (
    <div className="particle-flow-diagram">
      <div className="particle-canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="particle-canvas"
          aria-label={`数据流动画：从${inputFormat}到${outputFormat}`}
        />

        {/* 覆盖层盒子 */}
        <div className="flow-boxes">
          <div className="flow-box input-box" style={{ borderColor: color }}>
            <span className="flow-label" style={{ color }}>输入</span>
            <span className="flow-format">{inputFormat}</span>
          </div>

          <div className="flow-box transform-box" style={{ borderColor: color }}>
            <span className="flow-transform" style={{ color }}>转换</span>
          </div>

          <div className="flow-box output-box" style={{ borderColor: color }}>
            <span className="flow-label" style={{ color }}>输出</span>
            <span className="flow-format">{outputFormat}</span>
          </div>
        </div>
      </div>

      {/* 关键字段 */}
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

      {/* 示例 */}
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

export default ParticleFlowDiagram;
