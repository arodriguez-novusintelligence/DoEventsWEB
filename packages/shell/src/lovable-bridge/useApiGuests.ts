import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FavoriteContact } from '@doevents/shared';
import {
  addManualContact,
  addRegisteredUserToFavorites,
  createGuestGroup,
  deleteGuestGroup,
  fetchAllGuestContacts,
  fetchFavoriteContacts,
  fetchGuestGroups,
  fetchOtherContacts,
  removeFavoriteContact,
  searchUsers,
  toggleContactFavorite,
  updateContact,
  updateGuestGroup,
} from '@doevents/shared';
import type {
  CreateGroupRequest,
  CreateGuestRequest,
  Guest,
  UpdateGroupRequest,
  UpdateGuestRequest,
} from '@lovable/types/guest';
import {
  apiGroupToLovable,
  contactToGuest,
  contactsRepresentSamePerson,
  dedupeFavoriteContacts,
  dedupeGuests,
  findMatchingGuest,
  guestProbeFromCreateRequest,
  isJunkTestGuest,
  pickRicherName,
  pickSearchUserMatch,
  resolveGuestFavoriteId,
  resolveGuestGroupId,
  searchUserToGuest,
} from './guestsAdapter';

const DEFAULT_GROUPS: CreateGroupRequest[] = [
  { name: 'Familiares', color: 'hsl(142, 71%, 45%)' },
  { name: 'Amigos', color: 'hsl(217, 91%, 60%)' },
  { name: 'Trabajo', color: 'hsl(25, 95%, 53%)' },
];

