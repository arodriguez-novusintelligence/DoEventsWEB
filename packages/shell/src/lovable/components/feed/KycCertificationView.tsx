import { ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

interface KycCertificationViewProps {
  onBack?: () => void;
}

const SUPPORT_EMAIL = 'support@doeventsapp.com';

export const KycCertificationView = ({ onBack }: KycCertificationViewProps) => (
  <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
    <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-5 text-primary-foreground">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">Organizador certificado (KYC)</h1>
          <p className="text-xs text-primary-foreground/80">Verificación de identidad</p>
        </div>
      </div>
    </div>

    <div className="px-4 pt-6 space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">BACKEND_REQUIRED</p>
            <p className="mt-1 text-xs text-amber-800">
              El flujo completo de verificación KYC (documento, selfie y sello de organizador certificado)
              requiere integración con el proveedor de identidad en backend. Esta pantalla no muestra datos simulados.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-base font-bold text-foreground">Certificación pendiente</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No hay un estado de certificación disponible en tu perfil. Cuando el backend exponga el estado KYC,
          aparecerá aquí automáticamente.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          La verificación KYC es opcional para publicar eventos, pero puede ser requerida para eventos de gran escala
          o para obtener el sello ORGANIZADOR CERTIFICADO.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full"
        asChild
      >
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Solicitud%20KYC%20Do.Events`}>
          <Mail className="mr-2 h-4 w-4" />
          Contactar soporte
        </a>
      </Button>

      {onBack && (
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Volver
        </Button>
      )}
    </div>
  </div>
);

export default KycCertificationView;
