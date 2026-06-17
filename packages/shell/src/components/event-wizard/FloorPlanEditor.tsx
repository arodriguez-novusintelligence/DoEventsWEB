import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FLOOR_CANVAS_HEIGHT_PRESETS,
  FLOOR_PLAN_SHAPE_TOOLS,
  applyResize,
  buildSeatGrid,
  clampPercent,
  geometryBorderRadius,
  geometryClipPath,
  isRingGeometry,
  newWizardId,
  rotationFromPointer,
  type FloorPlanGeometry,
  type ResizeHandle,
  type WizardCategory,
  type WizardElement,
  type WizardFloor,
  type WizardGate,
} from '@doevents/shared';
import { CategoryFormModal, ElementFormModal, KindPickerModal } from './FloorPlanModals';
import { FloorPlanShapeView } from './FloorPlanShapeView';

type DraftShape = {
  geometry: FloorPlanGeometry;
  relX: number;
  relY: number;
  width: number;
  height: number;
};

type SelectedRef =
  | { kind: 'category'; id: string }
  | { kind: 'element'; id: string };

type TransformState =
  | { type: 'move'; id: string; kind: 'category' | 'element'; startX: number; startY: number; origX: number; origY: number }
  | { type: 'resize'; id: string; kind: 'category' | 'element'; handle: ResizeHandle; startX: number; startY: number; orig: { relX: number; relY: number; width: number; height: number } }
  | { type: 'rotate'; id: string; kind: 'category' | 'element'; origRotation: number; centerX: number; centerY: number };

interface FloorPlanEditorProps {
  floor: WizardFloor;
  floors: WizardFloor[];
  gates: WizardGate[];
  eventCapacity: number;
  onFloorChange: (floor: WizardFloor) => void;
  /** Oculta cabecera y barra de estado para el wizard móvil */
  compact?: boolean;
}

function defaultCategoryFromShape(shape: DraftShape, gateId: string, zIndex: number): WizardCategory {
  const rows = 4;
  const seatsPerRow = 5;
  return {
    categoryId: newWizardId(),
    name: '',
    color: '#BBDEFB',
    relX: shape.relX,
    relY: shape.relY,
    width: shape.width,
    height: shape.height,
    geometry: shape.geometry === 'IMAGEN' ? 'RECTANGLE' : shape.geometry,
    rotation: 0,
    zIndex,
    ringThickness: 55,
    locked: false,
    gateId,
    rows,
    seatsPerRow,
    seats: buildSeatGrid(rows, seatsPerRow),
    price: 50000,
    isPaid: true,
    currency: 'COP',
    description: '',
    colOrder: 'asc',
    rowOrder: 'asc',
    disableSeatsEnabled: false,
  };
}

