import React from 'react';
import { Colors } from '../theme';

export const SuccessIcon: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <circle cx="40" cy="40" r="40" fill={Colors.NightBlue_200} />
    <circle cx="40" cy="40" r="28" fill={Colors.NightBlue_600} />
    <path
      d="M28 41.5L36.5 50L52 34.5"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
