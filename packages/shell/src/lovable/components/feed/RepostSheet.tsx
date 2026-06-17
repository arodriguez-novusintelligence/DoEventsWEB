import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Globe, Lock, ImagePlus, X } from 'lucide-react';
import { useState, useRef } from 'react';
import { cn } from '@lovable/lib/utils';
import type { Post } from '@lovable/data/mockData';

interface RepostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onPublishRepost: (repost: Omit<Post, 'id' | 'likes' | 'comments' | 'reposts'>) => void;
}

const RepostSheet = ({ open, onOpenChange, post, onPublishRepost }: RepostSheetProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canPublish = title.trim().length > 0 || description.trim().length > 0;

  const handlePublish = () => {
    if (!canPublish) return;
    onPublishRepost({
      user: { id: 'me', name: 'Tú', initials: 'TU' },
      timeAgo: 'Justo ahora',
      images,
      title: title.trim() || '',
      date: new Date().toLocaleDateString('es-CO', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      location: post.location,
      tags: [],
      description: description.trim() || '',
      type: post.type,
      visibility,
      likedBy: [],
      repostedBy: [],
      repostOf: {
        user: post.user,
        timeAgo: post.timeAgo,
        images: post.images,
        title: post.title,
        description: post.description,
        tags: post.tags,
      },
    });
    setTitle('');
    setDescription('');
    setImages([]);
    setVisibility('public');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-2xl font-bold text-primary">
              Repostear
            </DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[65vh] overflow-y-auto px-4 pb-6">
            <div className="space-y-4">
              {/* Image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background transition-transform hover:scale-110"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/30 py-3 text-sm font-semibold text-primary transition-colors hover:border-primary/60"
              >
                <ImagePlus className="h-5 w-5" />
                Agregar imagen o video
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Original post preview */}
              <div className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                      {post.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">
                      {post.user.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {post.timeAgo}
                      </span>
                      <span className="text-xs font-bold text-primary">
                        Seguir
                      </span>
                    </div>
                  </div>
                </div>
                {post.images[0] && (
                  <img
                    src={post.images[0]}
                    alt=""
                    className="aspect-video w-full rounded-lg object-cover"
                  />
                )}
                <h3 className="mt-2 text-sm font-bold text-card-foreground">
                  {post.title}
                </h3>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                  {post.description}
                </p>
              </div>

              {/* Input section */}
              <div className="space-y-4 rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    ¡Ponle un título que llame la atención!
                  </p>
                  <input
                    type="text"
                    placeholder="Dale un título llamativo a tu post"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 w-full border-b border-border bg-transparent pb-2 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Usa palabras creativas o emotivas para que más personas vean tu
                  publicación.
                </p>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    ¡Cuéntales a todos!
                  </p>
                  <textarea
                    placeholder="Escribe tu opinión..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2 w-full resize-none border-b border-border bg-transparent pb-2 text-sm outline-none transition-colors focus:border-primary"
                    rows={3}
                  />
                </div>
              </div>

              {/* Visibility selector */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-card-foreground">Visibilidad</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-full border-2 py-2.5 text-sm font-semibold transition-all',
                      visibility === 'public'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    Público
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-full border-2 py-2.5 text-sm font-semibold transition-all',
                      visibility === 'private'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    Privado
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'public'
                    ? 'Todos pueden ver este repost'
                    : 'Solo perfiles que te siguen pueden ver este repost'}
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                Publicar Repost
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RepostSheet;
