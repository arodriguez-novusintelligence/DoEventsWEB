import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  Grid3x3,
  Layers,
  Moon,
  LayoutGrid,
  Ruler,
  TrendingUp,
  Maximize2,
  RotateCcw,
  Trash2,
  X,
  Plus,
  Minus,
  Focus,
  Tag,
  Box,
  ChevronDown,
  Lock,
  Unlock,
  Type,
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Eraser,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Switch } from '@lovable/components/ui/switch';
import { toast } from 'sonner';
import {
  CATEGORY_COLORS,
  EventGate,
  FONT_FAMILIES,
  SEATING_CURRENCIES,
  SEATING_ORDER_LABELS,
  SeatingCurrency,
  SeatingFigure,
  SeatingFigureRole,
  SeatingFigureShape,
  SeatingMap,
  SeatingOrder,
  TEXT_PALETTE,
} from '@lovable/data/eventFormData';

interface Props {
  initialMap?: SeatingMap;
  onSave: (map: SeatingMap) => void;
  onClose: () => void;
  gates?: EventGate[];
  totalCapacity?: number;
  currentFloor?: number;
}

interface ShapeDef {
  id: SeatingFigureShape;
  label: string;
  icon: string;
}

const SHAPES: ShapeDef[] = [
  { id: 'rectangle', label: 'Rectángulo', icon: '▭' },
  { id: 'circle', label: 'Círculo', icon: '◯' },
  { id: 'image', label: 'Imagen', icon: '🖼' },
  { id: 'triangle', label: 'Triángulo', icon: '△' },
  { id: 'ellipse', label: 'Elipse', icon: '⬭' },
  { id: 'semicircle', label: 'Semicírculo', icon: '⌒' },
  { id: 'rhombus', label: 'Rombo', icon: '◇' },
  { id: 'trapezoid', label: 'Trapecio', icon: '⏢' },
  { id: 'horseshoe', label: 'Herradura', icon: '∪' },
  { id: 'stadium', label: 'Estadio', icon: '⬬' },
  { id: 'fan', label: 'Abanico', icon: '◗' },
  { id: 'ring', label: 'Anillo', icon: '◎' },
  { id: 'semi-ring', label: 'Semi anillo', icon: '◠' },
  { id: 'chevron', label: 'Chevron', icon: '⌵' },
  { id: 'octagon', label: 'Octágono', icon: '⬡' },
  { id: 'boomerang', label: 'Boomerang', icon: '↶' },
  { id: 'superellipse', label: 'Superellipse', icon: '⬭' },
  { id: 'text', label: 'Texto', icon: 'T' },
];

const SHAPE_LABEL = (s: SeatingFigureShape) =>
  SHAPES.find((sh) => sh.id === s)?.label ?? s;
const SHAPE_ICON = (s: SeatingFigureShape) =>
  SHAPES.find((sh) => sh.id === s)?.icon ?? '▭';

const arcClipPath = (span: number) => {
  const spanDeg = Math.max(60, Math.min(180, span));
  const spanRad = (spanDeg * Math.PI) / 180;
  const midAng = Math.PI / 2;
  const points = ['50% 100%'];
  const steps = Math.max(8, Math.ceil(spanDeg / 12));

  for (let i = 0; i <= steps; i++) {
    const angle = midAng + spanRad / 2 - (spanRad * i) / steps;
    const x = 50 + 50 * Math.cos(angle);
    const y = 100 - 100 * Math.sin(angle);
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }

  return `polygon(${points.join(', ')})`;
};

const smartArcInner = (
  shape: SeatingFigureShape,
  opts?: { arcInner?: number; rows?: number; seatsPerRow?: number },
) => {
  const isSemicircle = shape === 'semicircle';
  const minInner = isSemicircle ? 4 : 8;
  const requested = Math.max(
    minInner,
    Math.min(85, opts?.arcInner ?? (isSemicircle ? 8 : 55)),
  );
  const rows = Math.max(0, opts?.rows ?? 0);
  if (rows <= 0) return requested;

  // When many radial rows are configured, automatically thicken the usable band
  // so every row remains inside the horseshoe/semicircle silhouette.
  const requiredBand = Math.min(92, rows * 5 + 10);
  return Math.max(minInner, Math.min(requested, 100 - requiredBand));
};

const ARC_VB_W = 200;
const ARC_VB_H = 100;
const ARC_CX = 100;
const ARC_CY = 100;

const usesSvgArcGeometry = (shape: SeatingFigureShape) => shape === 'horseshoe';

const arcPoint = (radius: number, angle: number) =>
  [ARC_CX + radius * Math.cos(angle), ARC_CY - radius * Math.sin(angle)] as const;

const annularArcPath = (
  innerR: number,
  outerR: number,
  startAng: number,
  endAng: number,
) => {
  const [osx, osy] = arcPoint(outerR, startAng);
  const [oex, oey] = arcPoint(outerR, endAng);
  const [iex, iey] = arcPoint(innerR, endAng);
  const [isx, isy] = arcPoint(innerR, startAng);
  const largeArc = Math.abs(endAng - startAng) > Math.PI ? 1 : 0;
  return `M ${osx} ${osy} A ${outerR} ${outerR} 0 ${largeArc} 1 ${oex} ${oey} L ${iex} ${iey} A ${innerR} ${innerR} 0 ${largeArc} 0 ${isx} ${isy} Z`;
};

const getArcGeometry = (figure: SeatingFigure) => {
  const rows = Math.max(0, figure.rows ?? 0);
  const cols = Math.max(0, figure.seatsPerRow ?? 0);
  const spanDeg = Math.max(60, Math.min(180, figure.arcSpan ?? 180));
  const spanRad = (spanDeg * Math.PI) / 180;
  const visualInnerR = smartArcInner(figure.shape, {
    arcInner: figure.arcInner,
    rows,
    seatsPerRow: cols,
  });
  const shapeOuterR = 100;
  const shapeInnerR = Math.max(0, Math.min(88, visualInnerR));
  const midAng = Math.PI / 2;
  const startAng = midAng + spanRad / 2;
  const endAng = midAng - spanRad / 2;
  return {
    shapeOuterR,
    shapeInnerR,
    shapeStartAng: startAng,
    shapeEndAng: endAng,
  };
};

export const ArcFigureShape = ({ figure }: { figure: SeatingFigure }) => {
  const geometry = getArcGeometry(figure);
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${ARC_VB_W} ${ARC_VB_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={annularArcPath(
          geometry.shapeInnerR,
          geometry.shapeOuterR,
          geometry.shapeStartAng,
          geometry.shapeEndAng,
        )}
        fill={figure.color}
      />
    </svg>
  );
};

