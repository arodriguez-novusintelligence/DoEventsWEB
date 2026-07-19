import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lovable/components/ui/alert-dialog';
import {
  Briefcase,
  Calendar,
  Check,
  Home,
  ImagePlus,
  Images,
  Loader2,
  MapPin,
  Search,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import type { RootState } from '@doevents/shared';
import type { FeedMention, FeedPublication } from '@doevents/shared';
import {
  uploadMediaFile,
  fetchUserEvents,
  fetchServicesByUserId,
  listUserVenues,
  searchEvents,
  searchServices,
  searchVenues,
  searchUsers,
  type SearchUserResult,
  galleryImageUrlToFile,
  mapDiscoverEventBadge,
  resolveUserLocation,
  resolveImageUrl,
  googleMapsUrl,
  searchPlaceSuggestions,
  formatGpsLocationLabel,
  type GeocodedPlace,
} from '@doevents/shared';
import { ProfileGalleryPickerSheet } from '@doevents/shared';
import UserMentionAutocomplete from './UserMentionAutocomplete';
import FeedLocationMapDialog from './FeedLocationMapDialog';

export type FeedPostCategory = 'publicacion' | 'evento' | 'servicio' | 'lugar';

export interface FeedCreatePostSubmitData {
  title: string;
  description: string;
  visibility?: string;
  mediaIds?: string[];
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  mentions?: FeedMention[];
  /** Solo edición: indica si la multimedia cambió y debe reemplazarse. */
  mediaChanged?: boolean;
}

interface FeedCreatePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FeedCreatePostSubmitData) => Promise<void>;
  onOpenStorySheet?: () => void;
  mode?: 'create' | 'edit';
  initialPublication?: FeedPublication | null;
}

interface PickerItem {
  id: string;
  title: string;
  image?: string;
  subtitle?: string;
  location?: string;
}

const CATEGORY_OPTIONS: Array<{ value: FeedPostCategory; label: string; helper: string }> = [
  { value: 'publicacion', label: 'Publicación', helper: 'Comparte un estado con fotos o videos en el Feed.' },
  { value: 'evento', label: 'Evento', helper: 'Promociona un evento próximo con fecha y ubicación.' },
  { value: 'servicio', label: 'Servicio', helper: 'Ofrece un servicio profesional a la comunidad.' },
  { value: 'lugar', label: 'Lugar', helper: 'Recomienda o promociona un lugar para visitar.' },
];

const PICKER_META: Record<Exclude<FeedPostCategory, 'publicacion'>, {
  title: string;
  subtitle: string;
  empty: string;
  searchPlaceholder: string;
}> = {
  evento: {
    title: 'Seleccionar Evento',
    subtitle: 'Busca cualquier evento de DoEvents para etiquetarlo',
    empty: 'Escribe para buscar eventos en toda la plataforma.',
    searchPlaceholder: 'Buscar evento por nombre',
  },
  servicio: {
    title: 'Seleccionar Servicio',
    subtitle: 'Busca un servicio para etiquetarlo en el feed',
    empty: 'Escribe para buscar servicios, o revisa los tuyos abajo.',
    searchPlaceholder: 'Buscar servicio por nombre',
  },
  lugar: {
    title: 'Seleccionar Lugar',
    subtitle: 'Busca un lugar para etiquetarlo en el feed',
    empty: 'Escribe para buscar lugares, o revisa los tuyos abajo.',
    searchPlaceholder: 'Buscar lugar por nombre',
  },
};

const MAX_MEDIA = 6;

function resolveHandle(user: SearchUserResult): string {
  const label = user.name || user.nombreCompleto || user.username || user.user || 'usuario';
  const handleRaw = (user.username || user.user || label).replace(/^@/, '').trim();
  if (handleRaw.includes(' ')) {
    return label.replace(/\s+/g, '');
  }
  return handleRaw;
}

