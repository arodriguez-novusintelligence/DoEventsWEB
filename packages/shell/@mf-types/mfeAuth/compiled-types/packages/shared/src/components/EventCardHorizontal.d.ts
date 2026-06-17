import React from 'react';
export interface EventCardHorizontalProps {
    title: string;
    imageUrl?: string;
    dateLine?: string;
    locationLine?: string;
    description?: string;
    onClick?: () => void;
}
export declare const EventCardHorizontal: React.FC<EventCardHorizontalProps>;
