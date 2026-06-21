import { useState } from 'react';
import { AlertCircle, FileText, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import PostCard from './PostCard';
import type { FeedUiPost as Post } from '@doevents/shared';
import { toast } from 'sonner';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Button } from '@lovable/components/ui/button';

interface MyPostsViewProps {
  onBack: () => void;
  posts?: Post[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onDeletePost?: (postId: string) => Promise<void>;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-secondary pb-24">
      <ProfileSectionBanner
        title="Mis publicaciones"
        subtitle={`${posts.length} publicación${posts.length === 1 ? '' : 'es'}`}
        icon={FileText}
        onBack={onBack}
      />

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card py-16 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando publicaciones…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{loadError}</p>
            {onRetry && (
              <Button type="button" variant="outline" className="rounded-full" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            )}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Sin publicaciones</p>
            <p className="text-xs text-muted-foreground">Aún no has publicado en el muro</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="relative">
              <PostCard
                post={post}
                liked={false}
                followed={false}
                isOwner
                onLike={() => undefined}
                onFollow={() => undefined}
                onComment={() => undefined}
                onRepost={() => undefined}
                onShare={() => undefined}
                onHide={() => undefined}
                onNotInterested={() => undefined}
                onBlock={() => undefined}
                onReport={() => undefined}
                onOpenDetail={onOpenDetail}
              />
              {onDeletePost && (
                <button
                  type="button"
                  disabled={deletingId === post.id}
                  onClick={() => void handleDelete(post.id)}
                  className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-destructive/30 bg-card/90 text-destructive shadow-sm hover:bg-destructive/10 disabled:opacity-50"
                  aria-label="Eliminar publicación"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPostsView;
