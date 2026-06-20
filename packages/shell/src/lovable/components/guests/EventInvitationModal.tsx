import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Mail, MessageCircle, Bell, Smartphone, Heart, Plus, Edit, Trash2, MoreHorizontal, Check, X, AlertCircle, AlertTriangle, AtSign, UserCheck, CalendarDays, Loader2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Badge } from "@lovable/components/ui/badge";
import { Checkbox } from "@lovable/components/ui/checkbox";
import { ScrollArea } from "@lovable/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@lovable/components/ui/dropdown-menu";
import { AddGuestModal } from "./AddGuestModal";
import { EditGuestModal } from "./EditGuestModal";
import { useToast } from "@lovable/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Guest, CreateGuestRequest, UpdateGuestRequest, GuestGroup } from "@lovable/types/guest";
import {
  fetchUserEvents,
  fetchEventGuests,
  fetchEventInvitations,
  resolveEventImageUrl,
  sendEventInvitations,
  addEventGuest,
  type UserEventItem,
  type EventGuest,
  type EventInvitation,
} from "@doevents/shared";
import { buildEventInvitationPayload, mergeEventGuestLists, mergeGuestsForInvite, dedupeGuests, findMatchingGuest, syncGuestIdsToInviteList } from "../../../lovable-bridge/guestsAdapter";
import { guestErrorMessage } from "@lovable/utils/guestErrorMessage";
import { composeFullPhone } from "./PhoneCountryFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  userId?: string;
  onToggleFavorite: (id: string) => void;
  onMoveToGroup: (id: string, gid: string | undefined) => void;
  groups: GuestGroup[];
  onAddGuest: (g: CreateGuestRequest, options?: { skipReload?: boolean }) => Promise<string | void | undefined>;
  onRegisterFoundUser?: (targetUserId: string, options?: { skipReload?: boolean; profile?: Guest }) => Promise<string | void | undefined>;
  onSearchUser: (username: string) => Promise<Guest | null>;
  onUpdateGuest?: (data: UpdateGuestRequest) => Promise<void>;
  onDeleteGuest?: (guestId: string) => Promise<void>;
  onInvitationsSent?: (guestIds: string[], eventId: string) => void;
  onReloadGuests?: (options?: { silent?: boolean }) => Promise<void>;
  initialGuestIds?: string[];
  initialEventId?: string;
}

type InviteEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
};

type GuestAddedMeta = {
  platformUserId?: string;
  platformUserIds?: string[];
  email?: string;
  name?: string;
  phone?: string;
  favoriteId?: string;
};

function mapUserEvent(ev: UserEventItem): InviteEvent {
  const raw = ev as unknown as Record<string, unknown>;
  const id = String(
    ev.id
    || raw.idEvento
    || raw.eventId
    || raw.id_evento
    || '',
  ).trim();
  return {
    id,
    title: String(ev.nombre || raw.name || raw.nombre || 'Evento'),
    date: String(ev.fechaIni || raw.fecha_ini || ''),
    time: String(ev.horaIni || raw.hora_ini || ''),
    location: String(ev.ciudad || raw.direccion || raw.ubicacion || ''),
    image: resolveEventImageUrl(String(ev.imagen || raw.imagen || '')),
  };
}

function findGuestByKey(guests: Guest[], key: string): Guest | undefined {
  const k = key.trim().toLowerCase();
  if (!k) return undefined;
  return guests.find((g) => {
    const fullName = `${g.name} ${g.lastName}`.trim().toLowerCase();
    return (
      g.id === key
      || g.favoriteId === key
      || g.invitedUserId === key
      || g.email?.toLowerCase() === k
      || g.username?.replace(/^@/, '').toLowerCase() === k.replace(/^@/, '')
      || fullName === k
      || fullName.includes(k)
    );
  });
}

function resolveGuestIdsFromKeys(guests: Guest[], keys: string[]): string[] {
  const ids: string[] = [];
  for (const key of keys) {
    const match = findGuestByKey(guests, key);
    if (match && !ids.includes(match.id)) ids.push(match.id);
  }
  return ids;
}

function guestKeysForMatch(g: Guest | EventGuest): string[] {
  const keys: string[] = [];
  const eg = g as EventGuest;
  const cg = g as Guest;
  const id = eg.guestId || cg.id;
  const favoriteId = eg.favoriteId || cg.favoriteId;
  const userId = eg.userId || cg.invitedUserId;
  const email = eg.email || cg.email;
  if (id) keys.push(`id:${id}`);
  if (favoriteId) keys.push(`fav:${favoriteId}`);
  if (userId) keys.push(`uid:${userId}`);
  if (email) keys.push(`email:${email.toLowerCase()}`);
  return keys;
}

