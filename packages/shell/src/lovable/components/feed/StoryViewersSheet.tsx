import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { useStories } from '@lovable/contexts/StoriesContext';
import { Eye } from 'lucide-react';

import { UserAvatar } from '@doevents/shared';
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  itemId: string | null;
}

const relTime = (ts: number) => {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60_000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
};

const StoryViewersSheet = ({ open, onOpenChange, userId, itemId }: Props) => {
  const { users } = useStories();
  const user = users.find((u) => u.id === userId);
  const item = user?.items.find((i) => i.id === itemId);
  const viewers = item?.viewers ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Visto por {viewers.length}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto h-full pb-20">
          {viewers.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">Aún nadie ha visto esta historia.</p>
          )}
          {viewers.map((v) => (
            <div key={v.id} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                {v.avatar && <img src={v.avatar} alt={v.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{v.name}</p>
                <p className="text-xs text-muted-foreground">{relTime(v.viewedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoryViewersSheet;