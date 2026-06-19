import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lovable/components/ui/dialog';
import { Button } from '@lovable/components/ui/button';

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsDialog = ({ open, onClose, onAccept }: TermsDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Términos y Condiciones</DialogTitle>
        <DialogDescription>Do.Events — Versión actualizada</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          Bienvenidos a Do.Events. Estos términos describen las reglas para el uso de la aplicación móvil y/o web
          Do.Events. Al acceder a la aplicación aceptas estos términos en su totalidad.
        </p>
        <p>
          Do.Events es una plataforma tecnológica que permite gestionar eventos de principio a fin: crear, publicar,
          vender, comunicar, contratar servicios, gestionar invitados, control de accesos y estadísticas.
        </p>
        <p>
          Te comprometes a no publicar contenido ofensivo, ilegal o engañoso, a respetar la privacidad de otros usuarios
          y a proporcionar información real al registrarte.
        </p>
        <p>
          Para registrarte y vender boletas debes ser mayor de 18 años. El tratamiento de datos personales se realiza
          conforme a nuestra política de privacidad y la normativa colombiana aplicable.
        </p>
      </div>
      <DialogFooter>
        <Button
          type="button"
          className="w-full rounded-full"
          onClick={() => {
            onAccept?.();
            onClose();
          }}
        >
          Aceptar términos
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default TermsDialog;
