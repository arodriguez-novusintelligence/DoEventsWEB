export type FloorPlanGeometry =
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'ELLIPSE'
  | 'TRIANGLE'
  | 'TRAPEZOID'
  | 'RING'
  | 'SEMI_RING'
  | 'CHEVRON'
  | 'OCTAGON'
  | 'IMAGEN';

export type FloorPlanItemKind = 'category' | 'element';

export type SeatOrder = 'asc' | 'desc';

export interface FloorPlanBaseShape {
  id: string;
  kind: FloorPlanItemKind;
  name: string;
  geometry: FloorPlanGeometry;
  relX: number;
  relY: number;
  width: number;
  height: number;
  rotation: number;
  /** Offset del título respecto al centro (unidades del canvas). */
  labelDx?: number;
  labelDy?: number;
  labelRotation?: number;
  zIndex: number;
  locked: boolean;
  ringThickness?: number;
}

export interface WizardElement extends FloorPlanBaseShape {
  kind: 'element';
  elementId: string;
  type: 'stage' | 'bathroom' | 'stairs' | 'entrance' | 'exit' | 'other';
  notes: string;
}

export interface FloorEditorSettings {
  zoom: number;
  showGrid: boolean;
  /** Altura del lienzo editable en px (600–1600) */
  canvasHeight?: number;
  lastSavedAt?: string;
}

export const FLOOR_CANVAS_HEIGHT_PRESETS = [
  { id: 'compact', label: 'Compacto', height: 600 },
  { id: 'medium', label: 'Mediano', height: 900 },
  { id: 'large', label: 'Amplio', height: 1200 },
  { id: 'xlarge', label: 'Máximo', height: 1600 },
] as const;

export const FLOOR_PLAN_SHAPE_TOOLS: Array<{ id: FloorPlanGeometry; label: string; icon: string }> = [
  { id: 'RECTANGLE', label: 'Rectángulo', icon: '▭' },
  { id: 'CIRCLE', label: 'Círculo', icon: '○' },
  { id: 'IMAGEN', label: 'Imagen', icon: '🖼' },
  { id: 'TRIANGLE', label: 'Triángulo', icon: '△' },
  { id: 'ELLIPSE', label: 'Elipse', icon: '⬭' },
  { id: 'TRAPEZOID', label: 'Trapecio', icon: '⏢' },
  { id: 'RING', label: 'Anillo', icon: '◎' },
  { id: 'SEMI_RING', label: 'Semi anillo', icon: '◠' },
  { id: 'CHEVRON', label: 'Chevron', icon: '⌄' },
  { id: 'OCTAGON', label: 'Octágono', icon: '⬡' },
];

export const CATEGORY_PASTEL_COLORS = [
  '#E8DCC8', '#FFDAB9', '#FFF9C4', '#C8E6C9', '#BBDEFB', '#E1BEE7', '#F8BBD0', '#B2DFDB',
];
