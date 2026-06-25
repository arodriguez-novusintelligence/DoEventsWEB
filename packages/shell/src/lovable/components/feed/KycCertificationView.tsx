import {
  ShieldCheck,
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Camera,
  IdCard,
  Upload,
  RefreshCw,
  ChevronLeft,
  BadgeCheck,
} from 'lucide-react';
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
  in_review: 'text-warning',
  verified: 'text-success',
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

const INTRO_BULLETS = [
  'Captura de tu Face ID en tiempo real',
  'Validación de cédula o pasaporte',
  'Prueba de vida (movimientos guiados)',
  'Insignia visible en tu perfil al aprobar',
] as const;

export const KycCertificationView = ({ onBack }: KycCertificationViewProps) => {
  const { status, loading, loadError, loadErrorMessage, isCertified, statusLabel, refresh } = useKyc();
  const StatusIcon = STATUS_ICONS[status];

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-32">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
        >
          <ChevronLeft className="h-4 w-4" /> Atrás
        </button>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-primary-foreground">
              Certifica tu identidad
            </h1>
            <p className="text-[11px] text-primary-foreground/80">
              {isCertified ? 'Identidad verificada' : 'Proceso KYC seguro'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-4 px-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="mt-3 text-sm font-medium text-destructive">
              {loadErrorMessage || 'No se pudo cargar el estado KYC'}
            </p>
            <Button type="button" variant="outline" className="mt-4 gap-1.5 rounded-full" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            {!isCertified && status === 'pending' && (
              <div className="space-y-4 rounded-2xl bg-card p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Insignia de Identidad Verificada</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Obtén el sello azul de verificación en tu perfil y demuestra a la comunidad que eres una persona real.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {INTRO_BULLETS.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl bg-card p-6 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
                <StatusIcon className={`h-7 w-7 ${STATUS_COLORS[status]}`} />
              </div>
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
                  <h3 className="px-1 text-sm font-bold text-foreground">Pasos de verificación</h3>
                  {UPLOAD_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
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

                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Envío pendiente de backend</p>
                      <p className="mt-1 text-xs text-muted-foreground">
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
