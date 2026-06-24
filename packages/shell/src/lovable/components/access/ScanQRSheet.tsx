import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@lovable/components/ui/dialog';
import {
  ArrowLeft,
  CameraOff,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Zap,
  ZapOff,
  Camera,
  Loader2,
  AlertTriangle,
  OctagonAlert,
  Ticket,
} from 'lucide-react';

import { scanTicketFromQr } from '@doevents/shared';
interface ScanQRSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
}

type ScanStatus = 'idle' | 'validating' | 'result';
type ResultKind = 'success' | 'alreadyUsed' | 'invalidCode';

interface ScanResult {
  kind: ResultKind;
  id: string;
  estado: string;
  evento: string;
  lugar?: string;
  titular?: string;
  email?: string;
  validado: string;
}


const resultMeta: Record<ResultKind, {
  title: string;
  subtitle: string;
  Icon: typeof CheckCircle2;
  tone: string;
  border: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
}> = {
  success: {
    title: 'Acceso Válido',
    subtitle: 'Escaneo registrado correctamente.',
    Icon: CheckCircle2,
    tone: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-400/70',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleColor: 'text-emerald-700 dark:text-emerald-300',
  },
  alreadyUsed: {
    title: 'Acceso ya utilizado',
    subtitle: 'Este ticket ya fue utilizado (escaneado previamente).',
    Icon: AlertTriangle,
    tone: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-400/80',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-amber-700 dark:text-amber-300',
  },
  invalidCode: {
    title: 'Boleto Inválido',
    subtitle: 'El usuario no es el propietario del ticket. Solo el comprador puede utilizar este ticket.',
    Icon: OctagonAlert,
    tone: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-400/80',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-700 dark:text-red-300',
  },
};

