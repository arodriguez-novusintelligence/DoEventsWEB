import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import { ImagePlus, Video, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Post } from '@lovable/data/mockData';

interface EditPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onSave: (postId: string, updates: { title: string; description: string; location: string; images: string[] }) => void;
}

const isVideo = (src: string) => {
  if (src.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
};

const EditPostSheet = ({ open, onOpenChange, post, onSave }: EditPostSheetProps) => {
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [location, setLocation] = useState(post.location);
  const [media, setMedia] = useState<string[]>(post.images);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(post.title);
      setDescription(post.description);
      setLocation(post.location);
      setMedia(post.images);
    }
  }, [open, post]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setMedia((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const canSave = title.trim().length > 0 || description.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(post.id, {
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || 'Sin ubicación',
      images: media,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl font-bold">Editar publicación</DrawerTitle>
          </DrawerHeader>

          <div className="max-h-[65vh] overflow-y-auto px-4 pb-6">
            <div className="space-y-4">
              {/* Title */}
              <input
                type="text"
                placeholder="Título de tu publicación"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                className="w-full border-b border-border bg-transparent pb-2 text-base font-semibold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />

              {/* Description */}
              <textarea
                placeholder="¿Qué quieres compartir?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />

              {/* Location */}
              <input
                type="text"
                placeholder="📍 Ubicación"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />

              {/* Media previews */}
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((src, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
                      {isVideo(src) ? (
                        <video src={src} className="h-full w-full object-cover" muted preload="metadata" />
                      ) : (
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      )}
                      {isVideo(src) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/50">
                            <Video className="h-4 w-4 text-background" />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background transition-transform hover:scale-110"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add media buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/30 py-3 text-sm font-semibold text-primary transition-colors hover:border-primary/60"
                >
                  <ImagePlus className="h-5 w-5" />
                  Fotos
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/30 py-3 text-sm font-semibold text-primary transition-colors hover:border-primary/60"
                >
                  <Video className="h-5 w-5" />
                  Videos
                </button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditPostSheet;
