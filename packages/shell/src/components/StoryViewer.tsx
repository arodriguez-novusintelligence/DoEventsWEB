import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="de-story-viewer" role="dialog" aria-modal="true">
      {loading && !stories.length && <Loader />}

      {!loading && !stories.length && (
        <div className="de-story-viewer__empty">
          <p>No hay historias activas de este usuario.</p>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      )}

      {!loading && current && (
        <>
          <header className="de-story-viewer__header">
            <div className="de-story-viewer__header-row">
              <button
                type="button"
                className="de-story-viewer__author"
                onClick={() => navigate(`/users/${authorUserId}`)}
              >
                <UserAvatar name={current.authorName} imageUrl={current.authorAvatar} size={36} />
                <span>{current.authorName}</span>
                {current.isLive && <span className="de-feed-stories__badge">Live</span>}
              </button>

              <div className="de-story-viewer__header-actions">
                {canManage && (
                  <button
                    type="button"
                    className="de-story-viewer__menu-btn"
                    onClick={toggleMenu}
                    aria-label="Opciones de la historia"
                    aria-expanded={menuOpen}
                    disabled={Boolean(busyAction)}
                  >
                    ⋯
                  </button>
                )}
                <button
                  type="button"
                  className="de-story-viewer__close"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="de-story-viewer__progress">
              {stories.map((story, i) => (
                <span
                  key={story.id}
                  className={`de-story-viewer__seg${i <= index ? ' de-story-viewer__seg--active' : ''}`}
                />
              ))}
            </div>
          </header>

          <div className="de-story-viewer__body" role="presentation">
            {mediaUrl && !mediaFailed ? (
              isVideo ? (
                <video
                  key={mediaUrl}
                  src={mediaUrl}
                  className="de-story-viewer__media"
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
                  className="de-story-viewer__media"
                  onError={() => setMediaFailed(true)}
                />
              )
            ) : (
              <div className="de-story-viewer__text-only">
                <p>{current.description || (mediaFailed ? 'No se pudo cargar el contenido.' : 'Estado')}</p>
              </div>
            )}
            {current.description && mediaUrl && !mediaFailed && (
              <p className="de-story-viewer__caption">{current.description}</p>
            )}
            <button
              type="button"
              className="de-story-viewer__tap de-story-viewer__tap--prev"
              aria-label="Historia anterior"
              onClick={goPrev}
            />
            <button
              type="button"
              className="de-story-viewer__tap de-story-viewer__tap--next"
              aria-label="Siguiente historia"
              onClick={goNext}
            />
          </div>
        </>
      )}

      {menuOpen && canManage && (
        <div className="de-story-viewer__menu-overlay" onClick={closeMenu} role="presentation">
          <div
            className="de-story-viewer__menu-sheet"
            onClick={(e) => e.stopPropagation()}
            role="menu"
            aria-label="Opciones de la historia"
          >
            <div className="de-story-viewer__menu-head">
              <span>Archivar historias mientras están activas.</span>
              <button type="button" onClick={closeMenu} aria-label="Cerrar menú">×</button>
            </div>

            <button
              type="button"
              className="de-story-viewer__menu-item"
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
              className="de-story-viewer__menu-item de-story-viewer__menu-item--danger"
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
                className="de-story-viewer__menu-item de-story-viewer__menu-item--disabled"
                disabled
                role="menuitem"
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              className="de-story-viewer__menu-item"
              onClick={() => void handleShareAsPublication()}
              disabled={busyAction === 'share'}
              role="menuitem"
            >
              {busyAction === 'share' ? 'Compartiendo…' : 'Compartir como publicación…'}
            </button>
          </div>

          <button
            type="button"
            className="de-story-viewer__menu-cancel"
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
