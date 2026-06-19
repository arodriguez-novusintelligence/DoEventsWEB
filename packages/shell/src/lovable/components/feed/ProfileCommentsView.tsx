import { ChevronLeft, MessageSquare, Star } from 'lucide-react';
import { Loader } from '@doevents/shared';
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
  <div className="mx-auto max-w-lg min-h-screen bg-background pb-24">
    <div className="px-4 pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-foreground font-medium">
        <ChevronLeft className="h-5 w-5 text-primary" />
        Atrás
      </button>
      <h1 className="mt-2 text-2xl font-extrabold text-primary">Comentarios</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Opiniones de clientes sobre tus servicios
      </p>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader />
            <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-destructive">{error}</p>
            {onRetry && (
              <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={onRetry}>
                Reintentar
              </Button>
            )}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl bg-card shadow-sm">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Sin comentarios aún</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Cuando los clientes califiquen tus servicios, sus opiniones aparecerán aquí.
            </p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card p-4 shadow-sm border border-border/60">
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
                <p className="mt-2 text-sm text-foreground leading-relaxed">{c.comment}</p>
              )}
              {c.createdAt && (
                <p className="mt-2 text-[11px] text-muted-foreground">{c.createdAt}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default ProfileCommentsView;