export function useApiGuests(userId?: string) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<ReturnType<typeof apiGroupToLovable>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) {
      setGuests([]);
      setGroups([]);
      setLoading(false);
      return;
    }
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      let apiGroups = await fetchGuestGroups(userId).catch(() => []);
      if (apiGroups.length === 0) {
        for (let order = 0; order < DEFAULT_GROUPS.length; order += 1) {
          const g = DEFAULT_GROUPS[order];
          try {
            await createGuestGroup(userId, { name: g.name, color: g.color, order });
          } catch {
            // continuar con los demás grupos
          }
        }
        apiGroups = await fetchGuestGroups(userId).catch(() => []);
      }

      const normalize = (c: FavoriteContact & { userId?: string }) => {
        const invitedUserId = c.invitedUserId || c.userId;
        return {
          ...c,
          favoriteId: c.favoriteId || '',
          invitedUserId,
          email: c.email?.trim().toLowerCase() || c.email,
        };
      };

      let contactRows: (FavoriteContact & { userId?: string })[] = [];
      try {
        contactRows = (await fetchAllGuestContacts(userId)).map(normalize);
      } catch {
        const [favorites, legacyOthers] = await Promise.all([
          fetchFavoriteContacts(userId).catch(() => []),
          fetchOtherContacts(userId).catch(() => []),
        ]);
        contactRows = dedupeFavoriteContacts([
          ...favorites.map(normalize),
          ...legacyOthers.map(normalize),
        ]);
      }

      const supplementalOthers = await fetchOtherContacts(userId).catch(() => []);
      const extras = supplementalOthers
        .map(normalize)
        .filter((other) => !contactRows.some((existing) => contactsRepresentSamePerson(existing, other)))
        .filter((other) => !isJunkTestGuest(contactToGuest(other)));

      const deduped = dedupeFavoriteContacts([...contactRows, ...extras]);
      const merged = deduped
        .filter((c) => c.favoriteId || c.invitedUserId)
        .map((c) => contactToGuest(c))
        .filter((g) => !isJunkTestGuest(g));
      setGuests(dedupeGuests(merged));
      const mappedGroups = apiGroups.map(apiGroupToLovable);
      setGroups(
        mappedGroups.length > 0
          ? mappedGroups
          : DEFAULT_GROUPS.map((g, index) => ({
            id: `local-group-${index}`,
            name: g.name,
            color: g.color,
            createdAt: new Date(),
          })),
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredGuests = useMemo(() => {
    let list = dedupeGuests(guests).filter((g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase())
      || g.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      || g.username?.toLowerCase().includes(searchTerm.toLowerCase())
      || g.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    if (selectedGroupId === 'ungrouped') {
      list = list.filter((g) => !g.groupId);
    } else if (selectedGroupId) {
      list = list.filter((g) => g.groupId === selectedGroupId);
    }
    return list;
  }, [guests, searchTerm, selectedGroupId]);

  const favoriteGuests = filteredGuests.filter((g) => g.isFavorite);
  const regularGuests = filteredGuests.filter((g) => !g.groupId && !g.isFavorite);
  const favoritesWithoutGroup = favoriteGuests.filter((g) => !g.groupId);

  const guestsByGroup = filteredGuests.reduce((acc, guest) => {
    if (!guest.groupId) return acc;
    if (!acc[guest.groupId]) acc[guest.groupId] = [];
    acc[guest.groupId].push(guest);
    return acc;
  }, {} as Record<string, Guest[]>);

  const ungroupedGuests = filteredGuests.filter((g) => !g.groupId && !g.isFavorite);

  const addGuest = useCallback(async (
    data: CreateGuestRequest,
    options?: { skipReload?: boolean },
  ): Promise<string | undefined> => {
    if (!userId) throw new Error('Debes iniciar sesión para agregar invitados');
    const phoneIndicative = data.phoneIndicative || '+57';
    const phoneNumber = data.phoneNumber || '';
    const composedPhone = phoneNumber
      ? `${phoneIndicative.replace(/\D/g, '')}${phoneNumber.replace(/\D/g, '')}`
      : data.phone;
    const groupId = resolveGuestGroupId(data.groupId, groups);
    const existing = findMatchingGuest(guests, guestProbeFromCreateRequest(data));

    if (existing) {
      const favoriteId = existing.favoriteId || existing.id;
      if (!favoriteId) {
        throw new Error('No se pudo actualizar el invitado existente');
      }
      const mergedName = pickRicherName(existing.name, data.name);
      const mergedLastName = pickRicherName(existing.lastName, data.lastName) || data.lastName || existing.lastName;
      await updateContact(userId, favoriteId, {
        name: mergedName,
        lastName: mergedLastName,
        email: data.email || existing.email,
        username: data.username || existing.username,
        phoneIndicative,
        phoneNumber,
        phone: composedPhone,
        isFavorite: data.isFavorite ?? existing.isFavorite,
        groupIds: groupId ? [groupId] : [],
      });
      if (!options?.skipReload) {
        await reload();
      } else {
        setGuests((prev) => {
          const updated = prev.map((g) => (
            g.id === existing.id || g.favoriteId === favoriteId
              ? {
                ...g,
                name: mergedName,
                lastName: mergedLastName,
                email: data.email || g.email,
                username: data.username || g.username,
                phone: composedPhone || g.phone,
                phoneIndicative,
                phoneNumber,
                isFavorite: data.isFavorite ?? g.isFavorite,
                groupId,
              }
              : g
          ));
          const idx = updated.findIndex((g) => g.id === existing.id || g.favoriteId === favoriteId);
          if (idx < 0) return dedupeGuests(updated);
          const [record] = updated.splice(idx, 1);
          return dedupeGuests([record, ...updated]);
        });
      }
      return favoriteId;
    }

    const { favoriteId } = await addManualContact(userId, {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      phone: composedPhone,
      phoneIndicative,
      phoneNumber,
      username: data.username,
      isFavorite: data.isFavorite,
      groupIds: groupId ? [groupId] : undefined,
    });
    if (!options?.skipReload) {
      await reload();
    } else if (favoriteId) {
      setGuests((prev) => dedupeGuests([{
        id: favoriteId,
        favoriteId,
        name: data.name,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        phone: composedPhone,
        phoneIndicative,
        phoneNumber,
        isFavorite: Boolean(data.isFavorite),
        groupId,
        createdAt: new Date(),
      }, ...prev]));
    }
    return favoriteId || undefined;
  }, [userId, reload, guests, groups]);

  const addGroup = useCallback(async (data: CreateGroupRequest) => {
    if (!userId) return;
    await createGuestGroup(userId, { name: data.name, color: data.color });
    await reload();
  }, [userId, reload]);

  const updateGroup = useCallback(async (data: UpdateGroupRequest) => {
    if (!userId) return;
    await updateGuestGroup(userId, data.id, { name: data.name, color: data.color });
    await reload();
  }, [userId, reload]);

  const deleteGroup = useCallback(async (groupId: string) => {
    if (!userId) return;
    await deleteGuestGroup(userId, groupId);
    setSelectedGroupId((curr) => (curr === groupId ? null : curr));
    await reload();
  }, [userId, reload]);

  const moveGuestToGroup = useCallback(async (guestId: string, newGroupId: string | undefined) => {
    if (!userId) return;
    const guest = guests.find((g) => g.id === guestId || g.favoriteId === guestId);
    if (!guest) return;
    const contactId = resolveGuestFavoriteId(guest);
    await updateContact(userId, contactId, {
      groupIds: newGroupId ? [newGroupId] : [],
    });
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, groupId: newGroupId } : g)));
    await reload();
  }, [userId, guests, reload]);

  const getGroupGuestCount = useCallback(
    (groupId: string) => guests.filter((g) => g.groupId === groupId).length,
    [guests],
  );

  const updateGuest = useCallback(async (data: UpdateGuestRequest) => {
    if (!userId) return;
    const guest = guests.find((g) => g.id === data.id || g.favoriteId === data.id);
    const contactId = guest ? resolveGuestFavoriteId(guest) : data.id;
    const phoneIndicative = data.phoneIndicative || '+57';
    const phoneNumber = data.phoneNumber || '';
    await updateContact(userId, contactId, {
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      username: data.username,
      phoneIndicative,
      phoneNumber,
      phone: phoneNumber
        ? `${phoneIndicative.replace(/\D/g, '')}${phoneNumber.replace(/\D/g, '')}`
        : data.phone,
      isFavorite: data.isFavorite,
      groupIds: data.groupId ? [resolveGuestGroupId(data.groupId, groups) || data.groupId] : undefined,
    });
    await reload();
  }, [userId, reload, groups, guests]);

  const deleteGuest = useCallback(async (guestId: string) => {
    if (!userId) return;
    const guest = guests.find((g) => g.id === guestId || g.favoriteId === guestId);
    const favoriteId = guest ? resolveGuestFavoriteId(guest) : guestId;
    if (!favoriteId) throw new Error('No se encontró el contacto a eliminar');
    await removeFavoriteContact(userId, favoriteId);
    setGuests((prev) => prev.filter((g) => g.id !== guestId && g.favoriteId !== favoriteId));
    await reload({ silent: true });
  }, [userId, guests, reload]);

  const purgeJunkGuests = useCallback(async (): Promise<number> => {
    if (!userId) return 0;
    try {
      const contacts = await fetchAllGuestContacts(userId).catch(() => []);
      const junk = contacts
        .map((c) => contactToGuest(c as FavoriteContact & { userId?: string }))
        .filter(isJunkTestGuest);
      let removed = 0;
      for (const g of junk) {
        const favoriteId = g.favoriteId || g.id;
        if (!favoriteId) continue;
        try {
          await removeFavoriteContact(userId, favoriteId);
          removed += 1;
        } catch {
          // omitir contactos que ya no existen
        }
      }
      if (removed > 0) await reload({ silent: true });
      return removed;
    } catch {
      return 0;
    }
  }, [userId, reload]);

  const toggleFavorite = useCallback(async (guestId: string) => {
    if (!userId) return;
    const guest = guests.find((g) => g.id === guestId || g.favoriteId === guestId);
    if (!guest) return;
    const contactId = resolveGuestFavoriteId(guest);
    const next = !guest.isFavorite;
    await toggleContactFavorite(userId, contactId, next);
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, isFavorite: next } : g)));
  }, [userId, guests]);

  const searchUserByUsername = useCallback(async (username: string): Promise<Guest | null> => {
    const clean = username.replace('@', '').trim();
    if (clean.length < 2) return null;
    const results = await searchUsers(clean);
    const match = pickSearchUserMatch(clean, results);
    if (!match) return null;
    return searchUserToGuest(match);
  }, []);

  const searchUsersForGuest = useCallback(async (query: string): Promise<Guest[]> => {
    const clean = query.replace('@', '').trim();
    if (clean.length < 2) return [];
    const results = await searchUsers(clean);
    return results
      .map(searchUserToGuest)
      .filter((g) => g.id && !g.id.startsWith('search-'));
  }, []);

  const registerUserAsGuest = useCallback(async (
    targetUserId: string,
    options?: {
      skipReload?: boolean;
      profile?: Guest;
      groupId?: string;
      isFavorite?: boolean;
    },
  ): Promise<string | undefined> => {
    if (!userId) throw new Error('Debes iniciar sesión para agregar invitados');
    const profile = options?.profile;
    const groupId = resolveGuestGroupId(options?.groupId ?? profile?.groupId, groups);
    const existing = findMatchingGuest(guests, {
      invitedUserId: targetUserId,
      id: targetUserId,
      email: profile?.email,
      username: profile?.username,
    });

    if (existing) {
      const favoriteId = existing.favoriteId || existing.id;
      if (!favoriteId) {
        throw new Error('No se pudo actualizar el invitado existente');
      }
      const mergedName = pickRicherName(existing.name, profile?.name);
      const mergedLastName = pickRicherName(existing.lastName, profile?.lastName) || profile?.lastName || existing.lastName;
      await updateContact(userId, favoriteId, {
        name: mergedName,
        lastName: mergedLastName,
        username: profile?.username || existing.username,
        email: profile?.email || existing.email,
        isFavorite: options?.isFavorite ?? true,
        groupIds: groupId ? [groupId] : [],
      });
      if (!options?.skipReload) {
        await reload();
      } else {
        setGuests((prev) => {
          const updated = prev.map((g) => (
            g.id === existing.id || g.favoriteId === favoriteId || g.invitedUserId === targetUserId
              ? {
                ...g,
                invitedUserId: targetUserId,
                name: mergedName,
                lastName: mergedLastName,
                username: profile?.username || g.username,
                email: profile?.email || g.email,
                avatar: profile?.avatar || g.avatar,
                isFavorite: options?.isFavorite ?? true,
                groupId,
                originType: 'REGISTERED' as const,
              }
              : g
          ));
          const idx = updated.findIndex((g) => g.id === existing.id || g.favoriteId === favoriteId || g.invitedUserId === targetUserId);
          if (idx < 0) return dedupeGuests(updated);
          const [record] = updated.splice(idx, 1);
          return dedupeGuests([record, ...updated]);
        });
      }
      return favoriteId;
    }

    const { favoriteId } = await addRegisteredUserToFavorites(userId, targetUserId);
    if (favoriteId) {
      await updateContact(userId, favoriteId, {
        name: profile?.name,
        lastName: profile?.lastName,
        username: profile?.username,
        email: profile?.email,
        isFavorite: options?.isFavorite ?? true,
        groupIds: groupId ? [groupId] : [],
      });
    }
    if (!options?.skipReload) {
      await reload();
    } else if (favoriteId) {
      setGuests((prev) => dedupeGuests([{
        id: favoriteId,
        favoriteId,
        invitedUserId: targetUserId,
        name: profile?.name || 'Usuario',
        lastName: profile?.lastName || '',
        username: profile?.username,
        email: profile?.email,
        avatar: profile?.avatar,
        isFavorite: options?.isFavorite ?? true,
        groupId,
        originType: 'REGISTERED',
        createdAt: new Date(),
      }, ...prev]));
    }
    return favoriteId || undefined;
  }, [userId, reload, guests, groups]);

  return {
    allGuests: guests,
    guests: filteredGuests,
    favoriteGuests,
    favoritesWithoutGroup,
    regularGuests,
    guestsByGroup,
    ungroupedGuests,
    groups,
    selectedGroupId,
    searchTerm,
    loading,
    setSearchTerm,
    setSelectedGroupId,
    addGuest,
    updateGuest,
    deleteGuest,
    toggleFavorite,
    addGroup,
    updateGroup,
    deleteGroup,
    moveGuestToGroup,
    getGroupGuestCount,
    searchUserByUsername,
    searchUsersForGuest,
    registerUserAsGuest,
    purgeJunkGuests,
    reload,
  };
}

export type ApiGuestsController = ReturnType<typeof useApiGuests>;
