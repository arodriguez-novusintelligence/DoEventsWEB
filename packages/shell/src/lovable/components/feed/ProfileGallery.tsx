import { useRef, useState } from 'react';
import {
  ImagePlus,
  X,
  Expand,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@lovable/components/ui/button';

export const MAX_GALLERY_PHOTOS = 15;

export interface GalleryPhotoItem {
  id: string;
  url: string;
}

interface ProfileGalleryProps {
  onBack: () => void;
  photos: GalleryPhotoItem[];
  loading?: boolean;
  loadError?: string | null;
  saving?: boolean;
  hasChanges?: boolean;
  onAddFiles: (files: File[]) => void;
  onRemove: (photoId: string) => void;
  onSave: () => void;
}

const ProfileGallery = ({
  onBack,
  photos,
  loading = false,
  loadError = null,
  saving = false,
  hasChanges = false,
  onAddFiles,
  onRemove,
  onSave,
}: ProfileGalleryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const remaining = MAX_GALLERY_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_GALLERY_PHOTOS} fotos permitidas`);
      e.target.value = '';
      return;
    }

    const picked = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!picked.length) {
      toast.error('Solo se permiten imágenes');
      e.target.value = '';
      return;
    }

    const filesToAdd = picked.slice(0, remaining);
    if (picked.length > remaining) {
      toast.info(`Solo se agregaron ${remaining} fotos (máximo ${MAX_GALLERY_PHOTOS})`);
    }

    onAddFiles(filesToAdd);
    if (filesToAdd.length) toast.success(`${filesToAdd.length} foto(s) agregada(s)`);
    e.target.value = '';
  };

  const handleRemove = (photoId: string) => {
    onRemove(photoId);
    setViewingIndex(null);
    toast('Foto eliminada');
  };

  const navigateViewer = (dir: 'prev' | 'next') => {
    if (viewingIndex === null) return;
    if (dir === 'prev' && viewingIndex > 0) setViewingIndex(viewingIndex - 1);
    if (dir === 'next' && viewingIndex < photos.length - 1) setViewingIndex(viewingIndex + 1);
  };

  const currentViewerPhoto = viewingIndex !== null ? photos[viewingIndex] : null;

  return (
    <div className="min-h-screen bg-secondary pt-16">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </button>

        <div className="rounded-2xl bg-card p-5 shadow-sm">
          {loadError && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <ImagePlus className="h-5 w-5 text-primary" />
                Mi Galería de Fotos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {photos.length} de {MAX_GALLERY_PHOTOS} fotos
              </p>
            </div>
            {photos.length < MAX_GALLERY_PHOTOS && (
              <button
                type="button"
                disabled={loading || saving}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                <ImagePlus className="h-4 w-4" />
                Agregar
              </button>
            )}
          </div>

          <div className="mb-5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(photos.length / MAX_GALLERY_PHOTOS) * 100}%` }}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-muted" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 py-16 text-muted-foreground hover:border-primary/50 hover:bg-accent/30 transition-colors"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Agrega tus mejores fotos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hasta {MAX_GALLERY_PHOTOS} fotos · JPG, PNG, WEBP
                </p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl">
                  <img
                    src={photo.url}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setViewingIndex(i)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-foreground shadow"
                    >
                      <Expand className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(photo.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground shadow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_GALLERY_PHOTOS && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-primary/25 hover:border-primary/50 hover:bg-accent/30 transition-colors disabled:opacity-60"
                >
                  <ImagePlus className="h-7 w-7 text-primary/40" />
                </button>
              )}
            </div>
          )}

          {hasChanges && photos.length > 0 && (
            <div className="mt-5">
              <Button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="w-full rounded-full gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando…' : 'Guardar galería'}
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

      {viewingIndex !== null && currentViewerPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setViewingIndex(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewingIndex(null); }}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {viewingIndex > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateViewer('prev'); }}
              className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {viewingIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigateViewer('next'); }}
              className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <img
            src={currentViewerPhoto.url}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 flex items-center gap-3">
            <span className="text-sm text-white/70">{viewingIndex + 1} / {photos.length}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(currentViewerPhoto.id); }}
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

export default ProfileGallery;
