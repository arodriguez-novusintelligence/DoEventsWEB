import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { ImagePlus, Video, X, Globe, Lock, Loader2, PenLine, MapPin } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { cn } from '@lovable/lib/utils';
import type { Post } from '@doevents/shared';
import MentionAutocomplete, { type MentionOption } from './MentionAutocomplete';

interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'reposts'>) => void | Promise<void>;
  authorName?: string;
  authorInitials?: string;
  authorId?: string;
  mentionOptions?: MentionOption[];
  publishing?: boolean;
}

const isVideo = (src: string) => {
  if (src.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
};

const CreatePostSheet = ({
  open,
  onOpenChange,
  onPublish,
  authorName = 'Tú',
  authorInitials = 'TU',
  authorId,
  mentionOptions: mentionOptionsProp = [],
  publishing = false,
}: CreatePostSheetProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [descCursor, setDescCursor] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const mentionOptions = useMemo<MentionOption[]>(
    () => mentionOptionsProp,
    [mentionOptionsProp],
  );

  const handleMentionSelect = (option: MentionOption, mentionStart: number, mentionEnd: number) => {
    const mentionTag = `@${option.name.replace(/\s+/g, '')}`;
    const newDesc = description.slice(0, mentionStart) + mentionTag + ' ' + description.slice(mentionEnd);
    setDescription(newDesc);
    const newCursor = mentionStart + mentionTag.length + 1;
    setDescCursor(newCursor);
    // Restore focus and cursor position
    setTimeout(() => {
      if (descRef.current) {
        descRef.current.focus();
        descRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

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

  const canPublish = (title.trim().length > 0 || description.trim().length > 0) && !publishing;

  const handlePublish = async () => {
    if (!canPublish) return;
    try {
      await onPublish({
        user: { id: authorId || '', name: authorName, initials: authorInitials },
        timeAgo: 'Justo ahora',
        images: media,
        title: title.trim(),
        date: new Date().toLocaleDateString('es-CO', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        location: location.trim() || 'Sin ubicación',
        tags: [],
        description: description.trim(),
        type: 'evento',
        visibility,
        likedBy: [],
        repostedBy: [],
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setMedia([]);
      setVisibility('public');
      onOpenChange(false);
    } catch {
      /* el padre muestra error; no cerrar ni resetear */
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh] border-t border-border/60">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <DrawerTitle className="text-xl font-extrabold">Nueva publicación</DrawerTitle>
            </div>
          </DrawerHeader>

          <div className="max-h-[65vh] overflow-y-auto px-4 pb-6">
            <div className="space-y-4">
              {/* Author preview */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-accent text-sm font-extrabold text-accent-foreground">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-extrabold text-card-foreground">{authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {visibility === 'public' ? 'Publicación pública' : 'Solo seguidores'}
                  </p>
                </div>
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="Dale un título a tu publicación"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                className="w-full border-b border-border/60 bg-transparent pb-2 text-base font-extrabold outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />

              {/* Description with mention autocomplete */}
              <div className="relative">
                <textarea
                  ref={descRef}
                  placeholder="¿Qué quieres compartir?"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setDescCursor(e.target.selectionStart || 0);
                  }}
                  onSelect={(e) => {
                    setDescCursor((e.target as HTMLTextAreaElement).selectionStart || 0);
                  }}
                  maxLength={1000}
                  rows={4}
                  className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                />
                <MentionAutocomplete
                  options={mentionOptions}
                  inputValue={description}
                  cursorPosition={descCursor}
                  onSelect={handleMentionSelect}
                  anchorRef={descRef}
                />
              </div>

              {/* Location */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder="Agregar ubicación"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-border/60 bg-muted/50 py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Visibility selector */}
              <div className="space-y-2">
                <p className="text-sm font-extrabold text-card-foreground">Visibilidad</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-full border-2 py-2.5 text-sm font-extrabold transition-all',
                      visibility === 'public'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    Público
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-full border-2 py-2.5 text-sm font-extrabold transition-all',
                      visibility === 'private'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <Lock className="h-4 w-4" />
                    Privado
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'public'
                    ? 'Todos pueden ver esta publicación'
                    : 'Solo perfiles que te siguen pueden ver esta publicación'}
                </p>
              </div>

              {/* Media previews */}
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((src, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg shadow-sm ring-2 ring-primary/20">
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/25 py-3 text-sm font-extrabold text-primary shadow-sm transition-colors hover:border-primary/60"
                >
                  <ImagePlus className="h-5 w-5" />
                  Fotos
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/25 py-3 text-sm font-extrabold text-primary shadow-sm transition-colors hover:border-primary/60"
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

              {/* Publish */}
              <button
                onClick={handlePublish}
                disabled={!canPublish}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-extrabold text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publicando…
                  </>
                ) : (
                  'Publicar'
                )}
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreatePostSheet;
