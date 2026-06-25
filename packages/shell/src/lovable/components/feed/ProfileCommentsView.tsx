import { AlertCircle, ChevronLeft, Heart, Loader2, MessageCircle, MessageSquare, RefreshCw, Send, Star } from 'lucide-react';
import { UserAvatar } from '@doevents/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';

export type ProfileCommentItem = {
  id: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  comment?: string;
  rating?: number;
  createdAt?: string;
  eventName?: string;
};

interface ProfileCommentsViewProps {
  onBack: () => void;
  comments?: ProfileCommentItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  currentUserName?: string;
  currentUserAvatar?: string;
}

const CommentRow = ({ comment }: { comment: ProfileCommentItem }) => {
  const likeCount = comment.rating != null && comment.rating > 0
    ? Math.round(comment.rating * 2)
    : 0;
  const subtitle = comment.authorUsername
    || (comment.eventName ? `en ${comment.eventName}` : undefined);

  return (
    <div className="flex gap-3">
      {comment.authorAvatar ? (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={comment.authorAvatar} alt="" />
          <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
        </Avatar>
      ) : (
        <UserAvatar name={comment.authorName} size={36} className="shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{comment.authorName}</span>
          {subtitle && (
            <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
        {comment.comment && (
          <p className="mt-0.5 break-words text-sm text-foreground/90">{comment.comment}</p>
        )}
        <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
          {comment.createdAt && <span>{comment.createdAt}</span>}
          {comment.rating != null && comment.rating > 0 && (
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Star className="h-3.5 w-3.5 fill-primary" />
              {comment.rating.toFixed(1)}
            </span>
          )}
          <button
            type="button"
            disabled
            className="flex items-center gap-1 opacity-50"
            aria-label="Me gusta (próximamente)"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>{likeCount}</span>
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-1 opacity-50"
            aria-label="Responder (próximamente)"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Responder
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileCommentsView = ({
  onBack,
  comments = [],
  loading = false,
  error = null,
  onRetry,
  currentUserName = 'Tú',
  currentUserAvatar,
}: ProfileCommentsViewProps) => {
  const total = comments.length;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 pt-4 font-medium text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Atrás
        </button>
        <div className="px-4 pb-4 pt-3">
          <h1 className="text-2xl font-extrabold text-primary">Comentarios</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? '…' : `${total} comentario${total === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-16 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-12 text-center shadow-sm">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            {onRetry && (
              <Button type="button" variant="outline" className="rounded-full" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            )}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <MessageSquare className="mb-4 h-14 w-14 text-foreground/70" strokeWidth={1.5} />
            <p className="font-semibold text-foreground">Sin comentarios aún</p>
            <p className="mt-1 max-w-[260px] text-sm text-muted-foreground">
              Los comentarios que otros usuarios dejen en tu perfil aparecerán aquí
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="rounded-2xl border border-border/50 bg-card p-3 shadow-sm">
                <CommentRow comment={c} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-20 px-4">
        <div className="mx-auto flex max-w-lg items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-lg opacity-60">
          {currentUserAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUserAvatar} alt="" />
              <AvatarFallback>{currentUserName.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserAvatar name={currentUserName} size={32} />
          )}
          <input
            disabled
            readOnly
            placeholder="Agregar un comentario… (próximamente)"
            className="flex-1 bg-transparent text-sm text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            disabled
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-40"
            aria-label="Publicar comentario (próximamente)"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCommentsView;
