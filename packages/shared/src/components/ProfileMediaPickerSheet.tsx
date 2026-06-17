import React from 'react';
import { MediaSourcePicker } from './MediaSourcePicker';
import type { SelectedGalleryImage } from '../lib/galleryMediaUtils';

export interface ProfileMediaPickerSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  title: string;
  onFile: (file: File) => void;
  onGallerySelect: (item: SelectedGalleryImage) => void;
}

export const ProfileMediaPickerSheet: React.FC<ProfileMediaPickerSheetProps> = ({
  open,
  onClose,
  userId,
  title,
  onFile,
  onGallerySelect,
}) => {
  if (!open) return null;

  const handleGallery = (items: SelectedGalleryImage[]) => {
    const first = items[0];
    if (first) onGallerySelect(first);
    onClose();
  };

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">
      <div className="de-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <h2>{title}</h2>
          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>
        </header>
        <div className="de-sheet__body de-form-stack">
          <p className="de-form-hint">Sube una imagen nueva o elige una de tu galería de fotos.</p>
          <MediaSourcePicker
            userId={userId}
            multiple={false}
            maxCount={1}
            currentCount={0}
            galleryMode="single"
            deviceLabel="Subir desde dispositivo"
            galleryLabel="Elegir de mi galería"
            onFiles={(files) => {
              const file = files[0];
              if (file) {
                onFile(file);
                onClose();
              }
            }}
            onGallerySelect={handleGallery}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileMediaPickerSheet;
