import React, { useEffect, useState } from 'react';
import { resolveUserAvatarUrl } from '../lib/userAvatarUtils';

export interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  userId?: string | null;
  size?: number;
  className?: string;
}

function PersonIcon({ size }: { size: number }) {
  const iconSize = Math.round(size * 0.52);
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v1h20v-1c0-3.33-6.67-5-10-5z" />
    </svg>
  );
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imageUrl,
  userId,
  size = 40,
  className = '',
}) => {
  const resolved = resolveUserAvatarUrl(imageUrl, userId);
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.34)) };

  useEffect(() => {
    setBroken(false);
  }, [resolved]);

  if (resolved && !broken) {
    return (
      <img
        src={resolved}
        alt={name || 'Usuario'}
        className={`de-user-avatar de-user-avatar--img ${className}`.trim()}
        style={style}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className={`de-user-avatar de-user-avatar--placeholder ${className}`.trim()}
      style={style}
      aria-label={name || 'Usuario'}
      title={name}
    >
      <PersonIcon size={size} />
    </span>
  );
};

export default UserAvatar;