function computePreselectedGuestIds(
  guests: Guest[],
  invitations: EventInvitation[],
  eventGuests: EventGuest[],
  initialGuestIds?: string[],
): string[] {
  const invitedUserIds = new Set(
    invitations.map((inv) => inv.userId).filter(Boolean) as string[],
  );
  const invitedFavoriteIds = new Set(
    invitations.map((inv) => inv.favoriteId).filter(Boolean) as string[],
  );
  const eventGuestUserIds = new Set(
    eventGuests.map((g) => g.userId).filter(Boolean) as string[],
  );
  const eventGuestFavoriteIds = new Set(
    eventGuests.map((g) => g.favoriteId).filter(Boolean) as string[],
  );

  const preselected = guests
    .filter((g) => {
      const favoriteId = g.favoriteId || g.id;
      const invitedUserId = g.invitedUserId || '';
      return (
        invitedUserIds.has(g.id)
        || invitedUserIds.has(invitedUserId)
        || invitedFavoriteIds.has(favoriteId)
        || eventGuestUserIds.has(invitedUserId)
        || eventGuestFavoriteIds.has(favoriteId)
      );
    })
    .map((g) => g.id);

  const fromSelection = initialGuestIds?.length
    ? initialGuestIds.filter((gid) => guests.some((g) => g.id === gid))
    : [];

  return Array.from(new Set([...fromSelection, ...preselected]));
}

