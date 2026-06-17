import { useState, useCallback } from "react";
import { Guest, CreateGuestRequest, UpdateGuestRequest, GuestGroup, CreateGroupRequest, UpdateGroupRequest } from "@lovable/types/guest";

const mockGroups: GuestGroup[] = [
  { id: "group-1", name: "Familiares", color: "hsl(142, 71%, 45%)", createdAt: new Date() },
  { id: "group-2", name: "Amigos", color: "hsl(217, 91%, 60%)", createdAt: new Date() },
  { id: "group-3", name: "Trabajo", color: "hsl(25, 95%, 53%)", createdAt: new Date() },
];

const mockGuests: Guest[] = [
  { id: "1", name: "Ana", lastName: "Ruiz", username: "anaruis", email: "ana.ruiz@email.com", phone: "+57 300 123 4567", isFavorite: false, groupId: "group-1", createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face" },
  { id: "2", name: "Clara", lastName: "Gómez", username: "claragomez", email: "clara.gomez@email.com", phone: "+57 301 234 5678", isFavorite: false, groupId: "group-2", createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face" },
  { id: "3", name: "Luz", lastName: "Pérez", username: "luzperez", email: "luz.perez@email.com", phone: "+57 302 345 6789", isFavorite: false, groupId: "group-2", createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face" },
  { id: "4", name: "Javier", lastName: "Torres", username: "javiertorres", email: "javier.torres@email.com", phone: "+57 303 456 7890", isFavorite: true, groupId: "group-3", createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" },
];

export function useGuests() {
  const [guests, setGuests] = useState<Guest[]>(mockGuests);
  const [groups, setGroups] = useState<GuestGroup[]>(mockGroups);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  let filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (selectedGroupId) filteredGuests = filteredGuests.filter(g => g.groupId === selectedGroupId);

  const favoriteGuests = filteredGuests.filter(g => g.isFavorite);
  const regularGuests = filteredGuests.filter(g => !g.isFavorite);

  const guestsByGroup = filteredGuests.reduce((acc, guest) => {
    const gid = guest.groupId || 'ungrouped';
    if (!acc[gid]) acc[gid] = [];
    acc[gid].push(guest);
    return acc;
  }, {} as Record<string, Guest[]>);
  const ungroupedGuests = guestsByGroup['ungrouped'] || [];

  const addGuest = useCallback((data: CreateGuestRequest) => {
    setGuests(prev => [{ id: Math.random().toString(36).slice(2, 11), ...data, isFavorite: data.isFavorite || false, createdAt: new Date() }, ...prev]);
  }, []);
  const addGroup = useCallback((data: CreateGroupRequest) => {
    setGroups(prev => [{ id: Math.random().toString(36).slice(2, 11), ...data, createdAt: new Date() }, ...prev]);
  }, []);
  const updateGroup = useCallback((data: UpdateGroupRequest) => {
    setGroups(prev => prev.map(g => g.id === data.id ? { ...g, ...data } : g));
  }, []);
  const deleteGroup = useCallback((groupId: string) => {
    setGuests(prev => prev.map(g => g.groupId === groupId ? { ...g, groupId: undefined } : g));
    setGroups(prev => prev.filter(g => g.id !== groupId));
    setSelectedGroupId(curr => curr === groupId ? null : curr);
  }, []);
  const moveGuestToGroup = useCallback((guestId: string, newGroupId: string | undefined) => {
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, groupId: newGroupId } : g));
  }, []);
  const getGroupGuestCount = useCallback((groupId: string) => guests.filter(g => g.groupId === groupId).length, [guests]);
  const updateGuest = useCallback((data: UpdateGuestRequest) => {
    setGuests(prev => prev.map(g => g.id === data.id ? { ...g, ...data } : g));
  }, []);
  const deleteGuest = useCallback((guestId: string) => {
    setGuests(prev => prev.filter(g => g.id !== guestId));
  }, []);
  const toggleFavorite = useCallback((guestId: string) => {
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, isFavorite: !g.isFavorite } : g));
  }, []);

  const searchUserByUsername = useCallback(async (username: string): Promise<Guest | null> => {
    await new Promise(r => setTimeout(r, 800));
    const results: Guest[] = [
      { id: "s1", name: "Luis", lastName: "Martínez", username: "luis", email: "luis@email.com", phone: "+57 304 567 8901", isFavorite: false, createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" },
      { id: "s2", name: "Sebastián", lastName: "López", username: "sebas", email: "sebastian@email.com", phone: "+57 305 678 9012", isFavorite: false, createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face" },
      { id: "s3", name: "Salvador", lastName: "Herrera", username: "salo", email: "salvador@email.com", phone: "+57 306 789 0123", isFavorite: false, createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face" },
      { id: "s4", name: "Andrea", lastName: "Morales", username: "andrea", email: "andrea@email.com", phone: "+57 309 012 3456", isFavorite: false, createdAt: new Date(), avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face" },
    ];
    const clean = username.replace('@', '').toLowerCase();
    return results.find(u => u.username!.toLowerCase().includes(clean)) || null;
  }, []);

  return {
    guests: filteredGuests, favoriteGuests, regularGuests, guestsByGroup, ungroupedGuests,
    groups, selectedGroupId, searchTerm,
    setSearchTerm, setSelectedGroupId,
    addGuest, updateGuest, deleteGuest, toggleFavorite,
    addGroup, updateGroup, deleteGroup,
    moveGuestToGroup, getGroupGuestCount, searchUserByUsername,
  };
}
