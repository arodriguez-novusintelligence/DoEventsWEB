import { useState } from 'react';
import { ChevronLeft, Trash2, FileText } from 'lucide-react';
import PostCard from './PostCard';
import type { FeedUiPost as Post } from '@doevents/shared';
import { toast } from 'sonner';

interface MyPostsViewProps {
  onBack: () => void;
  posts?: Post[];
  onDeletePost?: (postId: string) => Promise<void>;
  onOpenDetail?: (post: Post) => void;
}

const MyPostsView = ({ onBack, posts = [], onDeletePost, onOpenDetail }: MyPostsViewProps) => {
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
    <div className="mx-auto max-w-lg min-h-screen bg-background pb-24">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-foreground font-medium">
          <ChevronLeft className="h-5 w-5 text-primary" />
          Atras
        </button>
        <h1 className="mt-2 text-2xl font-extrabold text-primary">Mis publicaciones</h1>

        <div className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
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
                    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 border border-destructive/30 text-destructive shadow-sm hover:bg-destructive/10 disabled:opacity-50"
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
    </div>
  );
};

export default MyPostsView;
