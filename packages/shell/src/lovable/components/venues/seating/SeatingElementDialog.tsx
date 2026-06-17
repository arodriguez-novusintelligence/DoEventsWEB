import { useState } from "react";
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
import { SeatingElement, ELEMENT_TYPES, ZONE_COLORS } from "./types";

interface SeatingElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (element: SeatingElement) => void;
  editElement?: SeatingElement | null;
}

const SeatingElementDialog = ({
  open,
  onOpenChange,
  onSave,
  editElement,
}: SeatingElementDialogProps) => {
  const [elementType, setElementType] = useState<SeatingElement["type"]>(
    editElement?.type || "stage"
  );
  const [name, setName] = useState(editElement?.name || "");
  const [shape, setShape] = useState<SeatingElement["shape"]>(
    editElement?.shape || "rectangular"
  );
  const [color, setColor] = useState(editElement?.color || "#a855f7");
  const [description, setDescription] = useState(editElement?.description || "");

  const handleSave = () => {
    const element: SeatingElement = {
      id: editElement?.id || Date.now().toString(),
      type: elementType,
      name: name || ELEMENT_TYPES.find((t) => t.value === elementType)?.label || "",
      shape,
      color,
      description,
      position: editElement?.position || { x: 50, y: 50 },
      size: editElement?.size || { width: 120, height: 80 },
    };
    onSave(element);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setElementType("stage");
    setName("");
    setShape("rectangular");
    setColor("#a855f7");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editElement ? "Editar Elemento" : "Agregar Elemento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Elemento */}
          <div className="space-y-2">
            <Label>Tipo de Elemento</Label>
            <Select value={elementType} onValueChange={(v) => setElementType(v as SeatingElement["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELEMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre personalizado (opcional) */}
          {elementType === "other" && (
            <div className="space-y-2">
              <Label>Nombre del elemento</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Zona de comida, Entrada..."
              />
            </div>
          )}

          {/* Forma */}
          <div className="space-y-2">
            <Label>Forma</Label>
            <Select value={shape} onValueChange={(v) => setShape(v as SeatingElement["shape"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangular">Rectangular</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-10 rounded border border-input"
                style={{ backgroundColor: color }}
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#a855f7"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {ZONE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del elemento..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editElement ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeatingElementDialog;