function isVideoPreview(src: string) {
  return src.startsWith('data:video/') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

function inferCategoryFromPublication(pub: FeedPublication): FeedPostCategory {
  for (const mention of pub.mentions || []) {
    const type = String(mention.mentionType || mention.type || '').toLowerCase();
    if (type === 'event' || mention.eventId) return 'evento';
    if (type === 'service') return 'servicio';
    if (type === 'venue') return 'lugar';
  }
  return 'publicacion';
}

function inferSelectedRefFromPublication(pub: FeedPublication): PickerItem | null {
  const category = inferCategoryFromPublication(pub);
  if (category === 'publicacion') return null;
  const mention = (pub.mentions || []).find((entry) => {
    const type = String(entry.mentionType || entry.type || '').toLowerCase();
    if (category === 'evento') return type === 'event' || Boolean(entry.eventId);
    if (category === 'servicio') return type === 'service';
    if (category === 'lugar') return type === 'venue';
    return false;
  });
  if (!mention) return null;
  const id = String(
    mention.eventId
    || mention.targetId
    || mention.metadata?.eventId
    || mention.metadata?.serviceId
    || mention.metadata?.venueId
    || '',
  ).trim();
  if (!id) return null;
  const image = resolveImageUrl(
    String(mention.metadata?.imageUrl || mention.metadata?.mainImage || '') || undefined,
  ) || undefined;
  return {
    id,
    title: String(mention.title || mention.name || pub.title || 'Sin título'),
    subtitle: mention.dateLabel || undefined,
    location: mention.locationLabel || pub.locationLabel || undefined,
    image,
  };
}

function extractPublicationMedia(pub: FeedPublication): {
  mediaIds: string[];
  previews: Array<{ src: string; kind: 'image' | 'video' }>;
} {
  const mediaItems = Array.isArray(pub.media) ? pub.media : [];
  const mediaIds = mediaItems
    .map((item) => String(item.mediaId || '').trim())
    .filter(Boolean);
  const previews = mediaItems
    .map((item) => {
      const src = resolveImageUrl(item.url) || item.url;
      if (!src) return null;
      const kind = String(item.kind || '').toLowerCase().includes('video') || isVideoPreview(src)
        ? 'video' as const
        : 'image' as const;
      return { src, kind };
    })
    .filter((item): item is { src: string; kind: 'image' | 'video' } => Boolean(item));

  if (previews.length) return { mediaIds, previews };

  const fallbackUrls = [
    ...(Array.isArray(pub.images) ? pub.images : []),
    pub.imageUrl,
  ].filter((url): url is string => Boolean(url));
  return {
    mediaIds,
    previews: fallbackUrls.map((src) => ({
      src: resolveImageUrl(src) || src,
      kind: isVideoPreview(src) ? 'video' as const : 'image' as const,
    })),
  };
}

async function resolveUserMentionsFromDescription(
  text: string,
  pickedUsers: Map<string, SearchUserResult>,
): Promise<FeedMention[]> {
  const mentions: FeedMention[] = [];
  const regex = /@([\wáéíóúñüÁÉÍÓÚÑÜ][\wáéíóúñüÁÉÍÓÚÑÜ\-]*)/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = regex.exec(text))) {
    const handle = match[1].toLowerCase();
    if (seen.has(handle)) continue;

    let user = pickedUsers.get(handle);
    if (!user?.id) {
      try {
        const results = await searchUsers(match[1]);
        user = results.find((candidate) => {
          const candidateHandle = resolveHandle(candidate).toLowerCase();
          const candidateName = (candidate.name || candidate.nombreCompleto || '').toLowerCase().replace(/\s+/g, '');
          return candidateHandle === handle || candidateName === handle;
        });
      } catch {
        user = undefined;
      }
    }

    if (!user?.id) continue;
    seen.add(handle);

    mentions.push({
      mentionType: 'user',
      type: 'user',
      userId: user.id,
      targetId: user.id,
      tag: `@${resolveHandle(user)}`,
      username: resolveHandle(user),
      name: user.name || user.nombreCompleto || undefined,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return mentions;
}

const FeedCreatePostSheet = ({
  open,
  onOpenChange,
  onSubmit,
  mode = 'create',
  initialPublication = null,
}: FeedCreatePostSheetProps) => {
  const isEdit = mode === 'edit';
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [category, setCategory] = useState<FeedPostCategory>('publicacion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ src: string; kind: 'image' | 'video' }>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [debouncedPickerQuery, setDebouncedPickerQuery] = useState('');
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<PickerItem | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [descCursor, setDescCursor] = useState(0);
  const [pickedUsers, setPickedUsers] = useState<Map<string, SearchUserResult>>(new Map());
  const [mediaDirty, setMediaDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const hydratedEditId = useRef<string | null>(null);
  const closingGuard = useRef(false);

  const needsEntity = category !== 'publicacion';
  const helper = CATEGORY_OPTIONS.find((o) => o.value === category)?.helper ?? '';

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPickerQuery(pickerQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [pickerQuery]);

  useEffect(() => {
    if (!open || !isEdit || !initialPublication) return;
    if (hydratedEditId.current === initialPublication.id) return;
    hydratedEditId.current = initialPublication.id;

    const nextCategory = inferCategoryFromPublication(initialPublication);
    const nextRef = inferSelectedRefFromPublication(initialPublication);
    const media = extractPublicationMedia(initialPublication);
    const location = initialPublication.locationLabel || '';
    const vis = String(initialPublication.visibility || 'PUBLIC').toUpperCase() === 'PRIVATE'
      ? 'PRIVATE' as const
      : 'PUBLIC' as const;

    setCategory(nextCategory);
    setSelectedRef(nextRef);
    // Título libre de la publicación; el nombre de la entidad vive en selectedRef / mentions.
    setTitle(initialPublication.title || '');
    setDescription(initialPublication.description || '');
    setLocationQuery(location);
    setLocationLabel(location);
    setLatitude(initialPublication.latitude);
    setLongitude(initialPublication.longitude);
    setVisibility(vis);
    setMediaIds(media.mediaIds);
    setMediaPreviews(media.previews);
    setMediaDirty(false);
    setUploadError(null);
    setPickerOpen(false);
    setPickerQuery('');
  }, [open, isEdit, initialPublication]);

  useEffect(() => {
    if (!open || !needsEntity || !pickerOpen) {
      if (!pickerOpen) {
        setPickerItems([]);
        setPickerError(null);
      }
      return;
    }

    let cancelled = false;
    setLoadingPicker(true);
    setPickerError(null);

    (async () => {
      try {
        let items: PickerItem[] = [];
        const query = debouncedPickerQuery;

        if (category === 'evento') {
          if (query) {
            const res = await searchEvents(query);
            items = (res.items || []).map((ev) => ({
              id: String(ev.id || ''),
              title: ev.nombre || 'Evento',
              subtitle: [ev.fechaIni, ev.ciudad].filter(Boolean).join(' · '),
              location: ev.ciudad || '',
              image: resolveImageUrl(ev.imagen) || undefined,
            }));
          } else if (userId) {
            const res = await fetchUserEvents(userId, { allEvents: true, forceNetwork: true });
            items = (res.data?.datosEvento || [])
              .filter((ev) => {
                const status = mapDiscoverEventBadge({
                  estatus: ev.estatus,
                  fechaIni: ev.fechaIni,
                  fechaFin: ev.fechaFin,
                  horaIni: ev.horaIni,
                  horaFin: ev.horaFin,
                });
                return status !== 'borrador' && status !== 'inactivo';
              })
              .map((ev) => ({
                id: String(ev.id || ''),
                title: ev.nombre || 'Evento',
                subtitle: [ev.fechaIni, ev.ciudad].filter(Boolean).join(' · '),
                location: ev.ciudad || '',
                image: resolveImageUrl(ev.imagen) || undefined,
              }));
          }
        } else if (category === 'servicio') {
          if (query) {
            const services = await searchServices(query);
            items = (services || []).map((svc) => ({
              id: String(svc.serviceId || ''),
              title: svc.name || svc.category || 'Servicio',
              subtitle: svc.city || svc.category || '',
              location: svc.city || '',
              image: resolveImageUrl(svc.profileImageUrl || svc.gallery?.[0]) || undefined,
            }));
          } else if (userId) {
            const services = await fetchServicesByUserId(userId, { forceNetwork: true });
            items = (services || []).map((svc) => {
              const raw = svc as { serviceId?: string; id?: string };
              return {
                id: String(raw.serviceId || raw.id || ''),
                title: svc.name || svc.category || 'Servicio',
                subtitle: svc.city || svc.category || '',
                location: svc.city || '',
                image: resolveImageUrl(svc.profileImageUrl || svc.gallery?.[0]) || undefined,
              };
            });
          }
        } else if (category === 'lugar') {
          if (query) {
            const venues = await searchVenues(query);
            items = (venues || []).map((v) => ({
              id: v.venueId,
              title: v.name || 'Lugar',
              subtitle: v.city || '',
              location: v.city || v.address || '',
              image: resolveImageUrl(v.mainImage || v.imageUrls?.[0]) || undefined,
            }));
          } else if (userId) {
            const venues = await listUserVenues(userId);
            items = venues.map((v) => ({
              id: v.venueId,
              title: v.name || 'Lugar',
              subtitle: v.city || '',
              location: v.city || '',
              image: resolveImageUrl(v.mainImage || v.imageUrls?.[0]) || undefined,
            }));
          }
        }

        if (!cancelled) {
          const filtered = items.filter((i) => i.id);
          setPickerItems(filtered);
          if (!filtered.length) {
            setPickerError(
              query
                ? `No se encontraron resultados para “${query}”.`
                : PICKER_META[category].empty,
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setPickerItems([]);
          setPickerError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo');
        }
      } finally {
        if (!cancelled) setLoadingPicker(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, userId, category, needsEntity, pickerOpen, debouncedPickerQuery]);

  const filteredPickerItems = pickerItems;

  const resetForm = () => {
    hydratedEditId.current = null;
    setCategory('publicacion');
    setTitle('');
    setDescription('');
    setLocationQuery('');
    setLocationLabel('');
    setLatitude(undefined);
    setLongitude(undefined);
    setSuggestions([]);
    setMediaIds([]);
    setMediaPreviews([]);
    setMediaDirty(false);
    setVisibility('PUBLIC');
    setSelectedRef(null);
    setPickerOpen(false);
    setPickerQuery('');
    setDebouncedPickerQuery('');
    setPickerItems([]);
    setPickerError(null);
    setUploadError(null);
    setPickedUsers(new Map());
  };

  const isDirty = () => Boolean(
    title.trim()
    || description.trim()
    || locationQuery.trim()
    || mediaIds.length
    || selectedRef,
  );

  const hasNestedOverlay = pickerOpen || galleryOpen || mapPickerOpen || discardOpen;

  const requestClose = () => {
    if (submitting || closingGuard.current) return;
    if (pickerOpen || galleryOpen || mapPickerOpen) return;
    if (!isDirty()) {
      resetForm();
      onOpenChange(false);
      return;
    }
    setDiscardOpen(true);
  };

  const confirmDiscard = () => {
    closingGuard.current = true;
    setDiscardOpen(false);
    resetForm();
    onOpenChange(false);
    // Liberar el guard en el siguiente tick (tras cerrar el drawer)
    setTimeout(() => { closingGuard.current = false; }, 300);
  };

  const handleCategoryChange = (next: FeedPostCategory) => {
    setCategory(next);
    setSelectedRef(null);
    setPickerQuery('');
    if (next !== 'publicacion') {
      setPickerOpen(true);
    } else {
      setPickerOpen(false);
    }
  };

  const handlePickItem = (item: PickerItem) => {
    setSelectedRef(item);
    // El título/descripción de la publicación son libres; la cápsula usa selectedRef (nombre original).
    if (item.location && !locationQuery.trim()) {
      setLocationQuery(item.location);
      setLocationLabel(item.location);
    }
    if (item.image && !mediaPreviews.some((m) => m.src === item.image)) {
      void (async () => {
        try {
          setUploading(true);
          const file = await galleryImageUrlToFile(item.image!, 'entity-cover.jpg');
          const mediaId = await uploadMediaFile(file);
          setMediaDirty(true);
          setMediaIds((prev) => [mediaId, ...prev].slice(0, MAX_MEDIA));
          setMediaPreviews((prev) => [{ src: item.image!, kind: 'image' }, ...prev].slice(0, MAX_MEDIA));
        } catch {
          setMediaDirty(true);
          setMediaPreviews((prev) => [{ src: item.image!, kind: 'image' }, ...prev].slice(0, MAX_MEDIA));
        } finally {
          setUploading(false);
        }
      })();
    }
    setPickerOpen(false);
    setPickerQuery('');
  };

  const applyMention = (user: SearchUserResult, mentionStart: number, mentionEnd: number) => {
    const handle = resolveHandle(user);
    const mentionTag = `@${handle}`;
    const before = description.slice(0, mentionStart);
    const after = description.slice(mentionEnd);
    const next = `${before}${mentionTag} ${after}`;
    setDescription(next);
    setPickedUsers((prev) => new Map(prev).set(handle.toLowerCase(), user));
    const nextCursor = mentionStart + mentionTag.length + 1;
    setDescCursor(nextCursor);
    setTimeout(() => {
      descRef.current?.focus();
      descRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const buildEntityMentions = (): FeedMention[] => {
    if (!selectedRef) return [];
    if (category === 'evento') {
      return [{
        mentionType: 'event',
        type: 'event',
        eventId: selectedRef.id,
        targetId: selectedRef.id,
        name: selectedRef.title,
        title: selectedRef.title,
        dateLabel: selectedRef.subtitle,
        locationLabel: selectedRef.location,
        metadata: { imageUrl: selectedRef.image, eventId: selectedRef.id },
      }];
    }
    if (category === 'servicio') {
      return [{
        mentionType: 'service',
        type: 'service',
        targetId: selectedRef.id,
        name: selectedRef.title,
        title: selectedRef.title,
        locationLabel: selectedRef.location || selectedRef.subtitle,
        metadata: { imageUrl: selectedRef.image, serviceId: selectedRef.id },
      }];
    }
    if (category === 'lugar') {
      return [{
        mentionType: 'venue',
        type: 'venue',
        targetId: selectedRef.id,
        name: selectedRef.title,
        title: selectedRef.title,
        locationLabel: selectedRef.location || selectedRef.subtitle,
        metadata: {
          venueId: selectedRef.id,
          imageUrl: selectedRef.image,
          mainImage: selectedRef.image,
          imageUrls: selectedRef.image ? [selectedRef.image] : undefined,
        },
      }];
    }
    return [];
  };

  const uploadFilesToPost = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const nextIds = [...mediaIds];
      const nextPreviews = [...mediaPreviews];
      for (const file of files.slice(0, MAX_MEDIA - nextIds.length)) {
        const mediaId = await uploadMediaFile(file);
        nextIds.push(mediaId);
        nextPreviews.push({
          src: URL.createObjectURL(file),
          kind: file.type.startsWith('video/') ? 'video' : 'image',
        });
      }
      setMediaIds(nextIds);
      setMediaPreviews(nextPreviews);
      setMediaDirty(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryImages = async (urls: string[]) => {
    if (!urls.length || mediaIds.length >= MAX_MEDIA) return;
    setUploading(true);
    setUploadError(null);
    try {
      const remaining = MAX_MEDIA - mediaIds.length;
      const picked = urls.slice(0, remaining);
      const files = await Promise.all(
        picked.map((url, index) => galleryImageUrlToFile(url, `gallery-post-${index + 1}.jpg`)),
      );
      await uploadFilesToPost(files);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo usar la imagen de la galería');
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaDirty(true);
    setMediaIds((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationInput = (value: string) => {
    setLocationQuery(value);
    setShowSuggestions(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      const items = await searchPlaceSuggestions(value, 5);
      setSuggestions(items);
    }, 280);
  };

  const applyLocation = (place: GeocodedPlace) => {
    const label = formatGpsLocationLabel({
      label: place.label,
      city: place.city,
      departamento: place.departamento,
      lat: place.lat,
      lng: place.lng,
    });
    setLocationQuery(label);
    setLocationLabel(label);
    setLatitude(place.lat);
    setLongitude(place.lng);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const applyMapLocation = (payload: { lat: number; lng: number; label: string }) => {
    setLocationQuery(payload.label);
    setLocationLabel(payload.label);
    setLatitude(payload.lat);
    setLongitude(payload.lng);
    setShowSuggestions(false);
  };

  const useDeviceLocation = async () => {
    setLocating(true);
    try {
      const loc = await resolveUserLocation({ prompt: true, force: true, deviceOnly: true });
      if (!loc) return;
      const label = formatGpsLocationLabel({
        label: loc.label,
        city: loc.city,
        departamento: loc.departamento,
        lat: loc.lat,
        lng: loc.lng,
      });
      setLocationQuery(label);
      setLocationLabel(label);
      setLatitude(loc.lat);
      setLongitude(loc.lng);
      setShowSuggestions(false);
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (needsEntity && !selectedRef) return;
    if (!needsEntity && !description.trim() && mediaIds.length === 0) return;

    setSubmitting(true);
    try {
      const userMentions = await resolveUserMentionsFromDescription(description, pickedUsers);
      const entityMentions = buildEntityMentions();
      const mentions = [...entityMentions, ...userMentions];
      const trimmedDescription = description.trim();

      await onSubmit({
        title: title.trim() || selectedRef?.title || '',
        description: trimmedDescription || selectedRef?.title || '',
        visibility,
        mediaIds: mediaIds.length ? mediaIds : undefined,
        locationLabel: locationLabel || locationQuery.trim() || undefined,
        latitude,
        longitude,
        mentions: mentions.length ? mentions : undefined,
        mediaChanged: isEdit ? mediaDirty : true,
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const mapsHref = latitude != null && longitude != null
    ? googleMapsUrl(latitude, longitude, locationLabel || locationQuery)
    : null;

  const canSubmit = needsEntity
    ? Boolean(selectedRef)
    : Boolean(description.trim() || mediaIds.length);

  if (!open) return null;

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) return;
          // No cerrar el sheet si hay overlays anidados o ya estamos en flujo de descarte.
          if (hasNestedOverlay || closingGuard.current) return;
          requestClose();
        }}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="flex flex-row items-start justify-between pb-2 text-left">
              <DrawerTitle className="text-xl font-bold">
                {isEdit ? 'Editar publicación' : 'Vitrina del Feed'}
              </DrawerTitle>
              <button
                type="button"
                onClick={requestClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </DrawerHeader>

            <div className="max-h-[72vh] overflow-y-auto px-4 pb-6">
              <p className="mb-4 text-sm text-muted-foreground">
                {isEdit
                  ? 'Actualiza el tipo, la entidad etiquetada, el contenido y la multimedia de tu publicación.'
                  : 'Promociona tus eventos, servicios y lugares ante la comunidad. Las publicaciones admiten me gusta, comentarios y contacto directo.'}
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-card-foreground" htmlFor="feed-create-kind">
                    Tipo de publicación
                  </label>
                  <Select value={category} onValueChange={(v) => handleCategoryChange(v as FeedPostCategory)}>
                    <SelectTrigger id="feed-create-kind" className="bg-muted/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{helper}</p>
                </div>

                {needsEntity && (
                  selectedRef ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                      {selectedRef.image ? (
                        <img src={selectedRef.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">
                          {category === 'evento' ? <Calendar className="h-5 w-5" /> : category === 'servicio' ? <Briefcase className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-primary/80">
                          {category === 'evento' ? 'Evento' : category === 'servicio' ? 'Servicio' : 'Lugar'} · cápsula
                        </p>
                        <p className="truncate text-sm font-semibold text-card-foreground">{selectedRef.title}</p>
                        {selectedRef.subtitle ? (
                          <p className="truncate text-xs text-muted-foreground">{selectedRef.subtitle}</p>
                        ) : null}
                        {selectedRef.location ? (
                          <p className="truncate text-[11px] text-muted-foreground">{selectedRef.location}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="shrink-0 rounded-full border border-primary/50 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
                    >
                      {PICKER_META[category].title}
                    </button>
                  )
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-card-foreground">
                    Título <span className="font-normal normal-case text-muted-foreground">(opcional)</span>
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
                      onClick={(e) => setDescCursor((e.target as HTMLTextAreaElement).selectionStart || 0)}
                      maxLength={2000}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:border-primary"
                    />
                    <UserMentionAutocomplete
                      inputValue={description}
                      cursorPosition={descCursor}
                      onSelect={applyMention}
                      anchorRef={descRef}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-card-foreground">
                    Ubicación <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Bogotá, Bogotá Colombia"
                    value={locationQuery}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    maxLength={120}
                    className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="overflow-hidden rounded-lg border border-border bg-popover shadow-sm">
                      {suggestions.map((place) => (
                        <li key={`${place.lat}-${place.lng}-${place.label}`}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => applyLocation(place)}
                          >
                            {place.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => void useDeviceLocation()}
                    disabled={locating}
                    className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-bold text-primary hover:underline disabled:opacity-60"
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen(true)}
                    className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-bold text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    Seleccionar en el mapa
                  </button>
                  {mapsHref ? (
                    <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Ver en Google Maps
                    </a>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => setVisibility('PUBLIC')}
                    className={cn(
                      'rounded-full py-2 text-sm font-semibold transition-colors',
                      visibility === 'PUBLIC'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Pública
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('PRIVATE')}
                    className={cn(
                      'rounded-full py-2 text-sm font-semibold transition-colors',
                      visibility === 'PRIVATE'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Solo seguidores
                  </button>
                </div>

                {mediaPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaPreviews.map((item, index) => (
                      <div key={`${item.src}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg">
                        {item.kind === 'video' || isVideoPreview(item.src) ? (
                          <video src={item.src} className="h-full w-full object-cover" muted preload="metadata" />
                        ) : (
                          <img src={item.src} alt="" className="h-full w-full object-cover" />
                        )}
                        {(item.kind === 'video' || isVideoPreview(item.src)) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/50">
                              <Video className="h-4 w-4 text-background" />
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={uploading || mediaIds.length >= MAX_MEDIA}
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-5 transition-all hover:border-primary hover:from-primary/10 hover:to-primary/20 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-card-foreground">Fotos o videos</span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {mediaIds.length}/{MAX_MEDIA} seleccionados
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={uploading || mediaIds.length >= MAX_MEDIA || !userId}
                    onClick={() => setGalleryOpen(true)}
                    className="group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-5 transition-all hover:border-primary hover:from-primary/10 hover:to-primary/20 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                      <Images className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-card-foreground">Mi galería</span>
                      <span className="text-[11px] font-medium text-muted-foreground">Elegir guardadas</span>
                    </div>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    void uploadFilesToPost(files);
                    e.target.value = '';
                  }}
                />

                {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || uploading || !canSubmit}
                  className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
                >
                  {submitting
                    ? (isEdit ? 'Guardando…' : 'Publicando…')
                    : (isEdit ? 'Guardar cambios' : 'Publicar')}
                </button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog
        open={pickerOpen && needsEntity}
        onOpenChange={(next) => {
          setPickerOpen(next);
          if (!next) setPickerQuery('');
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 p-0">
          <DialogHeader className="p-5 pb-2 text-center sm:text-center">
            <DialogTitle className="text-lg font-bold text-card-foreground">
              {PICKER_META[category as Exclude<FeedPostCategory, 'publicacion'>]?.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {PICKER_META[category as Exclude<FeedPostCategory, 'publicacion'>]?.subtitle}
            </p>
          </DialogHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder={PICKER_META[category as Exclude<FeedPostCategory, 'publicacion'>]?.searchPlaceholder}
                className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {pickerQuery ? (
                <button
                  type="button"
                  onClick={() => setPickerQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
            {loadingPicker ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </p>
            ) : pickerError && !pickerItems.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{pickerError}</p>
            ) : filteredPickerItems.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {PICKER_META[category as Exclude<FeedPostCategory, 'publicacion'>]?.empty}
              </p>
            ) : (
              <>
                {!debouncedPickerQuery && category === 'evento' ? (
                  <p className="text-xs text-muted-foreground">
                    Tus eventos aparecen abajo. Escribe para buscar cualquier evento de la plataforma.
                  </p>
                ) : null}
              {filteredPickerItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePickItem(item)}
                  className={cn(
                    'block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:border-primary hover:shadow-md',
                    selectedRef?.id === item.id && 'border-primary ring-2 ring-primary/30',
                  )}
                >
                  <div className="relative h-32 w-full overflow-hidden bg-muted">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                        {category === 'evento' ? <Calendar className="h-10 w-10 opacity-60" /> : category === 'servicio' ? <Briefcase className="h-10 w-10 opacity-60" /> : <Home className="h-10 w-10 opacity-60" />}
                      </div>
                    )}
                    {selectedRef?.id === item.id ? (
                      <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 text-sm font-bold text-card-foreground">{item.title}</p>
                    {item.subtitle ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>
                    ) : null}
                    {item.location ? (
                      <p className="flex items-center gap-1 line-clamp-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {userId ? (
        <ProfileGalleryPickerSheet
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          userId={userId}
          mode="multiple"
          maxSelect={Math.max(1, MAX_MEDIA - mediaIds.length)}
          onConfirm={(items) => {
            void handleGalleryImages(items.map((item) => item.url));
            setGalleryOpen(false);
          }}
        />
      ) : null}

      <FeedLocationMapDialog
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialLat={latitude}
        initialLng={longitude}
        onConfirm={applyMapLocation}
      />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales ahora se perderán los cambios de esta publicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDiscard}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeedCreatePostSheet;
