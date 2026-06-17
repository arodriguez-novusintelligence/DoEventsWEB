import anaAvatar from '@lovable/assets/avatars/ana.jpg';
import carlosAvatar from '@lovable/assets/avatars/carlos.jpg';
import fernandoAvatar from '@lovable/assets/avatars/fernando.jpg';
import isabelAvatar from '@lovable/assets/avatars/isabel.jpg';
import joseAvatar from '@lovable/assets/avatars/jose.jpg';
import lauraAvatar from '@lovable/assets/avatars/laura.jpg';
import luisAvatar from '@lovable/assets/avatars/luis.jpg';
import mariaAvatar from '@lovable/assets/avatars/maria.jpg';
import miguelAvatar from '@lovable/assets/avatars/miguel.jpg';
import pedroAvatar from '@lovable/assets/avatars/pedro.jpg';

export interface AccessStatusData {
  valid: number;
  invalid: number;
  duplicate: number;
}

export interface GateData {
  name: string;
  totalAttempts: number;
  granted: number;
  denied: number;
  percentage: number;
  status: 'Óptimo' | 'Normal' | 'Alerta';
}

export interface TicketTypeTraffic {
  type: string;
  granted: number;
  denied: number;
}

export interface AttendeeInfo {
  name: string;
  avatar: string;
  status: 'granted' | 'denied' | 'pending';
}

export interface TicketTypeAttendees {
  type: string;
  attendees: AttendeeInfo[];
  grantedCount: number;
}

export interface SeatAccessInfo {
  row: string;
  number: number;
  sold: boolean;
  accessStatus: 'granted' | 'denied' | 'pending' | 'none'; // none = not sold
  buyerName?: string;
}

export interface CategoryAccessData {
  name: string;
  color: string;
  colorHex: string;
  total: number;
  granted: number;
  denied: number;
  pending: number;
  seats: SeatAccessInfo[];
}

export interface AccessControlData {
  totalTickets: number;
  accessGranted: number;
  attendance: number;
  denials: number;
  currentInside: number;
  accessStatus: AccessStatusData;
  gates: GateData[];
  trafficByType: TicketTypeTraffic[];
  attendeesByType: TicketTypeAttendees[];
  categoryAccess: CategoryAccessData[];
}

const generateCategoryAccess = (): CategoryAccessData[] => {
  const buyers = ['María','Carlos','Ana','Juan','Laura','Pedro','Sofía','Diego','Valentina','Andrés'];
  const configs = [
    { name: 'VIP', color: 'bg-destructive', colorHex: '#ef4444', rows: ['A','B','C','D'], cols: 5, soldCount: 12 },
    { name: 'Palco', color: 'bg-amber-400', colorHex: '#fbbf24', rows: ['A','B','C','D'], cols: 6, soldCount: 15 },
    { name: 'Terraza', color: 'bg-blue-500', colorHex: '#3b82f6', rows: ['A','B','C','D'], cols: 5, soldCount: 8 },
    { name: 'General', color: 'bg-purple-500', colorHex: '#a855f7', rows: ['A','B','C','D'], cols: 5, soldCount: 14 },
  ];

  return configs.map(cfg => {
    const seats: SeatAccessInfo[] = [];
    let remaining = cfg.soldCount;
    let granted = 0, denied = 0, pending = 0;

    for (const row of cfg.rows) {
      for (let n = 1; n <= cfg.cols; n++) {
        if (remaining > 0) {
          const r = Math.random();
          const status = r > 0.25 ? 'granted' : r > 0.1 ? 'denied' : 'pending';
          if (status === 'granted') granted++;
          else if (status === 'denied') denied++;
          else pending++;
          seats.push({ row, number: n, sold: true, accessStatus: status, buyerName: buyers[Math.floor(Math.random() * buyers.length)] });
          remaining--;
        } else {
          seats.push({ row, number: n, sold: false, accessStatus: 'none' });
        }
      }
    }
    return { name: cfg.name, color: cfg.color, colorHex: cfg.colorHex, total: cfg.rows.length * cfg.cols, granted, denied, pending, seats };
  });
};

