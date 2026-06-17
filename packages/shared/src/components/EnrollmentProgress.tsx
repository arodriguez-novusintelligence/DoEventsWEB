import React from 'react';

interface EnrollmentProgressProps {
  value: number;
}

export const EnrollmentProgress: React.FC<EnrollmentProgressProps> = ({ value }) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="de-progress" aria-label={`Progreso ${pct}%`}>
      <div className="de-progress__track">
        <div className="de-progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="de-progress__label">{pct}%</span>
    </div>
  );
};
