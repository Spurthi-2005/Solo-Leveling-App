import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SystemMessageProps {
  message: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function SystemMessage({ message, delay = 0, className, onComplete }: SystemMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= message.length) {
        setDisplayedText(message.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        onComplete?.();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [started, message, onComplete]);

  if (!started) return null;

  return (
    <div className={cn(
      "font-mono text-primary text-glow-primary",
      className
    )}>
      <span className="text-muted-foreground mr-2">[SYSTEM]</span>
      <span>{displayedText}</span>
      {isTyping && <span className="typing-cursor" />}
    </div>
  );
}
