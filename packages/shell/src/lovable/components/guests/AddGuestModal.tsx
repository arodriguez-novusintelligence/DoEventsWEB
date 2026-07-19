import { useEffect, useMemo, useState } from "react";
import { UserPlus, Search, Smartphone, Check, Folder, X, Loader2 } from "lucide-react";
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
import { searchUsers, UserAvatar } from "@doevents/shared";
import {
  findMatchingGuest,
  searchResultsToGuests,
} from "../../../lovable-bridge/guestsAdapter";
import {
  isDeviceContactsSupported,
  isLikelyMobileDevice,
  pickDeviceContacts,
  importContactsFromFile,
  getNativeContactsHelpMessage,
  type DeviceContact,
} from "@lovable/utils/deviceContacts";
import { splitGuestPhone } from "./PhoneCountryFields";

interface Props {
  onAddGuest: (g: CreateGuestRequest) => void | Promise<string | void | undefined>;
  onSearchUser: (username: string) => Promise<Guest | null>;
  groups: GuestGroup[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  nested?: boolean;
  userId?: string;
  existingGuests?: Guest[];
  onSubmitGuest?: (data: CreateGuestRequest) => Promise<void>;
  onSubmitGuestBatch?: (
    items: CreateGuestRequest[],
    batchMeta?: { platformUserIds?: string[]; name?: string; guests?: Guest[] },
  ) => Promise<void>;
  onRegisterFoundUser?: (
    targetUserId: string,
    options?: { skipReload?: boolean; profile?: Guest },
  ) => Promise<string | void | undefined>;
  onGuestAdded?: () => void;
}

type PendingAction = { type: 'contacts'; items: DeviceContact[] } | { type: 'search'; user: Guest } | null;

export function AddGuestModal({
  onAddGuest,
  onSearchUser,
  groups,
  trigger,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  nested = false,
  existingGuests = [],
  onSubmitGuest,
  onSubmitGuestBatch,
  onRegisterFoundUser,
  onGuestAdded,
}: Props) {
  const inviteMode = Boolean(onSubmitGuest || onSubmitGuestBatch);
  const defaultTab = inviteMode ? 'search' : 'contacts';

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const dialogOpen = isControlled ? controlledOpen : internalOpen;

  const setDialogOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (!next) resetAll();
  };

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [foundUser, setFoundUser] = useState<Guest | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsHelp, setContactsHelp] = useState<string | null>(null);
  const nativeContactsAvailable = isDeviceContactsSupported();
  const showPhoneImport = nativeContactsAvailable || isLikelyMobileDevice();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateGuestRequest>({
    name: "", lastName: "", username: "", email: "", phone: "", isFavorite: false, groupId: undefined,
  });
  const [pending, setPending] = useState<PendingAction>(null);
  const [confirmGroup, setConfirmGroup] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!dialogOpen) return;
    setActiveTab(defaultTab);
  }, [dialogOpen, defaultTab]);

  useEffect(() => {
    const q = searchQuery.replace('@', '').trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchUsers(q);
        setSearchResults(searchResultsToGuests(results));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return deviceContacts;
    return deviceContacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [contactSearch, deviceContacts]);

  const loadDeviceContacts = async () => {
    setLoadingContacts(true);
    setContactsHelp(null);
    try {
      // Siempre intentar el picker nativo primero (nunca abrir archivos en este botón).
      const list = await pickDeviceContacts();
      setDeviceContacts(list);
      setSelectedContacts(new Set());
      toast({
        title: "Contactos importados",
        description: `Se cargaron ${list.length} contacto(s) desde tu teléfono.`,
      });
    } catch (err) {
      const code = (err as Error & { code?: string })?.code;
      const message = err instanceof Error ? err.message : "Intenta de nuevo";
      if (code === 'CONTACTS_CANCELLED' || /cancel/i.test(message)) {
        return;
      }
      if (code === 'CONTACTS_UNSUPPORTED' || !isDeviceContactsSupported()) {
        setContactsHelp(getNativeContactsHelpMessage());
        toast({
          title: "No se pudo abrir la agenda",
          description: "Tu navegador no abre contactos nativos. Revisa las opciones abajo.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "No se pudieron importar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadContactsFromFile = async () => {
    setLoadingContacts(true);
    setContactsHelp(null);
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.vcf,.csv,.txt,text/vcard,text/x-vcard,text/csv,text/plain';
      const list = await new Promise<DeviceContact[]>((resolve, reject) => {
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            reject(new Error('No se seleccionó ningún archivo.'));
            return;
          }
          try {
            resolve(await importContactsFromFile(file));
          } catch (err) {
            reject(err);
          }
        };
        input.oncancel = () => reject(new Error('Importación cancelada.'));
        input.click();
      });
      setDeviceContacts(list);
      setSelectedContacts(new Set());
      toast({
        title: "Contactos importados",
        description: `Se cargaron ${list.length} contacto(s) desde el archivo.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Intenta de nuevo";
      if (!/cancel/i.test(message)) {
        toast({
          title: "No se pudieron importar",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoadingContacts(false);
    }
  };

  const allContactsSelected = filteredContacts.length > 0
    && filteredContacts.every((c) => selectedContacts.has(c.id));

  const toggleContact = (id: string) => {
    const next = new Set(selectedContacts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContacts(next);
  };

  const toggleAllContacts = () => {
    if (allContactsSelected) {
      const next = new Set(selectedContacts);
      filteredContacts.forEach((c) => next.delete(c.id));
      setSelectedContacts(next);
    } else {
      const next = new Set(selectedContacts);
      filteredContacts.forEach((c) => next.add(c.id));
      setSelectedContacts(next);
    }
  };

  const toggleUserSelection = (id: string) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUserIds(next);
  };

  const isInExistingList = (guest: Guest) => Boolean(findMatchingGuest(existingGuests, guest));

  const resetAll = () => {
    setForm({ name: "", lastName: "", username: "", email: "", phone: "", isFavorite: false, groupId: undefined });
    setSearchUsername("");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUserIds(new Set());
    setFoundUser(null);
    setSelectedContacts(new Set());
    setContactSearch("");
    setDeviceContacts([]);
    setContactsHelp(null);
    setPending(null);
    setConfirmGroup(undefined);
    setSubmitting(false);
  };

  const finishSuccess = (title: string, description: string) => {
    toast({ title, description });
    onGuestAdded?.();
    resetAll();
    setDialogOpen(false);
  };

  const submitGuestData = async (data: CreateGuestRequest) => {
    if (onSubmitGuest) {
      await onSubmitGuest(data);
      return;
    }
    await onAddGuest(data);
    onGuestAdded?.();
  };

  const addPlatformUsers = async (users: Guest[]) => {
    const fresh = users.filter((g) => !isInExistingList(g));
    if (!fresh.length) {
      toast({ title: "Ya en tu lista", description: "Los usuarios seleccionados ya están catalogados." });
      return;
    }

    if (onSubmitGuestBatch) {
      await onSubmitGuestBatch([], {
        platformUserIds: fresh.map((g) => g.invitedUserId || g.id).filter((id) => id && !id.startsWith('search-')),
        guests: fresh,
      });
      return;
    }

    if (onRegisterFoundUser) {
      for (const guest of fresh) {
        const uid = guest.invitedUserId || guest.id;
        if (!uid || uid.startsWith('search-')) continue;
        await onRegisterFoundUser(uid, { profile: guest });
      }
      onGuestAdded?.();
      return;
    }

    for (const guest of fresh) {
      await onAddGuest({
        name: guest.name,
        lastName: guest.lastName,
        username: guest.username,
        email: guest.email,
        isFavorite: false,
        groupId: undefined,
      });
    }
    onGuestAdded?.();
  };

  const startImportContacts = () => {
    const list = deviceContacts.filter((c) => selectedContacts.has(c.id));
    if (!list.length) {
      toast({ title: "Selecciona contactos", description: "Selecciona al menos uno.", variant: "destructive" });
      return;
    }
    setPending({ type: 'contacts', items: list });
    setConfirmGroup(undefined);
  };

  const confirmImportContacts = async () => {
    if (!pending || pending.type !== 'contacts') return;
    setSubmitting(true);
    try {
      const items = pending.items.map((c) => {
        const [name, ...rest] = c.name.split(" ");
        const { phoneIndicative, phoneNumber } = splitGuestPhone(c.phone);
        return {
          name,
          lastName: rest.join(" ") || "",
          username: "",
          email: "",
          phone: c.phone,
          phoneIndicative,
          phoneNumber,
          isFavorite: false,
          groupId: confirmGroup,
        } satisfies CreateGuestRequest;
      });

      if (onSubmitGuestBatch) {
        await onSubmitGuestBatch(items);
      } else if (onSubmitGuest && items.length === 1) {
        await onSubmitGuest(items[0]);
      } else {
        for (const item of items) {
          await submitGuestData(item);
        }
      }

      const groupName = confirmGroup
        ? groups.find((g) => g.id === confirmGroup)?.name || 'el grupo seleccionado'
        : 'Sin grupo';
      finishSuccess(
        "Contactos agregados",
        `${pending.items.length} invitado(s) agregado(s) en ${groupName}.`,
      );
    } catch (err) {
      toast({
        title: "No se pudieron agregar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y apellido son obligatorios.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, groupId: confirmGroup || form.groupId };
      await submitGuestData(payload);
      finishSuccess("Invitado agregado", "El invitado se agregó correctamente.");
    } catch (err) {
      toast({
        title: "No se pudo agregar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const searchLegacy = async () => {
    if (!searchUsername.trim()) {
      toast({ title: "Campo requerido", description: "Ingresa un usuario para buscar.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    try {
      const u = await onSearchUser(searchUsername);
      setFoundUser(u);
      if (!u) {
        toast({ title: "No encontrado", description: `No se encontró "${searchUsername}".`, variant: "destructive" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const startAddFound = () => {
    if (!foundUser) return;
    setPending({ type: 'search', user: foundUser });
    setConfirmGroup(undefined);
  };

  const confirmAddFound = async () => {
    if (!pending || pending.type !== 'search') return;
    setSubmitting(true);
    try {
      const guest = pending.user;
      if (isInExistingList(guest)) {
        toast({ title: "Ya en tu lista", description: `${guest.name} ya está en tus invitados.` });
        setDialogOpen(false);
        return;
      }

      const uid = guest.invitedUserId || guest.id;
      if (onSubmitGuestBatch && uid && !uid.startsWith('search-')) {
        await onSubmitGuestBatch([], { platformUserIds: [uid], guests: [guest] });
      } else if (onRegisterFoundUser && uid && !uid.startsWith('search-')) {
        await onRegisterFoundUser(uid, { profile: guest });
        onGuestAdded?.();
      } else {
        await submitGuestData({
          name: guest.name,
          lastName: guest.lastName,
          username: guest.username,
          email: guest.email,
          phone: guest.phone,
          isFavorite: false,
          groupId: confirmGroup,
        });
      }

      const groupName = confirmGroup
        ? groups.find((g) => g.id === confirmGroup)?.name || 'el grupo seleccionado'
        : 'Sin grupo';
      finishSuccess("Invitado agregado", `Usuario agregado en ${groupName}.`);
    } catch (err) {
      toast({
        title: "No se pudo agregar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addSelectedPlatformUsers = async () => {
    const picked = searchResults.filter((g) => selectedUserIds.has(g.id));
    if (!picked.length) {
      toast({ title: "Selecciona usuarios", description: "Marca al menos un usuario de la búsqueda.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await addPlatformUsers(picked);
      if (!onSubmitGuestBatch) {
        finishSuccess(
          "Usuarios agregados",
          `${picked.length} usuario(s) agregado(s) a tu lista.`,
        );
      } else {
        resetAll();
        setDialogOpen(false);
      }
    } catch (err) {
      toast({
        title: "No se pudieron agregar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPending = () => {
    setPending(null);
    setConfirmGroup(undefined);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4" />Nuevo invitado
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent stacked={nested} className="sm:max-w-md rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary">
            {inviteMode ? "Buscar y agregar usuarios" : "Agregar invitado"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="search">DoEvents</TabsTrigger>
            <TabsTrigger value="contacts">Contactos</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {pending?.type === 'search' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Confirmar usuario</h3>
                  <button type="button" onClick={cancelPending} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">¿En qué grupo quieres agregar a este usuario?</p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Grupo de destino</Label>
                  <Select value={confirmGroup || "none"} onValueChange={(v) => setConfirmGroup(v === "none" ? undefined : v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin grupo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-muted-foreground" />Sin grupo</div>
                      </SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                            {g.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {pending.user.name.charAt(0)}{pending.user.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{pending.user.name} {pending.user.lastName}</p>
                      {pending.user.username && (
                        <p className="text-sm text-muted-foreground">@{pending.user.username.replace(/^@/, '')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={() => void confirmAddFound()} disabled={submitting} className="w-full rounded-xl">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar y agregar"}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Buscar usuarios en DoEvents</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nombre, @usuario o correo"
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Escribe al menos 2 caracteres para buscar.</p>
                </div>

                {searchLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Buscando…
                  </div>
                )}

                {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Sin resultados para esta búsqueda.</p>
                )}

                {searchResults.length > 0 && (
                  <>
                    <ScrollArea className="h-56 rounded-xl border border-border">
                      <div className="p-2 space-y-2">
                        {searchResults.map((user) => {
                          const already = isInExistingList(user);
                          const sel = selectedUserIds.has(user.id);
                          return (
                            <label
                              key={user.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                                already
                                  ? 'bg-muted/40 border-border opacity-70'
                                  : sel
                                    ? 'bg-primary/5 border-primary cursor-pointer'
                                    : 'bg-card border-border hover:border-primary/40 cursor-pointer'
                              }`}
                            >
                              <Checkbox
                                checked={sel}
                                disabled={already}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                              <UserAvatar name={user.name} imageUrl={user.avatar} userId={user.invitedUserId || user.id} size={36} className="shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{user.name} {user.lastName}</p>
                                {user.username && (
                                  <p className="text-xs text-muted-foreground truncate">@{user.username.replace(/^@/, '')}</p>
                                )}
                              </div>
                              {already && <span className="text-[10px] text-muted-foreground shrink-0">En lista</span>}
                            </label>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <Button
                      onClick={() => void addSelectedPlatformUsers()}
                      disabled={submitting || selectedUserIds.size === 0}
                      className="w-full rounded-xl"
                    >
                      {submitting
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : `Agregar seleccionados (${selectedUserIds.size})`}
                    </Button>
                  </>
                )}

                <div className="border-t border-border pt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Búsqueda exacta por usuario</Label>
                  <div className="flex gap-2">
                    <Input
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      placeholder="@nombreusuario"
                      onKeyDown={(e) => e.key === 'Enter' && void searchLegacy()}
                    />
                    <Button onClick={() => void searchLegacy()} disabled={isSearching} variant="outline">
                      {isSearching
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Search className="h-4 w-4 text-primary" />}
                    </Button>
                  </div>
                  {foundUser && !pending && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {foundUser.name.charAt(0)}{foundUser.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{foundUser.name} {foundUser.lastName}</p>
                          {foundUser.username && (
                            <p className="text-sm text-muted-foreground">@{foundUser.username.replace(/^@/, '')}</p>
                          )}
                        </div>
                      </div>
                      <Button onClick={startAddFound} className="w-full" disabled={isInExistingList(foundUser)}>
                        {isInExistingList(foundUser) ? 'Ya en tu lista' : 'Agregar a mis invitados'}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-3">
            {pending?.type === 'contacts' ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Confirmar importación</h3>
                  <button type="button" onClick={cancelPending} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vas a agregar <span className="font-semibold text-primary">{pending.items.length}</span> contacto(s).
                </p>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Grupo de destino</Label>
                  <Select value={confirmGroup || "none"} onValueChange={(v) => setConfirmGroup(v === "none" ? undefined : v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin grupo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-muted-foreground" />Sin grupo</div>
                      </SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                            {g.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => void confirmImportContacts()} disabled={submitting} className="w-full rounded-xl">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar y agregar"}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {nativeContactsAvailable
                    ? 'Toca “Importar del teléfono” para abrir tu agenda y elegir contactos.'
                    : 'En Chrome Android puedes abrir la agenda del teléfono. En iPhone, activa Contact Picker en Safari (Feature Flags) o importa un archivo .vcf exportado desde Contactos.'}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {showPhoneImport && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void loadDeviceContacts()}
                      disabled={loadingContacts}
                      className="w-full rounded-xl"
                    >
                      {loadingContacts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Smartphone className="mr-2 h-4 w-4" />
                          Importar del teléfono
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadContactsFromFile()}
                    disabled={loadingContacts}
                    className="w-full rounded-xl"
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Importar archivo .vcf / .csv
                  </Button>
                </div>
                {contactsHelp && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 whitespace-pre-line">
                    {contactsHelp}
                  </div>
                )}
                {deviceContacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    Selecciona contactos desde tu teléfono para agregarlos como invitados.
                  </div>
                ) : (
                  <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar por nombre o teléfono"
                    className="pl-10 rounded-xl"
                  />
                </div>
                <button type="button" onClick={toggleAllContacts} className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Checkbox checked={allContactsSelected} onCheckedChange={toggleAllContacts} />
                  Seleccionar todos ({filteredContacts.length})
                </button>
                <ScrollArea className="h-56 rounded-xl border border-border">
                  <div className="p-2 space-y-2">
                    {filteredContacts.map((c) => {
                      const sel = selectedContacts.has(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            sel ? 'bg-primary/5 border-primary' : 'bg-card border-border hover:border-primary/40'
                          }`}
                        >
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
                  </div>
                </ScrollArea>
                <Button onClick={startImportContacts} disabled={!selectedContacts.size} className="w-full rounded-xl">
                  Agregar contactos {selectedContacts.size > 0 ? `(${selectedContacts.size})` : ''}
                </Button>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={(e) => void submitManual(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" /></div>
                <div className="space-y-2"><Label>Apellido *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido" /></div>
              </div>
              <div className="space-y-2"><Label>Usuario</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="@nombreusuario" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+57 300 123 4567" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ejemplo@email.com" /></div>
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={confirmGroup || form.groupId || "none"} onValueChange={(v) => setConfirmGroup(v === "none" ? undefined : v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin grupo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-muted-foreground" />Sin grupo</div>
                    </SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="fav" checked={form.isFavorite} onCheckedChange={(c) => setForm({ ...form, isFavorite: c })} />
                <Label htmlFor="fav" className="text-sm">Marcar como invitado favorito</Label>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar invitado"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
