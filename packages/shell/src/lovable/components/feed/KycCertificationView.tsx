import { ShieldCheck, Mail, AlertCircle, CheckCircle2, Clock, XCircle, Loader2, Camera, IdCard, Upload } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { useKyc, type KycStatus } from '@lovable/contexts/KycContext';

interface KycCertificationViewProps {
  onBack?: () => void;
}

const SUPPORT_EMAIL = 'support@doeventsapp.com';

const STATUS_ICONS: Record<KycStatus, typeof ShieldCheck> = {
  pending: ShieldCheck,
  in_review: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
};

const STATUS_COLORS: Record<KycStatus, string> = {
  pending: 'text-muted-foreground/40',
  in_review: 'text-amber-500',
  verified: 'text-emerald-500',
  rejected: 'text-destructive',
};

const UPLOAD_STEPS = [
  {
    icon: IdCard,
    title: 'Documento de identidad',
    description: 'Foto frontal y reverso de tu cédula o pasaporte vigente.',
  },
  {
    icon: Camera,
    title: 'Selfie de verificación',
    description: 'Selfie en tiempo real para validar que eres el titular del documento.',
  },
  {
    icon: Upload,
    title: 'Envío seguro',
    description: 'Los archivos se transmiten cifrados al proveedor KYC autorizado.',
  },
] as const;

export const KycCertificationView = ({ onBack }: KycCertificationViewProps) => {
  const { status, loading, isCertified, statusLabel, refresh } = useKyc();
  const StatusIcon = STATUS_ICONS[status];

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-5 text-primary-foreground">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-medium text-primary-foreground/90"
          >
            ← Volver
          </button>
        )}
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
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
              <StatusIcon className={`mx-auto h-12 w-12 ${STATUS_COLORS[status]}`} />
              <h2 className="mt-4 text-base font-bold text-foreground">{statusLabel}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isCertified
                  ? 'Tu perfil muestra el sello de organizador certificado. Puedes publicar eventos de gran escala.'
                  : status === 'in_review'
                    ? 'Tu solicitud está siendo revisada. Te notificaremos cuando esté lista.'
                    : status === 'rejected'
                      ? 'Tu solicitud fue rechazada. Contacta soporte para más información.'
                      : 'Completa la verificación para obtener el sello ORGANIZADOR CERTIFICADO.'}
              </p>
              {!isCertified && (
                <p className="mt-3 text-xs text-muted-foreground">
                  La certificación KYC es opcional para publicar eventos, pero puede ser requerida
                  para eventos de gran escala.
                </p>
              )}
            </div>

            {!isCertified && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground px-1">Pasos de verificación</h3>
                  {UPLOAD_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <StepIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Paso {index + 1}
                          </p>
                          <p className="text-sm font-bold text-foreground">{step.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Envío pendiente de backend</p>
                      <p className="mt-1 text-xs text-amber-800">
                        La carga de documentos requiere el endpoint KYC en DoEventsBack.
                        Esta pantalla muestra el flujo Lovable y el estado real del perfil sin simular envíos.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="button" className="w-full rounded-full" disabled>
                  Enviar documentos (próximamente)
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              onClick={() => refresh()}
            >
              Actualizar estado
            </Button>

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
          </>
        )}
      </div>
    </div>
  );
};

export default KycCertificationView;
