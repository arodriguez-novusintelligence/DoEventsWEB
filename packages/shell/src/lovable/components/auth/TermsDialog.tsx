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
      <div className="space-y-3 text-sm text-muted-foreground max-h-[50vh] overflow-y-auto pr-1">
        <section>
          <h3 className="font-semibold text-foreground mb-1">1. Aceptación</h3>
          <p>
            Bienvenidos a Do.Events. Estos términos describen las reglas para el uso de la aplicación móvil y/o web
            Do.Events. Al acceder a la aplicación aceptas estos términos en su totalidad.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground mb-1">2. Servicio</h3>
          <p>
            Do.Events es una plataforma tecnológica que permite gestionar eventos de principio a fin: crear, publicar,
            vender, comunicar, contratar servicios, gestionar invitados, control de accesos y estadísticas.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground mb-1">3. Conducta del usuario</h3>
          <p>
            Te comprometes a no publicar contenido ofensivo, ilegal o engañoso, a respetar la privacidad de otros usuarios
            y a proporcionar información real al registrarte.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-foreground mb-1">4. Edad y datos</h3>
          <p>
            Para registrarte y vender boletas debes ser mayor de 18 años. El tratamiento de datos personales se realiza
            conforme a nuestra política de privacidad y la normativa colombiana aplicable.
          </p>
        </section>
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
