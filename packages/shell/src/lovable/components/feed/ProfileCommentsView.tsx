import { AlertCircle, Loader2, MessageSquare, Star } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
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
  <div className="mx-auto max-w-lg min-h-screen bg-secondary pb-24">
    <ProfileSectionBanner
      title="Comentarios"
      subtitle={`${comments.length} opinión${comments.length === 1 ? '' : 'es'} de clientes`}
      icon={MessageSquare}
      onBack={onBack}
    />

    <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-16 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando comentarios…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-12 text-center shadow-sm">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            {onRetry && (
              <Button type="button" variant="outline" className="rounded-full" onClick={onRetry}>
                Reintentar
              </Button>
            )}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
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
);

export default ProfileCommentsView;
