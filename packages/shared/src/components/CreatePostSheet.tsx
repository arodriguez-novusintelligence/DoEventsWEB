import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, TextField } from './UI';
import {
  uploadMediaFile,
} from '../api/feedService';
import { galleryImageUrlToFile } from '../lib/galleryMediaUtils';
import { MediaSourcePicker } from './MediaSourcePicker';
import { fetchUserEvents } from '../api/eventsService';
import { mapDiscoverEventBadge } from '../lib/eventStatusUtils';
import { fetchServicesByUserId } from '../api/servicesService';
import { listUserVenues } from '../api/venueService';
import {
  googleMapsUrl,
  searchPlaceSuggestions,
  type GeocodedPlace,
} from '../lib/geocodePlace';
import { resolveDisplayLocation } from '../lib/formatMapLocation';
import { resolveUserLocation } from '../lib/userLocation';
import { resolveImageUrl } from '../lib/resolveImageUrl';
import { useToast } from './Toast';
import type { FeedMention } from '../types/feed';
import { searchUsers, type SearchUserResult } from '../api/searchService';
import type { RootState } from '../store/index';

export type CreatePostKind =
  | 'post'
  | 'story'
  | 'share_event'
  | 'share_service'
  | 'share_place';

export interface CreatePostSubmitData {
  title: string;
  description: string;
  visibility?: string;
  mediaIds?: string[];
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  type?: 'post' | 'story' | 'event' | 'service';
  mentions?: FeedMention[];
  mediaKind?: 'image' | 'video' | 'text';
  isLive?: boolean;
}

export interface CreatePostSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostSubmitData) => Promise<void>;
  onOpenStorySheet?: () => void;
}

interface ShareEntity {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;
}

const ENTITY_EMPTY_HINT: Record<string, string> = {
  share_event: 'Aún no tienes eventos publicados. Crea uno desde Eventos → Crear evento.',
  share_service: 'Aún no tienes servicios. Créalos desde tu perfil o Servicios.',
  share_place: 'Aún no tienes lugares. Publica uno desde Lugares.',
};

