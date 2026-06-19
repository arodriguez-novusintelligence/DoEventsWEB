import React from 'react';

export const FacebookIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#FFFFFF',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M13.5 8.5V6.75c0-.69.56-1.25 1.25-1.25H16V3h-2.25C11.9 3 10.5 4.4 10.5 6.25V8.5H8v3h2.5V21h3V11.5h2.55l.45-3H13.5z"
      fill={color}
    />
  </svg>
);
