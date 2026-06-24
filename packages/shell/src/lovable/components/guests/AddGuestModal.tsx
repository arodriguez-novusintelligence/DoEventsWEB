import { useMemo, useState } from "react";
import { UserPlus, Search, Smartphone, Check, Folder, X, Users } from "lucide-react";
import { Guest, CreateGuestRequest, GuestGroup } from "@lovable/types/guest";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import { Switch } from "@lovable/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lovable/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lovable/components/ui/select";
import { Checkbox } from "@lovable/components/ui/checkbox";
import { ScrollArea } from "@lovable/components/ui/scroll-area";
import { useToast } from "@lovable/hooks/use-toast";
import { fetchAllGuestContacts, searchUsers } from "@doevents/shared";
import { searchResultsToGuests, findMatchingGuestByEmail, contactToGuest } from "../../../lovable-bridge/guestsAdapter";

interface DeviceContact { id: string; name: string; phone: string; }
const deviceContacts: DeviceContact[] = [
  { id: "c1", name: "Olivia Brown", phone: "+57 301 2345678" },
  { id: "c2", name: "James Taylor", phone: "+57 302 3456789" },
  { id: "c3", name: "Lucas Martinez", phone: "+57 303 4567890" },
  { id: "c4", name: "Ethan Thomas", phone: "+57 304 5678901" },
  { id: "c5", name: "Liam Carter", phone: "+57 310 1234567" },
  { id: "c6", name: "Maya Johnson", phone: "+57 315 2345678" },
  { id: "c7", name: "Sofia Rodriguez", phone: "+57 320 3456789" },
  { id: "c8", name: "Noah Wilson", phone: "+57 325 4567890" },
  { id: "c9", name: "Jose Alejandro Bustos", phone: "+57 311 4416842" },
  { id: "c10", name: "Cesar Perez", phone: "+57 312 3868458" },
  { id: "c11", name: "Oscar Gutierrez", phone: "+57 313 4124795" },
];

interface Props {
  onAddGuest: (g: CreateGuestRequest) => void;
  onSearchUser: (username: string) => Promise<Guest | null>;
  groups: GuestGroup[];
  trigger?: React.ReactNode;
}

type PendingAction = { type: 'contacts'; items: DeviceContact[] } | { type: 'search'; user: Guest } | null;

