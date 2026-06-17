import React from 'react';
import type { EventCategoryCatalogItem } from '../data/eventCategories';
import { EVENT_CATEGORY_CATALOG } from '../data/eventCategories';

export interface CategoryItem {
  id: string;
  label: string;
  imageUrl?: string;
  emoji?: string;
  color?: string;
}

export interface CategoryScrollerProps {
  categories?: CategoryItem[];
  selectedIds?: string[];
  multi?: boolean;
  variant?: 'scroll' | 'grid';
  title?: string;
  showTitle?: boolean;
  onSeeAll?: () => void;
  onSelect?: (category: CategoryItem) => void;
  onToggle?: (category: CategoryItem, selected: boolean) => void;
}

function toDisplayCategory(cat: CategoryItem): CategoryItem {
  const catalog = EVENT_CATEGORY_CATALOG.find(
    (c) => c.id === cat.id || c.label === cat.label || c.id === cat.label,
  );
  return {
    ...cat,
    emoji: cat.emoji || catalog?.emoji || '●',
    color: cat.color || catalog?.color || '#5856EB',
  };
}

export const CategoryScroller: React.FC<CategoryScrollerProps> = ({
  categories,
  selectedIds = [],
  multi = false,
  variant = 'scroll',
  title = 'Categorías',
  showTitle = true,
  onSeeAll,
  onSelect,
  onToggle,
}) => {
  const items = (categories?.length ? categories : EVENT_CATEGORY_CATALOG).map(toDisplayCategory);

  const handleClick = (cat: CategoryItem) => {
    const selected = selectedIds.includes(cat.id) || selectedIds.includes(cat.label);
    if (multi && onToggle) {
      onToggle(cat, !selected);
      return;
    }
    onSelect?.(cat);
  };

  const scrollClass = variant === 'grid' ? 'de-categories__grid' : 'de-categories__scroll';

  return (
    <section className={`de-categories${variant === 'scroll' ? ' de-categories--events' : ''}`}>
      {showTitle && variant === 'scroll' && <h2 className="de-categories__title">{title}</h2>}
      <div className={scrollClass}>
        {items.map((cat) => {
          const active = selectedIds.includes(cat.id) || selectedIds.includes(cat.label);
          return (
            <button
              key={cat.id}
              type="button"
              className={`de-category-item${active ? ' de-category-item--active' : ''}`}
              onClick={() => handleClick(cat)}
            >
              <span
                className="de-category-item__avatar"
                style={{ background: active ? cat.color : `${cat.color}22`, color: cat.color }}
              >
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt="" className="de-category-item__img" />
                ) : (
                  <span className="de-category-item__emoji">{cat.emoji}</span>
                )}
              </span>
              <span className="de-category-item__label">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryScroller;
