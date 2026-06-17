import React from 'react';
export interface CategoryItem {
    id: string;
    label: string;
    imageUrl?: string;
}
export interface CategoryScrollerProps {
    categories?: CategoryItem[];
    onSelect?: (category: CategoryItem) => void;
}
export declare const CategoryScroller: React.FC<CategoryScrollerProps>;
