import { useState } from "react";
import { Search, X } from "lucide-react";
import { CreateGuestRequest } from "@lovable/types/guest";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Checkbox } from "@lovable/components/ui/checkbox";
import { useToast } from "@lovable/hooks/use-toast";

interface Contact { id: string; name: string; phone: string; }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportContacts: (contacts: CreateGuestRequest[]) => void;
}

export function ContactImportModal({ open, onOpenChange, onImportContacts }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  const filtered = mockContacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  const toggleAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelected(checked ? new Set(filtered.map(c => c.id)) : new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else { next.delete(id); setSelectAll(false); }
    setSelected(next);
  };

  const handleImport = () => {
    const list = mockContacts.filter(c => selected.has(c.id)).map(c => {
      const [name, ...rest] = c.name.split(" ");
      return { name, lastName: rest.join(" ") || "", username: "", email: "", phone: c.phone, isFavorite: false };
    });
    if (!list.length) { toast({ title: "Selecciona contactos", description: "Selecciona al menos un contacto.", variant: "destructive" }); return; }
    onImportContacts(list);
    onOpenChange(false);
    setSelected(new Set()); setSelectAll(false); setSearchTerm("");
    toast({ title: "Contactos importados", description: `Se importaron ${list.length} contactos.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl h-[80vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">Importa contactos como invitados</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-muted/50 border-0 rounded-xl" />
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="flex items-center space-x-3 py-2">
            <Checkbox id="select-all" checked={selectAll} onCheckedChange={(c) => toggleAll(!!c)} />
            <label htmlFor="select-all" className="text-sm font-medium">Todos</label>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-xl">
                <Checkbox id={c.id} checked={selected.has(c.id)} onCheckedChange={(ch) => toggleOne(c.id, !!ch)} />
                <div className="flex-1"><p className="font-medium text-foreground">{c.name}</p><p className="text-sm text-muted-foreground">{c.phone}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4">
          <Button onClick={handleImport} className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!selected.size}>
            Agregar contactos ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}