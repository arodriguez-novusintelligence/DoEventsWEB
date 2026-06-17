import React from 'react';
interface PreferenceTagProps {
    label: string;
    selected: boolean;
    onToggle: () => void;
}
export declare const PreferenceTag: React.FC<PreferenceTagProps>;
export {};
