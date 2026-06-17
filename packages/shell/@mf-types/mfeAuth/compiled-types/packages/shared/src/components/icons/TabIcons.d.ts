import React from 'react';
export type TabIconName = 'notifications' | 'chat' | 'wall' | 'tickets' | 'profile' | 'search';
interface IconProps {
    color?: string;
    size?: number;
}
export declare const TabIcon: React.FC<{
    name: TabIconName;
    color?: string;
    size?: number;
}>;
export declare const SearchIcon: React.FC<IconProps>;
export {};
