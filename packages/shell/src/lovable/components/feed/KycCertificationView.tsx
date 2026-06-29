import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ShieldCheck,
  BadgeCheck,
  CreditCard,
  Lock,
  Camera,
  IdCard,
  ScanFace,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import { toast } from 'sonner';
import { useKyc } from '@lovable/contexts/KycContext';

interface Props {
  onBack: () => void;
}

type Step = 'intro' | 'payment' | 'processing-payment' | 'kyc-doc-type' | 'kyc-doc-capture' | 'kyc-face' | 'kyc-liveness' | 'kyc-review' | 'success' | 'confirm-disable';
type DocType = 'cedula' | 'pasaporte' | 'licencia';

const KYC_PRICE = 10;

const KycCertificationView = ({ onBack }: Props) => {
  const { status, markPaid, approve, disable } = useKyc();
  const [step, setStep] = useState<Step>(status === 'verified' ? 'success' : 'intro');

  // Payment form
  const [cardName, setCardName] = useState('Sebastian Motta');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [country, setCountry] = useState('Colombia');

  // KYC
  const [docType, setDocType] = useState<DocType>('cedula');
  const [docCaptured, setDocCaptured] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);

  const livenessTimer = useRef<number | null>(null);

  useEffect(() => {
    if (step === 'kyc-liveness') {
      setLivenessProgress(0);
      livenessTimer.current = window.setInterval(() => {
        setLivenessProgress((p) => {
          if (p >= 100) {
            if (livenessTimer.current) window.clearInterval(livenessTimer.current);
            return 100;
          }
          return p + 5;
        });
      }, 120);
    }
    return () => {
      if (livenessTimer.current) window.clearInterval(livenessTimer.current);
    };
  }, [step]);

  // Auto-advance payment processing
  useEffect(() => {
    if (step === 'processing-payment') {
      const t = window.setTimeout(() => {
        markPaid();
        toast.success('Pago aprobado');
        setStep('kyc-doc-type');
      }, 1800);
      return () => window.clearTimeout(t);
    }
    if (step === 'kyc-review') {
      const t = window.setTimeout(() => {
        approve();
        setStep('success');
      }, 2200);
      return () => window.clearTimeout(t);
    }
  }, [step, markPaid, approve]);

  const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10 rounded-b-3xl">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 rounded-lg px-2 py-1 -ml-2 transition">
        <ChevronLeft className="h-4 w-4" /> Atrás
      </button>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-primary-foreground leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-primary-foreground/80">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background pb-32">
      <Header
        title="Certifica tu identidad"
        subtitle={step === 'success' ? 'Identidad verificada' : 'Proceso KYC seguro'}
      />

      <div className="px-4 mt-2 space-y-4">
        {/* INTRO */}
        {step === 'intro' && (
          <>
            <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BadgeCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Insignia de Identidad Verificada</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Obtén el sello azul de verificación en tu perfil y demuestra a la comunidad que eres una persona real.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {[
                  'Captura de tu Face ID en tiempo real',
                  'Validación de cédula o pasaporte',
                  'Prueba de vida (movimientos guiados)',
                  'Insignia visible en tu perfil al aprobar',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Costo de certificación</p>
                <p className="text-2xl font-extrabold text-primary">${KYC_PRICE} USD</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary/70" />
            </div>

            <Button onClick={() => setStep('payment')} className="w-full rounded-full py-6 text-base font-bold">
              Continuar al pago
            </Button>
          </>
        )}

        {/* PAYMENT */}
        {step === 'payment' && (
          <>
            <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground">Datos de pago</h2>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Lock className="h-3 w-3" /> Seguro
                </span>
              </div>

              <div>
                <Label className="text-sm font-semibold">Nombre en la tarjeta</Label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Número de tarjeta</Label>
                <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Vencimiento</Label>
                  <Input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/AA" className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">CVV</Label>
                  <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} inputMode="numeric" className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">País</Label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 w-full border-b border-muted-foreground/20 bg-transparent py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'España', 'Estados Unidos', 'Brasil'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Total a pagar</span>
                <span className="text-lg font-extrabold text-primary">${KYC_PRICE}.00 USD</span>
              </div>
            </div>

            <Button onClick={() => setStep('processing-payment')} className="w-full rounded-full py-6 text-base font-bold">
              <Lock className="mr-2 h-4 w-4" /> Pagar ${KYC_PRICE} USD
            </Button>
          </>
        )}

        {/* PROCESSING PAYMENT */}
        {step === 'processing-payment' && (
          <div className="rounded-2xl bg-card shadow-sm p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Procesando pago seguro...</h2>
            <p className="text-sm text-muted-foreground">Estamos validando tu tarjeta con la pasarela.</p>
          </div>
        )}

        {/* KYC DOC TYPE */}
        {step === 'kyc-doc-type' && (
          <>
            <KycSteps current={1} />
            <div className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-foreground">Selecciona tu documento</h2>
              <p className="text-xs text-muted-foreground">Usaremos este documento para verificar tu identidad.</p>
              <div className="space-y-2 pt-2">
                {([
                  { id: 'cedula', label: 'Cédula de ciudadanía' },
                  { id: 'pasaporte', label: 'Pasaporte' },
                  { id: 'licencia', label: 'Licencia de conducción' },
                ] as { id: DocType; label: string }[]).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDocType(d.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                      docType === d.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/20 bg-card text-foreground'
                    }`}
                  >
                    <IdCard className={`h-5 w-5 ${docType === d.id ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span className="text-sm font-semibold">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setStep('kyc-doc-capture')} className="w-full rounded-full py-6 text-base font-bold">
              Continuar
            </Button>
          </>
        )}

        {/* DOC CAPTURE */}
        {step === 'kyc-doc-capture' && (
          <>
            <KycSteps current={2} />
            <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-foreground">Captura tu documento</h2>
              <p className="text-xs text-muted-foreground">Coloca tu {docType} dentro del marco y asegúrate que sea legible.</p>
              <div className={`relative aspect-[3/2] rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden ${docCaptured ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 bg-muted/30'}`}>
                {docCaptured ? (
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                    <p className="mt-2 text-sm font-semibold text-primary">Documento capturado</p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-10 w-10 mx-auto" />
                    <p className="mt-2 text-xs">Toca para tomar foto</p>
                  </div>
                )}
              </div>
              <Button
                variant={docCaptured ? 'outline' : 'default'}
                onClick={() => setDocCaptured(true)}
                className="w-full rounded-full"
              >
                <Camera className="mr-2 h-4 w-4" /> {docCaptured ? 'Volver a capturar' : 'Capturar documento'}
              </Button>
            </div>
            <Button
              disabled={!docCaptured}
              onClick={() => setStep('kyc-face')}
              className="w-full rounded-full py-6 text-base font-bold"
            >
              Continuar
            </Button>
          </>
        )}

        {/* FACE ID */}
        {step === 'kyc-face' && (
          <>
            <KycSteps current={3} />
            <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-foreground">Face ID</h2>
              <p className="text-xs text-muted-foreground">Centra tu rostro dentro del círculo con buena iluminación.</p>
              <div className="relative mx-auto aspect-square w-56 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30 border-primary/40">
                {faceCaptured ? (
                  <CheckCircle2 className="h-16 w-16 text-primary" />
                ) : (
                  <ScanFace className="h-20 w-20 text-primary/70" />
                )}
              </div>
              <Button
                variant={faceCaptured ? 'outline' : 'default'}
                onClick={() => setFaceCaptured(true)}
                className="w-full rounded-full"
              >
                <Camera className="mr-2 h-4 w-4" /> {faceCaptured ? 'Volver a capturar' : 'Capturar rostro'}
              </Button>
            </div>
            <Button
              disabled={!faceCaptured}
              onClick={() => setStep('kyc-liveness')}
              className="w-full rounded-full py-6 text-base font-bold"
            >
              Continuar
            </Button>
          </>
        )}

        {/* LIVENESS */}
        {step === 'kyc-liveness' && (
          <>
            <KycSteps current={4} />
            <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-foreground">Prueba de vida</h2>
              <p className="text-xs text-muted-foreground">
                Sigue las instrucciones: parpadea, gira tu cabeza lentamente a la izquierda y luego a la derecha.
              </p>
              <div className="relative mx-auto aspect-square w-56 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <ScanFace className="h-24 w-24 text-primary animate-pulse" />
              </div>
              <div className="h-2 w-full bg-primary/15 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${livenessProgress}%` }} />
              </div>
              <p className="text-center text-xs font-semibold text-primary">{livenessProgress}% completado</p>
            </div>
            <Button
              disabled={livenessProgress < 100}
              onClick={() => setStep('kyc-review')}
              className="w-full rounded-full py-6 text-base font-bold"
            >
              Enviar para verificación
            </Button>
          </>
        )}

        {/* REVIEW */}
        {step === 'kyc-review' && (
          <div className="rounded-2xl bg-card shadow-sm p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Validando tu identidad...</h2>
            <p className="text-sm text-muted-foreground">Estamos cotejando tus datos biométricos con tu documento.</p>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <>
            <div className="rounded-2xl bg-card shadow-sm p-8 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <BadgeCheck className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">¡Identidad verificada!</h2>
              <p className="text-sm text-muted-foreground">
                Tu perfil ahora muestra la insignia oficial de identidad verificada.
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <BadgeCheck className="h-4 w-4" /> Identidad verificada
              </div>
            </div>
            <Button onClick={onBack} className="w-full rounded-full py-6 text-base font-bold">
              Volver a mi perfil
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('confirm-disable')}
              className="w-full rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-2 h-4 w-4" /> Inhabilitar certificación
            </Button>
          </>
        )}

        {/* CONFIRM DISABLE */}
        {step === 'confirm-disable' && (
          <div className="rounded-2xl bg-card shadow-sm p-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">¿Inhabilitar certificación?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Al inhabilitar tu certificación KYC perderás la insignia de identidad verificada en tu perfil.
                Si deseas recuperarla en el futuro deberás volver a pagar y realizar el proceso completo.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                variant="destructive"
                onClick={() => {
                  disable();
                  toast.success('Certificación inhabilitada');
                  onBack();
                }}
                className="w-full rounded-full py-6 text-base font-bold"
              >
                <XCircle className="mr-2 h-4 w-4" /> Sí, inhabilitar
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('success')}
                className="w-full rounded-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {status === 'rejected' && step === 'intro' && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 text-destructive p-3 text-xs">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            Tu verificación anterior fue rechazada. Puedes reintentar el proceso.
          </div>
        )}
      </div>
    </div>
  );
};

const KycSteps = ({ current }: { current: number }) => {
  const labels = ['Documento', 'Captura', 'Face ID', 'Prueba de vida'];
  return (
    <div className="rounded-2xl bg-card shadow-sm p-4">
      <div className="flex items-center justify-between gap-2">
        {labels.map((l, i) => {
          const idx = i + 1;
          const done = idx < current;
          const active = idx === current;
          return (
            <div key={l} className="flex-1 flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : idx}
              </div>
              <span className={`mt-1 text-[10px] text-center ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KycCertificationView;