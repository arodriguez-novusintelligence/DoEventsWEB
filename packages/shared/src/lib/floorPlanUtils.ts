import type { FloorPlanGeometry } from '../types/floorPlan';

export function geometryBorderRadius(geometry: FloorPlanGeometry): string | undefined {
  if (geometry === 'CIRCLE') return '50%';
  if (geometry === 'ELLIPSE') return '50% / 40%';
  if (geometry === 'RECTANGLE') return '12px';
  if (geometry === 'SEMI_RING') return '999px 999px 0 0';
  return undefined;
}

export function geometryClipPath(geometry: FloorPlanGeometry): string | undefined {
  switch (geometry) {
    case 'TRIANGLE':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'TRAPEZOID':
      return 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)';
    case 'CHEVRON':
      return 'polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)';
    case 'OCTAGON':
      return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
    default:
      return undefined;
  }
}

export function geometryLabel(geometry: FloorPlanGeometry): string {
  const map: Record<FloorPlanGeometry, string> = {
    RECTANGLE: 'Rectángulo',
    CIRCLE: 'Círculo',
    ELLIPSE: 'Elipse',
    TRIANGLE: 'Triángulo',
    TRAPEZOID: 'Trapecio',
    RING: 'Anillo',
    SEMI_RING: 'Semi anillo',
    CHEVRON: 'Chevron',
    OCTAGON: 'Octágono',
    IMAGEN: 'Imagen',
  };
  return map[geometry] || geometry;
}

export function isRingGeometry(geometry: FloorPlanGeometry): boolean {
  return geometry === 'RING' || geometry === 'SEMI_RING';
}

export function clampPercent(value: number, min = 2, max = 98): number {
  return Math.min(max, Math.max(min, value));
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export function applyResize(
  handle: ResizeHandle,
  orig: { relX: number; relY: number; width: number; height: number },
  dx: number,
  dy: number,
  minSize = 4,
): { relX: number; relY: number; width: number; height: number } {
  const right = orig.relX + orig.width;
  const bottom = orig.relY + orig.height;
  let relX = orig.relX;
  let relY = orig.relY;
  let width = orig.width;
  let height = orig.height;

  if (handle === 'e' || handle === 'ne' || handle === 'se') {
    width = clampPercent(orig.width + dx, minSize, 100 - orig.relX);
  }
  if (handle === 'w' || handle === 'nw' || handle === 'sw') {
    relX = clampPercent(orig.relX + dx, 0, right - minSize);
    width = clampPercent(right - relX, minSize, 100 - relX);
  }
  if (handle === 's' || handle === 'se' || handle === 'sw') {
    height = clampPercent(orig.height + dy, minSize, 100 - orig.relY);
  }
  if (handle === 'n' || handle === 'ne' || handle === 'nw') {
    relY = clampPercent(orig.relY + dy, 0, bottom - minSize);
    height = clampPercent(bottom - relY, minSize, 100 - relY);
  }

  return { relX, relY, width, height };
}

/** Ángulo en grados desde el centro de la forma hacia el puntero (0° = arriba). */
export function rotationFromPointer(
  centerPctX: number,
  centerPctY: number,
  pointerPctX: number,
  pointerPctY: number,
): number {
  const rad = Math.atan2(pointerPctY - centerPctY, pointerPctX - centerPctX);
  const deg = (rad * 180) / Math.PI + 90;
  return Math.round(((deg % 360) + 360) % 360);
}

export function totalSeatsForEvent(
  floors: Array<{ categories: Array<{ seats: unknown[]; seatsPerRow?: number; rows?: number }> }>,
  hasSeating: boolean,
): number {
  if (!hasSeating) {
    return floors.flatMap((f) => f.categories).reduce((acc, c) => acc + (c.seatsPerRow || 0), 0);
  }
  return floors.flatMap((f) => f.categories).reduce((acc, c) => acc + (c.seats?.length || 0), 0);
}