export const EventInvitationModal = ({
  open,
  onOpenChange,
  guests,
  userId,
  onToggleFavorite,
  groups,
  onAddGuest,
  onRegisterFoundUser,
  onSearchUser,
  onUpdateGuest,
  onDeleteGuest,
  onInvitationsSent,
  onReloadGuests,
  initialGuestIds,
  initialEventId,
}: Props) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<InviteEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsLoadError, setEventsLoadError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [guestIds, setGuestIds] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(['campana']);
  const [message, setMessage] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [step, setStep] = useState<'events' | 'channels'>('events');
  const [editing, setEditing] = useState<Guest | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const addGuestOpenRef = useRef(false);
  const editOpenRef = useRef(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const guestSectionRef = useRef<HTMLDivElement>(null);
  const [eventGuests, setEventGuests] = useState<EventGuest[]>([]);
  const [eventInvitations, setEventInvitations] = useState<EventInvitation[]>([]);
  const [loadingEventGuests, setLoadingEventGuests] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingSelectKeys, setPendingSelectKeys] = useState<string[]>([]);
  const [lastAddMessage, setLastAddMessage] = useState<string | null>(null);
  const [overlayGuests, setOverlayGuests] = useState<Guest[]>([]);
  const [recentlyAddedGuestIds, setRecentlyAddedGuestIds] = useState<string[]>([]);

  const loadEvents = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setEventsLoadError(null);
      return;
    }
    setLoadingEvents(true);
    setEventsLoadError(null);
    try {
      const result = await fetchUserEvents(userId, { allEvents: true, forceNetwork: true });
      const items = (result.data?.datosEvento || []) as UserEventItem[];
      setEvents(
        items
          .filter((ev) => {
            const status = String(ev.estatus || '').trim().toLowerCase();
            return status !== 'deleted' && status !== 'cancelado' && status !== 'cancelled';
          })
          .map(mapUserEvent)
          .filter((e) => e.id),
      );
    } catch {
      setEvents([]);
      setEventsLoadError('No se pudieron cargar tus eventos');
      toast({
        title: 'No se pudieron cargar tus eventos',
        description: 'Revisa tu conexión e intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEvents(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (!open || !userId) return;
    void loadEvents();
  }, [open, userId, loadEvents]);

  const event = eventId ? events.find((e) => e.id === eventId) : null;
  const channelDefs = [
    { id: 'mail', name: 'Mail', icon: Mail, color: 'text-primary' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-success' },
    { id: 'campana', name: 'Campaña', icon: Bell, color: 'text-primary' },
    { id: 'push', name: 'Push', icon: Smartphone, color: 'text-purple-500' },
  ];

  const listGuests = useMemo(
    () => dedupeGuests(mergeGuestsForInvite(
      dedupeGuests([...overlayGuests, ...guests]),
      eventGuests,
      [],
    )),
    [overlayGuests, guests, eventGuests],
  );

  useEffect(() => {
    setOverlayGuests((prev) => {
      if (!prev.length) return prev;
      const next = prev.filter((overlay) => {
        const match = findMatchingGuest(guests, overlay);
        if (!match) return true;
        const overlayName = `${overlay.name} ${overlay.lastName}`.trim();
        const matchName = `${match.name} ${match.lastName}`.trim();
        if (overlayName && overlayName !== 'Sin nombre' && matchName === 'Sin nombre') return true;
        if (overlay.id.startsWith('pending-') && match.id !== overlay.id && !match.favoriteId) return true;
        return false;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [guests]);

  const invitedGuestKeys = useMemo(() => {
    const keys = new Set<string>();
    eventInvitations.forEach((inv) => {
      if (inv.userId) {
        keys.add(`uid:${inv.userId}`);
        keys.add(`id:${inv.userId}`);
      }
      if (inv.favoriteId) {
        keys.add(`fav:${inv.favoriteId}`);
        keys.add(`id:${inv.favoriteId}`);
      }
    });
    return keys;
  }, [eventInvitations]);

  const isAlreadyInvited = (g: Guest) => {
    const checks = [
      g.invitedUserId && `uid:${g.invitedUserId}`,
      g.favoriteId && `fav:${g.favoriteId}`,
      g.id && `id:${g.id}`,
    ].filter(Boolean) as string[];
    return checks.some((k) => invitedGuestKeys.has(k));
  };

  const selectedGuests = useMemo(
    () => listGuests.filter((g) => guestIds.includes(g.id)),
    [listGuests, guestIds],
  );

  const filteredGuests = useMemo(() => {
    if (groupFilter === 'all') return listGuests;
    if (groupFilter === 'favorites') return listGuests.filter((g) => g.isFavorite);
    if (groupFilter === 'ungrouped') return listGuests.filter((g) => !g.groupId);
    return listGuests.filter((g) => g.groupId === groupFilter);
  }, [listGuests, groupFilter]);

  const guestIsRecent = useCallback((g: Guest) => {
    return recentlyAddedGuestIds.some((key) => {
      if (!key) return false;
      if (g.id === key || g.favoriteId === key || g.invitedUserId === key) return true;
      return Boolean(findGuestByKey([g], key));
    });
  }, [recentlyAddedGuestIds]);

  const displayGuests = useMemo(() => {
    return [...filteredGuests].sort((a, b) => {
      const aRecent = guestIsRecent(a) ? 0 : 1;
      const bRecent = guestIsRecent(b) ? 0 : 1;
      if (aRecent !== bRecent) return aRecent - bRecent;
      return `${a.name} ${a.lastName}`.localeCompare(`${b.name} ${b.lastName}`, 'es');
    });
  }, [filteredGuests, guestIsRecent]);

  const emailOnly = useMemo(
    () => selectedGuests.filter((g) => !g.username && g.email),
    [selectedGuests],
  );
  const existingUsers = useMemo(
    () => selectedGuests.filter((g) => g.username || g.invitedUserId),
    [selectedGuests],
  );
  const invalidEmails = useMemo(
    () => selectedGuests.filter((g) => g.email && !EMAIL_RE.test(g.email)),
    [selectedGuests],
  );
  const duplicateEmails = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedGuests.forEach((g) => {
      if (g.email) counts[g.email.toLowerCase()] = (counts[g.email.toLowerCase()] || 0) + 1;
    });
    return Object.entries(counts).filter(([, n]) => n > 1).map(([e]) => e);
  }, [selectedGuests]);
  const hasErrors = invalidEmails.length > 0 || duplicateEmails.length > 0;

  const scrollGuestListToTop = useCallback(() => {
    requestAnimationFrame(() => {
      guestSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const queueSelectKeys = (...keys: (string | undefined)[]) => {
    const next = keys.filter(Boolean) as string[];
    if (!next.length) return;
    setPendingSelectKeys((prev) => Array.from(new Set([...prev, ...next])));
  };

  const buildOptimisticGuest = (data: CreateGuestRequest, tempId: string): Guest => ({
    id: tempId,
    name: data.name,
    lastName: data.lastName,
    username: data.username,
    email: data.email?.trim().toLowerCase() || data.email,
    phone: composeFullPhone(data.phoneIndicative, data.phoneNumber) || data.phone,
    phoneIndicative: data.phoneIndicative,
    phoneNumber: data.phoneNumber,
    isFavorite: Boolean(data.isFavorite),
    groupId: data.groupId,
    createdAt: new Date(),
  });

  const prependOptimisticGuest = (data: CreateGuestRequest): string => {
    const tempId = `pending-${Date.now()}`;
    const optimistic = buildOptimisticGuest(data, tempId);
    setOverlayGuests((prev) => [optimistic, ...prev]);
    setGuestIds((prev) => [tempId, ...prev]);
    setRecentlyAddedGuestIds((prev) => [tempId, ...prev]);
    setGroupFilter('all');
    scrollGuestListToTop();
    return tempId;
  };

  const resolveOptimisticGuestId = (tempId: string, favoriteId?: string) => {
    const resolvedId = favoriteId || tempId;
    setOverlayGuests((prev) => prev.map((g) => (
      g.id === tempId
        ? { ...g, id: resolvedId, favoriteId: favoriteId || g.favoriteId }
        : g
    )));
    setGuestIds((prev) => prev.map((id) => (id === tempId ? resolvedId : id)));
    setRecentlyAddedGuestIds((prev) => prev.map((id) => (id === tempId ? resolvedId : id)));
    return resolvedId;
  };

  const removeOptimisticGuest = (tempId: string) => {
    setOverlayGuests((prev) => prev.filter((g) => g.id !== tempId));
    setGuestIds((prev) => prev.filter((id) => id !== tempId));
    setRecentlyAddedGuestIds((prev) => prev.filter((id) => id !== tempId));
  };

  const applyPendingSelections = useCallback((list: Guest[]) => {
    if (!pendingSelectKeys.length) return;
    const matched = resolveGuestIdsFromKeys(list, pendingSelectKeys);
    if (matched.length) {
      setGuestIds((prev) => Array.from(new Set([...prev, ...matched])));
      setPendingSelectKeys((prev) =>
        prev.filter((key) => !findGuestByKey(list, key)),
      );
    }
  }, [pendingSelectKeys]);

  const loadEventForSelection = useCallback(async (id: string, resetSelection: boolean) => {
    setLoadingEventGuests(true);
    try {
      const [invitations, loadedEventGuests] = await Promise.all([
        fetchEventInvitations(id).catch(() => []),
        fetchEventGuests(id).catch(() => []),
      ]);
      setEventInvitations(invitations);
      setEventGuests(loadedEventGuests);

      if (resetSelection) {
        const merged = computePreselectedGuestIds(guests, invitations, loadedEventGuests, initialGuestIds);
        setGuestIds(merged);
      }

      return { invitations, eventGuests: loadedEventGuests };
    } finally {
      setLoadingEventGuests(false);
    }
  }, [guests, initialGuestIds]);

  const selectEvent = async (id: string) => {
    let picked = events.find((e) => e.id === id);
    if (!picked && id) {
      picked = {
        id,
        title: 'Evento seleccionado',
        date: '',
        time: '',
        location: '',
        image: '',
      };
      setEvents((prev) => (prev.some((e) => e.id === id) ? prev : [...prev, picked!]));
    }
    if (!picked) {
      setStep('events');
      setEventId(null);
      toast({
        title: 'Evento no disponible',
        description: 'Elige otro evento de la lista.',
        variant: 'destructive',
      });
      return;
    }
    setEventId(id);
    try {
      await loadEventForSelection(id, true);
    } catch {
      setGuestIds(
        initialGuestIds?.length
          ? initialGuestIds.filter((gid) => guests.some((g) => g.id === gid))
          : [],
      );
    }
    setStep('channels');
  };

  useEffect(() => {
    if (!open) {
      setStep('events');
      setEventId(null);
      setGuestIds([]);
      setAddGuestOpenSafe(false);
      setEventGuests([]);
      setEventInvitations([]);
    setPendingSelectKeys([]);
    setOverlayGuests([]);
    setRecentlyAddedGuestIds([]);
    setLastAddMessage(null);
    return;
    }
    if (!initialEventId || eventId || loadingEvents) return;
    void selectEvent(initialEventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-preset solo al abrir
  }, [open, initialEventId, events, loadingEvents, eventId]);

  useEffect(() => {
    applyPendingSelections(listGuests);
    setGuestIds((prev) => {
      const synced = syncGuestIdsToInviteList(listGuests, prev);
      if (recentlyAddedGuestIds.length) {
        recentlyAddedGuestIds.forEach((key) => {
          const match = findGuestByKey(listGuests, key);
          if (match && !synced.includes(match.id)) synced.push(match.id);
        });
      }
      const next = Array.from(new Set(synced));
      return next.length === prev.length && next.every((id) => prev.includes(id)) ? prev : next;
    });
    setRecentlyAddedGuestIds((prev) => {
      const next = prev
        .map((key) => findGuestByKey(listGuests, key)?.id || key)
        .filter((id) => listGuests.some((g) => g.id === id));
      return next.length === prev.length && next.every((id, i) => id === prev[i]) ? prev : Array.from(new Set(next));
    });
  }, [listGuests, applyPendingSelections, recentlyAddedGuestIds]);

  const toggleChannel = (id: string) =>
    setChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const toggleGuest = (id: string, sel: boolean) =>
    setGuestIds((prev) => (sel ? [...prev, id] : prev.filter((x) => x !== id)));

  const send = async () => {
    if (!eventId || !channels.length || !userId || !guestIds.length) return;
    setSending(true);
    try {
      const picked = listGuests.filter((g) => guestIds.includes(g.id));
      const { favoriteIds, users, channels: apiChannels } = buildEventInvitationPayload(
        picked,
        channels,
      );

      if (!favoriteIds.length && !users.length) {
        throw new Error('No hay destinatarios válidos seleccionados');
      }

      const result = await sendEventInvitations(eventId, {
        invitedBy: userId,
        favoriteIds,
        users,
        channels: apiChannels,
        message: message.trim() || undefined,
      });

      onInvitationsSent?.(guestIds, eventId);
      if (eventId) await loadEventForSelection(eventId, false);
      const sentCount = result.sent ?? picked.length;
      const names = apiChannels
        .map((c) => ({
          email: 'Email',
          whatsapp: 'WhatsApp',
          sms: 'SMS',
          inApp: 'Campaña',
          push: 'Push',
        }[c] || c))
        .join(', ');
      toast({
        title: "Invitaciones enviadas",
        description: `${sentCount} invitación(es) enviada(s)${names ? ` · ${names}` : ''}`,
      });
      close();
    } catch (err) {
      toast({
        title: "No se pudieron enviar las invitaciones",
        description: guestErrorMessage(err, 'Intenta de nuevo'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setEventId(null);
    setGuestIds([]);
    setChannels(['campana']);
    setMessage('');
    setGroupFilter('all');
    setStep('events');
    setEditing(null);
    setEditOpenSafe(false);
    setAddGuestOpenSafe(false);
    setConfirmOpen(false);
    setEventGuests([]);
    setEventInvitations([]);
    setPendingSelectKeys([]);
    setOverlayGuests([]);
    setRecentlyAddedGuestIds([]);
    setLastAddMessage(null);
  };

  const refreshEventGuests = async () => {
    if (!eventId) return;
    try {
      const [invitations, loaded] = await Promise.all([
        fetchEventInvitations(eventId).catch(() => []),
        fetchEventGuests(eventId).catch(() => []),
      ]);
      setEventInvitations(invitations);
      setEventGuests((prev) => mergeEventGuestLists(loaded, prev));
    } catch {
      // mantener lista actual
    }
  };

  const addGuestToEvent = async (meta?: GuestAddedMeta) => {
    if (!eventId) {
      sonnerToast.error("Selecciona un evento", {
        description: "Elige un evento antes de agregar invitados.",
      });
      throw new Error('eventId requerido');
    }
    if (!meta) {
      sonnerToast.error("Datos incompletos", {
        description: "No se recibieron datos del invitado.",
      });
      throw new Error('meta requerido');
    }

    const entries: GuestAddedMeta[] = [];
    if (meta.platformUserIds?.length) {
      for (const uid of meta.platformUserIds) {
        entries.push({ platformUserId: uid, name: meta.name || 'Invitado' });
      }
    } else {
      entries.push(meta);
    }

    const addedRecords: EventGuest[] = [];
    for (const entry of entries) {
      const displayName = entry.name?.trim() || 'Invitado';
      try {
        const newGuestId = await addEventGuest(eventId, {
          name: displayName,
          email: entry.email,
          phone: entry.phone,
          userId: entry.platformUserId,
          favoriteId: entry.favoriteId,
        });
        addedRecords.push({
          guestId: newGuestId,
          eventId,
          name: displayName,
          email: entry.email,
          phone: entry.phone,
          userId: entry.platformUserId,
          favoriteId: entry.favoriteId,
        });
      } catch (err) {
        sonnerToast.error("No se pudo agregar al evento", {
          description: guestErrorMessage(err, "Intenta de nuevo"),
        });
        throw err;
      }
    }

    setEventGuests((prev) => mergeEventGuestLists(addedRecords, prev));

    for (const entry of entries) {
      queueSelectKeys(entry.favoriteId, entry.platformUserId, entry.email, entry.name);
    }
  };

  const finalizeGuestAdds = async () => {
    await onReloadGuests?.({ silent: true });
    try {
      await refreshEventGuests();
    } catch {
      // mantener lista optimista
    }
  };

  const buildMetaFromForm = (data: CreateGuestRequest, favoriteId?: string | void): GuestAddedMeta => ({
    favoriteId: favoriteId || undefined,
    name: `${data.name} ${data.lastName}`.trim(),
    email: data.email || undefined,
    phone: composeFullPhone(data.phoneIndicative, data.phoneNumber) || data.phone || undefined,
  });

  const notifyAdded = (title: string, description: string) => {
    setLastAddMessage(description);
    sonnerToast.success(title, { description, duration: 5000 });
  };

  const notifyError = (title: string, description: string) => {
    sonnerToast.error(title, { description, duration: 6000 });
  };

  const handleSubmitGuest = async (data: CreateGuestRequest) => {
    const displayName = `${data.name} ${data.lastName}`.trim();
    const tempId = prependOptimisticGuest(data);
    try {
      const favoriteId = await onAddGuest(data, { skipReload: true });
      resolveOptimisticGuestId(tempId, favoriteId || undefined);
      const meta = buildMetaFromForm(data, favoriteId);
      await addGuestToEvent(meta);
      void finalizeGuestAdds();
      setAddGuestOpenSafe(false);
      notifyAdded(
        "Invitado agregado al evento",
        `${displayName} fue agregado y está seleccionado para enviar la invitación.`,
      );
    } catch (err) {
      removeOptimisticGuest(tempId);
      notifyError(
        "No se pudo agregar el invitado",
        guestErrorMessage(err, "Intenta de nuevo"),
      );
      throw err;
    }
  };

  const handleSubmitGuestBatch = async (
    items: CreateGuestRequest[],
    batchMeta?: { platformUserIds?: string[]; name?: string; guests?: Guest[] },
  ) => {
    const tempIds: string[] = [];
    try {
      if (batchMeta?.guests?.length) {
        const overlays = batchMeta.guests.map((guest, index) => ({
          ...guest,
          id: guest.favoriteId || guest.id || `pending-batch-${Date.now()}-${index}`,
        }));
        tempIds.push(...overlays.map((g) => g.id));
        setOverlayGuests((prev) => [...overlays, ...prev]);
        setGuestIds((prev) => Array.from(new Set([...tempIds, ...prev])));
        setRecentlyAddedGuestIds((prev) => Array.from(new Set([...tempIds, ...prev])));
        setGroupFilter('all');
        scrollGuestListToTop();
      } else if (items.length) {
        const overlays = items.map((item, index) => buildOptimisticGuest(item, `pending-${Date.now()}-${index}`));
        tempIds.push(...overlays.map((g) => g.id));
        setOverlayGuests((prev) => [...overlays, ...prev]);
        setGuestIds((prev) => Array.from(new Set([...tempIds, ...prev])));
        setRecentlyAddedGuestIds((prev) => Array.from(new Set([...tempIds, ...prev])));
        setGroupFilter('all');
        scrollGuestListToTop();
      }

      if (batchMeta?.platformUserIds?.length && batchMeta.guests?.length) {
        for (const guest of batchMeta.guests) {
          const uid = guest.invitedUserId || guest.id;
          if (!uid || uid.startsWith('search-')) continue;
          let favoriteId: string | undefined;
          if (onRegisterFoundUser) {
            favoriteId = (await onRegisterFoundUser(uid, { skipReload: true, profile: guest })) || undefined;
          }
          const displayName = `${guest.name} ${guest.lastName}`.trim();
          await addGuestToEvent({
            platformUserId: uid,
            favoriteId,
            name: displayName,
            email: guest.email,
          });
        }
      } else if (batchMeta?.platformUserIds?.length) {
        for (const uid of batchMeta.platformUserIds) {
          const profileGuest = batchMeta.guests?.find(
            (g) => (g.invitedUserId || g.id) === uid,
          );
          let favoriteId: string | undefined;
          if (onRegisterFoundUser) {
            favoriteId = (await onRegisterFoundUser(uid, {
              skipReload: true,
              profile: profileGuest,
            })) || undefined;
          }
          const displayName = profileGuest
            ? `${profileGuest.name} ${profileGuest.lastName}`.trim()
            : (batchMeta.name || 'Invitado');
          await addGuestToEvent({
            platformUserId: uid,
            favoriteId,
            name: displayName,
            email: profileGuest?.email,
          });
        }
      } else {
        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          const tempId = tempIds[index];
          const favoriteId = await onAddGuest(item, { skipReload: true });
          if (tempId) resolveOptimisticGuestId(tempId, favoriteId || undefined);
          const meta = buildMetaFromForm(item, favoriteId);
          await addGuestToEvent(meta);
        }
      }
      void finalizeGuestAdds();
      setAddGuestOpenSafe(false);
      const count = batchMeta?.guests?.length || batchMeta?.platformUserIds?.length || items.length;
      notifyAdded(
        "Invitados agregados al evento",
        `${count} invitado(s) listos para enviar la invitación.`,
      );
    } catch (err) {
      if (tempIds.length) {
        setOverlayGuests((prev) => prev.filter((g) => !tempIds.includes(g.id)));
        setGuestIds((prev) => prev.filter((id) => !tempIds.includes(id)));
        setRecentlyAddedGuestIds((prev) => prev.filter((id) => !tempIds.includes(id)));
      }
      notifyError(
        "No se pudieron agregar los invitados",
        guestErrorMessage(err, "Intenta de nuevo"),
      );
      throw err;
    }
  };

  const handleUpdate = async (data: UpdateGuestRequest) => {
    try {
      if (onUpdateGuest) await onUpdateGuest(data);
      toast({ title: "Invitado actualizado" });
      await onReloadGuests?.({ silent: true });
    } catch (err) {
      toast({
        title: "No se pudo actualizar",
        description: guestErrorMessage(err, "Intenta de nuevo"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (g: Guest) => {
    try {
      if (onDeleteGuest) await onDeleteGuest(g.favoriteId || g.id);
      setGuestIds((prev) => prev.filter((id) => id !== g.id));
      toast({ title: "Invitado eliminado", description: `${g.name} ${g.lastName}`.trim() || "Contacto eliminado" });
      await onReloadGuests?.({ silent: true });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: guestErrorMessage(err, "Intenta de nuevo"),
        variant: "destructive",
      });
    }
  };

  const wrapAddGuest = async (data: CreateGuestRequest) => onAddGuest(data);

  const wrapRegisterUser = async (
    targetUserId: string,
    options?: { skipReload?: boolean; profile?: Guest },
  ) => {
    if (!onRegisterFoundUser) return;
    return onRegisterFoundUser(targetUserId, options);
  };

  const setEditOpenSafe = (v: boolean) => {
    editOpenRef.current = v;
    setEditOpen(v);
  };

  const setAddGuestOpenSafe = (v: boolean) => {
    addGuestOpenRef.current = v;
    setAddGuestOpen(v);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return;
          if (addGuestOpenRef.current || editOpenRef.current) return;
          close();
        }}
      >
        <DialogContent
          stacked
          className="!flex h-[100dvh] max-h-[100dvh] w-screen max-w-full flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[min(92dvh,820px)] sm:max-h-[min(92dvh,820px)] sm:w-full sm:max-w-md sm:rounded-2xl"
        >
          <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {step === 'events' && (
            <>
              <DialogHeader className="shrink-0 space-y-1 p-6 pb-4 text-left">
                <DialogTitle className="text-xl font-semibold">Seleccionar Evento</DialogTitle>
                <p className="text-sm text-muted-foreground">Elige un evento para enviar invitaciones</p>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 pb-6 touch-pan-y">
                {loadingEvents && (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Cargando eventos…</p>
                  </div>
                )}
                {!loadingEvents && eventsLoadError && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                      <AlertCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{eventsLoadError}</p>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void loadEvents()}>
                      Reintentar
                    </Button>
                  </div>
                )}
                {!loadingEvents && !eventsLoadError && events.length === 0 && (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <CalendarDays className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Sin eventos activos</p>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      Publica un evento para poder enviar invitaciones a tus contactos.
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => void selectEvent(ev.id)}
                      className={`cursor-pointer rounded-2xl border-2 transition-all duration-200 ${eventId === ev.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    >
                      {ev.image ? (
                        <img src={ev.image} alt={ev.title} className="w-full h-32 object-cover rounded-t-2xl" />
                      ) : (
                        <div className="w-full h-32 rounded-t-2xl bg-muted" />
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-base text-card-foreground mb-1">{ev.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{ev.date} - {ev.time}</p>
                        <p className="text-xs text-muted-foreground">{ev.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 'channels' && !event && (
            <div className="p-6 space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                No se pudo cargar el evento seleccionado. Elige uno de tus eventos activos.
              </p>
              <Button
                type="button"
                className="w-full rounded-xl"
                onClick={() => {
                  setStep('events');
                  setEventId(null);
                }}
              >
                Ver eventos disponibles
              </Button>
            </div>
          )}
          {step === 'channels' && event && (
            <>
              <DialogHeader className="shrink-0 space-y-0 p-4 sm:p-6 pb-2 sm:pb-3 text-left">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep('events')} className="h-8 w-8 p-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle className="text-base sm:text-lg font-semibold">Enviar Invitación</DialogTitle>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground pl-10 truncate">
                  Selecciona usuarios para invitar a &quot;{event.title}&quot;
                </p>
              </DialogHeader>

              <div
                ref={mainScrollRef}
                className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 sm:px-6 pb-28 sm:pb-6 touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <button
                  type="button"
                  onClick={() => setStep('events')}
                  className="w-full max-w-full text-left mb-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10 transition overflow-hidden"
                >
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-primary">Evento</p>
                    <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{event.date} · {event.time}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary shrink-0">Cambiar</span>
                </button>

                <div className="space-y-3 mb-5">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Canales de envío</h3>
                    <p className="text-[11px] text-muted-foreground">Selecciona uno o más medios.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {channelDefs.map((c) => {
                      const sel = channels.includes(c.id);
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleChannel(c.id)}
                          className={`inline-flex items-center gap-2 h-9 pl-2 pr-3 rounded-full border transition ${
                            sel
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-card border-border hover:border-primary/40 text-foreground'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${sel ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                            <Icon className={`h-3.5 w-3.5 ${sel ? 'text-primary-foreground' : c.color}`} />
                          </div>
                          <span className="text-[11px] font-semibold whitespace-nowrap">{c.name}</span>
                          {sel && <Check className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Mensaje (opcional)</h3>
                    <span className="text-[10px] text-muted-foreground">{message.length}/200</span>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                    placeholder="¡Te invito a mi evento especial!"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div ref={guestSectionRef} className="space-y-3 pb-6 border-t border-border pt-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">Gestionar Invitados</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {listGuests.length} en lista · {selectedGuests.length} seleccionado(s) para enviar
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-xs rounded-xl shrink-0"
                      onClick={() => setAddGuestOpenSafe(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Nuevo
                    </Button>
                  </div>

                  {lastAddMessage && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                      {lastAddMessage}
                    </div>
                  )}

                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="flex items-center gap-1.5 pb-1">
                      {[
                        { id: 'all', label: 'Todos', count: listGuests.length },
                        { id: 'favorites', label: 'Favoritos', count: listGuests.filter((g) => g.isFavorite).length },
                        { id: 'ungrouped', label: 'Sin grupo', count: listGuests.filter((g) => !g.groupId).length },
                        ...groups.map((g) => ({
                          id: g.id,
                          label: g.name,
                          count: listGuests.filter((x) => x.groupId === g.id).length,
                          color: g.color,
                        })),
                      ].map((f) => {
                        const active = groupFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setGroupFilter(f.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-[11px] font-semibold border transition ${
                              active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
                            }`}
                          >
                            {'color' in f && f.color && (
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                            )}
                            {f.label}{' '}
                            <span className={`opacity-70 ${active ? 'text-primary-foreground' : ''}`}>({f.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                      <Checkbox
                        checked={filteredGuests.length > 0 && filteredGuests.every((g) => guestIds.includes(g.id))}
                        onCheckedChange={(c) => {
                          if (c) {
                            setGuestIds((prev) => Array.from(new Set([...prev, ...filteredGuests.map((g) => g.id)])));
                          } else {
                            setGuestIds((prev) => prev.filter((id) => !filteredGuests.some((g) => g.id === id)));
                          }
                        }}
                      />
                      Seleccionar todos {groupFilter !== 'all' && `(${filteredGuests.length})`}
                    </label>
                    <span className="text-xs font-semibold text-primary">{guestIds.length} seleccionado(s)</span>
                  </div>

                  {loadingEventGuests && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Cargando invitados del evento…</p>
                    </div>
                  )}

                  {!loadingEventGuests && displayGuests.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <Users className="h-8 w-8 text-muted-foreground/60" />
                      <p className="text-sm font-semibold text-foreground">Sin invitados en este filtro</p>
                      <p className="text-xs text-muted-foreground max-w-[220px]">
                        Usa &quot;Nuevo&quot; para agregar contactos o cambia el filtro de grupo.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayGuests.map((g) => {
                        const sel = guestIds.includes(g.id);
                        const invited = isAlreadyInvited(g);
                        const isEventOnly = !guests.some((c) => c.id === g.id);
                        const isRecentlyAdded = guestIsRecent(g);
                        return (
                          <div
                            key={g.id}
                            className={`flex items-center gap-2 p-3 rounded-xl border transition min-w-0 ${
                              sel ? 'border-primary bg-primary/5' : 'border-border bg-card/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                              <Checkbox checked={sel} onCheckedChange={(c) => toggleGuest(g.id, Boolean(c))} className="shrink-0" />
                              {g.avatar ? (
                                <img src={g.avatar} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                  <span className="text-sm font-semibold text-primary">{g.name.charAt(0)}{g.lastName.charAt(0)}</span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="font-medium text-sm truncate">{g.name} {g.lastName}</p>
                                {g.username && (
                                  <p className="text-xs text-muted-foreground truncate">@{g.username.replace(/^@/, '')}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0 flex-wrap justify-end max-w-[42%] sm:max-w-none">
                              {isRecentlyAdded && (
                                <Badge variant="default" className="text-[10px] bg-success text-success-foreground">Nuevo</Badge>
                              )}
                              {invited && <Badge variant="secondary" className="text-[10px]">Invitado</Badge>}
                              {isEventOnly && <Badge variant="outline" className="text-[10px]">Evento</Badge>}
                              {g.isFavorite && <Badge variant="favorite" className="text-[10px]">Fav</Badge>}
                              {!isEventOnly && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => onToggleFavorite(g.id)} className="h-8 w-8 p-0">
                                    <Heart className={`h-4 w-4 ${g.isFavorite ? 'fill-favorite text-favorite' : 'text-muted-foreground'}`} />
                                  </Button>
                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-[200]">
                                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditing(g); setEditOpenSafe(true); }}>
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); void handleDelete(g); }} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 p-3 sm:p-6 pt-3 border-t border-border bg-background space-y-2 sm:space-y-3 safe-area-bottom overflow-hidden">
                {guestIds.length > 0 && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 overflow-hidden">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
                      <p className="text-xs font-semibold text-primary shrink-0">Invitados seleccionados</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {existingUsers.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <UserCheck className="h-3 w-3" />{existingUsers.length}
                          </Badge>
                        )}
                        {emailOnly.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Mail className="h-3 w-3" />{emailOnly.length}
                          </Badge>
                        )}
                        <Badge className="text-[10px]">{guestIds.length}</Badge>
                      </div>
                    </div>
                    <div className="max-h-28 overflow-y-auto overflow-x-hidden overscroll-y-contain">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGuests.map((g) => {
                          const isEmailOnly = !g.username && !!g.email;
                          const invalid = !!g.email && !EMAIL_RE.test(g.email);
                          const duplicate = !!g.email && duplicateEmails.includes(g.email.toLowerCase());
                          const bad = invalid || duplicate;
                          return (
                            <div
                              key={g.id}
                              title={invalid ? 'Correo inválido' : duplicate ? 'Correo duplicado' : (g.email || g.username || '')}
                              className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border text-xs max-w-full ${
                                bad ? 'border-destructive bg-destructive/10' : 'border-border bg-background'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isEmailOnly ? 'bg-accent/10' : 'bg-primary/10'}`}>
                                {isEmailOnly ? (
                                  <AtSign className="h-3 w-3 text-accent-foreground" />
                                ) : (
                                  <span className="text-[9px] font-semibold text-primary">{g.name.charAt(0)}{g.lastName.charAt(0)}</span>
                                )}
                              </div>
                              <span className="font-medium truncate max-w-[min(140px,38vw)]">
                                {isEmailOnly ? g.email : `${g.name} ${g.lastName}`}
                              </span>
                              {bad && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                              <button type="button" onClick={() => toggleGuest(g.id, false)} className="text-muted-foreground hover:text-destructive shrink-0">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {hasErrors && (
                      <div className="mt-2 flex items-start gap-1.5 text-[11px] text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                          {invalidEmails.length > 0 && `${invalidEmails.length} correo(s) inválido(s). `}
                          {duplicateEmails.length > 0 && `${duplicateEmails.length} correo(s) duplicado(s).`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <Button
                  onClick={() => setConfirmOpen(true)}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                  disabled={sending || !guestIds.length || !channels.length || hasErrors}
                >
                  {sending ? 'Enviando…' : `Enviar Invitación${guestIds.length ? ` (${guestIds.length})` : ''}`}
                </Button>
              </div>
            </>
          )}

          </div>
        </DialogContent>
      </Dialog>

      <AddGuestModal
        nested
        open={addGuestOpen && step === 'channels'}
        onOpenChange={setAddGuestOpenSafe}
        hideTrigger
        onSubmitGuest={handleSubmitGuest}
        onSubmitGuestBatch={handleSubmitGuestBatch}
        onAddGuest={wrapAddGuest}
        onRegisterFoundUser={onRegisterFoundUser ? wrapRegisterUser : undefined}
        onSearchUser={onSearchUser}
        groups={groups}
        existingGuests={listGuests}
        userId={userId}
      />

      <EditGuestModal guest={editing} open={editOpen} onOpenChange={setEditOpenSafe} onUpdateGuest={handleUpdate} groups={groups} nested />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent stacked className="max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar envío de invitaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-2">
                <p className="text-lg font-bold text-primary">{guestIds.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-2">
                <p className="text-lg font-bold text-primary">{existingUsers.length}</p>
                <p className="text-[10px] text-muted-foreground">Usuarios</p>
              </div>
              <div className="rounded-xl bg-accent/5 border border-accent/20 p-2">
                <p className="text-lg font-bold text-accent-foreground">{emailOnly.length}</p>
                <p className="text-[10px] text-muted-foreground">Correos nuevos</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Canales: {channels.map((c) => channelDefs.find((d) => d.id === c)?.name).join(', ')}
            </p>
            {message.trim() && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                &quot;{message.trim()}&quot;
              </p>
            )}
            <ScrollArea className="max-h-64 rounded-xl border border-border">
              <div className="p-2 space-y-1">
                {selectedGuests.map((g) => {
                  const isEmailOnly = !g.username && !!g.email;
                  return (
                    <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isEmailOnly ? 'bg-accent/10' : 'bg-primary/10'}`}>
                        {isEmailOnly ? (
                          <AtSign className="h-3.5 w-3.5 text-accent-foreground" />
                        ) : (
                          <span className="text-[10px] font-semibold text-primary">{g.name.charAt(0)}{g.lastName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{g.name} {g.lastName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {g.username ? `@${g.username.replace(/^@/, '')}` : g.email}
                        </p>
                      </div>
                      {isEmailOnly && <Badge variant="secondary" className="text-[9px]">Nuevo</Badge>}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="flex-1 rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => { setConfirmOpen(false); void send(); }}
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
              disabled={sending}
            >
              Enviar {guestIds.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
