import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@lovable/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lovable/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@lovable/components/ui/dialog';
import { ImagePlus, Video, X, MapPin, Images, Loader2, Check } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { cn } from '@lovable/lib/utils';
import type { Post } from '@lovable/data/mockData';
import { users, bannerEvents } from '@lovable/data/mockData';
import MentionAutocomplete, { type MentionOption } from './MentionAutocomplete';
import { toast } from 'sonner';
import galleryPhoto1 from '@lovable/assets/gallery/photo-1.jpg';
import galleryPhoto2 from '@lovable/assets/gallery/photo-2.jpg';
import galleryPhoto3 from '@lovable/assets/gallery/photo-3.jpg';
import galleryPhoto4 from '@lovable/assets/gallery/photo-4.jpg';
import galleryPhoto5 from '@lovable/assets/gallery/photo-5.jpg';
import galleryPhoto6 from '@lovable/assets/gallery/photo-6.jpg';

import type { Post } from '@doevents/shared';
interface CreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'reposts'>) => void;
}

type PostCategory = 'publicacion' | 'evento' | 'servicio' | 'lugar';

const CATEGORY_OPTIONS: { value: PostCategory; label: string; helper: string }[] = [
  { value: 'publicacion', label: 'Publicación', helper: 'Comparte un estado con fotos o videos en el Feed.' },
  { value: 'evento', label: 'Evento', helper: 'Promociona un evento próximo con fecha y ubicación.' },
  { value: 'servicio', label: 'Servicio', helper: 'Ofrece un servicio profesional a la comunidad.' },
  { value: 'lugar', label: 'Lugar', helper: 'Recomienda o promociona un lugar para visitar.' },
];

const MAX_MEDIA = 6;
const GALLERY = [galleryPhoto1, galleryPhoto2, galleryPhoto3, galleryPhoto4, galleryPhoto5, galleryPhoto6];

