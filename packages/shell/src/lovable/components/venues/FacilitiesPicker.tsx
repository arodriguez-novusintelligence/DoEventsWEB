import { useState, useMemo } from "react";
import { Search, X, Trash2, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@lovable/components/ui/dialog";
import { Input } from "@lovable/components/ui/input";
import { Button } from "@lovable/components/ui/button";
import { Checkbox } from "@lovable/components/ui/checkbox";
import {
  facilidadesDetailed,
  type FacilidadOption,
} from "@lovable/data/facilidadesOptions";

export interface FacilidadSelected {
  id: string;
  count: number;
}

interface FacilitiesPickerProps {
  selected: FacilidadSelected[];
  onChange: (next: FacilidadSelected[]) => void;
}

const FacilitiesPicker = ({ selected, onChange }: FacilitiesPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string>>(new Set());

  const optionsById = useMemo(() => {
    const map: Record<string, FacilidadOption> = {};
    facilidadesDetailed.forEach((f) => (map[f.id] = f));
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return facilidadesDetailed;
    return facilidadesDetailed.filter((f) =>
      f.label.toLowerCase().includes(q)
    );
  }, [search]);

  const openDialog = () => {
    // Pre-select items already chosen
    setDraft(new Set(selected.map((s) => s.id)));
    setSearch("");
    setOpen(true);
  };

  const toggle = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAgregar = () => {
    const existingMap: Record<string, number> = {};
    selected.forEach((s) => (existingMap[s.id] = s.count));
    const result: FacilidadSelected[] = Array.from(draft).map((id) => ({
      id,
      count: existingMap[id] ?? 0,
    }));
    onChange(result);
    setOpen(false);
  };

  const updateCount = (id: string, delta: number) => {
    onChange(
      selected.map((s) =>
        s.id === id ? { ...s, count: Math.max(0, s.count + delta) } : s
      )
    );
  };

  const removeItem = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-4">
      {selected.length === 0 ? (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground leading-snug sm:text-left sm:flex-1">
            Agrega los servicios y facilidades disponibles en tu lugar
          </p>
          <div className="shrink-0">
            <Button
              variant="outline"
              onClick={openDialog}
              className="rounded-full border-primary text-primary hover:bg-primary/5 px-8"
            >
              Agregar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {selected.map((item) => {
              const opt = optionsById[item.id];
              if (!opt) return null;
              const Icon = opt.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-card rounded-xl px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:opacity-80 shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <Icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCount(item.id, -1)}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCount(item.id, 1)}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Dialog selector */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0 max-h-[90vh] flex flex-col bg-background">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="text-primary text-xl">
              Servicios y facilidades
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
            {filtered.map((opt) => {
              const Icon = opt.icon;
              const checked = draft.has(opt.id);
              return (
                <label
                  key={opt.id}
                  className="flex items-start gap-3 bg-card rounded-2xl px-4 py-3 cursor-pointer shadow-sm border border-transparent hover:border-primary/30"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(opt.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Icon className="w-5 h-5 text-primary mb-1" />
                    <p className="text-sm font-semibold text-foreground">
                      {opt.label}
                    </p>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
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

export default FacilitiesPicker;
