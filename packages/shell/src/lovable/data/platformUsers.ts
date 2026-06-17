import ana from '@lovable/assets/avatars/ana.jpg';
import carlos from '@lovable/assets/avatars/carlos.jpg';
import fernando from '@lovable/assets/avatars/fernando.jpg';
import isabel from '@lovable/assets/avatars/isabel.jpg';
import jose from '@lovable/assets/avatars/jose.jpg';
import laura from '@lovable/assets/avatars/laura.jpg';
import luis from '@lovable/assets/avatars/luis.jpg';
import maria from '@lovable/assets/avatars/maria.jpg';
import miguel from '@lovable/assets/avatars/miguel.jpg';
import pedro from '@lovable/assets/avatars/pedro.jpg';

export interface PlatformUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  phone?: string;
  countryCode?: string;
  initials: string;
}

export const platformUsers: PlatformUser[] = [
  { id: 'u-luis-1', name: 'Luis Motta', username: '@Luis Motta', email: 'lucamo823@gmail.com', avatar: luis, phone: '3163975391', countryCode: '+57', initials: 'LM' },
  { id: 'u-luis-2', name: 'Luis Motta', username: '@Luis Motta', email: 'desarrollo.app.do.event@gmail.com', phone: '3001234567', countryCode: '+57', initials: 'LM' },
  { id: 'u-ana', name: 'Ana Ruiz', username: '@anaruiz', email: 'ana.ruiz@doevents.com', avatar: ana, phone: '3104567890', countryCode: '+57', initials: 'AR' },
  { id: 'u-carlos', name: 'Carlos Pérez', username: '@carlosp', email: 'carlos.perez@doevents.com', avatar: carlos, phone: '3209876543', countryCode: '+57', initials: 'CP' },
  { id: 'u-fer', name: 'Fernando Silva', username: '@fersilva', email: 'fernando.silva@doevents.com', avatar: fernando, phone: '3015551234', countryCode: '+57', initials: 'FS' },
  { id: 'u-isa', name: 'Isabel Gómez', username: '@isagomez', email: 'isabel.gomez@doevents.com', avatar: isabel, phone: '3127779988', countryCode: '+57', initials: 'IG' },
  { id: 'u-jose', name: 'José Hernández', username: '@joseh', email: 'jose.hernandez@doevents.com', avatar: jose, phone: '3143332211', countryCode: '+57', initials: 'JH' },
  { id: 'u-laura', name: 'Laura Castro', username: '@lauracastro', email: 'laura.castro@doevents.com', avatar: laura, phone: '3186667788', countryCode: '+57', initials: 'LC' },
  { id: 'u-maria', name: 'María Restrepo', username: '@mariar', email: 'maria.restrepo@doevents.com', avatar: maria, phone: '3221114455', countryCode: '+57', initials: 'MR' },
  { id: 'u-miguel', name: 'Miguel Ángel Torres', username: '@migueltorres', email: 'miguel.torres@doevents.com', avatar: miguel, phone: '3008889900', countryCode: '+57', initials: 'MT' },
  { id: 'u-pedro', name: 'Pedro Velásquez', username: '@pedrov', email: 'pedro.velasquez@doevents.com', avatar: pedro, phone: '3174442266', countryCode: '+57', initials: 'PV' },
];

export const searchPlatformUsers = (query: string): PlatformUser[] => {
  const q = query.trim().toLowerCase().replace(/^@lovable/, '');
  if (!q) return [];
  return platformUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  );
};
