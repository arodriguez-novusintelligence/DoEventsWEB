import { Eye } from 'lucide-react';
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

      <div className="mt-6 rounded-2xl bg-muted/50 p-8 text-center">
        <Eye className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-foreground">Sin datos de visualizaciones</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {storyId
            ? 'El endpoint de visualizaciones de historias aún no está disponible en la API compartida.'
            : 'Selecciona una historia para ver sus visualizaciones cuando el backend lo soporte.'}
        </p>
      </div>
    </SheetContent>
  </Sheet>
);

export default StoryViewersSheet;
