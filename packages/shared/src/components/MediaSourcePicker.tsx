import React, { useRef, useState } from 'react';
import { ProfileGalleryPickerSheet } from './ProfileGalleryPickerSheet';
import type { SelectedGalleryImage } from '../lib/galleryMediaUtils';

export interface MediaSourcePickerProps {
  userId?: string;
  onFiles: (files: File[]) => void;
  onGallerySelect?: (items: SelectedGalleryImage[]) => void;
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
  currentCount?: number;
  disabled?: boolean;
  showGallery?: boolean;
  galleryMode?: 'single' | 'multiple';
  deviceLabel?: string;
  galleryLabel?: string;
  className?: string;
  variant?: 'default' | 'lovable';
}

export const MediaSourcePicker: React.FC<MediaSourcePickerProps> = ({
  userId,
  onFiles,
  onGallerySelect,
  accept = 'image/*',
  multiple = true,
  maxCount = 10,
  currentCount = 0,
  disabled = false,
  showGallery = true,
  galleryMode,
  deviceLabel = 'Desde dispositivo',
  galleryLabel = 'Mi galería',
  className,
  variant = 'default',
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const remaining = Math.max(0, maxCount - currentCount);
  const canAdd = remaining > 0 && !disabled;
  const canUseGallery = Boolean(showGallery && userId && onGallerySelect && canAdd);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || !canAdd) return;
    const picked = Array.from(files).slice(0, remaining);
    if (picked.length) onFiles(picked);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resolvedGalleryMode = galleryMode || (multiple ? 'multiple' : 'single');
  const buttonClass = variant === 'lovable'
    ? 'flex flex-1 items-center justify-center gap-2 rounded-full border border-primary bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50'
    : 'de-access-btn de-access-btn--ghost';

  return (
    <>
      <div className={className || (variant === 'lovable' ? 'flex flex-col gap-2 sm:flex-row' : 'de-form-row de-form-row--wrap')}>
        <button
          type="button"
          className={buttonClass}
          disabled={!canAdd}
          onClick={() => fileRef.current?.click()}
        >
          {deviceLabel}
        </button>
        {canUseGallery && (
          <button
            type="button"
            className={buttonClass}
            onClick={() => setGalleryOpen(true)}
          >
            {galleryLabel}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          style={{ display: 'none' }}
          disabled={!canAdd}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {canUseGallery && userId && (
        <ProfileGalleryPickerSheet
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          userId={userId}
          mode={resolvedGalleryMode}
          maxSelect={remaining || 1}
          onConfirm={(items) => onGallerySelect?.(items)}
        />
      )}
    </>
  );
};

export default MediaSourcePicker;
