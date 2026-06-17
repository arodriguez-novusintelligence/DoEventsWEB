export interface AgendaItem {
  startTime: string;
  endTime: string;
  title: string;
  responsible: string;
}

export interface AgendaDay {
  dayLabel: string;
  dateLabel: string;
  items: AgendaItem[];
}

export interface InvitationPerson {
  name: string;
  avatar: string;
  initials?: string;
  rating: number; // 0-5
  eventsCount: number;
  experiencePct: number;
  userId?: string;
}

export interface InvitationEvent {
  id: string;
  title: string;
  receivedAt: string; // ISO
  inviter: string;
  status: 'pendiente' | 'aceptada' | 'rechazada';
  image: string;
  images: string[];
  state: 'activo' | 'inactivo';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  category: string;
  eventClass: string;
  capacity: number;
  venueType: string;
  description: string;
  agenda: AgendaDay[];
  venue: {
    name: string;
    address: string;
    images: string[];
  };
  videoUrl?: string;
  organizer: InvitationPerson;
  host: InvitationPerson;
  refundPolicy: string;
}

export const mockInvitations: InvitationEvent[] = [];