export const CreatePostSheet: React.FC<CreatePostSheetProps> = ({ open, onClose, onSubmit, onOpenStorySheet }) => {
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { showToast } = useToast();
  const [postKind, setPostKind] = useState<CreatePostKind>('post');
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
  const [entitySearch, setEntitySearch] = useState('');
  const [entities, setEntities] = useState<ShareEntity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [entityLoadError, setEntityLoadError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<ShareEntity | null>(null);
  const [descCursor, setDescCursor] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionSuggestions, setMentionSuggestions] = useState<SearchUserResult[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mentionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const POST_KIND_OPTIONS: Array<{ value: CreatePostKind; label: string }> = [
    { value: 'post', label: 'Publicación' },
    { value: 'story', label: 'Historia' },
    { value: 'share_event', label: 'Evento' },
    { value: 'share_service', label: 'Servicio' },
    { value: 'share_place', label: 'Lugar' },
  ];

  useEffect(() => {
    if (!open) return;
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (mentionTimer.current) clearTimeout(mentionTimer.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !userId) return;
    if (!['share_event', 'share_service', 'share_place'].includes(postKind)) {
      setEntities([]);
      setEntityLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadingEntities(true);
    setEntityLoadError(null);
    (async () => {
      try {
        let items: ShareEntity[] = [];
        if (postKind === 'share_event') {
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
            label: ev.nombre || 'Evento',
            subtitle: [ev.fechaIni, ev.ciudad].filter(Boolean).join(' · '),
            imageUrl: resolveImageUrl(ev.imagen) || undefined,
          }));
        } else if (postKind === 'share_service') {
          const services = await fetchServicesByUserId(userId, { forceNetwork: true });
          items = (services || []).map((svc) => {
            const raw = svc as { serviceId?: string; id?: string };
            return {
              id: String(raw.serviceId || raw.id || ''),
              label: svc.name || svc.category || 'Servicio',
              subtitle: svc.city || '',
              imageUrl: resolveImageUrl(svc.profileImageUrl || svc.gallery?.[0]) || undefined,
            };
          });
        } else {
          const venues = await listUserVenues(userId);
          items = venues.map((v) => ({
            id: v.venueId,
            label: v.name || 'Lugar',
            subtitle: v.city || '',
          }));
        }
        if (!cancelled) {
          setEntities(items.filter((i) => i.id));
          if (!items.filter((i) => i.id).length) {
            setEntityLoadError(ENTITY_EMPTY_HINT[postKind] || 'No hay elementos para compartir.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setEntities([]);
          setEntityLoadError(err instanceof Error ? err.message : 'No se pudo cargar tu catálogo');
        }
      } finally {
        if (!cancelled) setLoadingEntities(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, userId, postKind]);

  if (!open) return null;

  const resetForm = () => {
    setPostKind('post');
    setTitle('');
    setDescription('');
    setLocationQuery('');
    setLocationLabel('');
    setLatitude(undefined);
    setLongitude(undefined);
    setSuggestions([]);
    setMediaIds([]);
    setMediaPreviews([]);
    setVisibility('PUBLIC');
    setEntitySearch('');
    setEntities([]);
    setSelectedEntity(null);
    setEntityLoadError(null);
    setUploadError(null);
    setMentionSuggestions([]);
    setMentionStart(-1);
  };

  const isDirty = () => Boolean(
    title.trim()
    || description.trim()
    || locationQuery.trim()
    || mediaIds.length
    || selectedEntity,
  );

  const requestClose = () => {
    if (submitting) return;
    if (!isDirty()) {
      resetForm();
      onClose();
      return;
    }
    const save = window.confirm('Tienes cambios sin guardar. ¿Deseas guardarlos antes de salir?');
    if (save) {
      void handleSubmit().then(() => onClose()).catch(() => undefined);
      return;
    }
    if (window.confirm('¿Descartar los cambios de esta publicación?')) {
      resetForm();
      onClose();
    }
  };

  const detectMentionQuery = (value: string, cursor: number) => {
    const textBefore = value.slice(0, cursor);
    const match = textBefore.match(/(^|[^\wáéíóúñüÁÉÍÓÚÑÜ])@([\wáéíóúñüÁÉÍÓÚÑÜ\- ]*)$/i);
    if (!match) {
      setMentionStart(-1);
      setMentionSuggestions([]);
      return;
    }
    const start = textBefore.lastIndexOf('@');
    const query = match[2].trim();
    setMentionStart(start);
    if (mentionTimer.current) clearTimeout(mentionTimer.current);
    if (!query) {
      setMentionSuggestions([]);
      return;
    }
    mentionTimer.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query);
        setMentionSuggestions(users.slice(0, 6));
      } catch {
        setMentionSuggestions([]);
      }
    }, 220);
  };

  const applyMention = (user: SearchUserResult) => {
    if (mentionStart < 0) return;
    const handle = (user.username || user.user || user.name || 'usuario')
      .replace(/^@/, '')
      .replace(/\s+/g, '');
    const mentionTag = `@${handle}`;
    const before = description.slice(0, mentionStart);
    const after = description.slice(descCursor);
    const next = `${before}${mentionTag} ${after}`;
    setDescription(next);
    setMentionSuggestions([]);
    setMentionStart(-1);
    const nextCursor = mentionStart + mentionTag.length + 1;
    setDescCursor(nextCursor);
    setTimeout(() => {
      descRef.current?.focus();
      descRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  };

  const handleDescriptionChange = (value: string, cursor: number) => {
    setDescription(value);
    setDescCursor(cursor);
    if (postKind === 'post') detectMentionQuery(value, cursor);
  };

  const filteredEntities = entities.filter((item) => {
    const q = entitySearch.trim().toLowerCase();
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || (item.subtitle || '').toLowerCase().includes(q);
  });

  const buildMentions = (): FeedMention[] | undefined => {
    if (!selectedEntity) return undefined;
    if (postKind === 'share_event') {
      return [{
        mentionType: 'event',
        type: 'event',
        eventId: selectedEntity.id,
        targetId: selectedEntity.id,
        name: selectedEntity.label,
        title: selectedEntity.label,
        dateLabel: selectedEntity.subtitle,
        metadata: { imageUrl: selectedEntity.imageUrl, eventId: selectedEntity.id },
      }];
    }
    if (postKind === 'share_service') {
      return [{
        mentionType: 'service',
        type: 'service',
        targetId: selectedEntity.id,
        name: selectedEntity.label,
        title: selectedEntity.label,
        locationLabel: selectedEntity.subtitle,
        metadata: { imageUrl: selectedEntity.imageUrl, serviceId: selectedEntity.id },
      }];
    }
    if (postKind === 'share_place') {
      return [{
        mentionType: 'venue',
        type: 'venue',
        targetId: selectedEntity.id,
        name: selectedEntity.label,
        title: selectedEntity.label,
        locationLabel: selectedEntity.subtitle,
        metadata: { venueId: selectedEntity.id },
      }];
    }
    return undefined;
  };

  const resolvePublicationType = (): CreatePostSubmitData['type'] => 'post';

  const openStoryCreator = () => {
    resetForm();
    onClose();
    onOpenStorySheet?.();
  };

  const handleSubmit = async () => {
    const needsEntity = ['share_event', 'share_service', 'share_place'].includes(postKind);
    if (needsEntity && !selectedEntity) {
      showToast('Selecciona qué quieres promocionar en el feed', 'error');
      return;
    }
    if (!needsEntity && postKind === 'post' && !description.trim() && mediaIds.length === 0) {
      showToast('Agrega una descripción o al menos una imagen', 'error');
      return;
    }
    if (postKind === 'story') {
      openStoryCreator();
      return;
    }

    setSubmitting(true);
    try {
      const mentions = buildMentions();
      const sharePrefix = selectedEntity
        ? `Comparto ${postKind === 'share_event' ? 'mi evento' : postKind === 'share_service' ? 'mi servicio' : 'mi lugar'}: ${selectedEntity.label}. `
        : '';
      const payload: CreatePostSubmitData = {
        title: title.trim() || selectedEntity?.label || '',
        description: `${sharePrefix}${description.trim()}`.trim() || selectedEntity?.label || '',
        visibility,
        mediaIds: mediaIds.length ? mediaIds : undefined,
        locationLabel: locationLabel || locationQuery.trim() || undefined,
        latitude,
        longitude,
        mentions,
        type: resolvePublicationType(),
      };

      await onSubmit({ ...payload, type: 'post' });
      resetForm();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo publicar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const uploadFilesToPost = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const nextIds = [...mediaIds];
      const nextPreviews = [...mediaPreviews];
      for (const file of files) {
        const mediaId = await uploadMediaFile(file);
        nextIds.push(mediaId);
        nextPreviews.push({
          src: URL.createObjectURL(file),
          kind: file.type.startsWith('video/') ? 'video' : 'image',
        });
      }
      setMediaIds(nextIds);
      setMediaPreviews(nextPreviews);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryImages = async (urls: string[]) => {
    if (!urls.length || mediaIds.length >= 6) return;
    setUploading(true);
    setUploadError(null);
    try {
      const remaining = 6 - mediaIds.length;
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
    setLocationQuery(place.label);
    setLocationLabel(place.label);
    setLatitude(place.lat);
    setLongitude(place.lng);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const useDeviceLocation = async () => {
    setLocating(true);
    try {
      const loc = await resolveUserLocation({ prompt: true, force: true });
      if (!loc) return;
      const locationLabel = resolveDisplayLocation({
        label: loc.label,
        locationLabel: loc.label,
        ciudad: loc.city,
        departamento: loc.departamento,
      });
      const resolved = locationLabel !== '—'
        ? locationLabel
        : (loc.city || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
      setLocationQuery(resolved);
      setLocationLabel(resolved);
      setLatitude(loc.lat);
      setLongitude(loc.lng);
      setShowSuggestions(false);
    } finally {
      setLocating(false);
    }
  };

  const mapsHref = latitude != null && longitude != null
    ? googleMapsUrl(latitude, longitude, locationLabel || locationQuery)
    : null;

  const needsEntity = ['share_event', 'share_service', 'share_place'].includes(postKind);
  const canSubmit = postKind === 'story'
    ? true
    : needsEntity
      ? Boolean(selectedEntity)
      : Boolean(description.trim() || mediaIds.length);

  const entityPickerLabel = postKind === 'share_event'
    ? 'Elige el evento que quieres promocionar'
    : postKind === 'share_service'
      ? 'Elige el servicio que quieres promocionar'
      : 'Elige el lugar que quieres promocionar';

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={requestClose} role="presentation">
      <div className="de-sheet de-sheet--tall" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <h2>Vitrina del Feed</h2>
          <button type="button" className="de-sheet__close" onClick={requestClose}>×</button>
        </header>
        <div className="de-sheet__body de-form-stack">
          <p className="de-form-hint">
            Promociona tus eventos, servicios y lugares ante la comunidad. Las publicaciones admiten me gusta, comentarios y contacto directo.
          </p>

          <div className="de-form-stack">
            <label className="de-form-label" htmlFor="create-post-kind">Tipo de publicación</label>
            <select
              id="create-post-kind"
              className="de-form-input"
              value={postKind}
              onChange={(e) => {
                const kind = e.target.value as CreatePostKind;
                if (kind === 'story') {
                  openStoryCreator();
                  return;
                }
                setPostKind(kind);
                setSelectedEntity(null);
                setEntityLoadError(null);
              }}
            >
              {POST_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {postKind === 'post' && (
              <p className="de-form-hint">Comparte un estado con fotos o videos en el Feed.</p>
            )}
            {postKind === 'story' && (
              <p className="de-form-hint">
                Las historias se publican en tu globo de perfil, no en el Feed. Usa el editor de historias.
              </p>
            )}
            {needsEntity && (
              <p className="de-form-hint">Selecciona de tu catálogo qué quieres promocionar en el Feed.</p>
            )}
          </div>

          {postKind !== 'story' && needsEntity && (
            <div className="de-form-stack">
              <label className="de-form-label">{entityPickerLabel}</label>
              <input
                className="de-form-input"
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                placeholder="Buscar en tu catálogo..."
              />
              {loadingEntities && <p className="de-form-hint">Cargando tu catálogo…</p>}
              {entityLoadError && !loadingEntities && (
                <p className="de-form-hint" style={{ color: 'var(--destructive)' }}>{entityLoadError}</p>
              )}
              {!loadingEntities && filteredEntities.length > 0 && (
                <ul className="de-location-suggestions">
                  {filteredEntities.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={selectedEntity?.id === item.id ? 'is-selected' : ''}
                        onClick={() => setSelectedEntity(item)}
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="de-post-card__media"
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', marginRight: 8 }}
                          />
                        )}
                        <span>
                          <strong>{item.label}</strong>
                          {item.subtitle && <small>{item.subtitle}</small>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedEntity && (
                <div className="de-form-hint" style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--accent)' }}>
                  Seleccionado: <strong>{selectedEntity.label}</strong>
                </div>
              )}
            </div>
          )}

          <TextField
            label="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="bordered"
            placeholder={needsEntity ? 'Título de la promoción' : 'Dale un título a tu publicación'}
          />
          {postKind === 'post' ? (
            <div className="de-form-stack" style={{ position: 'relative' }}>
              <label className="de-form-label" htmlFor="create-post-content">Contenido</label>
              <textarea
                id="create-post-content"
                ref={descRef}
                className="de-form-input"
                rows={4}
                value={description}
                placeholder="Escribe tu publicación. Usa @ para mencionar usuarios."
                onChange={(e) => handleDescriptionChange(e.target.value, e.target.selectionStart || 0)}
                onClick={(e) => setDescCursor((e.target as HTMLTextAreaElement).selectionStart || 0)}
                onKeyUp={(e) => setDescCursor((e.target as HTMLTextAreaElement).selectionStart || 0)}
              />
              {mentionSuggestions.length > 0 && mentionStart >= 0 && (
                <ul className="de-location-suggestions" style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', zIndex: 20, marginBottom: 4 }}>
                  {mentionSuggestions.map((user) => {
                    const label = user.name || user.username || user.user || 'Usuario';
                    const handle = (user.username || user.user || label).replace(/^@/, '');
                    return (
                      <li key={user.id || handle}>
                        <button type="button" onClick={() => applyMention(user)}>
                          <span>
                            <strong>@{handle}</strong>
                            {label !== handle && <small>{label}</small>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <TextField
              label={needsEntity ? 'Mensaje promocional' : 'Contenido'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="bordered"
              placeholder="Cuéntale a la comunidad por qué deberían conocer esto..."
            />
          )}

          <div className="de-form-stack">
            <label className="de-form-label">Ubicación (opcional)</label>
            <div className="de-form-row">
              <input
                className="de-form-input de-form-input--grow"
                value={locationQuery}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ej: Bogotá, Bogotá Colombia"
              />
              <button
                type="button"
                className="de-access-btn de-access-btn--ghost"
                disabled={locating}
                onClick={() => void useDeviceLocation()}
              >
                {locating ? '…' : 'GPS'}
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="de-location-suggestions">
                {suggestions.map((s) => (
                  <li key={`${s.lat}-${s.lng}-${s.label}`}>
                    <button type="button" onClick={() => applyLocation(s)}>
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="de-form-link"
              >
                Ver en Google Maps
              </a>
            )}
          </div>

          <div className="de-form-row de-form-row--wrap">
            <button
              type="button"
              className={`de-chip${visibility === 'PUBLIC' ? ' de-chip--active' : ''}`}
              onClick={() => setVisibility('PUBLIC')}
            >
              Pública
            </button>
            <button
              type="button"
              className={`de-chip${visibility === 'PRIVATE' ? ' de-chip--active' : ''}`}
              onClick={() => setVisibility('PRIVATE')}
            >
              Solo seguidores
            </button>
          </div>

          <MediaSourcePicker
            userId={userId}
            multiple
            maxCount={6}
            currentCount={mediaIds.length}
            accept="image/*,video/*"
            disabled={uploading || mediaIds.length >= 6}
            deviceLabel={uploading ? 'Subiendo…' : `Fotos o videos (${mediaIds.length}/6)`}
            galleryLabel="Mi galería"
            onFiles={(files) => { void uploadFilesToPost(files); }}
            onGallerySelect={(items) => { void handleGalleryImages(items.map((item) => item.url)); }}
          />
          {uploadError && <p className="de-form-hint" style={{ color: 'var(--destructive)' }}>{uploadError}</p>}
          {mediaPreviews.length > 0 && (
            <div className="de-post-media-grid">
              {mediaPreviews.map((item, index) => (
                <div key={`${item.src}-${index}`} className="de-post-media-grid__item">
                  {item.kind === 'video' ? (
                    <video src={item.src} className="de-post-card__media" controls muted />
                  ) : (
                    <img src={item.src} alt="" className="de-post-card__media" />
                  )}
                  <button type="button" className="de-post-media-grid__remove" onClick={() => removeMedia(index)}>×</button>
                </div>
              ))}
            </div>
          )}

          <Button
            label={
              submitting
                ? 'Publicando...'
                : postKind === 'story'
                  ? 'Abrir editor de historias'
                  : needsEntity
                    ? 'Promocionar en el Feed'
                    : 'Publicar'
            }
            tone="lovable"
            disabled={submitting || uploading || !canSubmit}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};
