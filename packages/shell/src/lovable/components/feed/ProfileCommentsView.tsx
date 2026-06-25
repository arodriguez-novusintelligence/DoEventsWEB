import { AlertCircle, ChevronLeft, Loader2, MessageSquare, RefreshCw, Star } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

export type ProfileCommentItem = {
  id: string;
  authorName: string;
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
}

const ProfileCommentsView = ({
  onBack,
  comments = [],
  loading = false,
  error = null,
  onRetry,
}: ProfileCommentsViewProps) => (
  <div className="mx-auto min-h-screen max-w-lg bg-background pb-32">
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
          {comments.length} comentario{comments.length === 1 ? '' : 's'}
        </p>
      </div>
    </div>

    <div className="space-y-4 px-4 py-4">
      {loading ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-16 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
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
        comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">{c.authorName}</p>
              {c.rating != null && c.rating > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Star className="h-3.5 w-3.5 fill-primary" />
                  {c.rating.toFixed(1)}
                </span>
              )}
            </div>
            {c.eventName && (
              <p className="mt-1 text-xs text-muted-foreground">{c.eventName}</p>
            )}
            {c.comment && (
              <p className="mt-2 text-sm leading-relaxed text-foreground">{c.comment}</p>
            )}
            {c.createdAt && (
              <p className="mt-2 text-[10px] text-muted-foreground">{c.createdAt}</p>
            )}
          </div>
        ))
      )}
    </div>
  </div>
);

export default ProfileCommentsView;
