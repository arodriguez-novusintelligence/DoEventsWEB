import { useState, useRef } from 'react';
import { ImagePlus, X, Expand, ChevronLeft, ChevronRight, ArrowLeft, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@lovable/components/ui/button';
import { cn } from '@lovable/lib/utils';
import galleryPhoto1 from '@lovable/assets/gallery/photo-1.jpg';
import galleryPhoto2 from '@lovable/assets/gallery/photo-2.jpg';
import galleryPhoto3 from '@lovable/assets/gallery/photo-3.jpg';
import galleryPhoto4 from '@lovable/assets/gallery/photo-4.jpg';
import galleryPhoto5 from '@lovable/assets/gallery/photo-5.jpg';
import galleryPhoto6 from '@lovable/assets/gallery/photo-6.jpg';

const MAX_PHOTOS = 15;


interface ProfileGalleryProps {
  onBack: () => void;
}

const ProfileGallery = ({ onBack }: ProfileGalleryProps) => {
  const [photos, setPhotos] = useState<string[]>(PHOTOS);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_PHOTOS} fotos permitidas`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remaining);
    const newPhotos: string[] = [];

    filesToAdd.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      newPhotos.push(URL.createObjectURL(file));
    });

    if (Array.from(files).length > remaining) {
      toast.info(`Solo se agregaron ${remaining} fotos (máximo ${MAX_PHOTOS})`);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setHasChanges(true);
    if (newPhotos.length) toast.success(`${newPhotos.length} foto(s) agregada(s)`);
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      const url = updated[index];
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      updated.splice(index, 1);
      return updated;
    });
    setHasChanges(true);
    setViewingIndex(null);
    toast('Foto eliminada');
  };

  const navigateViewer = (dir: 'prev' | 'next') => {
    if (viewingIndex === null) return;
    if (dir === 'prev' && viewingIndex > 0) setViewingIndex(viewingIndex - 1);
    if (dir === 'next' && viewingIndex < photos.length - 1) setViewingIndex(viewingIndex + 1);
  };

  return (
    <div className="min-h-screen bg-secondary pt-16">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </button>

        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">📸 Mi Galería de Fotos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {photos.length} de {MAX_PHOTOS} fotos
              </p>
            </div>
            {photos.length < MAX_PHOTOS && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                <ImagePlus className="h-4 w-4" />
                Agregar
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }}
              />
            </div>
          </div>

          {photos.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 py-16 text-muted-foreground hover:border-primary/50 hover:bg-accent/30 transition-colors"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Agrega tus mejores fotos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hasta {MAX_PHOTOS} fotos · JPG, PNG, WEBP
                </p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                  <img
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setViewingIndex(i)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow"
                    >
                      <Expand className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(i)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground shadow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-primary/25 hover:border-primary/50 hover:bg-accent/30 transition-colors"
                >
                  <ImagePlus className="h-7 w-7 text-primary/40" />
                </button>
              )}
            </div>
          )}

          {/* Save button */}
          {hasChanges && photos.length > 0 && (
            <div className="mt-5">
              <Button
                onClick={() => {
                  setHasChanges(false);
                  toast.success('¡Galería guardada exitosamente!');
                }}
                className="w-full rounded-full gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar galería
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddPhotos}
          />
        </div>
      </div>

      {/* Fullscreen viewer */}
      {viewingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90" onClick={() => setViewingIndex(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setViewingIndex(null); }}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-primary-foreground z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {viewingIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateViewer('prev'); }}
              className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-primary-foreground z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {viewingIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateViewer('next'); }}
              className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-primary-foreground z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <img
            src={photos[viewingIndex]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 flex items-center gap-3">
            <span className="text-sm text-primary-foreground/70">{viewingIndex + 1} / {photos.length}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove(viewingIndex); }}
              className="flex items-center gap-1.5 rounded-full bg-destructive/80 px-3 py-1.5 text-xs font-medium text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MAX_GALLERY_PHOTOS = 15;
export interface GalleryPhotoItem {
  id: string;
  url: string;
}
export default ProfileGallery;