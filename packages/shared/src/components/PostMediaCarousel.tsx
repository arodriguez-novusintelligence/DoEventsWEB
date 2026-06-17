import React, { useMemo, useState } from 'react';

export interface PostMediaCarouselProps {
  images: string[];
  alt?: string;
}

export const PostMediaCarousel: React.FC<PostMediaCarouselProps> = ({ images, alt = '' }) => {
  const slides = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  if (!slides.length) return null;

  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <div className="de-post-carousel">
      <div className="de-post-carousel__frame">
        <img src={current} alt={alt} className="de-post-carousel__img" />
        {slides.length > 1 && (
          <span className="de-post-carousel__counter">
            {index + 1}/{slides.length}
          </span>
        )}
      </div>
      {slides.length > 1 && (
        <div className="de-post-carousel__dots" role="tablist" aria-label="Imágenes de la publicación">
          {slides.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Imagen ${dotIndex + 1}`}
              className={`de-post-carousel__dot${dotIndex === index ? ' de-post-carousel__dot--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(dotIndex);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostMediaCarousel;