const isVideo = (src: string) => {
  if (src.startsWith('data:video/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
};

const CreatePostSheet = ({ open, onOpenChange, onPublish }: CreatePostSheetProps) => {
  const [category, setCategory] = useState<PostCategory>('publicacion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [descCursor, setDescCursor] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [gallerySelected, setGallerySelected] = useState<Set<string>>(new Set());
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const helper = CATEGORY_OPTIONS.find((o) => o.value === category)?.helper ?? '';

  const mentionOptions = useMemo<MentionOption[]>(() => {
    const userOpts: MentionOption[] = users
      .filter((u) => u.id !== 'me')
      .map((u) => ({ id: u.id, name: u.name, initials: u.initials, type: 'user' as const }));
    const eventOpts: MentionOption[] = bannerEvents.map((e) => ({
      id: e.id,
      name: e.title,
      initials: e.title.slice(0, 2).toUpperCase(),
      type: 'event' as const,
    }));
    return [...userOpts, ...eventOpts];
  }, []);

  const handleMentionSelect = (option: MentionOption, mentionStart: number, mentionEnd: number) => {
    const mentionTag = `@${option.name.replace(/\s+/g, '')}`;
    const newDesc = description.slice(0, mentionStart) + mentionTag + ' ' + description.slice(mentionEnd);
    setDescription(newDesc);
    const newCursor = mentionStart + mentionTag.length + 1;
    setDescCursor(newCursor);
    setTimeout(() => {
      if (descRef.current) {
        descRef.current.focus();
        descRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  const remainingSlots = MAX_MEDIA - media.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const toProcess = Array.from(files).slice(0, remainingSlots);
    if (Array.from(files).length > remainingSlots) {
      toast.info(`Solo se agregaron ${remainingSlots} (máximo ${MAX_MEDIA})`);
    }
    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setMedia((prev) => (prev.length < MAX_MEDIA ? [...prev, ev.target!.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGps = () => {
    if (!('geolocation' in navigator)) {
      toast.error('GPS no disponible en este navegador');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const data = await r.json();
          const a = data?.address || {};
          const city = a.city || a.town || a.village || a.municipality || a.county || '';
          const country = a.country || '';
          const display = [city, country].filter(Boolean).join(', ') || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setLocation(display);
          toast.success('Ubicación detectada');
        } catch {
          setLocation(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        toast.error('No se pudo obtener la ubicación');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const openGallery = () => {
    setGallerySelected(new Set());
    setShowGallery(true);
  };

  const toggleGallerySelection = (src: string) => {
    setGallerySelected((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else if (next.size + media.length < MAX_MEDIA) next.add(src);
      else toast.info(`Máximo ${MAX_MEDIA} archivos`);
      return next;
    });
  };

  const confirmGallery = () => {
    const additions = Array.from(gallerySelected);
    setMedia((prev) => [...prev, ...additions].slice(0, MAX_MEDIA));
    setShowGallery(false);
  };

  const canPublish = title.trim().length > 0 || description.trim().length > 0;

  const handlePublish = () => {
    if (!canPublish) return;
    const mappedType: Post['type'] =
      category === 'publicacion' ? 'evento' : (category as Post['type']);
    onPublish({
      user: { id: 'me', name: 'Tú', initials: 'TU' },
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
      type: mappedType,
      visibility,
      likedBy: [],
      repostedBy: [],
    });
    setCategory('publicacion');
    setTitle('');
    setDescription('');
    setLocation('');
    setMedia([]);
    setVisibility('public');
    onOpenChange(false);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="flex flex-row items-start justify-between text-left pb-2">
              <DrawerTitle className="text-xl font-bold">Vitrina del Feed</DrawerTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </DrawerHeader>

            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Promociona tus eventos, servicios y lugares ante la comunidad. Las
                publicaciones admiten me gusta, comentarios y contacto directo.
              </p>

              <div className="space-y-4">
                {/* Tipo de publicación */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-card-foreground">
                    Tipo de publicación
                  </label>
                  <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
                    <SelectTrigger className="bg-muted/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{helper}</p>
                </div>

                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-card-foreground">
                    Título <span className="text-muted-foreground font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Dale un título a tu publicación"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>

                {/* Contenido */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-card-foreground">Contenido</label>
                  <div className="relative">
                    <textarea
                      ref={descRef}
                      placeholder="Escribe tu publicación. Usa @ para mencionar usuarios."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setDescCursor(e.target.selectionStart || 0);
                      }}
                      onSelect={(e) => setDescCursor((e.target as HTMLTextAreaElement).selectionStart || 0)}
                      maxLength={1000}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                    <MentionAutocomplete
                      options={mentionOptions}
                      inputValue={description}
                      cursorPosition={descCursor}
                      onSelect={handleMentionSelect}
                      anchorRef={descRef}
                    />
                  </div>
                </div>

                {/* Ubicación + GPS */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-card-foreground">
                    Ubicación <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Bogotá, Bogotá Colombia"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={120}
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleGps}
                    disabled={gpsLoading}
                    className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-bold text-primary hover:underline disabled:opacity-60"
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    GPS
                  </button>
                </div>

                {/* Visibilidad segmentada */}
                <div className="rounded-full border border-border bg-muted/40 p-1 grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={cn(
                      'rounded-full py-2 text-sm font-semibold transition-colors',
                      visibility === 'public'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Pública
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={cn(
                      'rounded-full py-2 text-sm font-semibold transition-colors',
                      visibility === 'private'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Solo seguidores
                  </button>
                </div>

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

                {/* Botones de fotos / galería */}
                <button
                  type="button"
                  disabled={media.length >= MAX_MEDIA}
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-primary transition-colors hover:underline disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  Fotos o videos ({media.length}/{MAX_MEDIA})
                </button>
                <button
                  type="button"
                  disabled={media.length >= MAX_MEDIA}
                  onClick={openGallery}
                  className="flex w-full items-center justify-center gap-2 py-1 text-sm font-bold text-primary transition-colors hover:underline disabled:opacity-50"
                >
                  <Images className="h-4 w-4" />
                  Mi galería
                </button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*,video/*"
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

                {/* Publicar */}
                <button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
                >
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Picker de "Mi galería" */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mi galería</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Selecciona hasta {MAX_MEDIA - media.length} foto(s) para añadir a tu publicación.
          </p>
          <div className="grid max-h-[55vh] grid-cols-3 gap-2 overflow-y-auto">
            {GALLERY.map((src) => {
              const selected = gallerySelected.has(src);
              const alreadyAdded = media.includes(src);
              return (
                <button
                  key={src}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => toggleGallerySelection(src)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                    selected ? 'border-primary ring-2 ring-primary/40' : 'border-transparent',
                    alreadyAdded && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {selected && (
                    <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowGallery(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={confirmGallery}
              disabled={gallerySelected.size === 0}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              Agregar ({gallerySelected.size})
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreatePostSheet;