import { Bot } from 'lucide-react';
import './IBMBobBadge.css';

interface IBMBobBadgeProps {
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
}

export function IBMBobBadge({ variant = 'default', showIcon = true }: IBMBobBadgeProps) {
  if (variant === 'inline') {
    return (
      <span className="ibm-bob-badge-inline">
        {showIcon && <Bot className="ibm-bob-icon" size={15} />}
        <span className="ibm-bob-text">Powered by IBM Bob</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="ibm-bob-badge-compact">
        {showIcon && <Bot className="ibm-bob-icon" size={16} />}
        <span className="ibm-bob-text">IBM Bob</span>
      </div>
    );
  }

  return (
    <div className="ibm-bob-badge">
      {showIcon && <Bot className="ibm-bob-icon" size={22} />}
      <div className="ibm-bob-content">
        <div className="ibm-bob-title">Powered by IBM Bob</div>
        <div className="ibm-bob-subtitle">AI-powered developer growth</div>
      </div>
    </div>
  );
}
