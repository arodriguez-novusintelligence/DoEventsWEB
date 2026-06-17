import React from 'react';
import { UserAvatar } from '@doevents/shared';
import { useActiveStoryAuthors } from '../contexts/StoriesContext';

interface StoryAvatarProps {
  userId?: string | null;
  name?: string;
  imageUrl?: string | null;
  size?: number;
  onClick?: () => void;
  onCreateStory?: () => void;
  className?: string;
  isOwn?: boolean;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  live?: boolean;
  /** Fuerza anillo de historia aunque el contexto aún no haya refrescado */
  forceActive?: boolean;
}

export const StoryAvatar: React.FC<StoryAvatarProps> = ({
  userId,
  name,
  imageUrl,
  size = 40,
  onClick,
  onCreateStory,
  className = '',
  isOwn = false,
  isOnline = false,
  showOnlineStatus = false,
  live = false,
  forceActive = false,
}) => {
  const { hasActiveStory } = useActiveStoryAuthors();
  const active = forceActive || (userId ? hasActiveStory(userId) : false);
  const showStoryRing = active || live;
  const showOwnIdleRing = isOwn && !showStoryRing;

  const inner = (
    <UserAvatar name={name || 'Usuario'} imageUrl={imageUrl || undefined} size={size} />
  );

  const ringClasses = [
    'relative inline-flex rounded-full shrink-0',
    showStoryRing
      ? 'p-[2.5px] bg-gradient-to-tr from-primary via-fuchsia-500 to-amber-400'
      : showOwnIdleRing
        ? 'p-[2px] ring-2 ring-primary/40'
        : '',
    className,
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (isOwn && !showStoryRing && onCreateStory) {
      onCreateStory();
      return;
    }
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={ringClasses}
      title={showStoryRing ? 'Ver historia' : isOwn ? 'Agregar historia' : undefined}
      aria-label={
        showStoryRing
          ? `Ver historia de ${name || 'usuario'}`
          : isOwn
            ? 'Agregar historia'
            : `Ver perfil de ${name || 'usuario'}`
      }
    >
      <span className={`block rounded-full ${showStoryRing ? 'bg-background p-[2px]' : ''}`}>
        {inner}
      </span>

      {live && (
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold text-white leading-none">
          Live
        </span>
      )}

      {isOwn && onCreateStory && (
        <span
          role="button"
          tabIndex={0}
          aria-label="Agregar historia"
          onClick={(e) => {
            e.stopPropagation();
            onCreateStory();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onCreateStory();
            }
          }}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground border-2 border-background shadow-sm z-10"
        >
          +
        </span>
      )}

      {showOnlineStatus && isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background z-10" />
      )}
    </button>
  );
};

export default StoryAvatar;
