import React, { useEffect, useRef, useState } from 'react';

export interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ open, onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    let raf = 0;

    const start = async () => {
      setError(null);
      setScanning(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = typeof window !== 'undefined' && 'BarcodeDetector' in window
          ? new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector({ formats: ['qr_code'] })
          : null;

        const loop = async () => {
          if (cancelled || !videoRef.current || !detector) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              onScan(value.trim());
              onClose();
              return;
            }
          } catch {
            /* ignore frame errors */
          }
          raf = window.requestAnimationFrame(loop);
        };

        if (detector) {
          raf = window.requestAnimationFrame(loop);
        } else {
          setError('Tu navegador no soporta escaneo automático. Ingresa el código manualmente.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo acceder a la cámara');
      } finally {
        if (!cancelled) setScanning(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (raf) window.cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open, onClose, onScan]);

  if (!open) return null;

  return (
    <div className="de-qr-scanner" role="dialog" aria-modal="true">
      <div className="de-qr-scanner__panel">
        <header className="de-qr-scanner__header">
          <h2>Escanear código</h2>
          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>
        </header>
        <div className="de-qr-scanner__video-wrap">
          <video ref={videoRef} className="de-qr-scanner__video" playsInline muted />
          <div className="de-qr-scanner__frame" aria-hidden="true" />
        </div>
        {scanning && <p className="de-qr-scanner__hint">Apunta la cámara al QR de la boleta…</p>}
        {error && <p className="de-qr-scanner__error">{error}</p>}
        <label className="de-form-stack">
          <span>Código manual</span>
          <input
            className="de-form-input"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Pega el código QR"
          />
        </label>
        <button
          type="button"
          className="de-access-btn de-access-btn--primary"
          onClick={() => {
            if (!manualCode.trim()) return;
            onScan(manualCode.trim());
            onClose();
          }}
        >
          Validar código
        </button>
      </div>
    </div>
  );
};

export default QrScanner;
