import React, { useState } from 'react';
import { DEFAULT_EVENT_IMAGE, resolveImageUrl } from '../lib/resolveImageUrl';

export interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = DEFAULT_EVENT_IMAGE,
  alt = '',
  onError,
  ...rest
}) => {
  const initial = resolveImageUrl(src) || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(initial);

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      onError={(e) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(e);
      }}
    />
  );
};

export default SafeImage;
