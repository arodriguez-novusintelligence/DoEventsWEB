import React from 'react';
export interface WallHeaderProps {
    userName?: string;
    isAuthenticated?: boolean;
    onSearchClick?: () => void;
}
export declare const WallHeader: React.FC<WallHeaderProps>;
