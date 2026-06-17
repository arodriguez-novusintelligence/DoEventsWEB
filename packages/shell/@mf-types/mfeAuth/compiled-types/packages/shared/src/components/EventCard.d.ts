import React from 'react';
export interface EventCardProps {
    title: string;
    imageUrl?: string;
    dateLine?: string;
    locationLine?: string;
    description?: string;
    onClick?: () => void;
}
export declare const EventCard: React.FC<EventCardProps>;
