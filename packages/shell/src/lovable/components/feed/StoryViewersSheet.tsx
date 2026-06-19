import { Eye, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';

interface StoryViewersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId?: string | null;
}

export const StoryViewersSheet = ({
  open,
  onOpenChange,
  storyId,
}: StoryViewersSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-2xl">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Quién vio tu historia
        </SheetTitle>
      </SheetHeader>

      <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Users className="h-7 w-7 text-muted-foreground/50" />
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
    </SheetContent>
  </Sheet>
);

export default StoryViewersSheet;
