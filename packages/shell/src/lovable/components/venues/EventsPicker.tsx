import { useState, useMemo } from "react";
import { Search, X, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@lovable/components/ui/dialog";
import { Input } from "@lovable/components/ui/input";
import { Button } from "@lovable/components/ui/button";
import { Checkbox } from "@lovable/components/ui/checkbox";

export const eventosLugar: string[] = [
  "Actuación",
  "Charla",
  "Cena",
  "Conferencia",
  "Convención",
  "Cumbre",
  "Congreso",
  "Presentación musical",
  "Seminario",
  "Standup comedy",
  "Reunión social",
  "Tour",
  "Ceremonia",
  "Concierto",
  "Premiación",
  "Campamento",
  "Festival o feria",
  "Networking",
  "Feria comercial",
  "Evento deportivo",
  "Torneo",
];

interface EventsPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

const EventsPicker = ({ selected, onChange }: EventsPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eventosLugar;
    return eventosLugar.filter((e) => e.toLowerCase().includes(q));
  }, [search]);

  const openDialog = () => {
    setDraft(new Set(selected));
    setSearch("");
    setOpen(true);
  };

  const toggle = (item: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const handleAgregar = () => {
    onChange(Array.from(draft));
    setOpen(false);
  };

  const removeItem = (item: string) => {
    onChange(selected.filter((s) => s !== item));
  };

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-4">
      {selected.length === 0 ? (
        <>
          <p className="text-center text-sm text-muted-foreground mb-3 leading-snug">
            Agrega los tipos de eventos que se pueden hacer en el lugar
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={openDialog}
              className="rounded-full border-primary text-primary hover:bg-primary/5 px-8"
            >
              Agregar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            {selected.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 bg-card rounded-xl px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="text-destructive hover:opacity-80 shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {item}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              onClick={openDialog}
              className="rounded-full border-primary text-primary hover:bg-primary/5 px-8"
            >
              Agregar
            </Button>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0 max-h-[90vh] flex flex-col bg-background">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="text-primary text-xl">
              Eventos en el lugar
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar"
                className="pl-9 pr-9 rounded-xl"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
            {filtered.map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3.5 cursor-pointer shadow-sm border border-transparent hover:border-primary/30"
              >
                <Checkbox
                  checked={draft.has(item)}
                  onCheckedChange={() => toggle(item)}
                />
                <span className="text-sm font-semibold text-foreground">
                  {item}
                </span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                Sin resultados
              </p>
            )}
          </div>

          <div className="flex gap-3 p-4 border-t border-border bg-background">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border-primary text-primary hover:bg-primary/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAgregar}
              className="flex-1 rounded-full"
            >
              Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPicker;
