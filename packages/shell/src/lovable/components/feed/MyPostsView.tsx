import { useState } from 'react';
import { ChevronLeft, FileText, Loader2 } from 'lucide-react';
import PostCard from './PostCard';
import { toast } from 'sonner';
import type { Post } from '@doevents/shared';

interface MyPostsViewProps {
  onBack: () => void;
  posts?: Post[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onDeletePost?: (postId: string) => void | Promise<void>;
  onOpenDetail?: (post: Post) => void;
}

const MyPostsView = ({
  onBack,
  posts = [],
  loading = false,
  loadError = null,
  onRetry,
  onDeletePost,
  onOpenDetail,
}: MyPostsViewProps) => {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleDelete = async (postId: string) => {
    if (!onDeletePost) return;
    setDeletingId(postId);
    try {
      await onDeletePost(postId);
      toast.success('Publicación eliminada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la publicación');
    } finally {
      setDeletingId(null);
    }
  };

  const noop = () => {};

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="mx-auto max-w-lg">
        <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
            >
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold leading-tight text-primary-foreground">Mis publicaciones</h1>
              <p className="text-[11px] text-primary-foreground/80">
                {loading ? 'Cargando…' : `${posts.length} Publicación${posts.length === 1 ? '' : 'es'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm">Cargando publicaciones…</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm font-semibold text-destructive">{loadError}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Reintentar
                </button>
              )}
            </div>
          )}

          {!loading && !loadError && posts.length === 0 && (
            <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-sm">
              Aún no has publicado nada.
            </div>
          )}

          {!loading && !loadError && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={likedPosts.has(post.id)}
                  followed={false}
                  isOwner
                  onLike={() => toggleLike(post.id)}
                  onFollow={noop}
                  onComment={() => toast('Comentarios')}
                  onRepost={() => toast('Repostear')}
                  onShare={() => toast.success('Enlace copiado')}
                  onHide={noop}
                  onNotInterested={noop}
                  onBlock={noop}
                  onReport={() => toast('Reporte enviado')}
                  onEdit={() => toast('Editar publicación')}
                  onDelete={() => { void handleDelete(post.id); }}
                  onViewLikes={noop}
                  onViewReposts={noop}
                  onViewProfile={noop}
                  onMentionClick={noop}
                  onOpenDetail={onOpenDetail ? () => onOpenDetail(post) : noop}
                />
              ))}
            </div>
          )}

          {deletingId && (
            <p className="mt-2 text-center text-xs text-muted-foreground">Eliminando…</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPostsView;
