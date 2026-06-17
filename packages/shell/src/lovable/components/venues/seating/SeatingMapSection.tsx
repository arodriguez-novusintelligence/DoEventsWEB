import { useState } from "react";
import { Label } from "@lovable/components/ui/label";
import { Switch } from "@lovable/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@lovable/components/ui/radio-group";
import { Badge } from "@lovable/components/ui/badge";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Grid3X3, Upload, Palette, Sparkles, DoorOpen, Trash2 } from "lucide-react";
import SeatingManualMode from "./SeatingManualMode";
import SeatingDesignerMode from "./SeatingDesignerMode";

interface AccessDoor {
  id: string;
  number: number;
  name: string;
}

type SeatingMode = "manual" | "designer";

const SeatingMapSection = () => {
  const [hasSeatingMap, setHasSeatingMap] = useState(false);
  const [seatingMode, setSeatingMode] = useState<SeatingMode>("designer");
  const [accessDoors, setAccessDoors] = useState<AccessDoor[]>([
    { id: "1", number: 1, name: "" },
  ]);

  const addAccessDoor = () => {
    const newDoor: AccessDoor = {
      id: Date.now().toString(),
      number: accessDoors.length + 1,
      name: "",
    };
    setAccessDoors([...accessDoors, newDoor]);
  };

  const removeAccessDoor = (id: string) => {
    if (accessDoors.length > 1) {
      const filtered = accessDoors.filter((door) => door.id !== id);
      const renumbered = filtered.map((door, index) => ({
        ...door,
        number: index + 1,
      }));
      setAccessDoors(renumbered);
    }
  };

  const updateDoorName = (id: string, name: string) => {
    setAccessDoors(
      accessDoors.map((door) =>
        door.id === id ? { ...door, name } : door
      )
    );
  };

  return (
    <div className="form-section">
      <div className="form-group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Grid3X3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="form-label mb-0">Mapa de silletería</Label>
              <p className="form-sublabel mt-0.5">
                ¿Tu lugar cuenta con distribución de asientos/mesas?
              </p>
            </div>
          </div>
          <Switch
            checked={hasSeatingMap}
            onCheckedChange={setHasSeatingMap}
          />
        </div>

        {hasSeatingMap && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Mode selection */}
            <RadioGroup
              value={seatingMode}
              onValueChange={(v) => setSeatingMode(v as SeatingMode)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {/* Designer Mode - Recommended */}
              <label
                htmlFor="designer-mode"
                className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  seatingMode === "designer"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Badge 
                  className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Recomendado
                </Badge>
                <RadioGroupItem value="designer" id="designer-mode" className="mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Diseño Personalizado</p>
                  <div className="flex items-center gap-2 mb-1">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="font-medium">Diseñar personalizado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Crea tu mapa de silletería con categorías y elementos visuales
                  </p>
                </div>
              </label>

              {/* Manual Mode */}
              <label
                htmlFor="manual-mode"
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  seatingMode === "manual"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="manual" id="manual-mode" className="mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Diseño Manual</p>
                  <div className="flex items-center gap-2 mb-1">
                    <Upload className="w-4 h-4 text-primary" />
                    <span className="font-medium">Subir imagen</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sube una imagen del mapa y describe las zonas manualmente
                  </p>
                </div>
              </label>
            </RadioGroup>

            {/* Mode content */}
            <div className="pt-2">
              {seatingMode === "manual" ? (
                <SeatingManualMode />
              ) : (
                <SeatingDesignerMode />
              )}
            </div>

            {/* Puertas de acceso - después de capacidad por zonas */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <DoorOpen className="w-5 h-5 text-primary" />
                <Label className="form-label mb-0">
                  Agregar puertas de ingreso al lugar <span className="text-destructive">*</span>
                </Label>
              </div>

              <div className="border border-border rounded-xl p-4 bg-background">
                <div className="space-y-4">
                  {accessDoors.map((door) => (
                    <div key={door.id} className="flex items-end gap-4">
                      <div className="w-24">
                        <p className="text-xs text-muted-foreground mb-1"># de puerta</p>
                        <div className="text-lg font-medium border-b border-border pb-1">
                          {door.number}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          Nombre de puerta (opcional)
                        </p>
                        <Input
                          value={door.name}
                          onChange={(e) => updateDoorName(door.id, e.target.value)}
                          placeholder="Ej: Principal, Lateral derecha..."
                          className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                        />
                      </div>
                      {accessDoors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => removeAccessDoor(door.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-primary hover:text-primary"
                  onClick={addAccessDoor}
                >
                  Agregar puerta +
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingMapSection;
