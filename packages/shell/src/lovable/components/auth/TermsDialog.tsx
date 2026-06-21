import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lovable/components/ui/dialog';
import { Button } from '@lovable/components/ui/button';
import { ScrollText, CheckCircle2 } from 'lucide-react';

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const SECTIONS = [
  {
    title: '1. Aceptación',
    body: 'Bienvenidos a Do.Events. Estos términos describen las reglas para el uso de la aplicación móvil y/o web Do.Events. Al acceder a la aplicación aceptas estos términos en su totalidad.',
  },
  {
    title: '2. Servicio',
    body: 'Do.Events es una plataforma tecnológica que permite gestionar eventos de principio a fin: crear, publicar, vender, comunicar, contratar servicios, gestionar invitados, control de accesos y estadísticas.',
  },
  {
    title: '3. Conducta del usuario',
    body: 'Te comprometes a no publicar contenido ofensivo, ilegal o engañoso, a respetar la privacidad de otros usuarios y a proporcionar información real al registrarte.',
  },
  {
    title: '4. Edad y datos',
    body: 'Para registrarte y vender boletas debes ser mayor de 18 años. El tratamiento de datos personales se realiza conforme a nuestra política de privacidad y la normativa colombiana aplicable.',
  },
  {
    title: '5. Pagos y reembolsos',
    body: 'Los cobros de boletas y reservas se procesan a través de proveedores de pago autorizados. Las políticas de reembolso dependen del organizador y del tipo de evento o servicio contratado.',
  },
  {
    title: '6. Propiedad intelectual',
    body: 'El contenido que publiques sigue siendo tuyo, pero nos concedes una licencia limitada para mostrarlo en la plataforma con fines operativos del servicio.',
  },
  {
    title: '7. Privacidad',
    body: 'Consulta nuestra política de privacidad en la app para conocer cómo tratamos tus datos personales, cookies y derechos de acceso, rectificación y supresión.',
  },
];

export const TermsDialog = ({ open, onClose, onAccept }: TermsDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="max-w-lg rounded-2xl shadow-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          Términos y Condiciones
        </DialogTitle>
        <DialogDescription>Do.Events — Versión actualizada</DialogDescription>
      </DialogHeader>
      <div className="relative">
        <div className="space-y-4 text-sm text-muted-foreground max-h-[50vh] overflow-y-auto pr-2">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="font-semibold text-foreground mb-1">{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </div>
      <DialogFooter className="flex-col gap-2 sm:flex-col">
        <Button
          type="button"
          className="w-full rounded-full"
          onClick={() => {
            onAccept?.();
            onClose();
          }}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Aceptar términos
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default TermsDialog;
