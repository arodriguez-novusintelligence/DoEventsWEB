import { useState } from "react";
import { GuestEvent } from "@lovable/types/guest-event";

const HERO = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop";

const mockEvents: GuestEvent[] = [
  { id: "1", title: "Feria del postre", description: "Una tarde dulce con los mejores reposteros de la ciudad.", date: "Jun 15 del 2026", time: "4:00 P.M", location: "Llanogrande - Antioquia", image: HERO, isActive: true, invitedGuests: [], createdAt: new Date("2026-06-01") },
  { id: "2", title: "Gastronomía para todos", description: "Festival gastronómico abierto al público.", date: "May 30 del 2026", time: "8:00 A.M", location: "Medellín - Antioquia", image: HERO, isActive: true, invitedGuests: [], createdAt: new Date("2026-05-15") },
  { id: "3", title: "Festival del baile", description: "Tres escenarios, una noche inolvidable.", date: "Jul 02 del 2026", time: "6:00 P.M", location: "Medellín - Antioquia", image: HERO, isActive: true, invitedGuests: [], createdAt: new Date("2026-06-20") },
  { id: "4", title: "Clases de baile", description: "Aprende salsa y bachata desde cero.", date: "Jul 23 del 2026", time: "6:00 P.M", location: "Medellín - Antioquia", image: HERO, isActive: true, invitedGuests: [], createdAt: new Date("2026-07-01") },
];

export const useGuestEvents = () => {
  const [events, setEvents] = useState<GuestEvent[]>(mockEvents);
  const activeEvents = events.filter(e => e.isActive);
  const updateEventGuests = (eventId: string, guestIds: string[]) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, invitedGuests: guestIds } : e));
  };
  const getEventById = (eventId: string) => events.find(e => e.id === eventId);
  return { events, activeEvents, updateEventGuests, getEventById };
};
