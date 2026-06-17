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

export interface GuestInfo {
  name: string;
  avatar: string;
  confirmed: boolean;
  phone?: string;
  email?: string;
  purchaseDate?: string;
  paymentAuthorization?: 'before' | 'after';
  amountPaid?: number;
  platformCommission?: number;
  totalWithCommission?: number;
  category?: string;
}

export interface ChannelFunnelStep {
  label: string;
  value: number;
  percentage: number;
}

export interface ChannelData {
  id: string;
  name: string;
  icon: 'whatsapp' | 'mail' | 'campaign' | 'push';
  sent: number;
  conversionRate: number;
  funnel: ChannelFunnelStep[];
  guests: GuestInfo[];
  confirmedCount: number;
}

export interface GuestStatsData {
  channels: ChannelData[];
  avgDeliveryRate: number;
  avgOpenRate: number;
  avgConversionRate: number;
  totalConfirmations: number;
}

const phones = ['+57 300 123 4567','+57 310 234 5678','+57 320 345 6789','+57 315 456 7890','+57 301 567 8901','+57 311 678 9012','+57 321 789 0123','+57 316 890 1234','+57 302 901 2345','+57 312 012 3456'];
const emails = ['ana@mail.com','carlos@mail.com','maria@mail.com','jose@mail.com','laura@mail.com','miguel@mail.com','carmen@mail.com','rafael@mail.com','sandra@mail.com','david@mail.com'];
const categories = ['VIP', 'Palco', 'Terraza', 'General'];
const prices = [150000, 700000, 450000, 800000];
const commissionRate = 0.05;

const enrichGuest = (g: { name: string; avatar: string; confirmed: boolean }, i: number): GuestInfo => {
  const catIdx = i % 4;
  const price = prices[catIdx];
  const commission = Math.round(price * commissionRate);
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  const purchaseDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  return {
    ...g,
    phone: phones[i % phones.length],
    email: g.name.toLowerCase().replace(/\s/g, '.') + '@mail.com',
    purchaseDate,
    paymentAuthorization: Math.random() > 0.3 ? 'before' : 'after',
    amountPaid: price,
    platformCommission: commission,
    totalWithCommission: price + commission,
    category: categories[catIdx],
  };
};

const rawGuests = [
  { name: 'Ana', avatar: anaAvatar, confirmed: true },
  { name: 'Carlos', avatar: carlosAvatar, confirmed: true },
  { name: 'María', avatar: mariaAvatar, confirmed: true },
  { name: 'José', avatar: joseAvatar, confirmed: false },
  { name: 'Laura', avatar: lauraAvatar, confirmed: true },
  { name: 'Miguel', avatar: miguelAvatar, confirmed: true },
  { name: 'Carmen', avatar: fernandoAvatar, confirmed: false },
  { name: 'Rafael', avatar: luisAvatar, confirmed: true },
  { name: 'Sandra', avatar: isabelAvatar, confirmed: true },
  { name: 'David', avatar: pedroAvatar, confirmed: true },
  { name: 'Pedro', avatar: pedroAvatar, confirmed: true },
  { name: 'Isabel', avatar: isabelAvatar, confirmed: false },
  { name: 'Antonio', avatar: joseAvatar, confirmed: false },
  { name: 'Lucía', avatar: lauraAvatar, confirmed: true },
  { name: 'Francisco', avatar: carlosAvatar, confirmed: false },
  { name: 'Elena', avatar: anaAvatar, confirmed: false },
  { name: 'Manuel', avatar: miguelAvatar, confirmed: false },
  { name: 'Cristina', avatar: mariaAvatar, confirmed: false },
  { name: 'Javier', avatar: luisAvatar, confirmed: false },
  { name: 'Patricia', avatar: isabelAvatar, confirmed: false },
  { name: 'Roberto', avatar: fernandoAvatar, confirmed: false },
  { name: 'Mónica', avatar: lauraAvatar, confirmed: false },
  { name: 'Fernando', avatar: fernandoAvatar, confirmed: true },
  { name: 'Beatriz', avatar: anaAvatar, confirmed: true },
  { name: 'Sergio', avatar: carlosAvatar, confirmed: true },
  { name: 'Diana', avatar: mariaAvatar, confirmed: true },
  { name: 'Andrés', avatar: joseAvatar, confirmed: true },
  { name: 'Pilar', avatar: lauraAvatar, confirmed: true },
  { name: 'Alberto', avatar: miguelAvatar, confirmed: true },
  { name: 'Claudia', avatar: isabelAvatar, confirmed: false },
  { name: 'Tomás', avatar: luisAvatar, confirmed: true },
  { name: 'Gabriela', avatar: anaAvatar, confirmed: true },
  { name: 'Óscar', avatar: pedroAvatar, confirmed: true },
  { name: 'Valentina', avatar: mariaAvatar, confirmed: true },
  { name: 'Ricardo', avatar: carlosAvatar, confirmed: false },
  { name: 'Camila', avatar: lauraAvatar, confirmed: false },
];

const allGuests: GuestInfo[] = rawGuests.map((g, i) => enrichGuest(g, i));

export const generateGuestStatsData = (): GuestStatsData => {
  const channels: ChannelData[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'whatsapp',
      sent: 3200,
      conversionRate: 4.2,
      funnel: [
        { label: 'Enviados', value: 3200, percentage: 100 },
        { label: 'Entregados', value: 3136, percentage: 98 },
        { label: 'Abiertos', value: 2720, percentage: 85 },
        { label: 'Clics', value: 544, percentage: 17 },
        { label: 'Confirmados', value: 134, percentage: 4.2 },
      ],
      guests: allGuests.slice(0, 10),
      confirmedCount: 8,
    },
    {
      id: 'mail',
      name: 'Mail',
      icon: 'mail',
      sent: 4000,
      conversionRate: 1.52,
      funnel: [
        { label: 'Enviados', value: 4000, percentage: 100 },
        { label: 'Entregados', value: 3800, percentage: 95 },
        { label: 'Abiertos', value: 2400, percentage: 60 },
        { label: 'Clics', value: 320, percentage: 8 },
        { label: 'Confirmados', value: 61, percentage: 1.52 },
      ],
      guests: allGuests.slice(10, 22),
      confirmedCount: 3,
    },
    {
      id: 'campaign',
      name: 'Campaña\n(inApp)',
      icon: 'campaign',
      sent: 1800,
      conversionRate: 6.8,
      funnel: [
        { label: 'Enviados', value: 1800, percentage: 100 },
        { label: 'Entregados', value: 1764, percentage: 98 },
        { label: 'Abiertos', value: 1620, percentage: 90 },
        { label: 'Clics', value: 432, percentage: 24 },
        { label: 'Confirmados', value: 122, percentage: 6.8 },
      ],
      guests: allGuests.slice(22, 30),
      confirmedCount: 7,
    },
    {
      id: 'push',
      name: 'Push',
      icon: 'push',
      sent: 1000,
      conversionRate: 3.1,
      funnel: [
        { label: 'Enviados', value: 1000, percentage: 100 },
        { label: 'Entregados', value: 970, percentage: 97 },
        { label: 'Abiertos', value: 750, percentage: 75 },
        { label: 'Clics', value: 180, percentage: 18 },
        { label: 'Confirmados', value: 31, percentage: 3.1 },
      ],
      guests: allGuests.slice(30, 36),
      confirmedCount: 4,
    },
  ];

  return {
    channels,
    avgDeliveryRate: 97.25,
    avgOpenRate: 74,
    avgConversionRate: 2.91,
    totalConfirmations: 152,
  };
};
