import type { EventChatRoom } from '@lovable/data/chatData';

export interface SeatInfo {
  row: string;
  number: number;
  sold: boolean;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  purchaseDate?: string;
  paymentAuthorization?: 'before' | 'after'; // antes o después del evento
  amountPaid?: number;       // monto neto
  platformCommission?: number; // comisión plataforma
  totalWithCommission?: number; // total incluyendo comisión
}

export interface CategorySales {
  name: string;
  color: string;       // tailwind color class
  colorHex: string;    // for indicators
  total: number;
  sold: number;
  available: number;
  occupancy: number;   // percentage
  revenue: number;
  seats: SeatInfo[];
}

export interface EventSalesData {
  eventId: string;
  eventName: string;
  venueName: string;
  currency: string;
  categories: CategorySales[];
}

const generateSeats = (rows: string[], cols: number, soldCount: number, pricePerSeat: number): SeatInfo[] => {
  const seats: SeatInfo[] = [];
  const buyers = [
    { name: 'María López', phone: '+57 300 123 4567', email: 'maria.lopez@mail.com' },
    { name: 'Carlos Gómez', phone: '+57 310 234 5678', email: 'carlos.gomez@mail.com' },
    { name: 'Ana Martínez', phone: '+57 320 345 6789', email: 'ana.martinez@mail.com' },
    { name: 'Juan Pérez', phone: '+57 315 456 7890', email: 'juan.perez@mail.com' },
    { name: 'Laura Díaz', phone: '+57 301 567 8901', email: 'laura.diaz@mail.com' },
    { name: 'Pedro Ruiz', phone: '+57 311 678 9012', email: 'pedro.ruiz@mail.com' },
    { name: 'Sofía Torres', phone: '+57 321 789 0123', email: 'sofia.torres@mail.com' },
    { name: 'Diego Castro', phone: '+57 316 890 1234', email: 'diego.castro@mail.com' },
    { name: 'Valentina Ríos', phone: '+57 302 901 2345', email: 'valentina.rios@mail.com' },
    { name: 'Andrés Morales', phone: '+57 312 012 3456', email: 'andres.morales@mail.com' },
  ];
  const commissionRate = 0.05; // 5% comisión plataforma
  let remaining = soldCount;

  for (const row of rows) {
    for (let n = 1; n <= cols; n++) {
      const sold = remaining > 0;
      if (sold) {
        const buyer = buyers[Math.floor(Math.random() * buyers.length)];
        const commission = Math.round(pricePerSeat * commissionRate);
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const purchaseDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
        seats.push({
          row, number: n, sold: true,
          buyerName: buyer.name,
          buyerPhone: buyer.phone,
          buyerEmail: buyer.email,
          purchaseDate,
          paymentAuthorization: Math.random() > 0.3 ? 'before' : 'after',
          amountPaid: pricePerSeat,
          platformCommission: commission,
          totalWithCommission: pricePerSeat + commission,
        });
        remaining--;
      } else {
        seats.push({ row, number: n, sold: false });
      }
    }
  }
  return seats;
};

export const generateMockSalesData = (event: EventChatRoom): EventSalesData => {
  const categories: CategorySales[] = [
    {
      name: 'VIP',
      color: 'bg-destructive',
      colorHex: '#ef4444',
      total: 20,
      sold: 12,
      available: 8,
      occupancy: 60,
      revenue: 1800000,
      seats: generateSeats(['A', 'B', 'C', 'D'], 5, 12, 150000),
    },
    {
      name: 'Palco',
      color: 'bg-amber-400',
      colorHex: '#fbbf24',
      total: 24,
      sold: 15,
      available: 9,
      occupancy: 63,
      revenue: 10500000,
      seats: generateSeats(['A', 'B', 'C', 'D'], 6, 15, 700000),
    },
    {
      name: 'Terraza',
      color: 'bg-blue-500',
      colorHex: '#3b82f6',
      total: 20,
      sold: 8,
      available: 12,
      occupancy: 40,
      revenue: 3600000,
      seats: generateSeats(['A', 'B', 'C', 'D'], 5, 8, 450000),
    },
    {
      name: 'General',
      color: 'bg-purple-500',
      colorHex: '#a855f7',
      total: 20,
      sold: 14,
      available: 6,
      occupancy: 70,
      revenue: 11200000,
      seats: generateSeats(['A', 'B', 'C', 'D'], 5, 14, 800000),
    },
  ];

  return {
    eventId: event.id,
    eventName: event.eventName,
    venueName: 'Teatro Principal',
    currency: 'COP',
    categories,
  };
};
