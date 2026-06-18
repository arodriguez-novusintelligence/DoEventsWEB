import { useSyncExternalStore } from 'react';

export type TicketStatus = 'aprobada' | 'pendiente' | 'cancelada' | 'finalizada';

export interface Ticket {
  id: string;
  orderNumber: string;
  orderDate: string;
  eventTitle: string;
  eventImage: string;
  eventVideo?: string;
  eventDate: string;
  startTime: string;
  category: string;
  seat: string;
  seatLabel?: string;
  entrance: string;
  qrCode: string;
  qrUrl?: string;
  orderRef?: string;
  status: TicketStatus;
  eventId?: string;
  orderId?: string;
  ticketInstanceId?: string;
  price?: number;
  paymentExpiresAtTs?: number;
  eventTicketCount?: number;
}

let tickets: Ticket[] = [
  {
    id: 't1',
    orderNumber: 'C4D533',
    orderDate: '28/05/2026',
    eventTitle: 'Tercer Evento Santo Domingo',
    eventImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
    eventDate: '24/06/2026',
    startTime: '08:00 P. M.',
    category: 'General',
    seat: 'Silla - A05',
    entrance: 'Puerta Principal',
    qrCode: '1974474392934501001',
    status: 'aprobada',
    eventId: 'inv-1',
  },
  {
    id: 't2',
    orderNumber: 'B8F212',
    orderDate: '20/05/2026',
    eventTitle: 'Celebracion Cumpleanos JUANA',
    eventImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop',
    eventDate: '24/06/2026',
    startTime: '06:00 P. M.',
    category: 'VIP',
    seat: 'Mesa - M03',
    entrance: 'Entrada Lateral',
    qrCode: '1974474392934501022',
    status: 'aprobada',
    eventId: 'inv-3',
  },
  {
    id: 't3',
    orderNumber: 'C4D533',
    orderDate: '28/05/2026',
    eventTitle: 'Musical El Fantasma de La Ópera',
    eventImage: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&auto=format&fit=crop',
    eventDate: '23/06/2026',
    startTime: '07:34 P. M.',
    category: 'Gradas Lateral Derecho',
    seat: 'Silla - G12',
    entrance: 'Entrando Lateral Derecha',
    qrCode: '1974474392934501045',
    status: 'aprobada',
    eventId: 'inv-2',
  },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const getTickets = () => tickets;

export const addTickets = (newTickets: Ticket[]) => {
  tickets = [...newTickets, ...tickets];
  emit();
};

export const useTickets = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => tickets,
    () => tickets
  );
