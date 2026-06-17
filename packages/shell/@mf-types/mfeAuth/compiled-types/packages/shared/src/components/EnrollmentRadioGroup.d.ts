import React from 'react';
interface EnrollmentRadioGroupProps {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
}
export declare const EnrollmentRadioGroup: React.FC<EnrollmentRadioGroupProps>;
export {};
