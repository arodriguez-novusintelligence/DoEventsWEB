import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@lovable/components/ui/dialog';
import { Input } from '@lovable/components/ui/input';
import { Button } from '@lovable/components/ui/button';
import { ScanLine, ShieldCheck, CameraOff, KeyRound, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { scanTicketFromQr } from '@doevents/shared';
import { toast } from 'sonner';

interface ScanQRSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  eventId: string;
}

const ScanQRSheet = ({ open, onOpenChange, eventTitle, eventId }: ScanQRSheetProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (!open) {
      setManualCode('');
      setLastResult(null);
      return;
    }
    let stream: MediaStream | null = null;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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

  const validateCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      toast.error('Ingresa un código manualmente');
      return;
    }
    if (!eventId) {
      toast.error('Evento no identificado');
      return;
    }
    setValidating(true);
    setLastResult(null);
    try {
      const result = await scanTicketFromQr(code, eventId);
      setLastResult('success');
      toast.success(`✓ Acceso concedido • ${result.ticket_id || eventTitle}`);
      setManualCode('');
      setTimeout(() => onOpenChange(false), 1200);
    } catch (err) {
      setLastResult('error');
      toast.error(err instanceof Error ? err.message : 'Código inválido o acceso denegado');
    } finally {
      setValidating(false);
    }
  };

  const validate = () => void validateCode(manualCode);

  useEffect(() => {
    if (!open || !cameraReady || !videoRef.current || validating) return;
    const BarcodeDetectorCtor = (window as Window & {
      BarcodeDetector?: new (opts: { formats: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
      };
    }).BarcodeDetector;
    if (!BarcodeDetectorCtor) return;

    const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
    let cancelled = false;
    let raf = 0;

    const tick = async () => {
      if (cancelled || !videoRef.current || validating) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0 && !cancelled) {
          cancelled = true;
          setManualCode(codes[0].rawValue);
          void validateCode(codes[0].rawValue);
          return;
        }
      } catch {
        // ignore frame errors
      }
      raf = requestAnimationFrame(() => { void tick(); });
    };

    raf = requestAnimationFrame(() => { void tick(); });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [open, cameraReady, eventId, validating]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 bg-card">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
            <ScanLine className="h-5 w-5 text-primary" />
            Escanear código
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 truncate">{eventTitle}</p>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground px-4 text-center">
                <CameraOff className="h-8 w-8" />
                <span className="text-xs">Cámara no disponible — permite el acceso en ajustes del navegador o usa código manual</span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-3/5 w-3/5 rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <span className="absolute -top-px -left-px h-6 w-6 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                <span className="absolute -top-px -right-px h-6 w-6 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                <span className="absolute -bottom-px -left-px h-6 w-6 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                <span className="absolute -bottom-px -right-px h-6 w-6 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                {cameraReady && (
                  <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-primary shadow-[0_0_12px_hsl(var(--primary))] animate-pulse" />
                )}
              </div>
            </div>

            <div className="absolute left-0 right-0 bottom-2 text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                <ShieldCheck className="h-3 w-3" /> Centra el QR en el recuadro
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-secondary/60 p-4">
            <p className="text-[11px] text-muted-foreground mb-2">
              ¿No se detecta? Ingresa el código manualmente.
            </p>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <KeyRound className="h-3.5 w-3.5 text-primary" /> Código manual
            </label>
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !validating && void validate()}
              placeholder="Pega el código QR"
              disabled={validating}
              className="rounded-xl"
            />
          </div>

          {lastResult === 'success' && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Acceso validado correctamente
            </div>
          )}
          {lastResult === 'error' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                Código inválido — intenta de nuevo
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={() => {
                  setLastResult(null);
                  setManualCode('');
                }}
              >
                Reintentar
              </Button>
            </div>
          )}

          <button
            onClick={() => void validate()}
            disabled={validating}
            className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando…
              </>
            ) : (
              'Validar código'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanQRSheet;
