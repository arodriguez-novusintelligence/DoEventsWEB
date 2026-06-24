import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lovable/components/ui/dialog';
import { ScrollArea } from '@lovable/components/ui/scroll-area';
import { Button } from '@lovable/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAccept?: () => void;
}

const TermsDialog = ({ open, onOpenChange, onAccept }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="text-primary text-xl">Términos y Condiciones</DialogTitle>
        <p className="text-xs text-muted-foreground">Do.Events — Versión actualizada</p>
      </DialogHeader>
      <ScrollArea className="flex-1 pr-3 text-sm text-foreground space-y-3">
        <div className="space-y-3 leading-relaxed">
          <p>Bienvenidos a Do.Events. Estos términos y condiciones describen las reglas para el uso de la aplicación móvil y/o web Do.Events, desarrollada por Do.Events Software SAS, NIT 901908812-0, con domicilio en Carrera 91 No. 20A-75, Bogotá D.C., Colombia. Al acceder a la aplicación aceptas estos términos en su totalidad.</p>

          <h4 className="font-semibold text-primary">1. Definiciones</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Eventer:</b> persona o empresa que organiza eventos.</li>
            <li><b>Invitado:</b> persona que recibe una invitación.</li>
            <li><b>Asistente:</b> persona que confirmó asistencia o compró boleto.</li>
            <li><b>Host:</b> dueño de un lugar para realizar eventos.</li>
            <li><b>Staff:</b> persona o empresa que brinda servicios logísticos.</li>
            <li><b>Cliente:</b> persona o empresa que busca un Eventer.</li>
          </ul>

          <h4 className="font-semibold text-primary">2. Descripción de la Plataforma</h4>
          <p>Do.Events es una plataforma tecnológica móvil y web (iOS, Android) que permite gestionar eventos de principio a fin: crear, publicar, vender, comunicar, contratar servicios, gestionar invitados, control de accesos y estadísticas, en un entorno de red social.</p>

          <h4 className="font-semibold text-primary">3. Uso de la Plataforma</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>No publicar contenido ofensivo, ilegal, difamatorio o engañoso.</li>
            <li>Respetar los derechos y privacidad de otros usuarios.</li>
            <li>No intentar acceder a cuentas ajenas sin autorización.</li>
            <li>No acosar, amenazar o discriminar a otros usuarios.</li>
          </ul>

          <h4 className="font-semibold text-primary">4. Obligaciones del Eventer</h4>
          <p>El Eventer es responsable del evento anunciado, sus características, información y ejecución. El precio informado es el final e incluye cargas adicionales. Los eventos deben estar conforme a la ley colombiana.</p>

          <h4 className="font-semibold text-primary">5. Obligaciones del Invitado/Cliente</h4>
          <p>Al manifestar interés en un evento, el usuario verifica condiciones (fecha, hora, lugar, costos) antes de adquirirlo.</p>

          <div className="bg-primary/10 rounded-lg p-3">
            <p className="font-semibold">Protección del Asistente</p>
            <p>La opción por defecto es Compra Protegida (escrow). La Transferencia Inmediata requiere elección explícita y solo está disponible con Organizadores Nivel 2 o superior.</p>
          </div>

          <h4 className="font-semibold text-primary">6. Registro, Edad Mínima y Verificación</h4>
          <p>Para registrarse como Eventer y vender boletas debes ser mayor de 18 años y proporcionar información real. La verificación KYC no es obligatoria para publicar; los Organizadores nuevos están cubiertos por escrow y niveles progresivos.</p>

          <div className="bg-primary/10 rounded-lg p-3">
            <p className="font-semibold">Sello ORGANIZADOR CERTIFICADO</p>
            <p>Los Organizadores que completen KYC voluntariamente recibirán el sello. Acredita verificación de identidad. Costo USD $10–$15, no reembolsable.</p>
          </div>

          <h4 className="font-semibold text-primary">7. Recaudo, Escrow y Límites Progresivos</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Nivel 1:</b> fondos liberados tras finalización verificada del evento.</li>
            <li><b>Nivel 2:</b> condiciones intermedias según historial.</li>
            <li><b>Nivel 3:</b> adelanto parcial y Transferencia Inmediata disponible.</li>
          </ul>

          <h4 className="font-semibold text-primary">8. Depósito de Garantía</h4>
          <p>Do.Events podrá exigir depósito en eventos de gran escala o alto valor.</p>

          <h4 className="font-semibold text-primary">9. Contenido Prohibido</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Contenido pornográfico o que involucre menores.</li>
            <li>Incitación al odio, violencia o discriminación.</li>
            <li>Eventos vinculados a terrorismo o paramilitarismo.</li>
            <li>Promoción de crímenes o autolesiones.</li>
          </ul>

          <h4 className="font-semibold text-primary">10. Derechos de Autor</h4>
          <p>Reclamaciones a management@doeventsapp.com bajo Ley 23/1982 y Decisión Andina 351/1993.</p>

          <div className="bg-primary/10 rounded-lg p-3">
            <p className="font-semibold">Derechos del Consumidor</p>
            <p>Los Asistentes conservan el derecho de acudir a la SIC o jueces ordinarios conforme a la Ley 1480 de 2011.</p>
          </div>

          <h4 className="font-semibold text-primary">11. Privacidad de los Datos</h4>
          <p>Tratamiento conforme a Ley 1581 de 2012 y Decreto 1377 de 2013. Bases inscritas en el RNBD de la SIC.</p>

          <h4 className="font-semibold text-primary">12. Responsabilidades</h4>
          <p><b>12.1</b> Do.Events responde por defectos imputables. <b>12.2</b> El Eventer responde por el contenido y calidad del evento. <b>12.3</b> Responsabilidad solidaria conforme al art. 53 Ley 1480/2011 en casos de fraude comprobado.</p>

          <h4 className="font-semibold text-primary">13. Tarifas</h4>
          <p>Tarifas actualizadas en www.doeventsapp.com. Do.Events podrá retener fondos para saldar tarifas impagas.</p>

          <h4 className="font-semibold text-primary">14. Resolución de Controversias</h4>
          <p>Arbitraje vinculante con sede en Bogotá D.C., sin perjuicio de los derechos del consumidor.</p>

          <h4 className="font-semibold text-primary">15. Sanciones</h4>
          <p>Advertencia, suspensión o inhabilitación de la cuenta.</p>

          <h4 className="font-semibold text-primary">16. Disposiciones Generales</h4>
          <p>Rige la ley colombiana. Modificaciones se publican en www.doeventsapp.com. Contacto: management@doeventsapp.com</p>
        </div>
      </ScrollArea>
      {onAccept && (
        <Button
          onClick={() => { onAccept(); onOpenChange(false); }}
          className="w-full rounded-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Aceptar y continuar
        </Button>
      )}
    </DialogContent>
  </Dialog>
);

export default TermsDialog;