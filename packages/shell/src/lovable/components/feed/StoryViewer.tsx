import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MoreHorizontal, X, Eye } from 'lucide-react';
import {
  FeedStoryItem,
  UserAvatar,
  cacheUserStories,
  deletePublication,
  dispatchStoriesCacheInvalidated,
  fetchStoryViewers,
  fetchUserStories,
  getCachedUserStories,
  getPersistedOAuthProfilePhoto,
  recordStoryView,
  resolveImageUrl,
  shareStoryAsPublication,
  userIdsMatch,
  useToast,
} from '@doevents/shared';
import { StoryViewersSheet } from './StoryViewersSheet';

export interface StoryViewerProps {
  open: boolean;
  authorUserId?: string | null;
  /** Alias Lovable / FeedHero */
  startUserId?: string | null;
  currentUserId?: string | null;
  /** Avatar del usuario logueado (fallback en "Tu historia") */
  currentUserAvatar?: string | null;
  onClose: () => void;
  onStoriesChanged?: () => void;
  onOpenViewers?: (userId: string, itemId: string) => void;
  /** Override: abrir perfil del autor (por defecto /users/:id o /profile) */
  onOpenProfile?: (userId: string) => void;
}

const STORY_DURATION_MS = 5000;

function formatStoryTimeAgo(iso?: string): string | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(diff / 60_000))} min`;
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

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
  startUserId,
  currentUserId,
  currentUserAvatar,
  onClose,
  onStoriesChanged,
  onOpenViewers,
  onOpenProfile,
}) => {
  const resolvedAuthorId = authorUserId ?? startUserId ?? null;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'delete' | 'share' | null>(null);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [stories, setStories] = useState<FeedStoryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [views, setViews] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

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
    if (!open || !resolvedAuthorId) return;
    let cancelled = false;
    setLoading(true);
    setIndex(0);
    setMenuOpen(false);
    setViewersOpen(false);
    setMediaFailed(false);
    void loadStories(resolvedAuthorId, true)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, resolvedAuthorId, loadStories]);

  useEffect(() => {
    if (!open || !resolvedAuthorId) return;
    const hasLive = stories.some((story) => story.isLive);
    if (!hasLive) return;
    const timer = window.setInterval(() => {
      void loadStories(resolvedAuthorId, false).catch(() => undefined);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [open, resolvedAuthorId, stories, loadStories]);

  const goNext = useCallback(() => {
    setProgressKey((k) => k + 1);
    setIndex((current) => {
      if (current < stories.length - 1) return current + 1;
      onClose();
      return current;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setProgressKey((k) => k + 1);
    setIndex((current) => (current > 0 ? current - 1 : current));
  }, []);

  const current = stories[index];
  const mediaKind = current ? inferStoryMediaKind(current) : 'text';
  const mediaUrl = current?.mediaUrl ? resolveImageUrl(current.mediaUrl) : undefined;
  const isVideo = mediaKind === 'video';
  const storyAuthorId = current?.authorId || resolvedAuthorId || '';
  const canManage = Boolean(
    currentUserId && current && userIdsMatch(storyAuthorId, currentUserId),
  );

  useEffect(() => {
    setMediaFailed(false);
    setProgressKey((k) => k + 1);
    setViews(current?.views || 0);
  }, [current?.id, mediaUrl]);

  useEffect(() => {
    if (!open || !current?.id) return;
    let cancelled = false;
    if (canManage) {
      void fetchStoryViewers(current.id)
        .then((viewers) => {
          if (!cancelled) setViews(viewers.length);
        })
        .catch(() => undefined);
      return () => { cancelled = true; };
    }
    void recordStoryView(current.id)
      .then((count) => {
        if (!cancelled && count != null) setViews(count);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open, current?.id, canManage]);

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
      dispatchStoriesCacheInvalidated(resolvedAuthorId || undefined);
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
    if (!open || loading || !current || isVideo || busyAction || menuOpen || viewersOpen || mediaFailed) return;
    startRef.current = performance.now();
    setProgress(0);

    const tick = (t: number) => {
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        goNext();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open, loading, current, isVideo, index, goNext, busyAction, menuOpen, viewersOpen, mediaFailed, progressKey]);

  if (!open || !resolvedAuthorId) return null;

  const openViewers = () => {
    if (onOpenViewers && current) {
      onOpenViewers(resolvedAuthorId, current.id);
      return;
    }
    setViewersOpen(true);
  };

  if (loading && !stories.length) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-white/80" />
      </div>
    );
  }

  if (!loading && !stories.length) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-sm text-white/80">No hay historias activas de este usuario.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-full bg-black/60 px-6 py-2 text-xs font-semibold text-white backdrop-blur"
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (!current) return null;

  const displayName = canManage ? 'Tu historia' : current.authorName;
  const avatarUrl = resolveImageUrl(current.authorAvatar)
    || (canManage
      ? resolveImageUrl(currentUserAvatar) || resolveImageUrl(getPersistedOAuthProfilePhoto(currentUserId))
      : undefined);
  const profileTargetId = (storyAuthorId || resolvedAuthorId || '').trim();

  const openAuthorProfile = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profileTargetId) return;
    onClose();
    if (onOpenProfile) {
      onOpenProfile(profileTargetId);
      return;
    }
    if (canManage || (currentUserId && userIdsMatch(profileTargetId, currentUserId))) {
      navigate('/profile');
      return;
    }
    navigate(`/users/${encodeURIComponent(profileTargetId)}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 px-3 pt-3">
        {stories.map((story, i) => (
          <div key={story.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-none"
              style={{
                width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute left-0 right-0 top-6 z-40 flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={openAuthorProfile}
          onPointerUp={(e) => e.stopPropagation()}
          disabled={!profileTargetId}
          className="relative z-40 flex min-w-0 max-w-[70%] items-center gap-2 rounded-md text-left disabled:opacity-60"
          aria-label={canManage ? 'Ver mi perfil' : `Ver perfil de ${current.authorName || 'usuario'}`}
        >
          <UserAvatar
            name={displayName}
            imageUrl={avatarUrl}
            size={32}
            className="border-2 border-white pointer-events-none"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            {(() => {
              const ago = formatStoryTimeAgo(current.createdAt);
              return ago ? <p className="text-[10px] text-white/70">hace {ago}</p> : null;
            })()}
          </div>
        </button>
        <div className="relative z-40 flex items-center gap-1">
          {canManage && (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40"
              onClick={toggleMenu}
              aria-label="Opciones de la historia"
              aria-expanded={menuOpen}
              disabled={Boolean(busyAction)}
            >
              <MoreHorizontal className="h-5 w-5 text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {mediaUrl && !mediaFailed ? (
        isVideo ? (
          <video
            key={mediaUrl}
            src={mediaUrl}
            className="max-h-full max-w-full object-contain"
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
            className="max-h-full max-w-full object-contain"
            onError={() => setMediaFailed(true)}
          />
        )
      ) : (
        <p className="px-8 text-center text-lg font-medium text-white">
          {current.description || (mediaFailed ? 'No se pudo cargar el contenido.' : 'Estado')}
        </p>
      )}

      {current.description && mediaUrl && !mediaFailed && (
        <p className="absolute inset-x-0 bottom-24 px-6 text-center text-sm text-white/90 drop-shadow">
          {current.description}
        </p>
      )}

      <button
        type="button"
        className="absolute bottom-0 left-0 top-20 z-0 w-1/3"
        aria-label="Historia anterior"
        onClick={goPrev}
      />
      <button
        type="button"
        className="absolute bottom-0 right-0 top-20 z-0 w-1/3"
        aria-label="Siguiente historia"
        onClick={goNext}
      />

      {canManage && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openViewers();
          }}
          className="absolute bottom-6 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur"
        >
          <Eye className="h-4 w-4" />
          {views} {views === 1 ? 'vista' : 'vistas'}
        </button>
      )}

      {menuOpen && canManage && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-end bg-black/60"
          onClick={closeMenu}
          role="presentation"
        >
          <div
            className="mx-3 mb-2 overflow-hidden rounded-2xl bg-card text-foreground shadow-sm"
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
                openViewers();
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
            className="mx-3 mb-6 rounded-2xl bg-card py-3 text-center text-sm font-semibold text-foreground shadow-sm"
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
        onViewProfile={(viewerUserId) => {
          const targetId = String(viewerUserId || '').trim();
          if (!targetId) return;
          setViewersOpen(false);
          onClose();
          if (onOpenProfile) {
            onOpenProfile(targetId);
            return;
          }
          if (currentUserId && userIdsMatch(targetId, currentUserId)) {
            navigate('/profile');
            return;
          }
          navigate(`/users/${encodeURIComponent(targetId)}`);
        }}
      />
    </div>
  );
};

export default StoryViewer;
