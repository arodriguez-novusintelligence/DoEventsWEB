import React, { useEffect, useMemo, useState } from 'react';
import {
  DoorOpen,
  Expand,
  EyeOff as EyeOffIcon,
  Home as HomeIcon,
  Maximize2,
  Menu,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { SEATING_MAP_TEMPLATES, formatTemplateCapacityLabel } from '@lovable/data/seatingTemplates';
import SeatingTemplateInfoPanel from '@lovable/components/venues/seating/SeatingTemplateInfoPanel';
import { Button } from '@lovable/components/ui/button';
import { newWizardId, type WizardFloor, type WizardGate } from '@doevents/shared';
import SeatingMapEditor from '@lovable/components/events/SeatingMapEditor';
import { SeatingPreview } from '@lovable/components/events/StepEventLocation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lovable/components/ui/alert-dialog';
import {
  seatingMapToWizardFloors,
  wizardFloorsToSeatingMap,
  wizardGatesToEventGates,
} from '../../lovable-bridge/placeSeatingBridge';

export interface PlaceSeatingMapSectionProps {
  placeName: string;
  floors: WizardFloor[];
  gates: WizardGate[];
  capacity: string | number;
  onFloorsChange: (floors: WizardFloor[]) => void;
  onGatesChange: (gates: WizardGate[]) => void;
}

export const PlaceSeatingMapSection: React.FC<PlaceSeatingMapSectionProps> = ({
  placeName,
  floors,
  gates,
  capacity,
  onFloorsChange,
  onGatesChange,
}) => {
  const [previewHidden, setPreviewHidden] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newGateName, setNewGateName] = useState('');
  const [floorTabs, setFloorTabs] = useState<number[]>([1]);
  const [activeFloor, setActiveFloor] = useState(1);
  const [floorToRemove, setFloorToRemove] = useState<number | null>(null);

  const eventCapacity = Number(capacity) || 1000;
  const seatingMap = useMemo(() => wizardFloorsToSeatingMap(floors), [floors]);
  const eventGates = useMemo(() => wizardGatesToEventGates(gates), [gates]);
  const allFigures = seatingMap.figures;

  const currentFloorFigures = useMemo(
    () => allFigures.filter((f) => (f.floor ?? 1) === activeFloor),
    [allFigures, activeFloor],
  );

  useEffect(() => {
    const fromFigures = Array.from(new Set(allFigures.map((f) => f.floor ?? 1))).sort((a, b) => a - b);
    const fromWizard = floors.map((_, index) => index + 1);
    const merged = Array.from(new Set([...fromFigures, ...fromWizard])).sort((a, b) => a - b);
    if (!merged.length) return;
    setFloorTabs((prev) => {
      const next = Array.from(new Set([...prev, ...merged])).sort((a, b) => a - b);
      return next.length === prev.length && next.every((v, i) => v === prev[i]) ? prev : next;
    });
  }, [allFigures, floors.length]);

  const addFloor = () => {
    const next = (floorTabs[floorTabs.length - 1] ?? 0) + 1;
    setFloorTabs([...floorTabs, next]);
    setActiveFloor(next);
  };

  const confirmRemoveFloor = () => {
    if (floorToRemove == null || floorToRemove === 1) {
      setFloorToRemove(null);
      return;
    }
    const remaining = floorTabs.filter((f) => f !== floorToRemove);
    const filteredFigures = allFigures.filter((f) => (f.floor ?? 1) !== floorToRemove);
    const nextMap = { ...seatingMap, figures: filteredFigures };
    onFloorsChange(seatingMapToWizardFloors(nextMap, gates, floors));
    setFloorTabs(remaining);
    if (activeFloor === floorToRemove) setActiveFloor(remaining[0] ?? 1);
    setFloorToRemove(null);
    toast.success(`Piso ${floorToRemove} eliminado`);
  };

  const addGate = () => {
    const name = newGateName.trim();
    if (!name) return;
    onGatesChange([
      ...gates,
      {
        gateId: newWizardId(),
        gateNumber: gates.length + 1,
        name,
        description: '',
      },
    ]);
    setNewGateName('');
  };

  const removeGate = (gateId: string) => {
    if (gates.length <= 1) return;
    onGatesChange(gates.filter((g) => g.gateId !== gateId));
  };

  const handleMapSave = (map: ReturnType<typeof wizardFloorsToSeatingMap>) => {
    const others = allFigures.filter((f) => (f.floor ?? 1) !== activeFloor);
    const updated = map.figures.map((f) => ({
      ...f,
      floor: f.floor ?? activeFloor,
    }));
    onFloorsChange(seatingMapToWizardFloors({ ...map, figures: [...others, ...updated] }, gates, floors));
    setEditorOpen(false);
  };

  if (!floors.length) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        <h3 className="text-base font-bold text-foreground">
          Agregar puertas de ingreso al lugar{' '}
          <span className="text-sm font-medium text-destructive">(obligatorio)</span>
        </h3>

        <div className="rounded-xl border border-border p-3">
          <div className="grid grid-cols-[60px_1fr] items-end gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                # de puerta
              </label>
              <div className="border-b border-input pb-1 text-sm font-bold text-foreground">
                {gates.length + 1}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                Nombre de la puerta
              </label>
              <input
                value={newGateName}
                onChange={(e) => setNewGateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGate();
                  }
                }}
                placeholder="Ej. Entrada principal"
                className="w-full border-b border-input bg-transparent pb-1 text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addGate}
            className="ml-auto mt-2 flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Plus className="h-4 w-4" /> Agregar puerta
          </button>
        </div>

        <div className="space-y-2">
          {gates.map((g) => (
            <div
              key={g.gateId}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <DoorOpen className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground">{g.gateNumber}</span>
              <span className="flex-1 text-sm font-semibold text-foreground">{g.name}</span>
              {gates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGate(g.gateId)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive"
                  aria-label="Eliminar puerta"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {gates.length > 0 ? (
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <HomeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {placeName.trim() || 'Nuevo lugar'}
              </p>
              <p className="text-xs text-muted-foreground">
                Diseña las zonas (categorías) y referencias (elementos) del lugar.
              </p>
            </div>
          </div>

          <h3 className="text-base font-bold text-foreground">Editor de mapa de silletería</h3>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-semibold text-primary">Plantillas</p>
            <p className="text-[11px] text-muted-foreground">
              Diseños base listos para editar en el canvas.
            </p>
            <div className="flex flex-col gap-3">
              {SEATING_MAP_TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl justify-start h-auto py-2 px-3"
                    onClick={() => {
                      const wizardGates = tpl.gates.map((g) => ({
                        gateId: g.id,
                        gateNumber: g.number,
                        name: g.name,
                        description: '',
                      }));
                      onGatesChange(wizardGates);
                      onFloorsChange(seatingMapToWizardFloors(tpl.seatingMap, wizardGates));
                      setFloorTabs(tpl.floors);
                      setActiveFloor(tpl.floors[0] ?? 1);
                      toast.success(
                        `Plantilla "${tpl.name}" cargada · ${formatTemplateCapacityLabel(tpl)}`,
                      );
                    }}
                  >
                    <span className="text-left">
                      <span className="block text-sm font-semibold">{tpl.name}</span>
                      <span className="block text-[11px] text-muted-foreground font-normal">
                        {tpl.city} · {formatTemplateCapacityLabel(tpl)}
                      </span>
                    </span>
                  </Button>
                  <SeatingTemplateInfoPanel template={tpl} compact />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewHidden((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left"
          >
            <span className="text-sm font-semibold text-foreground">Vista previa del editor</span>
            <span className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background">
              <EyeOffIcon className="h-3.5 w-3.5" />
              {previewHidden ? 'Mostrar editor' : 'Ocultar editor'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Maximize2 className="h-4 w-4" /> Vista completa · desliza
            </span>
            <span className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background">
              <Expand className="h-3.5 w-3.5" /> Abrir editor
            </span>
          </button>

          {!previewHidden && (
            <div className="relative min-h-[260px] rounded-xl border border-border bg-card p-2">
              {currentFloorFigures.length === 0 ? (
                <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
                  <Menu className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    Piso {activeFloor} vacío. Abre el editor para empezar.
                  </p>
                </div>
              ) : (
                <SeatingPreview figures={currentFloorFigures} />
              )}

              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-md"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Ver completo
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => floorTabs.length > 1 && setFloorToRemove(activeFloor)}
              disabled={activeFloor === 1}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary disabled:opacity-30"
              aria-label="Eliminar piso"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="flex flex-1 gap-2 overflow-x-auto">
              {floorTabs.map((f) => {
                const isActive = f === activeFloor;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFloor(f)}
                    className={`shrink-0 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground'
                    }`}
                  >
                    Piso {f}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addFloor}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary"
              aria-label="Agregar piso"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {editorOpen && (
            <SeatingMapEditor
              initialMap={{ ...seatingMap, figures: currentFloorFigures }}
              gates={eventGates}
              totalCapacity={eventCapacity}
              currentFloor={activeFloor}
              onSave={handleMapSave}
              onClose={() => setEditorOpen(false)}
            />
          )}

          <AlertDialog
            open={floorToRemove !== null}
            onOpenChange={(o) => !o && setFloorToRemove(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar Piso {floorToRemove}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todo el diseño realizado sobre el canvas de este piso.
                  Los cambios se perderán de forma definitiva y no podrán recuperarse.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmRemoveFloor}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sí, eliminar piso
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Editor de mapa de silletería</h3>
          <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <DoorOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Agrega al menos una puerta de ingreso</p>
            <p className="text-xs text-muted-foreground">
              Para acceder al editor de mapa de silletería, primero debes registrar al menos una puerta de ingreso al lugar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceSeatingMapSection;
