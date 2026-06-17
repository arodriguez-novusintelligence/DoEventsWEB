import React from 'react';

interface PreferenceTagProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export const PreferenceTag: React.FC<PreferenceTagProps> = ({ label, selected, onToggle }) => (
  <button
    type="button"
    className={`de-preference-tag${selected ? ' de-preference-tag--selected' : ''}`}
    onClick={onToggle}
    aria-pressed={selected}
  >
    {label}
  </button>
);
