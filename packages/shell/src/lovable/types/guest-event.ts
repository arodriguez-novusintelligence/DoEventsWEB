export interface GuestEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  isActive: boolean;
  invitedGuests: string[];
  createdAt: Date;
}

export interface CreateGuestEventRequest {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image?: string;
}
