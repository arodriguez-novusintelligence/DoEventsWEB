import { Eye, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';

interface StoryViewersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId?: string | null;
  loading?: boolean;
}

const SKELETON_ROWS = [0, 1, 2];

export const StoryViewersSheet = ({
  open,
  onOpenChange,
  storyId,
  loading = false,
}: StoryViewersSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-2xl">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          Quién vio tu historia
        </SheetTitle>
      </SheetHeader>

      {loading ? (
        <div className="mt-6 space-y-3">
          {SKELETON_ROWS.map((row) => (
            <div key={row} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted ring-2 ring-border/40" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-2 w-16 rounded bg-muted" />
              </div>
            </div>
          ))}
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Eye className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Visualizaciones no disponibles</p>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {storyId
              ? 'El endpoint GET /stories/{id}/viewers aún no está expuesto en DoEventsBack. Cuando esté disponible, verás aquí la lista de personas que vieron tu historia.'
              : 'Selecciona una historia para consultar sus visualizaciones cuando el backend lo soporte.'}
          </p>
          <span className="mt-4 inline-block rounded-full bg-warning/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-warning">
            Backend requerido
          </span>
        </div>
      )}
    </SheetContent>
  </Sheet>
);

export default StoryViewersSheet;
