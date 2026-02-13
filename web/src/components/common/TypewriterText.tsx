import React, { useState, useEffect, useCallback } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

/**
 * 打字机效果组件 - 用于显示 Agent 的推理过程
 */
const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  className = '',
  showCursor = true,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const startTyping = useCallback(() => {
    let currentIndex = 0;
    setDisplayedText('');
    setIsComplete(false);
    setHasStarted(true);

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      const cleanup = startTyping();
      return cleanup;
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [startTyping, delay]);

  return (
    <span className={`font-mono ${className}`}>
      {displayedText}
      {showCursor && !isComplete && hasStarted && (
        <span className="typewriter-cursor" />
      )}
    </span>
  );
};

export default TypewriterText;
