import { useState } from "react";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import { Button } from "@lovable/components/ui/button";
import { Textarea } from "@lovable/components/ui/textarea";
import { Upload, Trash2, Eye, X } from "lucide-react";
import { SeatingZone, ZONE_COLORS } from "./types";

const SeatingManualMode = () => {
  const [seatingMapPreview, setSeatingMapPreview] = useState<string | null>(null);
  const [seatingZones, setSeatingZones] = useState<SeatingZone[]>([
    { id: "1", name: "", capacity: "", color: ZONE_COLORS[0] },
  ]);

  const handleSeatingMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSeatingMapPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSeatingZone = () => {
    const newZone: SeatingZone = {
      id: Date.now().toString(),
      name: "",
      capacity: "",
      color: ZONE_COLORS[seatingZones.length % ZONE_COLORS.length],
    };
    setSeatingZones([...seatingZones, newZone]);
  };

  const removeSeatingZone = (id: string) => {
    setSeatingZones(seatingZones.filter((zone) => zone.id !== id));
  };

  const updateSeatingZone = (id: string, field: "name" | "capacity", value: string) => {
    setSeatingZones(
      seatingZones.map((zone) =>
        zone.id === id ? { ...zone, [field]: value } : zone
      )
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sube una imagen o plano con la distribución de asientos, mesas o zonas de tu lugar.
        Esto ayudará a tus clientes a elegir su ubicación preferida.
      </p>

      {!seatingMapPreview ? (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer bg-secondary/20 hover:bg-secondary/40 transition-colors">
          <div className="flex flex-col items-center justify-center py-6">
            <Upload className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              Subir mapa de silletería
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG o SVG (máx. 5MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleSeatingMapUpload}
          />
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            src={seatingMapPreview}
            alt="Mapa de silletería"
            className="w-full h-auto max-h-[300px] object-contain bg-secondary/20"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={() => window.open(seatingMapPreview, '_blank')}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSeatingMapPreview(null)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Descripción del mapa */}
      <div className="form-group">
        <Label htmlFor="seatingDescription" className="form-label">
          Descripción del plano
        </Label>
        <Textarea
          id="seatingDescription"
          placeholder="Describe las zonas o secciones del plano... Ej: Zona VIP al frente, mesas generales en el centro, área de bar al fondo..."
          className="mt-1 min-h-[80px]"
        />
      </div>

      {/* Capacidad por zonas */}
      <div className="form-group">
        <Label className="form-label">Capacidad por zonas <span className="text-destructive">*</span></Label>
        <p className="form-sublabel">
          Agrega al menos una zona. Ej: VIP, General, Platea, Palco, Terraza, Gradas
        </p>
        <div className="mt-2 space-y-3">
          {seatingZones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: zone.color }}
              />
              <Input
                placeholder="Ej: VIP, General, Platea..."
                className="flex-1"
                value={zone.name}
                onChange={(e) => updateSeatingZone(zone.id, "name", e.target.value)}
              />
              <Input
                placeholder="Cap."
                className="w-20"
                type="number"
                min="0"
                value={zone.capacity}
                onChange={(e) => updateSeatingZone(zone.id, "capacity", e.target.value)}
              />
              {seatingZones.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeSeatingZone(zone.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-primary"
          onClick={addSeatingZone}
        >
          + Agregar zona
        </Button>
      </div>
    </div>
  );
};

export default SeatingManualMode;
