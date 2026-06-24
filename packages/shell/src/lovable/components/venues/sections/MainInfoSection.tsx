import { useState } from "react";
import { Minus, Plus, Users, X } from "lucide-react";
import { Input } from "@lovable/components/ui/input";
import { Textarea } from "@lovable/components/ui/textarea";
import { Label } from "@lovable/components/ui/label";
import { Checkbox } from "@lovable/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@lovable/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import MediaUpload from "../MediaUpload";
import FacilitiesPicker, {
  type FacilidadSelected,
} from "../FacilitiesPicker";
import EventsPicker from "../EventsPicker";
import {
  tiposLugar,
  servicios,
  accesibilidad,
  seguridad,
} from "@lovable/data/venueOptions";

/* ---------- Reusable: dashed picker card with dialog ---------- */
interface PickerCardProps {
  title: string;
  emptyText: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

const PickerCard = ({
  title,
  emptyText,
  options,
  selected,
  onChange,
}: PickerCardProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const [customValue, setCustomValue] = useState("");

  const toggle = (item: string) => {
    setDraft((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-4">
      {selected.length === 0 ? (
        <>
          <p className="text-center text-sm text-muted-foreground mb-3 leading-snug">
            {emptyText}
          </p>
          <div className="flex justify-center">
            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (o) setDraft(selected);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-primary/5 px-8"
                >
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 py-1.5 cursor-pointer"
                    >
                      <Checkbox
                        checked={draft.includes(opt)}
                        onCheckedChange={() => toggle(opt)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <Input
                      placeholder="Agregar otro..."
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const v = customValue.trim();
                        if (v && !draft.includes(v)) {
                          setDraft([...draft, v]);
                          setCustomValue("");
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      onChange(draft);
                      setOpen(false);
                    }}
                  >
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full"
              >
                {item}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((i) => i !== item))}
                  className="hover:opacity-80"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex justify-center">
            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (o) setDraft(selected);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary text-primary hover:bg-primary/5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 py-1.5 cursor-pointer"
                    >
                      <Checkbox
                        checked={draft.includes(opt)}
                        onCheckedChange={() => toggle(opt)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                  {draft
                    .filter((d) => !options.includes(d))
                    .map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-3 py-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked
                          onCheckedChange={() => toggle(opt)}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <Input
                      placeholder="Agregar otro..."
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const v = customValue.trim();
                        if (v && !draft.includes(v)) {
                          setDraft([...draft, v]);
                          setCustomValue("");
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      onChange(draft);
                      setOpen(false);
                    }}
                  >
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Reusable: select + chips + "Agregar otro" link ---------- */
interface SelectWithExtrasProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addAnotherLabel: string;
}

const SelectWithExtras = ({
  options,
  selected,
  onChange,
  placeholder,
  addAnotherLabel,
}: SelectWithExtrasProps) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  return (
    <div>
      <Select
        value=""
        onValueChange={(v) => {
          if (v && !selected.includes(v)) onChange([...selected, v]);
        }}
      >
        <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 shadow-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-popover">
          {options
            .filter((o) => !selected.includes(o))
            .map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(selected.filter((i) => i !== item))}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-2">
        {customOpen ? (
          <div className="flex gap-2 w-full">
            <Input
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={addAnotherLabel}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = customValue.trim();
                  if (v && !selected.includes(v)) {
                    onChange([...selected, v]);
                    setCustomValue("");
                    setCustomOpen(false);
                  }
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const v = customValue.trim();
                if (v && !selected.includes(v)) {
                  onChange([...selected, v]);
                  setCustomValue("");
                  setCustomOpen(false);
                } else {
                  setCustomOpen(false);
                }
              }}
            >
              OK
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
          >
            {addAnotherLabel} <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------- Main Section ---------- */
const MainInfoSection = () => {
  const [nombre, setNombre] = useState("");
  const [tipoLugar, setTipoLugar] = useState<string>("");
  const [aforo, setAforo] = useState(0);
  const [facilidadesSel, setFacilidadesSel] = useState<FacilidadSelected[]>([]);
  const [eventosSel, setEventosSel] = useState<string[]>([]);
  const [serviciosSel, setServiciosSel] = useState<string[]>([]);
  const [accesibilidadSel, setAccesibilidadSel] = useState<string[]>([]);
  const [seguridadSel, setSeguridadSel] = useState<string[]>([]);
  const [rol, setRol] = useState<"dueno" | "admin" | "">("");
  const [descripcion, setDescripcion] = useState("");

  const MAX_DESC = 140;

  return (
    <div className="space-y-5">
      {/* Material publicitario */}
      <MediaUpload />

      {/* Nombre del lugar */}
      <div>
        <Label className="text-sm font-medium">Nombre del lugar</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Finca Corralejas"
          className="border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none mt-1"
        />
      </div>

      {/* Tipo de lugar */}
      <div>
        <Label className="text-sm font-medium">Tipo de lugar</Label>
        <Select value={tipoLugar} onValueChange={setTipoLugar}>
          <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 shadow-none mt-1">
            <SelectValue placeholder="Selecciona el tipo de lugar" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] bg-popover">
            {tiposLugar.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aforo */}
      <div>
        <Label className="text-sm font-medium">Aforo del lugar</Label>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm">Número de personas</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAforo(Math.max(0, aforo - 1))}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{aforo}</span>
            <button
              type="button"
              onClick={() => setAforo(aforo + 1)}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Servicios y facilidades del lugar */}
      <div>
        <Label className="text-sm font-medium">Servicios y facilidades del lugar</Label>
        <div className="mt-2">
          <FacilitiesPicker
            selected={facilidadesSel}
            onChange={setFacilidadesSel}
          />
        </div>
      </div>

      {/* Eventos que se pueden realizar */}
      <div>
        <Label className="text-sm font-medium">
          Eventos que se pueden realizar en el lugar
        </Label>
        <div className="mt-2">
          <EventsPicker selected={eventosSel} onChange={setEventosSel} />
        </div>
      </div>

      {/* Servicios adicionales con costo */}
      <div>
        <Label className="text-sm font-medium">Servicios adicionales con costo</Label>
        <div className="mt-1">
          <SelectWithExtras
            options={servicios}
            selected={serviciosSel}
            onChange={setServiciosSel}
            placeholder="Selecciona el servicio"
            addAnotherLabel="Agregar otro servicio"
          />
        </div>
      </div>

      {/* Accesibilidad */}
      <div>
        <Label className="text-sm font-medium">Accesibilidad</Label>
        <div className="mt-1">
          <SelectWithExtras
            options={accesibilidad}
            selected={accesibilidadSel}
            onChange={setAccesibilidadSel}
            placeholder="Selecciona una opción"
            addAnotherLabel="Agregar otra opción"
          />
        </div>
      </div>

      {/* Seguridad */}
      <div>
        <Label className="text-sm font-medium">Seguridad</Label>
        <div className="mt-1">
          <SelectWithExtras
            options={seguridad}
            selected={seguridadSel}
            onChange={setSeguridadSel}
            placeholder="Selecciona una opción de seguridad"
            addAnotherLabel="Agregar otra opción"
          />
        </div>
      </div>

      {/* Dueño/Administrador */}
      <div>
        <Label className="text-sm font-medium">
          ¿Eres dueño/administrador del lugar?
        </Label>
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="rol"
              checked={rol === "dueno"}
              onChange={() => setRol("dueno")}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Dueño</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="rol"
              checked={rol === "admin"}
              onChange={() => setRol("admin")}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Administrador</span>
          </label>
        </div>
      </div>

      {/* Descripción y condiciones (Opcional) */}
      <div>
        <Label className="text-sm font-medium">
          Descripción y condiciones del lugar{" "}
          <span className="text-muted-foreground font-normal">(Opcional)</span>
        </Label>
        <Textarea
          value={descripcion}
          onChange={(e) =>
            setDescripcion(e.target.value.slice(0, MAX_DESC))
          }
          placeholder="Describe tu espacio con las características principales..."
          rows={3}
          className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {MAX_DESC} caracteres máximo
        </p>
      </div>
    </div>
  );
};

export default MainInfoSection;