export function AddGuestModal({ onAddGuest, onSearchUser, groups, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState<Guest | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [form, setForm] = useState<CreateGuestRequest>({ name: "", lastName: "", username: "", email: "", phone: "", isFavorite: false, groupId: undefined });
  const [pending, setPending] = useState<PendingAction>(null);
  const [confirmGroup, setConfirmGroup] = useState<string | undefined>(undefined);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return deviceContacts;
    return deviceContacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [contactSearch]);
  const allContactsSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedContacts.has(c.id));
  const toggleContact = (id: string) => {
    const next = new Set(selectedContacts);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedContacts(next);
  };
  const toggleAllContacts = () => {
    if (allContactsSelected) {
      const next = new Set(selectedContacts);
      filteredContacts.forEach(c => next.delete(c.id));
      setSelectedContacts(next);
    } else {
      const next = new Set(selectedContacts);
      filteredContacts.forEach(c => next.add(c.id));
      setSelectedContacts(next);
    }
  };

  const resetAll = () => {
    setForm({ name: "", lastName: "", username: "", email: "", phone: "", isFavorite: false, groupId: undefined });
    setSearchUsername("");
    setFoundUser(null);
    setSelectedContacts(new Set());
    setContactSearch("");
    setPending(null);
    setConfirmGroup(undefined);
  };

  const startImportContacts = () => {
    const list = deviceContacts.filter(c => selectedContacts.has(c.id));
    if (!list.length) { toast({ title: "Selecciona contactos", description: "Selecciona al menos uno.", variant: "destructive" }); return; }
    setPending({ type: 'contacts', items: list });
    setConfirmGroup(undefined);
  };

  const confirmImportContacts = () => {
    if (!pending || pending.type !== 'contacts') return;
    pending.items.forEach(c => {
      const [name, ...rest] = c.name.split(" ");
      onAddGuest({ name, lastName: rest.join(" ") || "", username: "", email: "", phone: c.phone, isFavorite: false, groupId: confirmGroup });
    });
    const groupName = confirmGroup ? groups.find(g => g.id === confirmGroup)?.name || 'el grupo seleccionado' : 'Sin grupo';
    toast({ title: "Contactos importados", description: `${pending.items.length} invitado(s) agregado(s) en ${groupName}.` });
    resetAll();
    setOpen(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) { toast({ title: "Campos requeridos", description: "Nombre y apellido son obligatorios.", variant: "destructive" }); return; }
    onAddGuest({ ...form, groupId: confirmGroup });
    resetAll();
    setOpen(false);
    toast({ title: "Invitado agregado", description: "El invitado se agregó correctamente." });
  };

  const search = async () => {
    if (!searchUsername.trim()) { toast({ title: "Campo requerido", description: "Ingresa un usuario para buscar.", variant: "destructive" }); return; }
    setIsSearching(true);
    try {
      const u = await onSearchUser(searchUsername);
      setFoundUser(u);
      if (!u) toast({ title: "No encontrado", description: `No se encontró "${searchUsername}". Prueba @luis, @sebas, @salo, @andrea.`, variant: "destructive" });
      else toast({ title: "Usuario encontrado", description: `${u.name} ${u.lastName}` });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally { setIsSearching(false); }
  };

  const startAddFound = () => {
    if (!foundUser) return;
    setPending({ type: 'search', user: foundUser });
    setConfirmGroup(undefined);
  };

  const confirmAddFound = () => {
    if (!pending || pending.type !== 'search') return;
    onAddGuest({ name: pending.user.name, lastName: pending.user.lastName, username: pending.user.username, email: pending.user.email, phone: pending.user.phone, isFavorite: false, groupId: confirmGroup });
    const groupName = confirmGroup ? groups.find(g => g.id === confirmGroup)?.name || 'el grupo seleccionado' : 'Sin grupo';
    resetAll();
    setOpen(false);
    toast({ title: "Invitado agregado", description: `Usuario agregado en ${groupName}.` });
  };

  const cancelPending = () => {
    setPending(null);
    setConfirmGroup(undefined);
  };

  const selectedGroupLabel = (id?: string) => {
    if (!id) return 'Sin grupo';
    return groups.find(g => g.id === id)?.name || 'Sin grupo';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (<Button className="rounded-xl gap-2 bg-primary hover:bg-primary/90"><UserPlus className="h-4 w-4" />Nuevo invitado</Button>)}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary">Agregar invitado</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="contacts">Contactos</TabsTrigger>
            <TabsTrigger value="search">DoEvents</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-3">
            {pending?.type === 'contacts' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Confirmar importación</h3>
                  <button onClick={cancelPending} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <p className="text-xs text-muted-foreground">Vas a agregar <span className="font-semibold text-primary">{pending.items.length}</span> contacto(s). ¿En qué grupo los quieres poner?</p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Grupo de destino</Label>
                  <Select value={confirmGroup || "none"} onValueChange={v => setConfirmGroup(v === "none" ? undefined : v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sin grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-muted-foreground" />Sin grupo</div>
                      </SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />{g.name}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="h-48 rounded-xl border border-border">
                  <div className="p-2 space-y-2">
                    {pending.items.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card border-border">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Smartphone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button onClick={confirmImportContacts} className="w-full rounded-xl">Confirmar y agregar</Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Importa contactos del dispositivo como invitados.</p>
                <p className="text-xs font-semibold text-primary">{selectedContacts.size} de {deviceContacts.length} seleccionados</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Buscar por nombre o teléfono" className="pl-10 rounded-xl" />
                </div>
                <button type="button" onClick={toggleAllContacts} className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Checkbox checked={allContactsSelected} onCheckedChange={toggleAllContacts} />
                  Seleccionar todos ({filteredContacts.length})
                </button>
                <ScrollArea className="h-72 rounded-xl border border-border">
                  <div className="p-2 space-y-2">
                    {filteredContacts.map(c => {
                      const sel = selectedContacts.has(c.id);
                      return (
                        <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${sel ? 'bg-primary/5 border-primary' : 'bg-card border-border hover:border-primary/40'}`}>
                          <Checkbox checked={sel} onCheckedChange={() => toggleContact(c.id)} />
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Smartphone className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                          </div>
                          {sel && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </label>
                      );
                    })}
                    {filteredContacts.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">Sin resultados</p>
                    )}
                  </div>
                </ScrollArea>
                <Button onClick={startImportContacts} disabled={!selectedContacts.size} className="w-full rounded-xl">
                  Agregar contactos {selectedContacts.size > 0 ? `(${selectedContacts.size})` : ''}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            {pending?.type === 'search' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Confirmar usuario</h3>
                  <button onClick={cancelPending} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <p className="text-xs text-muted-foreground">¿En qué grupo quieres agregar a este usuario?</p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Grupo de destino</Label>
                  <Select value={confirmGroup || "none"} onValueChange={v => setConfirmGroup(v === "none" ? undefined : v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sin grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-muted-foreground" />Sin grupo</div>
                      </SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />{g.name}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-sm font-semibold text-primary">{pending.user.name.charAt(0)}{pending.user.lastName.charAt(0)}</span></div>
                    <div><p className="font-medium">{pending.user.name} {pending.user.lastName}</p>{pending.user.username && <p className="text-sm text-muted-foreground">@{pending.user.username}</p>}</div>
                  </div>
                </div>
                <Button onClick={confirmAddFound} className="w-full rounded-xl">Confirmar y agregar</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Buscar usuario en DoEvents</Label>
                  <div className="flex gap-2">
                    <Input value={searchUsername} onChange={e => setSearchUsername(e.target.value)} placeholder="@nombreusuario" onKeyDown={e => e.key === 'Enter' && search()} />
                    <Button onClick={search} disabled={isSearching} variant="outline">
                      {isSearching ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" /> : <Search className="h-4 w-4 text-primary" />}
                    </Button>
                  </div>
                </div>
                {foundUser && (
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><span className="text-sm font-semibold text-primary">{foundUser.name.charAt(0)}{foundUser.lastName.charAt(0)}</span></div>
                      <div><p className="font-medium">{foundUser.name} {foundUser.lastName}</p>{foundUser.username && <p className="text-sm text-muted-foreground">@{foundUser.username}</p>}</div>
                    </div>
                    <Button onClick={startAddFound} className="w-full">Agregar a mis invitados</Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre" /></div>
                <div className="space-y-2"><Label>Apellido *</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido" /></div>
              </div>
              <div className="space-y-2"><Label>Usuario</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="@nombreusuario" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+57 300 123 4567" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ejemplo@email.com" /></div>
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={confirmGroup || "none"} onValueChange={v => setConfirmGroup(v === "none" ? undefined : v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin grupo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-muted-foreground" />Sin grupo</div>
                    </SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />{g.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="fav" checked={form.isFavorite} onCheckedChange={(c) => setForm({ ...form, isFavorite: c })} />
                <Label htmlFor="fav" className="text-sm">Marcar como invitado favorito</Label>
              </div>
              <Button type="submit" className="w-full">Agregar invitado</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}