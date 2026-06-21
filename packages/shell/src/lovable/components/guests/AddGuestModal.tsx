import { useState, useCallback, useEffect, useRef } from "react";
import { UserPlus, Search, Download, Loader2, X, UserCheck, AlertCircle, RefreshCw } from "lucide-react";
import { fetchAllGuestContacts, searchUsers } from "@doevents/shared";
import { Guest, CreateGuestRequest, GuestGroup } from "@lovable/types/guest";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import { Switch } from "@lovable/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lovable/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lovable/components/ui/select";
import { useToast } from "@lovable/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { ContactImportModal } from "./ContactImportModal";
import { PhoneCountryFields, splitGuestPhone, composeFullPhone } from "./PhoneCountryFields";
import { guestErrorMessage } from "@lovable/utils/guestErrorMessage";
import { searchResultsToGuests, findMatchingGuestByEmail, contactToGuest } from "../../../lovable-bridge/guestsAdapter";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  onAddGuest: (g: CreateGuestRequest, options?: { skipReload?: boolean }) => Promise<string | void | undefined>;
  onRegisterFoundUser?: (
    targetUserId: string,
    options?: { skipReload?: boolean; profile?: Guest; groupId?: string; isFavorite?: boolean },
  ) => Promise<string | void | undefined>;
  onSearchUser: (username: string) => Promise<Guest | null>;
  groups: GuestGroup[];
  /** Lista actual de invitados para detectar duplicados por correo */
  existingGuests?: Guest[];
  userId?: string;
  trigger?: React.ReactNode;
  /** Modo controlado — evita diálogos anidados dentro de otro modal */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  /** Flujo unificado (p. ej. invitación a evento): agrega contacto + evento en un solo paso */
  onSubmitGuest?: (g: CreateGuestRequest) => Promise<void>;
  /** Lote de invitados (búsqueda múltiple o importación) */
  onSubmitGuestBatch?: (items: CreateGuestRequest[], meta?: {
    platformUserIds?: string[];
    name?: string;
    guests?: Guest[];
  }) => Promise<void>;
  onGuestAdded?: (meta?: {
    platformUserId?: string;
    platformUserIds?: string[];
    email?: string;
    name?: string;
    phone?: string;
    favoriteId?: string;
  }) => void | Promise<void>;
  /** Si true, no cierra el modal tras agregar (permite agregar varios) */
  keepOpenAfterAdd?: boolean;
  /** Diálogo anidado sobre otro modal (Radix, no portal manual) */
  nested?: boolean;
  /** @deprecated usar nested */
  elevated?: boolean;
  /** Panel embebido dentro de otro modal (sin Radix Dialog) */
  embedded?: boolean;
  onClose?: () => void;
  onNestedOpenChange?: (open: boolean) => void;
}

