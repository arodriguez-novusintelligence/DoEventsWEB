import React, { useCallback, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@lovable/lib/utils';

export interface ZoomableSeatingMapProps {
  children: React.ReactNode;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  viewportHeight?: number | string;
}

/**
 * Contenedor de solo lectura con zoom (+/−), reset y desplazamiento por scroll.
 * Pensado para previsualizar mapas de silletería sin modo edición.
 */
export const ZoomableSeatingMap: React.FC<ZoomableSeatingMapProps> = ({
  children,
  className,
  minZoom = 75,
  maxZoom = 300,
  defaultZoom = 125,
  viewportHeight = 'min(55vh, 480px)',
}) => {
  const [zoom, setZoom] = useState(defaultZoom);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const changeZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(maxZoom, Math.max(minZoom, z + delta)));
  }, [maxZoom, minZoom]);

  const resetZoom = () => setZoom(100);

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      changeZoom(e.deltaY > 0 ? -12 : 12);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, zoom };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const ratio = dist / pinchRef.current.dist;
    const next = Math.min(maxZoom, Math.max(minZoom, pinchRef.current.zoom * ratio));
    setZoom(Math.round(next));
  };

  const onTouchEnd = () => {
    pinchRef.current = null;
  };

  return (
    <div className={cn('relative rounded-xl border border-border/60 bg-muted/20', className)}>
      <div
        ref={scrollRef}
        className="overflow-auto rounded-xl overscroll-contain"
        style={{ height: viewportHeight, touchAction: 'pan-x pan-y pinch-zoom' }}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="origin-top-left p-1 sm:p-2"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${10000 / zoom}%`,
            minHeight: '100%',
          }}
        >
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
        <p className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur">
          Arrastra para mover · pellizca o usa +/− para zoom
        </p>
      </div>

      <div className="absolute bottom-10 right-3 flex items-center gap-0.5 rounded-full bg-foreground/92 px-1.5 py-1 text-background shadow-lg backdrop-blur">
        <button
          type="button"
          aria-label="Alejar"
          onClick={() => changeZoom(-25)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background/15 active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[2.75rem] text-center text-[10px] font-bold tabular-nums">{zoom}%</span>
        <button
          type="button"
          aria-label="Acercar"
          onClick={() => changeZoom(25)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background/15 active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Restablecer zoom"
          onClick={resetZoom}
          className="flex h-8 w-8 items-center justify-center rounded-full border-l border-background/20 transition-colors hover:bg-background/15 active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ZoomableSeatingMap;
