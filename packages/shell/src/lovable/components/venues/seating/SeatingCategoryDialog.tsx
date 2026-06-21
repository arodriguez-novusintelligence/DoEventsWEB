import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import { Textarea } from "@lovable/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lovable/components/ui/select";
import { Armchair, Minus, Plus } from "lucide-react";
import {
  SeatingCategory,
  CATEGORY_COLORS,
  DISTRIBUTION_TYPES,
  SHAPE_TYPES,
} from "./types";

interface SeatingCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (category: SeatingCategory, floorId: string) => void;
  editCategory?: SeatingCategory | null;
  floors: { id: string; name: string }[];
  currentFloorId: string;
}

const SeatingCategoryDialog = ({
  open,
  onOpenChange,
  onSave,
  editCategory,
  floors,
  currentFloorId,
}: SeatingCategoryDialogProps) => {
  const [floorId, setFloorId] = useState(currentFloorId);
  const [name, setName] = useState(editCategory?.name || "");
  const [distributionType, setDistributionType] = useState<SeatingCategory["distributionType"]>(
    editCategory?.distributionType || "standard"
  );
  const [shape, setShape] = useState<SeatingCategory["shape"]>(
    editCategory?.shape || "rectangular"
  );
  const [selectedColor, setSelectedColor] = useState(
    editCategory?.color || CATEGORY_COLORS[0]
  );
  const [rows, setRows] = useState(editCategory?.rows || 4);
  const [seatsPerRow, setSeatsPerRow] = useState(editCategory?.seatsPerRow || 5);
  const [price, setPrice] = useState(editCategory?.price || 0);
  const [currency] = useState(editCategory?.currency || "COP");
  const [description, setDescription] = useState(editCategory?.description || "");

  useEffect(() => {
    if (open) {
      setFloorId(currentFloorId);
      setName(editCategory?.name || "");
      setDistributionType(editCategory?.distributionType || "standard");
      setShape(editCategory?.shape || "rectangular");
      setSelectedColor(editCategory?.color || CATEGORY_COLORS[0]);
      setRows(editCategory?.rows || 4);
      setSeatsPerRow(editCategory?.seatsPerRow || 5);
      setPrice(editCategory?.price || 0);
      setDescription(editCategory?.description || "");
    }
  }, [open, editCategory, currentFloorId]);

  const handleSave = () => {
    if (!name.trim() || !floorId) return;
    if (rows < 1 || seatsPerRow < 1) return;
    const category: SeatingCategory = {
      id: editCategory?.id || Date.now().toString(),
      name,
      distributionType,
      shape,
      color: selectedColor,
      rows,
      seatsPerRow,
      price,
      currency,
      description,
      position: editCategory?.position || { x: 100, y: 100 },
    };
    onSave(category, floorId);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFloorId(currentFloorId);
    setName("");
    setDistributionType("standard");
    setShape("rectangular");
    setSelectedColor(CATEGORY_COLORS[0]);
    setRows(4);
    setSeatsPerRow(5);
    setPrice(0);
    setDescription("");
  };

  const totalSeats = rows * seatsPerRow;

  // Generate seat preview grid
  const renderSeatPreview = () => {
    const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="p-4 bg-card border border-border rounded-2xl shadow-sm">
        <p className="text-xs text-muted-foreground mb-2">
          Vista previa ({totalSeats} sillas) - Arrastra A1 para reorganizar
        </p>
        <div className="flex flex-col items-center gap-1">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-1">
              {Array.from({ length: seatsPerRow }).map((_, seatIndex) => (
                <div
                  key={seatIndex}
                  className="w-8 h-6 rounded text-xs flex items-center justify-center font-medium"
                  style={{
                    backgroundColor: selectedColor,
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  {rowLabels[rowIndex]}
                  {seatIndex + 1}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center" aria-label="Vista previa de distribución de asientos">
          Vista previa · posición inicial superior izquierda
        </p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Armchair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {editCategory ? "Editar Categoría" : "Crear Categoría"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Configura los detalles de la categoría y organiza la distribución de asientos
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Piso <span className="text-destructive">*</span></Label>
            <Select value={floorId} onValueChange={setFloorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un piso" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Categoría</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: VIP, General, Graderías..."
            />
          </div>

          {/* Tipo de Distribución */}
          <div className="space-y-2">
            <Label>Tipo de Distribución</Label>
            <Select value={distributionType} onValueChange={(v) => setDistributionType(v as SeatingCategory["distributionType"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTRIBUTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Forma */}
          <div className="space-y-2">
            <Label>Forma de la Categoría</Label>
            <Select value={shape} onValueChange={(v) => setShape(v as SeatingCategory["shape"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHAPE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color de la categoría</Label>
            <div className="flex gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-primary/20 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Filas */}
          <div className="space-y-2">
            <Label>Número de filas</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-9 w-9"
                onClick={() => setRows(Math.max(1, rows - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center"
                min={1}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRows(rows + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sillas por fila */}
          <div className="space-y-2">
            <Label>Sillas por fila</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSeatsPerRow(Math.max(1, seatsPerRow - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center"
                min={1}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSeatsPerRow(seatsPerRow + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Vista previa */}
          {renderSeatPreview()}

          {/* Precio */}
          <div className="space-y-2">
            <Label>Precio</Label>
            <div className="flex gap-2">
              <Select value={currency} disabled>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la categoría..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="rounded-full" onClick={handleSave} disabled={!name.trim() || !floorId || rows < 1 || seatsPerRow < 1}>
            {editCategory ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeatingCategoryDialog;
