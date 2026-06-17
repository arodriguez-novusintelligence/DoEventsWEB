import React from 'react';

interface EnrollmentRadioGroupProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const EnrollmentRadioGroup: React.FC<EnrollmentRadioGroupProps> = ({
  name,
  label,
  value,
  onChange,
}) => (
  <div className="de-enrollment-question">
    <p className="de-enrollment-question__label">{label}</p>
    <div className="de-enrollment-question__options" role="radiogroup" aria-label={label}>
      {(['Si', 'No'] as const).map((option) => (
        <label key={option} className="de-enrollment-radio">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span className="de-enrollment-radio__control" aria-hidden />
          <span className="de-enrollment-radio__text">{option}</span>
        </label>
      ))}
    </div>
  </div>
);
