import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2, X } from 'lucide-react';
import {
  fetchStoryViewers,
  getStoredUserId,
  type StoryViewer,
  UserAvatar,
  userIdsMatch,
} from '@doevents/shared';

function formatViewedAt(iso?: string): string | null {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return null;
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

interface StoryViewersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId?: string | null;
  /** Compat FeedHero / StoriesContext Lovable */
  userId?: string | null;
  itemId?: string | null;
  loading?: boolean;
  /** Abrir perfil del visualizador (cierra el sheet antes de navegar). */
  onViewProfile?: (userId: string) => void;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export const StoryViewersSheet = ({
  open,
  onOpenChange,
  storyId,
  userId,
  itemId,
  loading = false,
  onViewProfile,
}: StoryViewersSheetProps) => {
  const navigate = useNavigate();
  const currentUserId = getStoredUserId();
  const resolvedStoryId = storyId ?? itemId;
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoading = loading || fetching;

  useEffect(() => {
    if (!open || !resolvedStoryId) return;
    let cancelled = false;
    setFetching(true);
    setError(null);
    void fetchStoryViewers(resolvedStoryId)
      .then((items) => {
        if (!cancelled) setViewers(items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setViewers([]);
          setError(err instanceof Error ? err.message : 'No se pudo cargar quién vio la historia.');
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => { cancelled = true; };
  }, [open, resolvedStoryId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;

  const openViewerProfile = (viewer: StoryViewer) => {
    const targetId = String(viewer.id || '').trim();
    if (!targetId) return;
    onOpenChange(false);
    if (onViewProfile) {
      onViewProfile(targetId);
      return;
    }
    if (currentUserId && userIdsMatch(targetId, currentUserId)) {
      navigate('/profile');
      return;
    }
    navigate(`/users/${encodeURIComponent(targetId)}`);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Quién vio tu historia"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar lista de visualizaciones"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 mx-auto flex max-h-[75vh] w-full max-w-lg flex-col rounded-t-3xl bg-background shadow-lg">
        <div className="flex flex-col items-center px-4 pt-3">
          <div className="mb-3 h-1 w-10 rounded-full bg-muted-foreground/30" />
          <div className="flex w-full items-center justify-between pb-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Eye className="h-4 w-4" />
              Visto por {isLoading ? '…' : viewers.length}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-8">
          {isLoading ? (
            <>
              {SKELETON_ROWS.map((row) => (
                <div key={row} className="flex animate-pulse items-center gap-3 px-2 py-2">
                  <div className="h-11 w-11 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 rounded bg-muted" />
                    <div className="h-2.5 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))}
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </>
          ) : error ? (
            <p className="mt-8 px-4 text-center text-sm text-destructive">{error}</p>
          ) : viewers.length === 0 ? (
            <p className="mt-8 px-4 text-center text-sm text-muted-foreground">
              {resolvedStoryId || userId
                ? 'Aún nadie ha visto esta historia.'
                : 'Selecciona una historia para ver quién la visualizó.'}
            </p>
          ) : (
            viewers.map((viewer) => (
              <button
                key={viewer.id}
                type="button"
                onClick={() => openViewerProfile(viewer)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/60 active:bg-muted"
              >
                <UserAvatar name={viewer.name} imageUrl={viewer.avatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{viewer.name}</p>
                  {viewer.viewedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatViewedAt(viewer.viewedAt) || viewer.viewedAt}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default StoryViewersSheet;