export const shapeStyle = (
  shape: SeatingFigureShape,
  opts?: { arcInner?: number; arcSpan?: number; rows?: number; seatsPerRow?: number },
): React.CSSProperties => {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'rectangle':
      return { borderRadius: 14 };
    case 'ellipse':
      return { borderRadius: '50% / 35%' };
    case 'stadium':
      return { borderRadius: 9999 };
    case 'triangle':
      return { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' };
    case 'rhombus':
      return { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' };
    case 'trapezoid':
      return { clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0 100%)' };
    case 'semicircle':
      return { borderRadius: '50% 50% 0 0' };
    case 'fan':
      return { clipPath: 'polygon(0 0, 100% 50%, 0 100%)' };
    case 'horseshoe': {
      // Half-ring band — arcInner controls inner radius and arcSpan controls opening.
      const inner = smartArcInner(shape, opts);
      const span = Math.max(60, Math.min(180, opts?.arcSpan ?? 180));
      const maskInner = Math.max(0, inner - 2);
      const mask = `radial-gradient(ellipse 100% 100% at 50% 100%, transparent 0 ${maskInner}%, #000 ${maskInner + 1}% 100%)`;
      return {
        clipPath: arcClipPath(span),
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      } as React.CSSProperties;
    }
    case 'ring':
      return { borderRadius: '50%', border: '16px solid currentColor', background: 'transparent' };
    case 'semi-ring':
      return {
        borderRadius: '50% 50% 0 0',
        border: '14px solid currentColor',
        borderBottom: 'none',
        background: 'transparent',
      };
    case 'chevron':
      return { clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 100%, 50% 50%, 0 0)' };
    case 'octagon':
      return {
        clipPath:
          'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)',
      };
    case 'boomerang':
      return {
        clipPath:
          'polygon(0 0, 50% 30%, 100% 0, 70% 50%, 100% 100%, 50% 70%, 0 100%, 30% 50%)',
      };
    case 'superellipse':
      return { borderRadius: '32%' };
    case 'text':
      return { background: 'transparent', border: 'none' };
    case 'image':
      return { borderRadius: 12, background: 'transparent', border: '2px dashed currentColor' };
    default:
      return { borderRadius: 12 };
  }
};

const SeatingMapEditor = ({
  initialMap,
  onSave,
  onClose,
  gates = [],
  totalCapacity = 1000,
  currentFloor = 1,
}: Props) => {
  const [figures, setFigures] = useState<SeatingFigure[]>(
    initialMap?.figures ?? []
  );
  const [past, setPast] = useState<SeatingFigure[][]>([]);
  const [future, setFuture] = useState<SeatingFigure[][]>([]);
  const suspendHistoryRef = useRef(false);
  const pushHistory = () => {
    if (suspendHistoryRef.current) return;
    setPast((p) => [...p.slice(-49), figures]);
    setFuture([]);
  };
  const undo = () => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [figures, ...f].slice(0, 50));
    setFigures(prev);
    setSelectedId(null);
  };
  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, figures].slice(-50));
    setFigures(next);
    setSelectedId(null);
  };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingShape, setPendingShape] = useState<SeatingFigureShape | null>(
    null
  );
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const replaceImageRef = useRef<HTMLInputElement>(null);
  const [replaceImageFor, setReplaceImageFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [dark, setDark] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [worldW, setWorldW] = useState(100);
  const [worldH, setWorldH] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  const ensureWorld = (needW: number, needH: number) => {
    setWorldW((w) => (needW > w - 5 ? Math.ceil((needW + 20) / 10) * 10 : w));
    setWorldH((h) => (needH > h - 5 ? Math.ceil((needH + 20) / 10) * 10 : h));
  };
  const shiftWorld = (shiftX: number, shiftY: number) => {
    if (shiftX <= 0 && shiftY <= 0) return;
    const sx = Math.max(0, shiftX);
    const sy = Math.max(0, shiftY);
    setFigures((arr) => arr.map((f) => ({ ...f, x: f.x + sx, y: f.y + sy })));
    setWorldW((w) => Math.ceil((w + sx + 10) / 10) * 10);
    setWorldH((h) => Math.ceil((h + sy + 10) / 10) * 10);
  };
  const [textEditId, setTextEditId] = useState<string | null>(null);

  const selected = figures.find((f) => f.id === selectedId) ?? null;
  const editing = figures.find((f) => f.id === editingId) ?? null;
  const textEditing = figures.find((f) => f.id === textEditId) ?? null;

  const addFigure = (
    shape: SeatingFigureShape,
    role: SeatingFigureRole,
    extras?: Partial<SeatingFigure>,
  ) => {
    const idx = figures.filter((f) => f.role === role).length + 1;
    const defaultName = role === 'category' ? `Categoría ${idx}` : `Elemento ${idx}`;
    const color =
      role === 'category'
        ? CATEGORY_COLORS[figures.length % CATEGORY_COLORS.length]
        : '#94A3B8';
    const newFig: SeatingFigure = {
      id: `fig-${Date.now()}`,
      shape,
      role,
      name: defaultName,
      x: 40,
      y: 40,
      w: 22,
      h: 14,
      rotation: 0,
      color,
      ...(role === 'category'
        ? {
            priceEnabled: true,
            currency: 'COP' as SeatingCurrency,
            price: 0,
            floor: currentFloor,
            rows: 6,
            seatsPerRow: 5,
            disabledSeats: [],
            seatingOrder: 'top-left' as SeatingOrder,
            seats: 30,
            description: '',
          }
        : { notes: '', floor: currentFloor }),
      ...(extras ?? {}),
    };
    pushHistory();
    setFigures((p) => [...p, newFig]);
    setSelectedId(newFig.id);
    setPendingShape(null);
    setPendingImageUrl(null);
    setEditingId(newFig.id); // open parametrization sheet right away
  };

  /** Convert an existing figure between 'category' and 'element' roles, seeding defaults. */
  const convertFigureRole = (id: string, role: SeatingFigureRole) => {
    pushHistory();
    setFigures((p) =>
      p.map((f) => {
        if (f.id !== id) return f;
        if (f.role === role) return f;
        if (role === 'category') {
          const rows = f.rows ?? 6;
          const spr = f.seatsPerRow ?? 5;
          return {
            ...f,
            role,
            priceEnabled: f.priceEnabled ?? true,
            currency: f.currency ?? ('COP' as SeatingCurrency),
            price: f.price ?? 0,
            floor: f.floor ?? 1,
            rows,
            seatsPerRow: spr,
            disabledSeats: f.disabledSeats ?? [],
            seatingOrder: f.seatingOrder ?? ('top-left' as SeatingOrder),
            seats: rows * spr,
            description: f.description ?? '',
            color:
              f.color && f.color !== '#94A3B8'
                ? f.color
                : CATEGORY_COLORS[figures.length % CATEGORY_COLORS.length],
          };
        }
        // category -> element
        return { ...f, role, notes: f.notes ?? '' };
      }),
    );
    toast(role === 'category' ? 'Convertido a categoría' : 'Convertido a elemento');
  };


  const updateFigure = (id: string, partial: Partial<SeatingFigure>) => {
    pushHistory();
    setFigures((p) =>
      p.map((f) => {
        if (f.id !== id) return f;
        const merged = { ...f, ...partial };
        if (merged.role === 'category') {
          const rows = merged.rows ?? 0;
          const spr = merged.seatsPerRow ?? 0;
          merged.seats = Math.max(0, rows * spr - (merged.disabledSeats?.length ?? 0));
        }
        return merged;
      })
    );
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const requestDeleteFigure = (id: string) => setPendingDeleteId(id);
  const confirmDeleteFigure = () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    if (!id) return;
    pushHistory();
    setFigures((p) => p.filter((f) => f.id !== id));
    setSelectedId(null);
    setEditingId(null);
  };
  const deleteFigure = (id: string) => requestDeleteFigure(id);


  const bringToFront = (id: string) => {
    pushHistory();
    setFigures((p) => {
      const f = p.find((x) => x.id === id);
      if (!f) return p;
      return [...p.filter((x) => x.id !== id), f];
    });
  };
  const sendToBack = (id: string) => {
    pushHistory();
    setFigures((p) => {
      const f = p.find((x) => x.id === id);
      if (!f) return p;
      return [f, ...p.filter((x) => x.id !== id)];
    });
  };

  const cloneFigure = () => {
    if (!selected) return;
    const copy: SeatingFigure = {
      ...selected,
      id: `fig-${Date.now()}`,
      x: Math.min(selected.x + 6, 80),
      y: Math.min(selected.y + 6, 80),
      name: selected.name + ' copia',
    };
    pushHistory();
    setFigures((p) => [...p, copy]);
    setSelectedId(copy.id);
  };

  /* Drag / Resize / Rotate handling */
  type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  type Interaction =
    | { mode: 'move'; id: string; startX: number; startY: number; figX: number; figY: number; moved: boolean }
    | { mode: 'resize'; id: string; handle: Handle; startX: number; startY: number; figX: number; figY: number; figW: number; figH: number }
    | { mode: 'rotate'; id: string; cx: number; cy: number; startAngle: number; figRot: number }
    | { mode: 'arcInner'; id: string; startY: number; figInner: number; figHpx: number }
    | { mode: 'arcSpan'; id: string; startX: number; figSpan: number; figWpx: number }
    | { mode: 'labelMove'; id: string; startX: number; startY: number; labelDx: number; labelDy: number; moved: boolean }
    | { mode: 'labelRotate'; id: string; cx: number; cy: number; startAngle: number; labelRot: number };

  const interactionRef = useRef<Interaction | null>(null);

  const startMove = (e: React.PointerEvent, fig: SeatingFigure) => {
    e.stopPropagation();
    setSelectedId(fig.id);
    if (fig.locked) return;
    if (!canvasRef.current) return;
    suspendHistoryRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    interactionRef.current = {
      mode: 'move',
      id: fig.id,
      startX: e.clientX,
      startY: e.clientY,
      figX: fig.x,
      figY: fig.y,
      moved: false,
    };
  };

  const startResize = (e: React.PointerEvent, fig: SeatingFigure, handle: Handle) => {
    e.stopPropagation();
    if (fig.locked) return;
    if (!canvasRef.current) return;
    pushHistory();
    suspendHistoryRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    interactionRef.current = {
      mode: 'resize',
      id: fig.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      figX: fig.x,
      figY: fig.y,
      figW: fig.w,
      figH: fig.h,
    };
  };

  const startRotate = (e: React.PointerEvent, fig: SeatingFigure) => {
    e.stopPropagation();
    if (fig.locked) return;
    if (!canvasRef.current) return;
    pushHistory();
    suspendHistoryRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = rect.left + ((fig.x + fig.w / 2) / worldW) * rect.width;
    const cy = rect.top + ((fig.y + fig.h / 2) / worldH) * rect.height;
    const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    interactionRef.current = {
      mode: 'rotate',
      id: fig.id,
      cx,
      cy,
      startAngle,
      figRot: fig.rotation ?? 0,
    };
  };

  const startLabelMove = (e: React.PointerEvent, fig: SeatingFigure) => {
    e.stopPropagation();
    setSelectedId(fig.id);
    if (fig.locked) return;
    if (!canvasRef.current) return;
    suspendHistoryRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    interactionRef.current = {
      mode: 'labelMove',
      id: fig.id,
      startX: e.clientX,
      startY: e.clientY,
      labelDx: fig.labelDx ?? 0,
      labelDy: fig.labelDy ?? 0,
      moved: false,
    };
  };

  const startLabelRotate = (e: React.PointerEvent, fig: SeatingFigure) => {
    e.stopPropagation();
    if (fig.locked) return;
    if (!canvasRef.current) return;
    pushHistory();
    suspendHistoryRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const cx =
      rect.left +
      ((fig.x + fig.w / 2 + (fig.labelDx ?? 0)) / worldW) * rect.width;
    const cy =
      rect.top +
      ((fig.y + fig.h / 2 + (fig.labelDy ?? 0)) / worldH) * rect.height;
    const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    interactionRef.current = {
      mode: 'labelRotate',
      id: fig.id,
      cx,
      cy,
      startAngle,
      labelRot: fig.labelRotation ?? 0,
    };
  };

  const startArcInner = (e: React.PointerEvent, fig: SeatingFigure) => {
    e.stopPropagation();
    e.preventDefault();
    if (fig.locked || !canvasRef.current) return;
    pushHistory();
    suspendHistoryRef.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const figHpx = Math.max(1, (fig.h / worldH) * rect.height);
    const startY = e.clientY;
    const figInner = fig.arcInner ?? 55;
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      const pct = (dy / figHpx) * 100;
      const next = Math.max(20, Math.min(85, Math.round(figInner + pct)));
      updateFigure(fig.id, { arcInner: next });
    };
    const onUp = () => {
      suspendHistoryRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const startArcSpan = (e: React.PointerEvent, fig: SeatingFigure) => {
    e.stopPropagation();
    e.preventDefault();
    if (fig.locked || !canvasRef.current) return;
    pushHistory();
    suspendHistoryRef.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const figWpx = Math.max(1, (fig.w / worldW) * rect.width);
    const startX = e.clientX;
    const figSpan = fig.arcSpan ?? 180;
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const pct = (dx / figWpx) * 180;
      const next = Math.max(60, Math.min(180, Math.round(figSpan + pct)));
      updateFigure(fig.id, { arcSpan: next });
    };
    const onUp = () => {
      suspendHistoryRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const it = interactionRef.current;
    if (!it || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (it.mode === 'move') {
      // Ignore sub-pixel jitter on click/tap so simply selecting a figure
      // never shifts its position. Only commit a move once the pointer has
      // clearly been dragged beyond a small threshold.
      const dxPx = e.clientX - it.startX;
      const dyPx = e.clientY - it.startY;
      if (Math.hypot(dxPx, dyPx) < 4) return;
      if (!it.moved) {
        suspendHistoryRef.current = false;
        pushHistory();
        suspendHistoryRef.current = true;
        it.moved = true;
      }
      const dx = (dxPx / rect.width) * worldW;
      const dy = (dyPx / rect.height) * worldH;
      const nx = it.figX + dx;
      const ny = it.figY + dy;
      const fig = figures.find((f) => f.id === it.id);
      if (fig) ensureWorld(nx + fig.w, ny + fig.h);
      updateFigure(it.id, { x: nx, y: ny });
    } else if (it.mode === 'resize') {
      const dx = ((e.clientX - it.startX) / rect.width) * worldW;
      const dy = ((e.clientY - it.startY) / rect.height) * worldH;
      let { figX: x, figY: y, figW: w, figH: h } = it;
      const min = 4;
      if (it.handle.includes('e')) w = Math.max(min, it.figW + dx);
      if (it.handle.includes('s')) h = Math.max(min, it.figH + dy);
      if (it.handle.includes('w')) {
        const nw = Math.max(min, it.figW - dx);
        x = it.figX + (it.figW - nw);
        w = nw;
      }
      if (it.handle.includes('n')) {
        const nh = Math.max(min, it.figH - dy);
        y = it.figY + (it.figH - nh);
        h = nh;
      }
      ensureWorld(x + w, y + h);
      updateFigure(it.id, { x, y, w, h });
    } else if (it.mode === 'rotate') {
      const ang = (Math.atan2(e.clientY - it.cy, e.clientX - it.cx) * 180) / Math.PI;
      const next = Math.round(it.figRot + (ang - it.startAngle));
      updateFigure(it.id, { rotation: ((next % 360) + 360) % 360 });
    } else if (it.mode === 'arcInner') {
      // Dragging up -> thinner band (higher inner). Down -> thicker band (lower inner).
      const dy = e.clientY - it.startY;
      const pct = it.figHpx > 0 ? (dy / it.figHpx) * 100 : 0;
      const next = Math.max(20, Math.min(85, Math.round(it.figInner + pct)));
      updateFigure(it.id, { arcInner: next });
    } else if (it.mode === 'arcSpan') {
      // Dragging outward (right tip to the right) opens the arc more.
      const dx = e.clientX - it.startX;
      const pct = it.figWpx > 0 ? (dx / it.figWpx) * 180 : 0;
      const next = Math.max(60, Math.min(180, Math.round(it.figSpan + pct)));
      updateFigure(it.id, { arcSpan: next });
    } else if (it.mode === 'labelMove') {
      const dxPx = e.clientX - it.startX;
      const dyPx = e.clientY - it.startY;
      if (!it.moved && Math.hypot(dxPx, dyPx) < 4) return;
      if (!it.moved) {
        suspendHistoryRef.current = false;
        pushHistory();
        suspendHistoryRef.current = true;
        it.moved = true;
      }
      const dx = (dxPx / rect.width) * worldW;
      const dy = (dyPx / rect.height) * worldH;
      updateFigure(it.id, { labelDx: it.labelDx + dx, labelDy: it.labelDy + dy });
    } else if (it.mode === 'labelRotate') {
      const ang = (Math.atan2(e.clientY - it.cy, e.clientX - it.cx) * 180) / Math.PI;
      const next = Math.round(it.labelRot + (ang - it.startAngle));
      updateFigure(it.id, { labelRotation: ((next % 360) + 360) % 360 });
    }
  };

  const onCanvasPointerUp = (e: React.PointerEvent) => {
    suspendHistoryRef.current = false;
    interactionRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    // If any figure was moved/resized into negative space, shift the world
    // so everything stays visible without restricting the user's movements.
    const minX = figures.reduce((m, f) => Math.min(m, f.x), 0);
    const minY = figures.reduce((m, f) => Math.min(m, f.y), 0);
    if (minX < 0 || minY < 0) shiftWorld(-Math.min(0, minX), -Math.min(0, minY));
  };

  const handleSave = () => {
    onSave({ figures });
    toast('Mapa de silletería guardado');
    onClose();
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const totalSeats = figures
    .filter((f) => f.role === 'category')
    .reduce((s, f) => s + (f.seats ?? 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Editando
          </p>
          <h2 className="text-base font-bold text-foreground">Piso {currentFloor}</h2>
        </div>
        <button
          onClick={() => setShowLegend(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Toolbar icons */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-card px-3 py-2">
        <ToolbarIcon
          onClick={undo}
          icon={<Undo2 className="h-4 w-4" />}
          disabled={past.length === 0}
        />
        <ToolbarIcon
          onClick={redo}
          icon={<Redo2 className="h-4 w-4" />}
          disabled={future.length === 0}
        />
        <ToolbarIcon
          active
          onClick={() => setShowLabels((v) => !v)}
          icon={<Eye className="h-4 w-4" />}
          dark
        />
        <ToolbarIcon
          onClick={() => selected && setEditingId(selected.id)}
          icon={<Pencil className="h-4 w-4" />}
          disabled={!selected}
        />
        <ToolbarIcon
          onClick={cloneFigure}
          icon={<Copy className="h-4 w-4" />}
          disabled={!selected}
        />
        <ToolbarIcon
          onClick={() => selected && bringToFront(selected.id)}
          icon={<ArrowUpToLine className="h-4 w-4" />}
          disabled={!selected}
        />
        <ToolbarIcon
          onClick={() => selected && sendToBack(selected.id)}
          icon={<ArrowDownToLine className="h-4 w-4" />}
          disabled={!selected}
        />
        <ToolbarIcon icon={<Grid3x3 className="h-4 w-4" />} />
        <ToolbarIcon
          onClick={() => setDark((v) => !v)}
          icon={<Moon className="h-4 w-4" />}
        />
        <ToolbarIcon icon={<Layers className="h-4 w-4" />} />
        <ToolbarIcon icon={<Focus className="h-4 w-4" />} />
        <ToolbarIcon
          active={showSeats}
          dark={showSeats}
          onClick={() => setShowSeats((v) => !v)}
          icon={<LayoutGrid className="h-4 w-4" />}
        />
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        <Chip icon={<Ruler className="h-3.5 w-3.5" />} label="Medidor" />
        <Chip
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label={`${figures.length} elem · ${zoom}%`}
        />
        <Chip icon={<Maximize2 className="h-3.5 w-3.5" />} label="Area 1.00x" />
        <Chip
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          label="Reiniciar area"
          onClick={() => {
            setFigures([]);
            setSelectedId(null);
          }}
        />
      </div>

      {/* Canvas */}
      <div className={`relative flex-1 overflow-hidden ${dark ? 'bg-zinc-900' : 'bg-secondary'}`}>
        <div className="absolute inset-0 overflow-auto">
          <div className="flex min-h-full min-w-full items-center justify-center">
            <div
              ref={canvasRef}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
              className={`relative ${
                dark ? 'bg-zinc-800' : 'bg-card'
              }`}
              style={{
                width: `${(zoom * worldW) / 100}%`,
                aspectRatio: `${worldW} / ${worldH}`,
                overflow: 'visible',
                backgroundImage: dark
                  ? 'linear-gradient(to right, hsl(0 0% 100% / 0.04) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.04) 1px, transparent 1px)'
                  : 'linear-gradient(to right, hsl(220 13% 91%) 1px, transparent 1px), linear-gradient(to bottom, hsl(220 13% 91%) 1px, transparent 1px)',
                backgroundSize: `${32 * (zoom / 100)}px ${32 * (zoom / 100)}px`,
              }}
            >
            {figures.map((fig) => {
              const isSelected = fig.id === selectedId;
              const rot = fig.rotation ?? 0;
              const wrapperStyle: React.CSSProperties = {
                left: `${(fig.x / worldW) * 100}%`,
                top: `${(fig.y / worldH) * 100}%`,
                width: `${(fig.w / worldW) * 100}%`,
                height: `${(fig.h / worldH) * 100}%`,
                transform: `rotate(${rot}deg)`,
                transformOrigin: 'center center',
              };
              const hasImage = !!fig.imageUrl;
              const innerStyle: React.CSSProperties = {
                background: hasImage ? '#fff' : fig.color,
                color: fig.color,
                overflow: 'hidden',
                ...shapeStyle(fig.shape, {
                  arcInner: fig.arcInner,
                  arcSpan: fig.arcSpan,
                  rows: fig.rows,
                  seatsPerRow: fig.seatsPerRow,
                }),
                ...(hasImage
                  ? {
                      backgroundImage: `url(${fig.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      border: 'none',
                    }
                  : {}),
              };
              const handles: { key: Handle; cls: string; cursor: string }[] = [
                { key: 'nw', cls: '-left-1.5 -top-1.5', cursor: 'nwse-resize' },
                { key: 'n', cls: 'left-1/2 -top-1.5 -translate-x-1/2', cursor: 'ns-resize' },
                { key: 'ne', cls: '-right-1.5 -top-1.5', cursor: 'nesw-resize' },
                { key: 'e', cls: '-right-1.5 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
                { key: 'se', cls: '-right-1.5 -bottom-1.5', cursor: 'nwse-resize' },
                { key: 's', cls: 'left-1/2 -bottom-1.5 -translate-x-1/2', cursor: 'ns-resize' },
                { key: 'sw', cls: '-left-1.5 -bottom-1.5', cursor: 'nesw-resize' },
                { key: 'w', cls: '-left-1.5 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
              ];
              const labelVisible = showLabels && fig.shape !== 'image' && !!fig.name;
              const showSeatGrid =
                showSeats &&
                fig.role === 'category' &&
                fig.shape !== 'image' &&
                (fig.rows ?? 0) > 0 &&
                (fig.seatsPerRow ?? 0) > 0;
              const isSvgArc = usesSvgArcGeometry(fig.shape) && !hasImage;
              const labelDx = fig.labelDx ?? 0;
              const labelDy = fig.labelDy ?? 0;
              const labelRot = fig.labelRotation ?? 0;
              const labelCenterX = fig.x + fig.w / 2 + labelDx;
              const labelCenterY = fig.y + fig.h / 2 + labelDy;
              return (
                <React.Fragment key={fig.id}>
                <div className="absolute" style={wrapperStyle} onClick={(e) => e.stopPropagation()}>
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedId(fig.id);
                      startMove(e, fig);
                    }}
                    onPointerMove={onCanvasPointerMove}
                    onPointerUp={onCanvasPointerUp}
                    onDoubleClick={() => setEditingId(fig.id)}
                    className={`relative h-full w-full flex ${fig.locked ? 'cursor-pointer' : 'cursor-grab'} touch-none items-center justify-center select-none ${
                      isSelected ? 'outline outline-2 outline-primary outline-offset-2' : ''
                    }`}
                    style={innerStyle}
                  >
                    {isSvgArc && <ArcFigureShape figure={fig} />}
                    {showSeatGrid && <SeatsGrid figure={fig} />}
                  </div>
                  {/* Lock toggle (visible when selected) */}
                  {isSelected && (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFigure(fig.id, { locked: !fig.locked });
                      }}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow"
                      title={fig.locked ? 'Desbloquear' : 'Bloquear'}
                    >
                      {fig.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                  )}
                  {isSelected && !fig.locked && (
                    <>
                      {handles.map((h) => (
                        <div
                          key={h.key}
                          onPointerDown={(e) => startResize(e, fig, h.key)}
                          onPointerMove={onCanvasPointerMove}
                          onPointerUp={onCanvasPointerUp}
                          className={`absolute h-3 w-3 rounded-full border-2 border-primary bg-background touch-none ${h.cls}`}
                          style={{ cursor: h.cursor }}
                        />
                      ))}
                      {/* Rotate handle */}
                      <div
                        onPointerDown={(e) => startRotate(e, fig)}
                        onPointerMove={onCanvasPointerMove}
                        onPointerUp={onCanvasPointerUp}
                        className="absolute left-1/2 -top-8 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background touch-none flex items-center justify-center"
                        style={{ cursor: 'grab' }}
                      >
                        <RotateCcw className="h-3 w-3 text-primary" />
                      </div>
                      <div className="pointer-events-none absolute left-1/2 -top-3 h-3 w-px -translate-x-1/2 bg-primary" />
                    </>
                  )}
                </div>
                {labelVisible && (
                  <div
                    className="absolute"
                    style={{
                      left: `${(labelCenterX / worldW) * 100}%`,
                      top: `${(labelCenterY / worldH) * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${labelRot}deg)`,
                      transformOrigin: 'center center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      onPointerDown={(e) => startLabelMove(e, fig)}
                      onPointerMove={onCanvasPointerMove}
                      onPointerUp={onCanvasPointerUp}
                      onDoubleClick={() => setEditingId(fig.id)}
                      className={`relative inline-flex items-center justify-center px-1 touch-none select-none ${
                        fig.locked ? 'cursor-pointer' : 'cursor-grab'
                      } ${isSelected ? 'outline outline-2 outline-primary outline-offset-2 rounded-sm' : ''}`}
                      style={{
                        color: fig.textColor ?? '#1e293b',
                        fontFamily: fig.fontFamily,
                        fontSize: fig.fontSize ? `${fig.fontSize}px` : '11px',
                        fontWeight: fig.fontWeight ?? 'bold',
                        fontStyle: fig.fontStyle ?? 'normal',
                        textDecoration: fig.textDecoration ?? 'none',
                        textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fig.name}
                      {isSelected && !fig.locked && (
                        <div
                          onPointerDown={(e) => startLabelRotate(e, fig)}
                          onPointerMove={onCanvasPointerMove}
                          onPointerUp={onCanvasPointerUp}
                          className="absolute left-1/2 -top-7 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background touch-none flex items-center justify-center"
                          style={{ cursor: 'grab' }}
                          title="Rotar etiqueta"
                        >
                          <RotateCcw className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      {isSelected && !fig.locked && (
                        <div className="pointer-events-none absolute left-1/2 -top-2 h-2 w-px -translate-x-1/2 bg-primary" />
                      )}
                    </div>
                  </div>
                )}
                </React.Fragment>
              );
            })}

            {figures.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className={`px-6 text-sm ${dark ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                  Toca una figura abajo para agregarla y configurarla como{' '}
                  <span className="font-semibold">Categoría</span> o{' '}
                  <span className="font-semibold">Elemento</span>.
                </p>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Zoom (fixed to viewport right edge, outside scroll container) */}
        <div className="pointer-events-none absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 25, 400))}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
          >
            <Focus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 25, 50))}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>


      {/* Selected mini panel */}
      {selected && (() => {
        const isArc = (['horseshoe', 'semicircle', 'fan', 'semi-ring'] as SeatingFigureShape[]).includes(selected.shape);
        const arcInner = selected.arcInner ?? 55;
        const arcSpan = selected.arcSpan ?? 180;
        const bumpInner = (d: number) => updateFigure(selected.id, { arcInner: Math.max(20, Math.min(85, arcInner + d)) });
        const bumpSpan = (d: number) => updateFigure(selected.id, { arcSpan: Math.max(60, Math.min(180, arcSpan + d)) });
        return (
        <div className="border-t border-border bg-card">
        {isArc && !selected.locked && (
          <div className="flex flex-wrap items-center gap-3 px-4 pt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Curvatura</span>
              <button onClick={() => bumpInner(-5)} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground">−</button>
              <span className="w-8 text-center font-bold tabular-nums">{arcInner}</span>
              <button onClick={() => bumpInner(5)} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground">+</button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Apertura</span>
              <button onClick={() => bumpSpan(-10)} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground">−</button>
              <span className="w-10 text-center font-bold tabular-nums">{arcSpan}°</span>
              <button onClick={() => bumpSpan(10)} className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground">+</button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-7 w-7 flex-shrink-0 rounded-md"
              style={{ background: selected.color }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {selected.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {selected.role === 'category' ? 'Categoría' : 'Elemento'} ·{' '}
                {SHAPE_LABEL(selected.shape)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTextEditId(selected.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground"
              title="Estilo de texto"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              onClick={() => updateFigure(selected.id, { name: '' })}
              disabled={!selected.name}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground disabled:opacity-40"
              title="Eliminar título"
            >
              <Eraser className="h-4 w-4" />
            </button>
            <button
              onClick={() => updateFigure(selected.id, { locked: !selected.locked })}
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                selected.locked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground'
              }`}
              title={selected.locked ? 'Desbloquear' : 'Bloquear'}
            >
              {selected.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setEditingId(selected.id)}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Pencil className="mr-1 inline h-3.5 w-3.5" /> Editar
            </button>
            <button
              onClick={() => deleteFigure(selected.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        </div>
        );
      })()}

      {/* Save bar */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
        <span>
          {figures.filter((f) => f.role === 'category').length} categorías ·{' '}
          {totalSeats} asientos
        </span>
        <Button
          size="sm"
          onClick={handleSave}
          className="rounded-full px-4 text-xs font-bold"
        >
          Guardar mapa
        </Button>
      </div>

      {/* Shape picker */}
      <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-3 py-3">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (s.id === 'image') {
                setPendingImageUrl(null);
                imageInputRef.current?.click();
              } else {
                setPendingShape(s.id);
              }
            }}
            className="flex min-w-[72px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card px-3 py-2 text-foreground transition-colors hover:border-primary hover:bg-primary/5"
          >
            {s.id === 'image' ? (
              <ImageIcon className="h-5 w-5 text-primary" aria-hidden />
            ) : (
              <span className="text-xl leading-none">{s.icon}</span>
            )}
            <span className="text-[11px] font-semibold">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Hidden file inputs for image picking */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const url = String(reader.result ?? '');
            if (!url) return;
            setPendingImageUrl(url);
            setPendingShape('image');
          };
          reader.readAsDataURL(file);
        }}
      />
      <input
        ref={replaceImageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const targetId = replaceImageFor;
          e.target.value = '';
          setReplaceImageFor(null);
          if (!file || !targetId) return;
          const reader = new FileReader();
          reader.onload = () => {
            const url = String(reader.result ?? '');
            if (!url) return;
            updateFigure(targetId, { imageUrl: url, shape: 'image' });
          };
          reader.readAsDataURL(file);
        }}
      />

      {pendingShape && (
        <RolePickerModal
          shape={pendingShape}
          onPick={(role) =>
            addFigure(
              pendingShape,
              role,
              pendingShape === 'image' && pendingImageUrl
                ? { imageUrl: pendingImageUrl, w: 28, h: 22 }
                : undefined,
            )
          }
          onClose={() => {
            setPendingShape(null);
            setPendingImageUrl(null);
          }}
        />
      )}


      {editing && editing.role === 'category' && (
        <CategoryFormSheet
          figure={editing}
          gates={gates}
          totalCapacity={totalCapacity}
          allFigures={figures}
          onChange={(p) => updateFigure(editing.id, p)}
          onDelete={() => deleteFigure(editing.id)}
          onClose={() => setEditingId(null)}
          onConvert={() => convertFigureRole(editing.id, 'element')}
          onPickImage={() => {
            setReplaceImageFor(editing.id);
            replaceImageRef.current?.click();
          }}
          onRemoveImage={() => updateFigure(editing.id, { imageUrl: undefined })}
        />
      )}
      {editing && editing.role === 'element' && (
        <ElementFormSheet
          figure={editing}
          onChange={(p) => updateFigure(editing.id, p)}
          onDelete={() => deleteFigure(editing.id)}
          onClose={() => setEditingId(null)}
          onConvert={() => convertFigureRole(editing.id, 'category')}
          onPickImage={() => {
            setReplaceImageFor(editing.id);
            replaceImageRef.current?.click();
          }}
          onRemoveImage={() => updateFigure(editing.id, { imageUrl: undefined })}
        />
      )}


      {textEditing && (
        <TextStyleModal
          figure={textEditing}
          onChange={(p) => updateFigure(textEditing.id, p)}
          onClose={() => setTextEditId(null)}
        />
      )}

      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}

      {pendingDeleteId && (() => {
        const fig = figures.find((f) => f.id === pendingDeleteId);
        const isCategory = fig?.role === 'category';
        const title = isCategory ? 'Eliminar categoría' : 'Eliminar elemento';
        const word = isCategory ? 'esta categoría' : 'este elemento';
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-5">
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <div
                  className="flex h-16 w-16 items-center justify-center text-white"
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    background: 'hsl(var(--primary))',
                  }}
                >
                  <span className="mt-3 text-2xl font-black leading-none">!</span>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold text-primary">{title}</h3>
              <p className="mb-5 text-sm text-muted-foreground">
                ¡Ten en cuenta que al eliminar {word}, se perderá toda la
                configuración asociada al mismo!
              </p>
              <button
                onClick={confirmDeleteFigure}
                className="mb-3 w-full rounded-full bg-destructive py-3 text-sm font-bold text-destructive-foreground shadow"
              >
                ELIMINAR
              </button>
              <button
                onClick={() => setPendingDeleteId(null)}
                className="w-full rounded-full border-2 border-primary py-3 text-sm font-bold text-primary"
              >
                VOLVER
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

/* ---------- Helpers ---------- */

const ToolbarIcon = ({
  icon,
  onClick,
  active,
  dark,
  disabled,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dark?: boolean;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
      active
        ? dark
          ? 'border-foreground bg-foreground text-background'
          : 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card text-foreground'
    } ${disabled ? 'opacity-40' : ''}`}
  >
    {icon}
  </button>
);

const Chip = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
  >
    {icon}
    {label}
  </button>
);

const RolePickerModal = ({
  shape,
  onPick,
  onClose,
}: {
  shape: SeatingFigureShape;
  onPick: (role: SeatingFigureRole) => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl">
      <h3 className="mb-4 text-center text-base font-bold text-foreground">
        ¿Qué deseas crear con {SHAPE_LABEL(shape)}?
      </h3>
      <div className="space-y-2">
        <button
          onClick={() => onPick('category')}
          className="flex w-full items-start gap-3 rounded-xl bg-primary p-3 text-left text-primary-foreground"
        >
          <Tag className="mt-0.5 h-4 w-4" />
          <div>
            <p className="text-sm font-bold">Categoría</p>
            <p className="text-[11px] opacity-90">
              Zonas para venta de tickets, con precio, puerta y silletería.
            </p>
          </div>
        </button>
        <button
          onClick={() => onPick('element')}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left"
        >
          <Box className="mt-0.5 h-4 w-4 text-foreground" />
          <div>
            <p className="text-sm font-bold text-foreground">Elemento</p>
            <p className="text-[11px] text-muted-foreground">
              Objetos de referencia: tarima, bar, baños, pista de baile, etc.
            </p>
          </div>
        </button>
        <Button onClick={onClose} variant="ghost" className="w-full rounded-xl">
          Cancelar
        </Button>
      </div>
    </div>
  </div>
);

/* ---------- Category Form Sheet ---------- */

const CategoryFormSheet = ({
  figure,
  gates,
  totalCapacity,
  allFigures,
  onChange,
  onDelete,
  onClose,
  onConvert,
  onPickImage,
  onRemoveImage,
}: {
  figure: SeatingFigure;
  gates: EventGate[];
  totalCapacity: number;
  allFigures: SeatingFigure[];
  onChange: (p: Partial<SeatingFigure>) => void;
  onDelete: () => void;
  onClose: () => void;
  onConvert: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
}) => {
  const otherSeats = allFigures
    .filter((f) => f.role === 'category' && f.id !== figure.id)
    .reduce((s, f) => s + (f.seats ?? 0), 0);
  const currentSeats = figure.seats ?? 0;
  const usedSeats = otherSeats + currentSeats;
  const withinCapacity = usedSeats <= totalCapacity;
  const usedPct = Math.min(100, Math.round((usedSeats / Math.max(1, totalCapacity)) * 100));

  const toggleSeat = (label: string) => {
    const set = new Set(figure.disabledSeats ?? []);
    if (set.has(label)) set.delete(label);
    else set.add(label);
    onChange({ disabledSeats: Array.from(set) });
  };

  const rows = figure.rows ?? 0;
  const spr = figure.seatsPerRow ?? 0;

  return (
    <Sheet onClose={onClose} title="Nueva Categoría">
      <div className="space-y-5 pb-6">
        {/* Name */}
        <Field label="Categoría">
          <Input
            value={figure.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ej: Palco"
            className="h-10 border-0 border-b border-border bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
        </Field>
        <NameStyleEditor figure={figure} onChange={onChange} />

        {/* Color */}
        <Field label="Color de la categoría">
          <div className="flex flex-wrap gap-3">
            {CATEGORY_COLORS.map((c) => {
              const active = figure.color === c;
              return (
                <button
                  key={c}
                  onClick={() => onChange({ color: c })}
                  className={`h-10 w-10 rounded-full border-2 transition-all ${
                    active ? 'ring-2 ring-primary ring-offset-2' : 'border-border'
                  }`}
                  style={{ background: c }}
                >
                  {active && <span className="block h-full w-full rounded-full" />}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Price toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Precio</span>
          <Switch
            checked={!!figure.priceEnabled}
            onCheckedChange={(v) => onChange({ priceEnabled: v })}
          />
        </div>

        {figure.priceEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Moneda">
              <Select
                value={figure.currency ?? 'COP'}
                onChange={(v) => onChange({ currency: v as SeatingCurrency })}
                options={SEATING_CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </Field>
            <Field label="Precio de boletería">
              <Input
                type="number"
                value={figure.price ?? 0}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
                placeholder="$450.000"
                className="h-10 border-0 border-b border-border bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              />
            </Field>
          </div>
        )}

        {/* Floor */}
        <Field label="Piso">
          <Select
            value={String(figure.floor ?? 1)}
            onChange={(v) => onChange({ floor: Number(v) })}
            options={[1, 2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: String(n),
            }))}
          />
        </Field>

        {/* Gate */}
        <Field label="Puerta de acceso">
          <Select
            value={figure.gateId ?? ''}
            onChange={(v) => onChange({ gateId: v || undefined })}
            placeholder="Seleccionar puerta"
            options={gates.map((g) => ({
              value: g.id,
              label: `Puerta ${g.number} · ${g.name}`,
            }))}
          />
        </Field>

        {/* Shape */}
        <Field label="Geometría">
          <Select
            value={figure.shape}
            onChange={(v) => onChange({ shape: v as SeatingFigureShape })}
            options={SHAPES.map((s) => ({
              value: s.id,
              label: `${s.icon}  ${s.label}`,
            }))}
            leftIcon={SHAPE_ICON(figure.shape)}
          />
        </Field>

        {/* Description */}
        <Field label="Descripción">
          <textarea
            value={figure.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Sillas preferenciales con servicio de bar"
            rows={2}
            className="w-full resize-none border-0 border-b border-border bg-transparent px-0 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </Field>

        {/* Seating map */}
        <div className="rounded-2xl bg-secondary/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Mapa de silletería</h4>
            <span className="text-xs text-muted-foreground">
              Número de sillas{' '}
              <span className="ml-1 font-bold text-foreground">{currentSeats}</span>
            </span>
          </div>

          <div
            className={`mb-4 rounded-xl border-l-4 p-3 ${
              withinCapacity
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-destructive bg-destructive/10'
            }`}
          >
            <p
              className={`mb-1 text-sm font-bold ${
                withinCapacity ? 'text-emerald-700' : 'text-destructive'
              }`}
            >
              {withinCapacity
                ? '✓ Dentro del aforo del evento'
                : '⚠ Excede el aforo del evento'}
            </p>
            <p className="mb-1 text-[11px] text-muted-foreground">Capacidad utilizada</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={withinCapacity ? 'h-full bg-emerald-500' : 'h-full bg-destructive'}
                style={{ width: `${usedPct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px]">
              <span className="text-muted-foreground">
                {usedSeats} de {totalCapacity} sillas
              </span>
              <span className={withinCapacity ? 'font-bold text-emerald-700' : 'font-bold text-destructive'}>
                {usedPct}%
              </span>
            </div>
            <p
              className={`mt-1 text-[11px] font-semibold ${
                withinCapacity ? 'text-emerald-700' : 'text-destructive'
              }`}
            >
              {Math.max(0, totalCapacity - usedSeats)} sillas disponibles
            </p>
          </div>

          <Stepper
            label="Número de filas"
            value={rows}
            min={1}
            max={50}
            onChange={(v) => onChange({ rows: v })}
          />
          <Stepper
            label="Sillas por fila"
            value={spr}
            min={1}
            max={50}
            onChange={(v) => onChange({ seatsPerRow: v })}
          />


          <div className="my-3 flex items-center justify-between">
            <span className="text-sm text-foreground">Inhabilitar sillas</span>
            <Switch
              checked={(figure.disabledSeats?.length ?? 0) > 0 || false}
              onCheckedChange={(v) => {
                if (!v) onChange({ disabledSeats: [] });
                else toast('Toca una silla en el mapa para inhabilitarla');
              }}
            />
          </div>

          <Field label="Orden de silletería">
            <Select
              value={figure.seatingOrder ?? 'top-left'}
              onChange={(v) => onChange({ seatingOrder: v as SeatingOrder })}
              options={(Object.keys(SEATING_ORDER_LABELS) as SeatingOrder[]).map(
                (k) => ({ value: k, label: SEATING_ORDER_LABELS[k] })
              )}
            />
          </Field>

          {/* Seat grid preview */}
          {rows > 0 && spr > 0 && (
            <div
              className="mt-4 rounded-2xl border border-border p-3"
              style={{ background: '#FFFDF7' }}
            >
              <div
                className="mb-3 -mx-3 -mt-3 rounded-t-2xl py-2 text-center text-sm font-bold text-foreground"
                style={{ background: figure.color }}
              >
                {figure.name || 'Categoría'}
              </div>
              {(() => {
                const order = figure.seatingOrder ?? 'top-left';
                const fromBottom = order.startsWith('bottom');
                const fromRight = order.endsWith('right');
                const visRows = Math.min(rows, 10);
                const visCols = Math.min(spr, 12);
                return (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: visRows }).map((_, ri) => {
                      // Letter A starts from the chosen corner row
                      const rowIndex = fromBottom ? visRows - 1 - ri : ri;
                      const rowLabel = String.fromCharCode(65 + rowIndex);
                      return (
                        <div key={ri} className="flex items-center gap-2">
                          <span className="w-4 text-xs font-bold text-foreground">
                            {rowLabel}
                          </span>
                          <div className="flex flex-1 flex-wrap gap-1.5">
                            {Array.from({ length: visCols }).map((_, ci) => {
                              const colNum = fromRight ? visCols - ci : ci + 1;
                              const label = `${rowLabel}${colNum}`;
                              const disabled = figure.disabledSeats?.includes(label);
                              const isA1 = label === 'A1';
                              return (
                                <button
                                  key={ci}
                                  onClick={() => toggleSeat(label)}
                                  className={`flex h-7 min-w-[28px] flex-1 items-center justify-center rounded-md border text-[10px] font-bold transition-colors ${
                                    disabled
                                      ? 'border-muted bg-muted text-muted-foreground line-through'
                                      : isA1
                                      ? 'border-primary ring-2 ring-primary'
                                      : 'border-border'
                                  }`}
                                  style={
                                    disabled
                                      ? undefined
                                      : { background: figure.color, color: '#1e293b' }
                                  }
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="mt-3 flex justify-center gap-5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-3 rounded"
                    style={{ background: figure.color }}
                  />
                  Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-muted" />
                  Inhabilitada
                </span>
              </div>
            </div>
          )}
        </div>

        <ImageAndRoleBlock
          figure={figure}
          onPickImage={onPickImage}
          onRemoveImage={onRemoveImage}
          onConvert={onConvert}
          targetRoleLabel="elemento"
        />
      </div>

      <FooterActions
        onCancel={onClose}
        onSave={onClose}
        secondary={
          <button
            onClick={onDelete}
            className="text-xs font-semibold text-destructive"
          >
            Eliminar categoría
          </button>
        }
      />
    </Sheet>
  );
};

/* ---------- Element Form Sheet ---------- */

const ElementFormSheet = ({
  figure,
  onChange,
  onDelete,
  onClose,
  onConvert,
  onPickImage,
  onRemoveImage,
}: {
  figure: SeatingFigure;
  onChange: (p: Partial<SeatingFigure>) => void;
  onDelete: () => void;
  onClose: () => void;
  onConvert: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
}) => (
  <Sheet onClose={onClose} title="Nuevo Elemento">
    <div className="space-y-5 pb-6">
      <Field label="Nombre del elemento">
        <Input
          value={figure.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ej: Baño principal"
          className="h-11 rounded-lg"
        />
      </Field>
      <NameStyleEditor figure={figure} onChange={onChange} />
      <Field label="Geometría">
        <Select
          value={figure.shape}
          onChange={(v) => onChange({ shape: v as SeatingFigureShape })}
          options={SHAPES.map((s) => ({
            value: s.id,
            label: `${s.icon}  ${s.label}`,
          }))}
          leftIcon={SHAPE_ICON(figure.shape)}
        />
      </Field>
      <Field label="Notas">
        <textarea
          value={figure.notes ?? ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Notas adicionales sobre el elemento"
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-secondary/40 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </Field>

      <ImageAndRoleBlock
        figure={figure}
        onPickImage={onPickImage}
        onRemoveImage={onRemoveImage}
        onConvert={onConvert}
        targetRoleLabel="categoría"
      />
    </div>
    <FooterActions
      onCancel={onClose}
      onSave={onClose}
      secondary={
        <button onClick={onDelete} className="text-xs font-semibold text-destructive">
          Eliminar elemento
        </button>
      }
    />
  </Sheet>
);

const ImageAndRoleBlock = ({
  figure,
  onPickImage,
  onRemoveImage,
  onConvert,
  targetRoleLabel,
}: {
  figure: SeatingFigure;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onConvert: () => void;
  targetRoleLabel: 'categoría' | 'elemento';
}) => (
  <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Imagen de la figura
      </p>
      {figure.imageUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={figure.imageUrl}
            alt={figure.name}
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
          <div className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              onClick={onPickImage}
              className="rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary"
            >
              Cambiar imagen
            </button>
            <button
              type="button"
              onClick={onRemoveImage}
              className="rounded-lg border border-destructive px-3 py-1.5 text-xs font-bold text-destructive"
            >
              Quitar imagen
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPickImage}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card px-3 py-3 text-xs font-bold text-foreground"
        >
          <Plus className="h-4 w-4" />
          Adjuntar imagen desde mi galería
        </button>
      )}
    </div>
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Convertir figura
      </p>
      <button
        type="button"
        onClick={onConvert}
        className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
      >
        Convertir en {targetRoleLabel}
      </button>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {targetRoleLabel === 'categoría'
          ? 'Activa precio, puerta y silletería para venta de tickets.'
          : 'Pasa a ser un objeto de referencia (sin precio ni sillas).'}
      </p>
    </div>
  </div>
);



/* ---------- Reusable sheet primitives ---------- */

const Sheet = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center">
    <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-4">{children}</div>
    </div>
  </div>
);

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-foreground">
      {label}
    </label>
    {children}
  </div>
);

const Select = ({
  value,
  onChange,
  options,
  placeholder,
  leftIcon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  leftIcon?: string;
}) => (
  <div className="relative">
    {leftIcon && (
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-base text-primary">
        {leftIcon}
      </span>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 w-full appearance-none border-0 border-b border-border bg-transparent ${
        leftIcon ? 'pl-6' : 'pl-0'
      } pr-8 text-sm text-foreground outline-none`}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
  </div>
);

const Stepper = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-foreground">{label}</span>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-bold text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const FooterActions = ({
  onCancel,
  onSave,
  secondary,
}: {
  onCancel: () => void;
  onSave: () => void;
  secondary?: React.ReactNode;
}) => (
  <div className="border-t border-border bg-card px-5 py-4">
    {secondary && <div className="mb-3 flex justify-end">{secondary}</div>}
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        onClick={onCancel}
        className="h-12 rounded-xl border-primary text-base font-bold text-primary"
      >
        Cancelar
      </Button>
      <Button
        onClick={onSave}
        className="h-12 rounded-xl bg-primary text-base font-bold text-primary-foreground"
      >
        Guardar cambios
      </Button>
    </div>
  </div>
);

const rowLetter = (idx: number) => {
  // 0 -> A, 25 -> Z, 26 -> AA ...
  let n = idx;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
};

export const SeatsGrid = ({
  figure,
  seatStates,
  interactive = false,
  onSeatClick,
}: {
  figure: SeatingFigure;
  seatStates?: Record<string, import('../../../lovable-bridge/venueToFigures').SeatVisualState>;
  interactive?: boolean;
  onSeatClick?: (label: string) => void;
}) => {
  const resolveSeatState = (label: string) => seatStates?.[label] ?? seatStates?.[label.toUpperCase()];

  const seatFillClass = (label: string, off: boolean) => {
    const state = resolveSeatState(label);
    if (off || state === 'disabled') return 'bg-zinc-400/60';
    if (state === 'selected') return 'bg-primary text-primary-foreground';
    if (state === 'available') return 'bg-emerald-400/90';
    if (state === 'sold') return 'bg-zinc-500/80 text-white';
    if (state === 'highlight') return 'bg-amber-400/90';
    return 'bg-white/90';
  };

  const seatRadialFill = (label: string, off: boolean): { fill: string; textFill: string } => {
    const state = resolveSeatState(label);
    if (off || state === 'disabled') {
      return { fill: 'rgba(161,161,170,0.6)', textFill: '#0F172A' };
    }
    if (state === 'selected') {
      return { fill: 'hsl(243 75% 59%)', textFill: '#FFFFFF' };
    }
    if (state === 'available') {
      return { fill: 'rgba(74,222,128,0.92)', textFill: '#0F172A' };
    }
    if (state === 'sold') {
      return { fill: 'rgba(113,113,122,0.88)', textFill: '#FFFFFF' };
    }
    if (state === 'highlight') {
      return { fill: 'rgba(251,191,36,0.92)', textFill: '#0F172A' };
    }
    return { fill: 'rgba(255,255,255,0.92)', textFill: '#0F172A' };
  };

  const canSelectRadialSeat = (label: string, off: boolean) => {
    if (!interactive || !onSeatClick || off) return false;
    const state = resolveSeatState(label);
    if (state === 'disabled' || state === 'sold' || state === 'highlight') return false;
    return state === 'available' || state === 'selected' || !state;
  };

  const rows = figure.rows ?? 0;
  const cols = figure.seatsPerRow ?? 0;
  const order: SeatingOrder = figure.seatingOrder ?? 'top-left';
  const disabled = new Set(figure.disabledSeats ?? []);
  const cells: { label: string; off: boolean }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // visual row/col
      const rowIdx =
        order === 'bottom-left' || order === 'bottom-right' ? rows - 1 - r : r;
      const colIdx =
        order === 'top-right' || order === 'bottom-right' ? cols - 1 - c : c;
      const label = `${rowLetter(rowIdx)}${colIdx + 1}`;
      cells.push({ label, off: disabled.has(label) });
    }
  }
  // Seat size is auto-fit to the figure geometry.
  const seatScale = 100;

  // Radial layout for arc-like shapes (horseshoe / semicircle / fan / semi-ring)
  const radialShapes: SeatingFigureShape[] = [
    'horseshoe',
    'semicircle',
    'fan',
    'semi-ring',
  ];
  if (radialShapes.includes(figure.shape)) {
    // Sector seating: letters = radial rows, numbers = angular slices.
    // Order option still controls direction.
    const VB_W = 200;
    const VB_H = 100;
    const cx = 100;
    const cy = 100;
    const outerR = 93;
    const safeInner = smartArcInner(figure.shape, {
      arcInner: figure.arcInner,
      rows,
      seatsPerRow: cols,
    });
    // Pull seats well inside the painted band and its radial edges so none are clipped.
    const innerR = Math.min(outerR - 6, safeInner + 3);
    const gap = 0.08; // fraction of slice/band reserved as gap
    const spanDeg = Math.max(60, Math.min(180, figure.arcSpan ?? 180));
    const spanRad = (spanDeg * Math.PI) / 180;
    const edgePadRad = Math.min(
      spanRad * 0.12,
      Math.max((2.5 * Math.PI) / 180, spanRad / Math.max(18, cols * 3)),
    );
    const midAng = Math.PI / 2; // top
    const startAng = midAng + spanRad / 2 - edgePadRad; // left side, inset
    const endAng = midAng - spanRad / 2 + edgePadRad; // right side, inset
    const totalSweep = endAng - startAng; // negative
    const angleStep = totalSweep / cols;
    const radStep = (outerR - innerR) / rows;
    const polar = (r: number, a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;

    const items: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // visual mapping with seatingOrder
        const rowIdx =
          order === 'bottom-left' || order === 'bottom-right' ? rows - 1 - r : r;
        const colIdx =
          order === 'top-right' || order === 'bottom-right' ? cols - 1 - c : c;
        // letter = radial row (A = innermost, growing outward), number = slice along arc
        const label = `${rowLetter(rowIdx)}${colIdx + 1}`;
        const off = disabled.has(label);
        const { fill, textFill } = seatRadialFill(label, off);
        const clickable = canSelectRadialSeat(label, off);

        // Rows distribute from inside (A) to outside, so r=0 is the innermost band.
        const r1 = innerR + r * radStep + radStep * gap;
        const r2 = innerR + (r + 1) * radStep - radStep * gap;
        const a1 = startAng + c * angleStep + angleStep * gap;
        const a2 = startAng + (c + 1) * angleStep - angleStep * gap;

        const [x1, y1] = polar(r1, a1);
        const [x2, y2] = polar(r2, a1);
        const [x3, y3] = polar(r2, a2);
        const [x4, y4] = polar(r1, a2);
        // Going left→right via top is clockwise in screen coords
        const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;

        // label position & rotation (top of text faces center)
        const am = (a1 + a2) / 2;
        const rm = (r1 + r2) / 2;
        const [tx, ty] = polar(rm, am);
        const rotDeg = 270 - (am * 180) / Math.PI;
        const fontPx = Math.max(
          1.6,
          Math.min(radStep, Math.abs(angleStep) * rm) * 0.45 * (seatScale / 100 + 0.4),
        );

        items.push(
          <g
            key={`${r}-${c}`}
            style={{ cursor: clickable ? 'pointer' : 'default' }}
            onClick={clickable ? () => onSeatClick(label) : undefined}
            role={clickable ? 'button' : undefined}
            aria-label={clickable ? `Asiento ${label}` : undefined}
          >
            <path
              d={d}
              fill={fill}
              stroke="rgba(15,23,42,0.15)"
              strokeWidth={0.2}
            />
            <text
              x={tx}
              y={ty}
              fill={textFill}
              fontWeight={600}
              fontSize={fontPx}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${rotDeg} ${tx} ${ty})`}
              style={{ pointerEvents: 'none' }}
            >
              {label}
            </text>
          </g>
        );
      }
    }

    return (
      <svg
        className={`absolute inset-0 h-full w-full ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
      >
        {items}
      </svg>
    );
  }


  // Inscribed rectangle (as % of the figure's bounding box) where seats can
  // safely live without being clipped by the shape's silhouette.
  const inscribed = ((): { w: number; h: number; x: number; y: number } => {
    switch (figure.shape) {
      case 'circle':
        return { w: 70, h: 70, x: 15, y: 15 };
      case 'ellipse':
        return { w: 78, h: 70, x: 11, y: 15 };
      case 'triangle':
        // Upward triangle: widest at the bottom; inscribed rect sits in the lower-middle.
        return { w: 55, h: 50, x: 22.5, y: 40 };
      case 'rhombus':
        return { w: 60, h: 60, x: 20, y: 20 };
      case 'trapezoid':
        return { w: 75, h: 80, x: 12.5, y: 10 };
      case 'stadium':
        return { w: 82, h: 90, x: 9, y: 5 };
      case 'chevron':
        return { w: 78, h: 55, x: 11, y: 8 };
      case 'octagon':
        return { w: 88, h: 88, x: 6, y: 6 };
      case 'boomerang':
        return { w: 60, h: 55, x: 20, y: 12 };
      case 'superellipse':
        return { w: 86, h: 86, x: 7, y: 7 };
      case 'ring':
        // Annulus: avoid using ring for seat grid; fall back to large inset.
        return { w: 60, h: 60, x: 20, y: 20 };
      case 'rectangle':
      default:
        return { w: 96, h: 96, x: 2, y: 2 };
    }
  })();

  return (
    <div
      className={`absolute grid ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{
        left: `${inscribed.x}%`,
        top: `${inscribed.y}%`,
        width: `${inscribed.w}%`,
        height: `${inscribed.h}%`,
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap: '1px',
        padding: '1px',
      }}
    >
      {cells.map((c, i) => {
        const fillClass = seatFillClass(c.label, c.off);
        const clickable = canSelectRadialSeat(c.label, c.off);
        const seatNode = (
          <div
            className={`flex items-center justify-center overflow-hidden rounded-full ${fillClass}`}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: '1 / 1',
              fontSize: `clamp(3px, ${seatScale * 0.07}px, 9px)`,
              color: '#0F172A',
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {c.label}
          </div>
        );
        return (
          <div key={i} className="flex items-center justify-center overflow-hidden">
            {clickable ? (
              <button
                type="button"
                className="flex h-full w-full items-center justify-center"
                onClick={() => onSeatClick!(c.label)}
              >
                {seatNode}
              </button>
            ) : (
              seatNode
            )}
          </div>
        );
      })}
    </div>
  );
};

const LegendModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Leyenda
          </p>
          <h3 className="text-base font-bold text-foreground">Botones del editor</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-3 text-sm">
        {[
          { icon: <Eye className="h-4 w-4" />, t: 'Nombres', d: 'Muestra u oculta los nombres en las figuras.' },
          { icon: <Pencil className="h-4 w-4" />, t: 'Editar', d: 'Abre el editor de la figura seleccionada.' },
          { icon: <Copy className="h-4 w-4" />, t: 'Clonar', d: 'Duplica la categoría o elemento seleccionado.' },
          { icon: <Grid3x3 className="h-4 w-4" />, t: 'Malla', d: 'Muestra u oculta la grilla del editor.' },
          { icon: <Moon className="h-4 w-4" />, t: 'Modo oscuro', d: 'Alterna el fondo del canvas.' },
          { icon: <LayoutGrid className="h-4 w-4" />, t: 'Sillas', d: 'Muestra el detalle de las sillas numeradas dentro de cada categoría.' },
        ].map((it, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
              {it.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{it.t}</p>
              <p className="text-xs text-muted-foreground">{it.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

/* ---------- Inline name style editor ---------- */

const FONT_SIZE_OPTIONS = [9, 11, 13, 15, 18, 22, 28];

const NameStyleEditor = ({
  figure,
  onChange,
}: {
  figure: SeatingFigure;
  onChange: (p: Partial<SeatingFigure>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const color = figure.textColor ?? '#0F172A';
  const family = figure.fontFamily ?? 'inherit';
  const size = figure.fontSize ?? 11;
  const weight = figure.fontWeight ?? 'bold';
  const style = figure.fontStyle ?? 'normal';
  const deco = figure.textDecoration ?? 'none';

  return (
    <div className="rounded-xl border border-border bg-secondary/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Estilo del nombre
          </span>
        </div>
        <span
          className="truncate rounded-md bg-card px-2 py-1 text-xs"
          style={{
            color,
            fontFamily: family,
            fontWeight: weight,
            fontStyle: style,
            textDecoration: deco,
          }}
        >
          {figure.name || 'Vista previa'}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          {/* Font family */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fuente
            </p>
            <select
              value={family}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          {/* Size */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tamaño
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FONT_SIZE_OPTIONS.map((s) => {
                const active = size === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange({ fontSize: s })}
                    className={`h-8 min-w-8 rounded-md border px-2 text-xs font-bold ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Style toggles */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Estilo
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onChange({ fontWeight: weight === 'bold' ? 'normal' : 'bold' })
                }
                className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                  weight === 'bold'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ fontStyle: style === 'italic' ? 'normal' : 'italic' })
                }
                className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                  style === 'italic'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    textDecoration: deco === 'underline' ? 'none' : 'underline',
                  })
                }
                className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                  deco === 'underline'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <Underline className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Color */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Color
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {TEXT_PALETTE.map((c) => {
                const active = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ textColor: c })}
                    className={`h-7 w-7 rounded-full border-2 ${
                      active ? 'ring-2 ring-primary ring-offset-2' : 'border-border'
                    }`}
                    style={{ background: c }}
                  />
                );
              })}
              <input
                type="color"
                value={color}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded-md border border-border bg-card"
                title="Color personalizado"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


/* ---------- Text style modal ---------- */

type TextTab = 'colores' | 'hex' | 'family' | 'size';

const TextStyleModal = ({
  figure,
  onChange,
  onClose,
}: {
  figure: SeatingFigure;
  onChange: (p: Partial<SeatingFigure>) => void;
  onClose: () => void;
}) => {
  const [tab, setTab] = useState<TextTab>('colores');
  const [draft, setDraft] = useState<Partial<SeatingFigure>>({
    textColor: figure.textColor ?? '#0F172A',
    fontFamily: figure.fontFamily ?? 'inherit',
    fontSize: figure.fontSize ?? 11,
    fontWeight: figure.fontWeight ?? 'bold',
    fontStyle: figure.fontStyle ?? 'normal',
    textDecoration: figure.textDecoration ?? 'none',
  });
  const set = (p: Partial<SeatingFigure>) => setDraft((d) => ({ ...d, ...p }));

  const apply = () => {
    onChange(draft);
    toast('Estilo de texto aplicado');
    onClose();
  };

  const tabs: { id: TextTab; label: string }[] = [
    { id: 'colores', label: 'Colores' },
    { id: 'hex', label: 'HEX' },
    { id: 'family', label: 'Font Family' },
    { id: 'size', label: 'Font Size' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl">
        <h3 className="mb-4 text-base font-bold text-foreground">Estilo de texto</h3>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'colores' && (
          <div className="flex flex-wrap gap-3">
            {TEXT_PALETTE.map((c) => {
              const active = draft.textColor?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => set({ textColor: c })}
                  className={`h-9 w-9 rounded-full border-2 ${
                    active ? 'ring-2 ring-primary ring-offset-2' : 'border-border'
                  }`}
                  style={{ background: c }}
                />
              );
            })}
          </div>
        )}

        {tab === 'hex' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Color HEX</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.textColor ?? '#000000'}
                onChange={(e) => set({ textColor: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-card"
              />
              <Input
                value={draft.textColor ?? ''}
                onChange={(e) => set({ textColor: e.target.value })}
                placeholder="#0F172A"
                className="h-10"
              />
            </div>
          </div>
        )}

        {tab === 'family' && (
          <div className="grid grid-cols-2 gap-2">
            {FONT_FAMILIES.map((f) => {
              const active = draft.fontFamily === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => set({ fontFamily: f.value })}
                  className={`rounded-xl border px-3 py-2 text-left text-sm ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground'
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {tab === 'size' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => set({ fontSize: Math.max(8, (draft.fontSize ?? 11) - 1) })}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
              >
                <Minus className="h-4 w-4" />
              </button>
              <Input
                type="number"
                value={draft.fontSize ?? 11}
                onChange={(e) => set({ fontSize: Number(e.target.value) })}
                className="h-10 w-20 text-center"
              />
              <button
                onClick={() => set({ fontSize: Math.min(72, (draft.fontSize ?? 11) + 1) })}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
        )}

        {/* Format toggles - always visible */}
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
          <button
            onClick={() =>
              set({ fontWeight: draft.fontWeight === 'bold' ? 'normal' : 'bold' })
            }
            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
              draft.fontWeight === 'bold'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            }`}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              set({ fontStyle: draft.fontStyle === 'italic' ? 'normal' : 'italic' })
            }
            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
              draft.fontStyle === 'italic'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            }`}
            title="Itálica"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() =>
              set({
                textDecoration: draft.textDecoration === 'underline' ? 'none' : 'underline',
              })
            }
            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
              draft.textDecoration === 'underline'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            }`}
            title="Subrayado"
          >
            <Underline className="h-4 w-4" />
          </button>

          <div
            className="ml-auto rounded-md border border-dashed border-border px-3 py-1.5"
            style={{
              color: draft.textColor,
              fontFamily: draft.fontFamily,
              fontSize: draft.fontSize ? `${draft.fontSize}px` : undefined,
              fontWeight: draft.fontWeight,
              fontStyle: draft.fontStyle,
              textDecoration: draft.textDecoration,
            }}
          >
            {figure.name}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full px-5">
            Cancelar
          </Button>
          <Button onClick={apply} className="rounded-full px-5 font-bold">
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeatingMapEditor;