const ScanQRSheet = ({ open, onOpenChange, eventTitle }: ScanQRSheetProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const cycleRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setResult(null);
      setFlashOn(false);
      return;
    }
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        setCameraReady(false);
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setCameraReady(false);
    };
  }, [open]);

  const simulateScan = () => {
    if (status !== 'idle') return;
    setStatus('validating');
    // simulate validation delay
    setTimeout(() => {
      const next = TICKETS[cycleRef.current % TICKETS.length];
      cycleRef.current += 1;
      setResult({
        ...next,
        evento: next.evento === 'Partido' ? eventTitle || 'Partido' : next.evento,
        validado: new Date().toISOString(),
      });
      setStatus('result');
    }, 1600);
  };

  const scanAnother = () => {
    setResult(null);
    setStatus('idle');
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden gap-0 bg-background border-0 sm:rounded-3xl
                   h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-4 pt-5 pb-3 shrink-0">
          <button
            onClick={close}
            aria-label="Volver"
            className="absolute left-3 top-1/2 -translate-y-1/2 -mt-1 h-9 w-9 grid place-items-center rounded-full hover:bg-muted/60 text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-extrabold text-primary">Escanear Boleto</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {/* Supervisor banner */}
          <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-400/60 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3">
            <div className="h-11 w-11 rounded-full border-2 border-emerald-500 grid place-items-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-emerald-700 dark:text-emerald-300 leading-tight">
                Sebastian
              </p>
              <p className="text-sm text-emerald-700/90 dark:text-emerald-300/90 leading-tight">
                Supervisor de Acceso
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                Control de acceso
              </p>
            </div>
          </div>

          {/* Camera viewfinder */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-background">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                <CameraOff className="h-8 w-8" />
                <span className="text-xs">Cámara no disponible</span>
              </div>
            )}

            {/* Scan frame overlay with corner brackets */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-[72%] w-[72%]">
                {/* corners */}
                <span className="absolute -top-1 -left-1 h-8 w-8 border-t-[5px] border-l-[5px] border-white rounded-tl-xl" />
                <span className="absolute -top-1 -right-1 h-8 w-8 border-t-[5px] border-r-[5px] border-white rounded-tr-xl" />
                <span className="absolute -bottom-1 -left-1 h-8 w-8 border-b-[5px] border-l-[5px] border-white rounded-bl-xl" />
                <span className="absolute -bottom-1 -right-1 h-8 w-8 border-b-[5px] border-r-[5px] border-white rounded-br-xl" />
                {/* scan line */}
                {status === 'idle' && cameraReady && (
                  <div className="absolute left-3 right-3 top-0 h-0.5 bg-primary shadow-[0_0_14px_hsl(var(--primary))] animate-[scan_2s_ease-in-out_infinite]" />
                )}
                {/* validating overlay */}
                {status === 'validating' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/45 rounded-xl">
                    <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                    <p className="text-primary-foreground font-semibold text-sm">Validando código QR...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Flash button */}
            <button
              type="button"
              onClick={() => setFlashOn((v) => !v)}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 inline-flex items-center gap-2 rounded-full bg-primary/95 hover:bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg"
            >
              {flashOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              {flashOn ? 'Apagar flash' : 'Encender flash'}
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl bg-card border border-border px-5 py-4 shadow-sm">
            <h3 className="text-center font-bold text-foreground mb-2">Instrucciones</h3>
            <ul className="text-sm text-foreground/80 space-y-1.5">
              <li className="flex gap-2"><span>•</span> Centra el código QR dentro del marco</li>
              <li className="flex gap-2"><span>•</span> Mantén el dispositivo estable</li>
              <li className="flex gap-2"><span>•</span> Asegúrate de tener buena iluminación</li>
              <li className="flex gap-2"><span>•</span> El escaneo será automático</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pb-5 pt-2 shrink-0 bg-background">
          <button
            onClick={simulateScan}
            disabled={status !== 'idle'}
            className="w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-80 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {status === 'validating' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Validando...
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" /> Tocar para Escanear
              </>
            )}
          </button>
        </div>

        {/* Result inner dialog */}
        <ResultDialog
          open={status === 'result' && !!result}
          result={result}
          onScanAnother={scanAnother}
          onBack={close}
        />

        <style>{`
          @keyframes scan {
            0% { transform: translateY(0); opacity: 0.2; }
            50% { transform: translateY(180px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.2; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

interface ResultDialogProps {
  open: boolean;
  result: ScanResult | null;
  onScanAnother: () => void;
  onBack: () => void;
}

const ResultDialog = ({ open, result, onScanAnother, onBack }: ResultDialogProps) => {
  if (!result) return null;
  const meta = resultMeta[result.kind];
  const { Icon } = meta;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onScanAnother()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0 bg-background rounded-3xl border-0">
        <div className="px-5 pt-6 pb-5">
          <h3 className="text-center text-xl font-extrabold text-foreground mb-4">
            Resultado del boleto
          </h3>

          {/* Status card */}
          <div className={`rounded-2xl border-2 ${meta.border} ${meta.tone} px-5 py-5 text-center`}>
            <div className={`mx-auto h-14 w-14 grid place-items-center rounded-full ${meta.iconBg} mb-2`}>
              <Icon className={`h-8 w-8 ${meta.iconColor}`} strokeWidth={2.2} />
            </div>
            <p className={`text-lg font-extrabold ${meta.titleColor}`}>{meta.title}</p>
            <p className={`text-sm mt-1 ${meta.titleColor}/90 font-medium`}>{meta.subtitle}</p>
          </div>

          {/* Detail card */}
          <div className="mt-4 rounded-2xl bg-card border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Detalle del boleto</span>
              </div>
              <span className="text-xs text-muted-foreground">ID: {result.id}</span>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Estado" value={<span className="font-bold">{result.estado}</span>} />
              {result.kind !== 'invalidCode' && (
                <>
                  <Row label="Evento" value={<span className="font-bold">{result.evento}</span>} />
                  <Row label="Lugar" value={result.lugar || '—'} />
                  <Row label="Titular" value={result.titular || '—'} />
                  <Row label="Email" value={<span className="font-semibold truncate max-w-[200px] inline-block align-bottom">{result.email}</span>} />
                </>
              )}
              <Row
                label="Validado"
                value={<span className="font-semibold">{new Date(result.validado).toLocaleString()}</span>}
              />
            </dl>
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              onClick={onScanAnother}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Escanear otro boleto
            </button>
            <button
              onClick={onBack}
              className="w-full rounded-2xl border-2 border-primary py-2.5 text-sm font-bold text-primary hover:bg-primary/5"
            >
              Atrás
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-foreground text-right">{value}</dd>
  </div>
);

export default ScanQRSheet;