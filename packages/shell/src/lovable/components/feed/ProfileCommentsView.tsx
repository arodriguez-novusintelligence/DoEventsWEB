import { ChevronLeft, MessageSquare, Star } from 'lucide-react';

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
}

const ProfileCommentsView = ({ onBack, comments = [] }: ProfileCommentsViewProps) => (
  <div className="mx-auto max-w-lg min-h-screen bg-background pb-24">
    <div className="px-4 pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-foreground font-medium">
        <ChevronLeft className="h-5 w-5 text-primary" />
        Atras
      </button>
      <h1 className="mt-2 text-2xl font-extrabold text-primary">Comentarios</h1>

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aún no tienes comentarios en tus eventos</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card p-4 shadow-sm">
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
