import { useEffect, useState } from "react";
import { Search, Smartphone, Loader2, UserPlus } from "lucide-react";
import { CreateGuestRequest } from "@lovable/types/guest";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Checkbox } from "@lovable/components/ui/checkbox";
import { useToast } from "@lovable/hooks/use-toast";
import { guestErrorMessage } from "@lovable/utils/guestErrorMessage";
import {
  type DeviceContact,
  isDeviceContactsSupported,
  pickDeviceContacts,
} from "@lovable/utils/deviceContacts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportContacts: (contacts: CreateGuestRequest[]) => void;
}

export function ContactImportModal({ open, onOpenChange, onImportContacts }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSelected(new Set());
      setContacts([]);
    }
  }, [open]);

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm),
  );
  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(filtered.map((c) => c.id)));
    else setSelected(new Set());
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(next);
  };

  const loadFromDevice = async () => {
    setLoading(true);
    try {
      const picked = await pickDeviceContacts();
      setContacts(picked);
      setSelected(new Set(picked.map((c) => c.id)));
    } catch (err) {
      toast({
        title: "No se pudieron cargar contactos",
        description: guestErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    const list = contacts.filter((c) => selected.has(c.id)).map((c) => {
      const parts = c.name.trim().split(/\s+/).filter(Boolean);
      const name = parts[0] || c.name.trim();
      const lastName = parts.slice(1).join(' ');
      return {
        name,
        lastName: lastName || '',
        username: "",
        email: "",
        phone: c.phone,
        isFavorite: false,
      } satisfies CreateGuestRequest;
    });
    if (!list.length) {
      toast({ title: "Selecciona contactos", description: "Selecciona al menos un contacto.", variant: "destructive" });
      return;
    }
    onImportContacts(list);
    onOpenChange(false);
    toast({ title: "Contactos importados", description: `Se importaron ${list.length} contacto(s).` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl h-[80vh] flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <UserPlus className="h-5 w-5 text-primary" />
              Importa contactos como invitados
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">Importa contactos del dispositivo como invitados.</p>
          {!isDeviceContactsSupported() && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs text-muted-foreground">
              La importación de contactos no está disponible en este navegador. Usa un dispositivo móvil compatible.
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 rounded-xl"
            onClick={() => void loadFromDevice()}
            disabled={loading || !isDeviceContactsSupported()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
            {isDeviceContactsSupported() ? 'Seleccionar del dispositivo' : 'Contactos no disponibles en este navegador'}
          </Button>
          {contacts.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o teléfono" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-muted/50 border-0 rounded-xl" />
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {contacts.length > 0 ? (
            <>
              <div className="flex items-center space-x-3 py-2">
                <Checkbox id="select-all" checked={allSelected} onCheckedChange={(c) => toggleAll(!!c)} />
                <label htmlFor="select-all" className="text-sm font-medium">Seleccionar todos ({filtered.length})</label>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {filtered.map((c) => (
                  <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${selected.has(c.id) ? 'bg-primary/5 border-primary' : 'bg-muted/30 border-border'}`}>
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={(ch) => toggleOne(c.id, !!ch)} />
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{c.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center px-4">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Importar desde tu dispositivo</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pulsa el botón superior para elegir contactos de tu teléfono o agenda.
              </p>
            </div>
          )}
        </div>
        <div className="pt-4">
          <Button onClick={handleImport} className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!selected.size}>
            Agregar contactos ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
