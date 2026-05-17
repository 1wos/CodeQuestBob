import React, { useId, useState } from 'react';
import './InfoPopover.css';

interface InfoPopoverProps {
  label: string;
  description: string;
  children: React.ReactNode;
  focusable?: boolean;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  label,
  description,
  children,
  focusable = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const popoverId = useId();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsVisible(false);
    }
  };

  return (
    <div
      className="info-popover-trigger"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={focusable ? () => setIsVisible(true) : undefined}
      onBlur={focusable ? () => setIsVisible(false) : undefined}
      onKeyDown={focusable ? handleKeyDown : undefined}
      tabIndex={focusable ? 0 : undefined}
      aria-describedby={isVisible ? popoverId : undefined}
    >
      {children}
      {isVisible && (
        <div id={popoverId} className="info-popover" role="tooltip">
          <div className="info-popover-label">{label}</div>
          <div className="info-popover-description">{description}</div>
        </div>
      )}
    </div>
  );
};

// Made with Bob
