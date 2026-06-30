import { Eye, Loader2 } from 'lucide-react';
import { UserAvatar } from '@doevents/shared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';

interface StoryViewersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId?: string | null;
  /** Compat FeedHero / StoriesContext Lovable */
  userId?: string | null;
  itemId?: string | null;
  loading?: boolean;
}

const SKELETON_ROWS = [0, 1, 2];

export const StoryViewersSheet = ({
  open,
  onOpenChange,
  storyId,
  userId,
  itemId,
  loading = false,
}: StoryViewersSheetProps) => {
  const resolvedStoryId = storyId ?? itemId;
  const viewers: Array<{ id: string; name: string; avatar?: string; viewedAt?: string }> = [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto h-[70vh] max-w-lg rounded-t-3xl p-0">
        <SheetHeader className="px-4 pt-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Eye className="h-4 w-4 text-primary" />
            Visto por {viewers.length}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 h-full space-y-3 overflow-y-auto px-4 pb-20">
          {loading ? (
            <>
              {SKELETON_ROWS.map((row) => (
                <div key={row} className="flex animate-pulse items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-2 w-16 rounded bg-muted" />
                  </div>
                </div>
              ))}
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </>
          ) : viewers.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {resolvedStoryId || userId
                ? 'Aún nadie ha visto esta historia.'
                : 'Selecciona una historia para ver quién la visualizó.'}
            </p>
          ) : (
            viewers.map((viewer) => (
              <div key={viewer.id} className="flex items-center gap-3">
                <UserAvatar name={viewer.name} imageUrl={viewer.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{viewer.name}</p>
                  {viewer.viewedAt && (
                    <p className="text-xs text-muted-foreground">{viewer.viewedAt}</p>
                  )}
                </div>
              </div>
            ))
          )}

          {!loading && viewers.length === 0 && (resolvedStoryId || userId) && (
            <p className="mt-6 text-center text-[10px] text-muted-foreground">
              El listado detallado estará disponible cuando DoEventsBack exponga GET /stories/{'{id}'}/viewers.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoryViewersSheet;
