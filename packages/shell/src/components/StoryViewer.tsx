import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Sparkles, X } from 'lucide-react';
import {
  FeedStoryItem,
  Loader,
  UserAvatar,
  cacheUserStories,
  deletePublication,
  dispatchStoriesCacheInvalidated,
  fetchUserStories,
  getCachedUserStories,
  resolveImageUrl,
  shareStoryAsPublication,
  useToast,
} from '@doevents/shared';
import { StoryViewersSheet } from '@lovable/components/feed/StoryViewersSheet';

export interface StoryViewerProps {
  open: boolean;
  authorUserId: string | null;
  currentUserId?: string | null;
  onClose: () => void;
  onStoriesChanged?: () => void;
}

const STORY_DURATION_MS = 5000;

const DISABLED_MENU_ITEMS = [
  'Editar historia',
  'Archivar',
  'Historia destacada',
  'Guardar…',
  'Configuración de la historia',
  'Desactivar comentarios',
];

function inferStoryMediaKind(item: FeedStoryItem): 'image' | 'video' | 'text' {
  if (item.mediaKind) return item.mediaKind;
  if (item.isLive) return 'video';
  const url = item.mediaUrl || '';
  if (/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) return 'video';
  return url ? 'image' : 'text';
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  open,
  authorUserId,
  currentUserId,
  onClose,
  onStoriesChanged,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'delete' | 'share' | null>(null);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [stories, setStories] = useState<FeedStoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [mediaFailed, setMediaFailed] = useState(false);

  const loadStories = useCallback(async (userId: string, preferCache = true) => {
    if (preferCache) {
      const cached = getCachedUserStories(userId);
      if (cached?.length) {
        setStories(cached);
        setLoading(false);
      }
    }
    const items = await fetchUserStories(userId);
    cacheUserStories(userId, items);
    setStories(items);
    setIndex((prev) => (items.length ? Math.min(prev, items.length - 1) : 0));
    return items;
  }, []);

  useEffect(() => {
    if (!open || !authorUserId) return;
    let cancelled = false;
    setLoading(true);
    setIndex(0);
    setMenuOpen(false);
    setViewersOpen(false);
    setMediaFailed(false);
    void loadStories(authorUserId, true)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, authorUserId, loadStories]);

  useEffect(() => {
    if (!open || !authorUserId) return;
    const hasLive = stories.some((story) => story.isLive);
    if (!hasLive) return;
    const timer = window.setInterval(() => {
      void loadStories(authorUserId, false).catch(() => undefined);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [open, authorUserId, stories, loadStories]);

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (current < stories.length - 1) return current + 1;
      onClose();
      return current;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current > 0 ? current - 1 : current));
  }, []);

  const current = stories[index];
  const mediaKind = current ? inferStoryMediaKind(current) : 'text';
  const mediaUrl = current?.mediaUrl ? resolveImageUrl(current.mediaUrl) : undefined;
  const isVideo = mediaKind === 'video';
  const storyAuthorId = current?.authorId || authorUserId || '';
  const canManage = Boolean(
    currentUserId && current && storyAuthorId === currentUserId,
  );

  useEffect(() => {
    setMediaFailed(false);
  }, [current?.id, mediaUrl]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  const closeMenu = () => setMenuOpen(false);

  const handleDelete = async () => {
    if (!current || !canManage || busyAction) return;
    closeMenu();
    const confirmed = window.confirm('¿Eliminar esta historia?');
    if (!confirmed) return;

    setBusyAction('delete');
    try {
      await deletePublication(current.id);
      showToast('Historia eliminada', 'success');
      dispatchStoriesCacheInvalidated(authorUserId || undefined);
      onStoriesChanged?.();
      const remaining = stories.filter((story) => story.id !== current.id);
      if (!remaining.length) {
        onClose();
        return;
      }
      setStories(remaining);
      setIndex((prev) => Math.min(prev, remaining.length - 1));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar la historia', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleShareAsPublication = async () => {
    if (!current || !canManage || busyAction) return;
    closeMenu();
    setBusyAction('share');
    try {
      await shareStoryAsPublication({
        description: current.description,
        mediaIds: current.mediaIds,
        locationLabel: current.locationLabel,
        latitude: current.latitude,
        longitude: current.longitude,
      });
      showToast('Historia compartida en el Feed', 'success');
      onStoriesChanged?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo compartir la historia', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  useEffect(() => {
    if (!open || loading || !current || isVideo || busyAction || menuOpen || mediaFailed) return;
    const timer = window.setTimeout(goNext, STORY_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [open, loading, current, isVideo, index, goNext, busyAction, menuOpen, mediaFailed]);

  if (!open || !authorUserId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
    >
      {loading && !stories.length && (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      )}

      {!loading && !stories.length && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20">
            <Sparkles className="h-7 w-7 text-white/80" />
          </div>
          <p className="text-sm text-white/80">No hay historias activas de este usuario.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-6 py-2 text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>
      )}

      {!loading && current && (
        <>
          <header className="absolute inset-x-0 top-0 z-20 px-3 pb-3 pt-4">
            <div className="mb-3 flex gap-1 px-1">
              {stories.map((story, i) => (
                <span
                  key={story.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <span
                    className={`block h-full rounded-full bg-white transition-all duration-300 ${
                      i < index ? 'w-full' : i === index ? 'w-full animate-pulse' : 'w-0'
                    }`}
                  />
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex min-w-0 items-center gap-2"
                onClick={() => navigate(`/users/${authorUserId}`)}
              >
                <UserAvatar name={current.authorName} imageUrl={current.authorAvatar} size={36} />
                <span className="truncate text-sm font-semibold">{current.authorName}</span>
                {current.isLive && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Live
                  </span>
                )}
              </button>

              <div className="flex items-center gap-1">
                {canManage && (
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30"
                    onClick={toggleMenu}
                    aria-label="Opciones de la historia"
                    aria-expanded={menuOpen}
                    disabled={Boolean(busyAction)}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <div className="relative flex flex-1 items-center justify-center" role="presentation">
            {mediaUrl && !mediaFailed ? (
              isVideo ? (
                <video
                  key={mediaUrl}
                  src={mediaUrl}
                  className="max-h-full w-full object-contain"
                  autoPlay
                  muted
                  playsInline
                  onEnded={goNext}
                  onError={() => setMediaFailed(true)}
                />
              ) : (
                <img
                  key={mediaUrl}
                  src={mediaUrl}
                  alt=""
                  className="max-h-full w-full object-contain"
                  onError={() => setMediaFailed(true)}
                />
              )
            ) : (
              <div className="px-8 text-center">
                <p className="text-lg font-medium">
                  {current.description || (mediaFailed ? 'No se pudo cargar el contenido.' : 'Estado')}
                </p>
              </div>
            )}
            {current.description && mediaUrl && !mediaFailed && (
              <p className="absolute inset-x-0 bottom-24 px-6 text-center text-sm text-white/90 drop-shadow">
                {current.description}
              </p>
            )}
            <button
              type="button"
              className="absolute inset-y-0 left-0 w-1/3"
              aria-label="Historia anterior"
              onClick={goPrev}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 w-1/3"
              aria-label="Siguiente historia"
              onClick={goNext}
            />
          </div>
        </>
      )}

      {menuOpen && canManage && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-end bg-black/60"
          onClick={closeMenu}
          role="presentation"
        >
          <div
            className="mx-3 mb-2 overflow-hidden rounded-2xl bg-card text-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="menu"
            aria-label="Opciones de la historia"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
              <span>Archivar historias mientras están activas.</span>
              <button type="button" onClick={closeMenu} aria-label="Cerrar menú">
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className="flex w-full px-4 py-3 text-left text-sm hover:bg-accent/50"
              onClick={() => {
                closeMenu();
                setViewersOpen(true);
              }}
              role="menuitem"
            >
              Quién vio tu historia
            </button>

            <button
              type="button"
              className="flex w-full px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => void handleDelete()}
              disabled={busyAction === 'delete'}
              role="menuitem"
            >
              {busyAction === 'delete' ? 'Eliminando…' : 'Eliminar historia'}
            </button>

            {DISABLED_MENU_ITEMS.map((label) => (
              <button
                key={label}
                type="button"
                className="flex w-full px-4 py-3 text-left text-sm text-muted-foreground/50"
                disabled
                role="menuitem"
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              className="flex w-full px-4 py-3 text-left text-sm hover:bg-accent/50"
              onClick={() => void handleShareAsPublication()}
              disabled={busyAction === 'share'}
              role="menuitem"
            >
              {busyAction === 'share' ? 'Compartiendo…' : 'Compartir como publicación…'}
            </button>
          </div>

          <button
            type="button"
            className="mx-3 mb-6 rounded-2xl bg-card py-3 text-center text-sm font-semibold text-foreground"
            onClick={closeMenu}
          >
            Cancelar
          </button>
        </div>
      )}

      <StoryViewersSheet
        open={viewersOpen}
        onOpenChange={setViewersOpen}
        storyId={current?.id || null}
      />
    </div>
  );
};

export default StoryViewer;