function defaultElementFromShape(shape: DraftShape, zIndex: number): WizardElement {
  const isStage = shape.relY < 25;
  return {
    kind: 'element',
    id: newWizardId(),
    elementId: newWizardId(),
    name: isStage ? 'Tarima' : 'Elemento',
    type: isStage ? 'stage' : 'other',
    geometry: shape.geometry === 'IMAGEN' ? 'RECTANGLE' : shape.geometry,
    relX: shape.relX,
    relY: shape.relY,
    width: shape.width,
    height: shape.height,
    rotation: 0,
    zIndex,
    ringThickness: 55,
    locked: false,
    notes: '',
  };
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  floor,
  floors,
  gates,
  eventCapacity,
  onFloorChange,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef(floor);
  const transformCommitted = useRef(false);
  const transformRef = useRef<TransformState | null>(null);
  const [activeTool, setActiveTool] = useState<FloorPlanGeometry>('RECTANGLE');
  const [previewMode, setPreviewMode] = useState(false);
  const [showSeatsOnMap, setShowSeatsOnMap] = useState(false);
  const [selected, setSelected] = useState<SelectedRef | null>(null);
  const [draftShape, setDraftShape] = useState<DraftShape | null>(null);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [transformState, setTransformState] = useState<TransformState | null>(null);
  const [kindPickerOpen, setKindPickerOpen] = useState(false);
  const [pendingShape, setPendingShape] = useState<DraftShape | null>(null);
  const [editingCategory, setEditingCategory] = useState<WizardCategory | null>(null);
  const [editingElement, setEditingElement] = useState<WizardElement | null>(null);
  const [history, setHistory] = useState<WizardFloor[]>([floor]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    floorRef.current = floor;
  }, [floor]);

  useEffect(() => {
    transformRef.current = transformState;
  }, [transformState]);

  const zoom = floor.editorSettings?.zoom ?? 1;
  const showGrid = floor.editorSettings?.showGrid ?? true;
  const canvasHeight = floor.editorSettings?.canvasHeight ?? (compact ? 720 : 1200);

  const usedSeats = useMemo(
    () => floors.flatMap((f) => f.categories).reduce((acc, c) => acc + (c.seats.length || c.rows * c.seatsPerRow), 0),
    [floors],
  );

  const usedSeatsForModal = useMemo(() => {
    if (!editingCategory) return usedSeats;
    const current = floor.categories.find((c) => c.categoryId === editingCategory.categoryId);
    const currentCount = current ? (current.seats.length || current.rows * current.seatsPerRow) : 0;
    return usedSeats - (editingCategory.seats.length || editingCategory.rows * editingCategory.seatsPerRow) + currentCount;
  }, [usedSeats, editingCategory, floor.categories]);

  const selectedRingGeometry = selected?.kind === 'category'
    ? floor.categories.find((c) => c.categoryId === selected.id)?.geometry
    : selected?.kind === 'element'
      ? floor.elements.find((e) => e.elementId === selected.id)?.geometry
      : activeTool;

  const selectedRingThickness = selected?.kind === 'category'
    ? floor.categories.find((c) => c.categoryId === selected.id)?.ringThickness ?? 55
    : selected?.kind === 'element'
      ? floor.elements.find((e) => e.elementId === selected.id)?.ringThickness ?? 55
      : 55;

  const pushHistory = useCallback((next: WizardFloor) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, next].slice(-30);
    });
    setHistoryIndex((i) => Math.min(i + 1, 29));
    onFloorChange({
      ...next,
      editorSettings: {
        zoom: next.editorSettings?.zoom ?? 1,
        showGrid: next.editorSettings?.showGrid ?? true,
        lastSavedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    });
  }, [historyIndex, onFloorChange]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    onFloorChange(history[nextIndex]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    onFloorChange(history[nextIndex]);
  };

  const pctFromEvent = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 10, y: 10 };
    return {
      x: clampPercent(((clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((clientY - rect.top) / rect.height) * 100),
    };
  };

  const updateCategory = (categoryId: string, patch: Partial<WizardCategory>, recordHistory = true) => {
    const next = {
      ...floorRef.current,
      categories: floorRef.current.categories.map((c) => (c.categoryId === categoryId ? { ...c, ...patch } : c)),
    };
    floorRef.current = next;
    if (recordHistory) pushHistory(next);
    else onFloorChange(next);
  };

  const updateElement = (elementId: string, patch: Partial<WizardElement>, recordHistory = true) => {
    const next = {
      ...floorRef.current,
      elements: floorRef.current.elements.map((el) => (el.elementId === elementId ? { ...el, ...patch } : el)),
    };
    floorRef.current = next;
    if (recordHistory) pushHistory(next);
    else onFloorChange(next);
  };

  const patchItem = (
    id: string,
    kind: 'category' | 'element',
    patch: Partial<WizardCategory> | Partial<WizardElement>,
    recordHistory = true,
  ) => {
    if (kind === 'category') updateCategory(id, patch as Partial<WizardCategory>, recordHistory);
    else updateElement(id, patch as Partial<WizardElement>, recordHistory);
  };

  const getItemRect = (id: string, kind: 'category' | 'element') => {
    if (kind === 'category') {
      const c = floorRef.current.categories.find((x) => x.categoryId === id);
      return c ? { relX: c.relX, relY: c.relY, width: c.width, height: c.height, rotation: c.rotation } : null;
    }
    const el = floorRef.current.elements.find((x) => x.elementId === id);
    return el ? { relX: el.relX, relY: el.relY, width: el.width, height: el.height, rotation: el.rotation } : null;
  };

  const commitTransform = () => {
    if (transformState && !transformCommitted.current) {
      transformCommitted.current = true;
      pushHistory(floorRef.current);
    }
    setTransformState(null);
  };

  const applyTransformFromPointer = useCallback((clientX: number, clientY: number) => {
    const current = transformRef.current;
    if (!current) return;
    const pt = pctFromEvent(clientX, clientY);
    const { id, kind } = current;

    if (current.type === 'move') {
      const dx = pt.x - current.startX;
      const dy = pt.y - current.startY;
      const rect = getItemRect(id, kind);
      const maxW = rect?.width ?? 10;
      const maxH = rect?.height ?? 10;
      patchItem(id, kind, {
        relX: clampPercent(current.origX + dx, 0, 100 - maxW),
        relY: clampPercent(current.origY + dy, 0, 100 - maxH),
      }, false);
      return;
    }

    if (current.type === 'resize') {
      const dx = pt.x - current.startX;
      const dy = pt.y - current.startY;
      const next = applyResize(current.handle, current.orig, dx, dy);
      patchItem(id, kind, next, false);
      return;
    }

    if (current.type === 'rotate') {
      const rotation = rotationFromPointer(
        current.centerX,
        current.centerY,
        pt.x,
        pt.y,
      );
      patchItem(id, kind, { rotation }, false);
    }
  }, [pctFromEvent, getItemRect, patchItem]);

  useEffect(() => {
    if (!transformState) return undefined;
    const onMove = (ev: PointerEvent) => {
      applyTransformFromPointer(ev.clientX, ev.clientY);
    };
    const onUp = () => {
      commitTransform();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [applyTransformFromPointer, transformState]);

  const duplicateSelected = () => {
    if (!selected) return;
    const z = floor.categories.length + floor.elements.length + 1;
    const offset = 3;

    if (selected.kind === 'category') {
      const src = floor.categories.find((c) => c.categoryId === selected.id);
      if (!src) return;
      const categoryId = newWizardId();
      const copy: WizardCategory = {
        ...src,
        categoryId,
        name: src.name ? `${src.name} (copia)` : 'Copia',
        relX: clampPercent(src.relX + offset, 0, 100 - src.width),
        relY: clampPercent(src.relY + offset, 0, 100 - src.height),
        zIndex: z,
        seats: src.seats.map((seat) => ({ ...seat, seatId: newWizardId() })),
      };
      pushHistory({ ...floor, categories: [...floor.categories, copy] });
      setSelected({ kind: 'category', id: categoryId });
      setEditingCategory(copy);
      return;
    }

    const src = floor.elements.find((el) => el.elementId === selected.id);
    if (!src) return;
    const elementId = newWizardId();
    const copy: WizardElement = {
      ...src,
      id: elementId,
      elementId,
      name: `${src.name} (copia)`,
      relX: clampPercent(src.relX + offset, 0, 100 - src.width),
      relY: clampPercent(src.relY + offset, 0, 100 - src.height),
      zIndex: z,
    };
    pushHistory({ ...floor, elements: [...floor.elements, copy] });
    setSelected({ kind: 'element', id: elementId });
    setEditingElement(copy);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (previewMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('.de-fp-shape')) return;

    const pt = pctFromEvent(e.clientX, e.clientY);
    setDrawStart(pt);
    setDraftShape({ geometry: activeTool, relX: pt.x, relY: pt.y, width: 4, height: 4 });
    setSelected(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (transformState) return;

    if (!drawStart || !draftShape) return;
    const pt = pctFromEvent(e.clientX, e.clientY);
    const relX = clampPercent(Math.min(drawStart.x, pt.x), 0, 95);
    const relY = clampPercent(Math.min(drawStart.y, pt.y), 0, 95);
    const width = clampPercent(Math.abs(pt.x - drawStart.x), 4, 100 - relX);
    const height = clampPercent(Math.abs(pt.y - drawStart.y), 4, 100 - relY);
    setDraftShape({ ...draftShape, relX, relY, width, height });
  };

  const finishDraw = () => {
    if (!draftShape || draftShape.width < 3 || draftShape.height < 3) {
      setDraftShape(null);
      setDrawStart(null);
      return;
    }
    if (activeTool === 'IMAGEN') {
      const el = defaultElementFromShape({ ...draftShape, geometry: 'RECTANGLE' }, floor.elements.length + floor.categories.length);
      pushHistory({ ...floor, elements: [...floor.elements, el] });
      setEditingElement(el);
      setDraftShape(null);
      setDrawStart(null);
      return;
    }
    setPendingShape(draftShape);
    setKindPickerOpen(true);
    setDraftShape(null);
    setDrawStart(null);
  };

  const handleCanvasPointerUp = () => {
    if (transformState) {
      commitTransform();
      return;
    }
    if (drawStart) finishDraw();
  };

  const startMove = (id: string, kind: 'category' | 'element', e: React.PointerEvent) => {
    if (previewMode) return;
    e.stopPropagation();
    const item = kind === 'category'
      ? floor.categories.find((c) => c.categoryId === id)
      : floor.elements.find((el) => el.elementId === id);
    if (!item || item.locked) return;
    transformCommitted.current = false;
    const pt = pctFromEvent(e.clientX, e.clientY);
    setSelected({ kind, id });
    setTransformState({
      type: 'move',
      id,
      kind,
      startX: pt.x,
      startY: pt.y,
      origX: item.relX,
      origY: item.relY,
    });
  };

  const startResize = (id: string, kind: 'category' | 'element', handle: ResizeHandle, e: React.PointerEvent) => {
    const rect = getItemRect(id, kind);
    if (!rect) return;
    transformCommitted.current = false;
    const pt = pctFromEvent(e.clientX, e.clientY);
    setSelected({ kind, id });
    setTransformState({
      type: 'resize',
      id,
      kind,
      handle,
      startX: pt.x,
      startY: pt.y,
      orig: { relX: rect.relX, relY: rect.relY, width: rect.width, height: rect.height },
    });
  };

  const startRotate = (id: string, kind: 'category' | 'element', e: React.PointerEvent) => {
    const rect = getItemRect(id, kind);
    if (!rect) return;
    transformCommitted.current = false;
    setSelected({ kind, id });
    setTransformState({
      type: 'rotate',
      id,
      kind,
      origRotation: rect.rotation,
      centerX: rect.relX + rect.width / 2,
      centerY: rect.relY + rect.height / 2,
    });
  };

  const onPickKind = (kind: 'category' | 'element') => {
    if (!pendingShape) return;
    const z = floor.categories.length + floor.elements.length + 1;
    const gateId = gates[0]?.gateId || '';
    if (kind === 'category') {
      const cat = defaultCategoryFromShape(pendingShape, gateId, z);
      pushHistory({ ...floor, categories: [...floor.categories, cat] });
      setEditingCategory(cat);
      setSelected({ kind: 'category', id: cat.categoryId });
    } else {
      const el = defaultElementFromShape(pendingShape, z);
      pushHistory({ ...floor, elements: [...floor.elements, el] });
      setEditingElement(el);
      setSelected({ kind: 'element', id: el.elementId });
    }
    setKindPickerOpen(false);
    setPendingShape(null);
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (selected.kind === 'category') {
      pushHistory({ ...floor, categories: floor.categories.filter((c) => c.categoryId !== selected.id) });
    } else {
      pushHistory({ ...floor, elements: floor.elements.filter((el) => el.elementId !== selected.id) });
    }
    setSelected(null);
  };

  const allItems = useMemo(() => {
    const cats = floor.categories.map((c) => ({ kind: 'category' as const, z: c.zIndex, data: c }));
    const els = floor.elements.map((e) => ({ kind: 'element' as const, z: e.zIndex, data: e }));
    return [...cats, ...els].sort((a, b) => a.z - b.z);
  }, [floor]);

  return (
    <div className={`de-fp-editor${compact ? ' de-fp-editor--compact' : ''}`}>
      {!compact && (
        <div className="de-fp-editor__header">
          <div>
            <small>EDITANDO</small>
            <h3>{floor.name}</h3>
          </div>
          {floor.editorSettings?.lastSavedAt && (
            <span className="de-fp-autosave">Guardado automático: {floor.editorSettings.lastSavedAt}</span>
          )}
        </div>
      )}

      {compact && (
        <div className="de-fp-workspace-bar">
          <span className="de-fp-workspace-bar__label">Área de trabajo</span>
          <div className="de-fp-workspace-bar__presets">
            {FLOOR_CANVAS_HEIGHT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`de-fp-workspace-bar__btn${canvasHeight === preset.height ? ' de-fp-workspace-bar__btn--active' : ''}`}
                onClick={() => onFloorChange({
                  ...floor,
                  editorSettings: { ...floor.editorSettings, zoom, showGrid, canvasHeight: preset.height },
                })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="de-fp-toolbar">
        <button type="button" className={`de-fp-tool de-fp-tool--icon${previewMode ? ' de-fp-tool--active' : ''}`} onClick={() => setPreviewMode((v) => !v)} title="Vista previa" aria-label="Vista previa">👁</button>
        <button type="button" className={`de-fp-tool de-fp-tool--icon${showSeatsOnMap ? ' de-fp-tool--active' : ''}`} onClick={() => setShowSeatsOnMap((v) => !v)} title="Ver sillas" aria-label="Ver sillas">💺</button>
        <button type="button" className="de-fp-tool de-fp-tool--icon" onClick={undo} title="Deshacer" aria-label="Deshacer">↶</button>
        <button type="button" className="de-fp-tool de-fp-tool--icon" onClick={redo} title="Rehacer" aria-label="Rehacer">↷</button>
        <button
          type="button"
          className={`de-fp-tool de-fp-tool--icon${!previewMode ? ' de-fp-tool--active' : ''}`}
          title="Modo edición"
          aria-label="Modo edición"
          onClick={() => setPreviewMode(false)}
        >
          ✎
        </button>
        <button
          type="button"
          className="de-fp-tool de-fp-tool--icon"
          title="Propiedades"
          aria-label="Propiedades"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            if (selected.kind === 'category') {
              const cat = floor.categories.find((c) => c.categoryId === selected.id);
              if (cat) setEditingCategory(cat);
            } else {
              const el = floor.elements.find((e) => e.elementId === selected.id);
              if (el) setEditingElement(el);
            }
          }}
        >
          ⚙
        </button>
        <button type="button" className="de-fp-tool de-fp-tool--icon" onClick={duplicateSelected} title="Duplicar" aria-label="Duplicar" disabled={!selected}>⧉</button>
        <button type="button" className={`de-fp-tool de-fp-tool--icon${showGrid ? ' de-fp-tool--active' : ''}`} onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom, showGrid: !showGrid } })} title="Cuadrícula" aria-label="Cuadrícula">▦</button>
        {compact && (
          <>
            <button type="button" className="de-fp-tool de-fp-tool--icon" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: Math.min(3, zoom + 0.1), showGrid } })} title="Acercar" aria-label="Acercar">+</button>
            <button type="button" className="de-fp-tool de-fp-tool--icon" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: 1, showGrid } })} title="Restablecer zoom" aria-label="Restablecer zoom">◎</button>
            <button type="button" className="de-fp-tool de-fp-tool--icon" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: Math.max(0.35, zoom - 0.1), showGrid } })} title="Alejar" aria-label="Alejar">−</button>
          </>
        )}
        <button type="button" className="de-fp-tool de-fp-tool--icon de-fp-tool--danger" onClick={deleteSelected} title="Eliminar" aria-label="Eliminar" disabled={!selected}>🗑</button>
      </div>

      {!compact && (
        <div className="de-fp-statusbar">
          <span>Medidor</span>
          <span>{allItems.length} elem · {Math.round(zoom * 100)}%</span>
          <span>Area {zoom.toFixed(2)}x</span>
          <button type="button" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: 1, showGrid } })}>Reiniciar</button>
        </div>
      )}

      <div className="de-fp-canvas-wrap" style={{ minHeight: Math.min(canvasHeight + 80, 520) }}>
        <div
          ref={canvasRef}
          className={`de-fp-canvas${showGrid ? ' de-fp-canvas--grid' : ''}${previewMode ? ' de-fp-canvas--preview' : ''}`}
          style={{ transform: `scale(${zoom})`, minHeight: canvasHeight }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
        >
          <div className="de-fp-canvas__bounds" />

          {allItems.map((item) => {
            if (item.kind === 'element') {
              const el = item.data as WizardElement;
              return (
                <FloorPlanShapeView
                  key={el.elementId}
                  label={el.name}
                  geometry={el.geometry}
                  color="#94A3B8"
                  relX={el.relX}
                  relY={el.relY}
                  width={el.width}
                  height={el.height}
                  rotation={el.rotation}
                  ringThickness={el.ringThickness}
                  selected={selected?.kind === 'element' && selected.id === el.elementId}
                  preview={previewMode}
                  isElement
                  onSelect={() => {
                    if (previewMode) return;
                    setSelected({ kind: 'element', id: el.elementId });
                  }}
                  onEdit={() => setEditingElement(el)}
                  onPointerDown={(e) => startMove(el.elementId, 'element', e)}
                  onResizeStart={(handle, e) => startResize(el.elementId, 'element', handle, e)}
                  onRotateStart={(e) => startRotate(el.elementId, 'element', e)}
                />
              );
            }
            const cat = item.data as WizardCategory;
            return (
              <FloorPlanShapeView
                key={cat.categoryId}
                label={cat.name}
                geometry={cat.geometry}
                color={cat.color}
                relX={cat.relX}
                relY={cat.relY}
                width={cat.width}
                height={cat.height}
                rotation={cat.rotation}
                ringThickness={cat.ringThickness}
                selected={selected?.kind === 'category' && selected.id === cat.categoryId}
                preview={previewMode}
                showSeats={showSeatsOnMap || previewMode}
                seats={cat.seats}
                onSelect={() => {
                  if (previewMode) return;
                  setSelected({ kind: 'category', id: cat.categoryId });
                }}
                onEdit={() => setEditingCategory(cat)}
                onPointerDown={(e) => startMove(cat.categoryId, 'category', e)}
                onResizeStart={(handle, e) => startResize(cat.categoryId, 'category', handle, e)}
                onRotateStart={(e) => startRotate(cat.categoryId, 'category', e)}
              />
            );
          })}

          {draftShape && (
            <div
              className="de-fp-shape de-fp-shape--draft"
              style={{
                left: `${draftShape.relX}%`,
                top: `${draftShape.relY}%`,
                width: `${draftShape.width}%`,
                height: `${draftShape.height}%`,
                borderRadius: geometryBorderRadius(draftShape.geometry),
                clipPath: geometryClipPath(draftShape.geometry),
              }}
            />
          )}
        </div>

        {!compact && (
          <div className="de-fp-zoom">
            <button type="button" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: Math.min(3, zoom + 0.1), showGrid } })}>+</button>
            <button type="button" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: 1, showGrid } })}>◎</button>
            <button type="button" onClick={() => onFloorChange({ ...floor, editorSettings: { ...floor.editorSettings, zoom: Math.max(0.35, zoom - 0.1), showGrid } })}>−</button>
          </div>
        )}
      </div>

      {!previewMode && (
        <div className="de-fp-shape-bar">
          {FLOOR_PLAN_SHAPE_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`de-fp-shape-btn${activeTool === tool.id ? ' de-fp-shape-btn--active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span>{tool.icon}</span>
              <small>{tool.label}</small>
            </button>
          ))}
        </div>
      )}

      {(isRingGeometry(activeTool) || (selectedRingGeometry && isRingGeometry(selectedRingGeometry))) && !previewMode && (
        <label className="de-fp-ring-slider">
          Grosor anillo
          <input
            type="range"
            min={20}
            max={80}
            value={selectedRingThickness}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (selected?.kind === 'category') {
                updateCategory(selected.id, { ringThickness: value });
              } else if (selected?.kind === 'element') {
                updateElement(selected.id, { ringThickness: value });
              }
            }}
          />
          <span>{selectedRingThickness}%</span>
        </label>
      )}

      <KindPickerModal open={kindPickerOpen} onPick={onPickKind} onClose={() => { setKindPickerOpen(false); setPendingShape(null); }} />

      {editingCategory && (
        <CategoryFormModal
          open
          category={floor.categories.find((c) => c.categoryId === editingCategory.categoryId) || editingCategory}
          gates={gates}
          floorName={floor.name}
          eventCapacity={eventCapacity}
          usedSeats={usedSeatsForModal}
          onChange={(patch) => updateCategory(editingCategory.categoryId, patch)}
          onSave={() => {
            const cat = floor.categories.find((c) => c.categoryId === editingCategory.categoryId);
            if (cat) {
              const idx = floor.categories.findIndex((c) => c.categoryId === cat.categoryId);
              const name = cat.name.trim() || `Zona ${idx + 1}`;
              const expected = cat.rows * cat.seatsPerRow;
              const seats = cat.seats.length === expected
                ? cat.seats
                : buildSeatGrid(cat.rows, cat.seatsPerRow);
              updateCategory(cat.categoryId, { name, seats });
            }
            setEditingCategory(null);
          }}
          onClose={() => setEditingCategory(null)}
          onDelete={() => {
            pushHistory({
              ...floor,
              categories: floor.categories.filter((c) => c.categoryId !== editingCategory.categoryId),
            });
            setSelected(null);
            setEditingCategory(null);
          }}
        />
      )}

      {editingElement && (
        <ElementFormModal
          open
          element={floor.elements.find((e) => e.elementId === editingElement.elementId) || editingElement}
          onChange={(patch) => updateElement(editingElement.elementId, patch)}
          onSave={() => setEditingElement(null)}
          onClose={() => setEditingElement(null)}
          onDelete={() => {
            pushHistory({
              ...floor,
              elements: floor.elements.filter((el) => el.elementId !== editingElement.elementId),
            });
            setSelected(null);
            setEditingElement(null);
          }}
        />
      )}
    </div>
  );
};