export function AddGuestModal({
  onAddGuest,
  onRegisterFoundUser,
  onSearchUser,
  groups,
  existingGuests = [],
  userId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
  onSubmitGuest,
  onSubmitGuestBatch,
  onGuestAdded,
  keepOpenAfterAdd = false,
  nested = false,
  elevated = false,
  onNestedOpenChange,
  embedded = false,
  onClose,
}: Props) {
  const isNested = nested || elevated;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) controlledOnOpenChange?.(next);
    else setInternalOpen(next);
    onNestedOpenChange?.(next);
  };
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState<Guest | null>(null);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedSearchIds, setSelectedSearchIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [matchedExisting, setMatchedExisting] = useState<Guest | null>(null);
  const [matchedPlatformUser, setMatchedPlatformUser] = useState<Guest | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState<CreateGuestRequest>({
    name: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    phoneIndicative: "+57",
    phoneNumber: "",
    isFavorite: false,
    groupId: undefined,
  });

  const resetForm = () => {
    setForm({
      name: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      phoneIndicative: "+57",
      phoneNumber: "",
      isFavorite: false,
      groupId: undefined,
    });
    setFoundUser(null);
    setSearchUsername("");
    setSearchResults([]);
    setSelectedSearchIds(new Set());
    setMatchedExisting(null);
    setMatchedPlatformUser(null);
  };

  const applyGuestToForm = useCallback((guest: Guest) => {
    setForm((prev) => ({
      ...prev,
      name: guest.name || prev.name,
      lastName: guest.lastName || prev.lastName,
      username: guest.username || prev.username,
      email: guest.email || prev.email,
      ...splitGuestPhone(guest.phone, guest.phoneIndicative, guest.phoneNumber),
      isFavorite: guest.isFavorite ?? prev.isFavorite,
      groupId: guest.groupId ?? prev.groupId,
    }));
  }, []);

  const lookupEmail = useCallback(async (rawEmail: string): Promise<{
    existing: Guest | null;
    platform: Guest | null;
  }> => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setMatchedExisting(null);
      setMatchedPlatformUser(null);
      return { existing: null, platform: null };
    }

    const localMatch = findMatchingGuestByEmail(existingGuests, email);
    if (localMatch) {
      setMatchedExisting(localMatch);
      setMatchedPlatformUser(null);
      applyGuestToForm(localMatch);
      return { existing: localMatch, platform: null };
    }

    if (userId) {
      try {
        const contacts = await fetchAllGuestContacts(userId).catch(() => []);
        const remote = contacts.find((c) => c.email?.trim().toLowerCase() === email);
        if (remote) {
          const guest = contactToGuest(remote);
          setMatchedExisting(guest);
          setMatchedPlatformUser(null);
          applyGuestToForm(guest);
          return { existing: guest, platform: null };
        }
      } catch {
        // continuar con búsqueda en plataforma
      }
    }

    setIsCheckingEmail(true);
    try {
      const results = searchResultsToGuests(await searchUsers(email));
      const platformMatch = results.find((g) => g.email?.trim().toLowerCase() === email) || null;
      if (platformMatch) {
        setMatchedPlatformUser(platformMatch);
        setMatchedExisting(null);
        applyGuestToForm(platformMatch);
      } else {
        setMatchedExisting(null);
        setMatchedPlatformUser(null);
      }
      return { existing: null, platform: platformMatch };
    } catch {
      setMatchedExisting(null);
      setMatchedPlatformUser(null);
      return { existing: null, platform: null };
    } finally {
      setIsCheckingEmail(false);
    }
  }, [applyGuestToForm, existingGuests, userId]);

  const emailLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return undefined;
    }
    if (emailLookupTimer.current) clearTimeout(emailLookupTimer.current);
    emailLookupTimer.current = setTimeout(() => {
      void lookupEmail(email);
    }, 450);
    return () => {
      if (emailLookupTimer.current) clearTimeout(emailLookupTimer.current);
    };
  }, [form.email, lookupEmail]);

  const closeModal = () => {
    resetForm();
    if (!embedded) setOpen(false);
    onClose?.();
  };

  const buildAddedMeta = (favoriteId?: string | void, guest?: Guest) => ({
    favoriteId: favoriteId || undefined,
    platformUserId: guest?.invitedUserId || guest?.id,
    email: guest?.email || form.email || undefined,
    name: guest ? `${guest.name} ${guest.lastName}`.trim() : `${form.name} ${form.lastName}`.trim(),
    phone: guest?.phone || composeFullPhone(form.phoneIndicative, form.phoneNumber) || undefined,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Nombre y apellido son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      let existingMatch = matchedExisting;
      let platformMatch = matchedPlatformUser;
      if (form.email.trim() && !existingMatch && !platformMatch) {
        const lookup = await lookupEmail(form.email);
        existingMatch = lookup.existing;
        platformMatch = lookup.platform;
      }
      if (onSubmitGuest) {
        await onSubmitGuest(form);
        resetForm();
        if (!keepOpenAfterAdd) closeModal();
        return;
      }

      const platformUserId = platformMatch?.invitedUserId || platformMatch?.id;
      if (
        platformUserId
        && onRegisterFoundUser
        && !platformUserId.startsWith("search-")
      ) {
        const favoriteId = await onRegisterFoundUser(platformUserId, {
          profile: platformMatch,
          groupId: form.groupId,
          isFavorite: form.isFavorite,
        });
        const addedMeta = buildAddedMeta(favoriteId, platformMatch);
        if (onGuestAdded) await onGuestAdded(addedMeta);
      } else {
        const favoriteId = await onAddGuest(form);
        const addedMeta = buildAddedMeta(favoriteId);
        if (onGuestAdded) await onGuestAdded(addedMeta);
      }
      resetForm();
      if (!keepOpenAfterAdd) closeModal();
      if (!embedded && !onGuestAdded) {
        toast({ title: "Invitado agregado", description: "El invitado se agregó correctamente." });
      }
    } catch (err) {
      toast({
        title: "No se pudo agregar el invitado",
        description: guestErrorMessage(err, "Intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const search = async () => {
    if (!searchUsername.trim()) {
      toast({
        title: "Campo requerido",
        description: "Ingresa al menos 2 caracteres para buscar.",
        variant: "destructive",
      });
      return;
    }
    if (searchUsername.trim().length < 2) {
      toast({
        title: "Búsqueda muy corta",
        description: "Escribe al menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setSearchAttempted(true);
    try {
      const matched = await onSearchUser(searchUsername.trim());
      const results = matched
        ? [matched]
        : searchResultsToGuests(await searchUsers(searchUsername.trim()));
      setSearchResults(results);
      setFoundUser(matched ?? results[0] ?? null);
      setSelectedSearchIds(new Set());
      if (!results.length) {
        toast({
          title: "No encontrado",
          description: `No se encontró un usuario con "${searchUsername}".`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const message = guestErrorMessage(err);
      setSearchError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setSearchResults([]);
      setFoundUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSearchSelection = (id: string) => {
    setSelectedSearchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addRegisteredGuest = async (guest: Guest) => {
    const platformUserId = guest.invitedUserId || guest.id;
    const isRegistered = Boolean(
      platformUserId && onRegisterFoundUser && !platformUserId.startsWith("search-"),
    );
    if (isRegistered) {
      await onRegisterFoundUser!(platformUserId, {
        profile: guest,
        groupId: form.groupId,
        isFavorite: form.isFavorite,
      });
    } else {
      await onAddGuest({
        name: guest.name,
        lastName: guest.lastName,
        username: guest.username,
        email: guest.email,
        ...splitGuestPhone(guest.phone, guest.phoneIndicative, guest.phoneNumber),
        isFavorite: form.isFavorite,
        groupId: form.groupId,
      });
    }
  };

  const addFound = async () => {
    if (!foundUser) return;
    setIsSaving(true);
    try {
      if (onSubmitGuestBatch) {
        await onSubmitGuestBatch([{
          name: foundUser.name,
          lastName: foundUser.lastName,
          username: foundUser.username,
          email: foundUser.email,
          ...splitGuestPhone(foundUser.phone, foundUser.phoneIndicative, foundUser.phoneNumber),
          isFavorite: false,
        }], {
          platformUserIds: [foundUser.invitedUserId || foundUser.id].filter(
            (id) => id && !id.startsWith('search-'),
          ) as string[],
          name: `${foundUser.name} ${foundUser.lastName}`.trim(),
          guests: [foundUser],
        });
      } else {
        await addRegisteredGuest(foundUser);
        const addedMeta = buildAddedMeta(undefined, foundUser);
        if (onGuestAdded) await onGuestAdded(addedMeta);
      }
      if (!keepOpenAfterAdd) {
        resetForm();
        closeModal();
      } else {
        setFoundUser(null);
        setSearchResults((prev) => prev.filter((g) => g.id !== foundUser.id));
        setSelectedSearchIds((prev) => {
          const next = new Set(prev);
          next.delete(foundUser.id);
          return next;
        });
      }
      if (!embedded && !onSubmitGuestBatch && !onGuestAdded) {
        toast({ title: "Invitado agregado", description: "Usuario agregado a tu lista." });
      }
    } catch (err) {
      toast({
        title: "No se pudo agregar el invitado",
        description: guestErrorMessage(err, "Intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSelectedSearchResults = async () => {
    const picked = searchResults.filter((g) => selectedSearchIds.has(g.id));
    if (!picked.length) {
      toast({ title: "Selecciona usuarios", description: "Marca al menos un usuario.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (onSubmitGuestBatch) {
        const batch = picked.map((guest) => ({
          name: guest.name,
          lastName: guest.lastName,
          username: guest.username,
          email: guest.email,
          ...splitGuestPhone(guest.phone, guest.phoneIndicative, guest.phoneNumber),
          isFavorite: false,
        }));
        await onSubmitGuestBatch(batch, {
          platformUserIds: picked
            .map((g) => g.invitedUserId || g.id)
            .filter((id) => id && !id.startsWith('search-')),
          name: picked.map((g) => `${g.name} ${g.lastName}`.trim()).join(', '),
          guests: picked,
        });
      } else {
        for (const guest of picked) {
          await addRegisteredGuest(guest);
        }
        if (onGuestAdded) {
          await onGuestAdded({
            platformUserIds: picked
              .map((g) => g.invitedUserId || g.id)
              .filter((id) => id && !id.startsWith('search-')),
            name: picked.map((g) => `${g.name} ${g.lastName}`.trim()).join(', '),
          });
        }
      }
      if (!keepOpenAfterAdd) {
        resetForm();
        closeModal();
      } else {
        setSearchResults((prev) => prev.filter((g) => !selectedSearchIds.has(g.id)));
        setSelectedSearchIds(new Set());
        setFoundUser(null);
      }
      if (!embedded && !onSubmitGuestBatch) {
        toast({
          title: "Invitados agregados",
          description: `Se agregaron ${picked.length} usuario(s).`,
        });
      }
    } catch (err) {
      const message = guestErrorMessage(err);
      sonnerToast.error("No se pudieron agregar", { description: message });
      toast({
        title: "No se pudieron agregar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportContacts = async (list: CreateGuestRequest[]) => {
    setIsSaving(true);
    try {
      if (onSubmitGuestBatch) {
        await onSubmitGuestBatch(list);
      } else {
        for (const contact of list) {
          await onAddGuest(contact);
        }
        if (onGuestAdded) await onGuestAdded();
      }
      resetForm();
      closeModal();
      if (!embedded) {
        toast({
          title: "Contactos importados",
          description: `Se agregaron ${list.length} invitado(s).`,
        });
      }
    } catch (err) {
      toast({
        title: "Error al importar",
        description: guestErrorMessage(err, "Intenta de nuevo"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const modalInner = (
    <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 rounded-xl border border-border/60 bg-secondary p-1 shadow-sm">
            <TabsTrigger value="contacts" className="rounded-full font-extrabold shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/20">Contactos</TabsTrigger>
            <TabsTrigger value="search" className="rounded-full font-extrabold shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/20">DoEvents</TabsTrigger>
            <TabsTrigger value="manual" className="rounded-full font-extrabold shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/20">Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts" className="space-y-3">
            <p className="text-xs font-extrabold text-muted-foreground">Importa contactos del dispositivo como invitados.</p>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 rounded-full border border-border/60 font-extrabold shadow-sm"
              onClick={() => setContactsOpen(true)}
              disabled={isSaving}
            >
              <Download className="h-4 w-4 text-icon-primary" /> Seleccionar contactos del dispositivo
            </Button>
          </TabsContent>
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-extrabold">Nombre *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" className="border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 font-extrabold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-extrabold">Apellido *</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellido" className="border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 font-extrabold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-extrabold">Usuario</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="@nombreusuario" className="border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 font-extrabold" />
              </div>
              <div className="space-y-2">
                <Label className="font-extrabold">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    setForm({ ...form, email: e.target.value });
                    setMatchedExisting(null);
                    setMatchedPlatformUser(null);
                  }}
                  onBlur={(e) => { void lookupEmail(e.target.value); }}
                  placeholder="ejemplo@email.com"
                  className="border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 font-extrabold"
                />
                {isCheckingEmail && (
                  <p className="text-xs font-extrabold text-muted-foreground">Verificando correo…</p>
                )}
                {(matchedExisting || matchedPlatformUser) && (
                  <div className="flex items-start gap-2 rounded-xl border border-border/60 border-primary/30 bg-primary/5 px-3 py-2 text-xs font-extrabold text-foreground shadow-sm">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </span>
                    <div>
                      {matchedExisting ? (
                        <>
                          <p className="font-extrabold text-primary">Invitado ya registrado</p>
                          <p className="text-muted-foreground">
                            Se actualizará el contacto existente para evitar duplicados.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-extrabold text-primary">Usuario de DoEvents encontrado</p>
                          <p className="text-muted-foreground">
                            Este correo ya está en la plataforma. Se vinculará a tu lista.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <PhoneCountryFields
                indicative={form.phoneIndicative || "+57"}
                number={form.phoneNumber || ""}
                onIndicativeChange={(value) => setForm({ ...form, phoneIndicative: value })}
                onNumberChange={(value) => setForm({ ...form, phoneNumber: value })}
                selectContentClassName={isNested || embedded ? "z-[120]" : undefined}
              />
              <div className="space-y-2">
                <Label className="font-extrabold">Grupo</Label>
                <Select value={form.groupId || "none"} onValueChange={(v) => setForm({ ...form, groupId: v === "none" ? undefined : v })}>
                  <SelectTrigger><SelectValue placeholder="Amigos (predeterminado)" /></SelectTrigger>
                  <SelectContent className={isNested || embedded ? "z-[120]" : undefined}>
                    <SelectItem value="none">Amigos (predeterminado)</SelectItem>
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
                <Label htmlFor="fav" className="text-sm font-extrabold">Marcar como invitado favorito</Label>
              </div>
              <Button type="submit" className="w-full rounded-full font-extrabold shadow-sm" disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</> : "Agregar invitado"}
              </Button>
              {keepOpenAfterAdd && (
                <p className="text-center text-xs text-muted-foreground">
                  Puedes agregar varios invitados seguidos. Cierra la ventana cuando termines.
                </p>
              )}
            </form>
          </TabsContent>
          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label className="font-extrabold">Buscar usuario en DoEvents</Label>
              <div className="flex gap-2">
                <Input
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="@nombreusuario"
                  className="border-border/60 font-extrabold focus-visible:ring-2 focus-visible:ring-primary/20"
                  onKeyDown={(e) => e.key === "Enter" && void search()}
                />
                <Button onClick={() => void search()} disabled={isSearching} variant="outline" className="rounded-full font-extrabold shadow-sm">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                  ) : (
                    <Search className="h-4 w-4 text-icon-primary" />
                  )}
                </Button>
              </div>
              <p className="text-xs font-extrabold text-muted-foreground">Usuarios reales registrados en DoEvents (mín. 2 caracteres).</p>
            </div>
            {isSearching && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card py-8 shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
                <p className="text-sm font-extrabold text-muted-foreground">Buscando usuario…</p>
              </div>
            )}
            {searchError && !isSearching && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-8 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <p className="px-4 text-sm font-extrabold text-destructive">{searchError}</p>
                <Button type="button" variant="outline" size="sm" className="rounded-full gap-1.5 font-extrabold shadow-sm" onClick={() => void search()}>
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            )}
            {!searchError && searchAttempted && !isSearching && searchResults.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/25 border-border/60 bg-card py-8 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">Sin resultados</p>
                <p className="text-xs font-extrabold text-muted-foreground px-4">Prueba con otro nombre de usuario</p>
              </div>
            )}
            {searchResults.length > 0 && !isSearching && (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {searchResults.map((u) => {
                  const selected = selectedSearchIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleSearchSelection(u.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-colors ${
                        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/60 bg-card hover:bg-secondary/50'
                      }`}
                    >
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20 text-sm font-extrabold text-primary">
                          {u.name.charAt(0)}{u.lastName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">{u.name} {u.lastName}</p>
                        {u.username && <p className="truncate text-xs text-muted-foreground">@{u.username.replace(/^@/, '')}</p>}
                      </div>
                      {selected && <span className="text-xs font-extrabold text-primary">✓</span>}
                    </button>
                  );
                })}
                <Button
                  onClick={() => void addSelectedSearchResults()}
                  className="w-full rounded-full font-extrabold shadow-sm"
                  disabled={isSaving || selectedSearchIds.size === 0}
                >
                  {isSaving ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agregando…</>
                  ) : (
                    `Agregar seleccionados (${selectedSearchIds.size})`
                  )}
                </Button>
              </div>
            )}
            {foundUser && searchResults.length === 1 && (
              <div className="rounded-xl border border-border/60 bg-muted/50 p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <span className="text-sm font-extrabold text-primary">
                      {foundUser.name.charAt(0)}{foundUser.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-extrabold">{foundUser.name} {foundUser.lastName}</p>
                    {foundUser.username && <p className="text-sm text-muted-foreground">@{foundUser.username.replace(/^@/, '')}</p>}
                  </div>
                </div>
                <Button onClick={() => void addFound()} className="w-full rounded-full font-extrabold shadow-sm" disabled={isSaving}>
                  {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Agregando…</> : "Agregar a mis invitados"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
  );

  if (embedded) {
    return (
      <>
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-xl font-extrabold text-primary">Agregar invitado</h2>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeModal}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">{modalInner}</div>
        </div>
        <ContactImportModal
          open={contactsOpen}
          onOpenChange={setContactsOpen}
          onImportContacts={(list) => void handleImportContacts(list)}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
        {!hideTrigger && (
          <DialogTrigger asChild>
            {trigger || (
              <Button className="gap-2 rounded-full bg-primary shadow-sm hover:bg-primary/90">
                <UserPlus className="h-4 w-4" />Nuevo invitado
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent stacked={isNested} className="sm:max-w-md rounded-2xl max-h-[92vh] overflow-y-auto border border-border/60 shadow-sm ring-1 ring-primary/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
                <UserPlus className="h-5 w-5 text-primary" />
              </span>
              Agregar invitado
            </DialogTitle>
          </DialogHeader>
          {modalInner}
        </DialogContent>
      </Dialog>
      <ContactImportModal
        open={contactsOpen}
        onOpenChange={setContactsOpen}
        onImportContacts={(list) => void handleImportContacts(list)}
      />
    </>
  );
}