export const generateAccessControlData = (): AccessControlData => {
  const attendeesVIP: AttendeeInfo[] = [
    { name: 'Ana', avatar: anaAvatar, status: 'granted' },
    { name: 'Carlos', avatar: carlosAvatar, status: 'denied' },
    { name: 'María', avatar: mariaAvatar, status: 'granted' },
    { name: 'José', avatar: joseAvatar, status: 'granted' },
    { name: 'Laura', avatar: lauraAvatar, status: 'granted' },
    { name: 'Miguel', avatar: miguelAvatar, status: 'granted' },
    { name: 'Carmen', avatar: fernandoAvatar, status: 'pending' },
    { name: 'Rafael', avatar: luisAvatar, status: 'granted' },
  ];

  const attendeesGeneral: AttendeeInfo[] = [
    { name: 'Sandra', avatar: isabelAvatar, status: 'granted' },
    { name: 'David', avatar: pedroAvatar, status: 'granted' },
    { name: 'Pedro', avatar: pedroAvatar, status: 'granted' },
    { name: 'Isabel', avatar: isabelAvatar, status: 'pending' },
    { name: 'Antonio', avatar: joseAvatar, status: 'granted' },
    { name: 'Lucía', avatar: lauraAvatar, status: 'granted' },
    { name: 'Francisco', avatar: carlosAvatar, status: 'denied' },
    { name: 'Elena', avatar: anaAvatar, status: 'granted' },
    { name: 'Manuel', avatar: miguelAvatar, status: 'granted' },
    { name: 'Cristina', avatar: mariaAvatar, status: 'pending' },
    { name: 'Javier', avatar: luisAvatar, status: 'granted' },
    { name: 'Patricia', avatar: isabelAvatar, status: 'pending' },
  ];

  const attendeesPrensa: AttendeeInfo[] = [
    { name: 'Roberto', avatar: fernandoAvatar, status: 'granted' },
    { name: 'Mónica', avatar: lauraAvatar, status: 'granted' },
    { name: 'Fernando', avatar: fernandoAvatar, status: 'granted' },
    { name: 'Beatriz', avatar: anaAvatar, status: 'granted' },
    { name: 'Sergio', avatar: carlosAvatar, status: 'granted' },
    { name: 'Diana', avatar: mariaAvatar, status: 'pending' },
  ];

  const attendeesStaff: AttendeeInfo[] = [
    { name: 'Andrés', avatar: joseAvatar, status: 'granted' },
    { name: 'Pilar', avatar: lauraAvatar, status: 'granted' },
    { name: 'Alberto', avatar: miguelAvatar, status: 'granted' },
    { name: 'Claudia', avatar: isabelAvatar, status: 'granted' },
    { name: 'Tomás', avatar: luisAvatar, status: 'granted' },
    { name: 'Gabriela', avatar: anaAvatar, status: 'pending' },
  ];

  return {
    totalTickets: 1000,
    accessGranted: 750,
    attendance: 75,
    denials: 25,
    currentInside: 685,
    accessStatus: {
      valid: 750,
      invalid: 220,
      duplicate: 30,
    },
    gates: [
      { name: 'Principal', totalAttempts: 450, granted: 425, denied: 25, percentage: 94.4, status: 'Óptimo' },
      { name: 'Lateral Derecha L1', totalAttempts: 310, granted: 290, denied: 20, percentage: 93.5, status: 'Normal' },
      { name: 'Lateral Izquierda L1', totalAttempts: 240, granted: 230, denied: 10, percentage: 95.8, status: 'Óptimo' },
    ],
    trafficByType: [
      { type: 'General', granted: 400, denied: 12 },
      { type: 'VIP', granted: 150, denied: 5 },
      { type: 'Prensa', granted: 80, denied: 3 },
      { type: 'Staff', granted: 120, denied: 5 },
    ],
    attendeesByType: [
      { type: 'VIP', attendees: attendeesVIP, grantedCount: 6 },
      { type: 'General', attendees: attendeesGeneral, grantedCount: 8 },
      { type: 'Prensa', attendees: attendeesPrensa, grantedCount: 5 },
      { type: 'Staff', attendees: attendeesStaff, grantedCount: 5 },
    ],
    categoryAccess: generateCategoryAccess(),
  };
};
