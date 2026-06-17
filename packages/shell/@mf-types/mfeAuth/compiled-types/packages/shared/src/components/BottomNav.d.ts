import React from 'react';
import { TabIconName } from './icons/TabIcons';
export interface BottomNavItem {
    to: string;
    label: string;
    icon: TabIconName;
    end?: boolean;
}
export declare const BOTTOM_NAV_ITEMS: BottomNavItem[];
export declare const BottomNav: React.FC;
