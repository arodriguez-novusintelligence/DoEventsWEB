import React from 'react';
import type { FeedEventItem, UserEventItem } from '../types/events';
type EventItem = FeedEventItem | UserEventItem;
export interface EventSectionProps {
    title: string;
    events: EventItem[];
    variant?: 'vertical' | 'horizontal';
    onEventClick?: (eventId: string) => void;
    onSeeMore?: () => void;
}
export declare const EventSection: React.FC<EventSectionProps>;
export {};
