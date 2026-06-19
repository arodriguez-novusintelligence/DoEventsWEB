/**
 * Hook de invitados — empalme Lovable sobre integración API real (`useApiGuests`).
 * Sin datos mock; grupos por defecto se crean vía backend cuando aplica.
 */
export {
  useApiGuests as useGuests,
  useApiGuests,
} from '../../lovable-bridge/useApiGuests';

export type { Guest, GuestGroup, CreateGuestRequest } from '@lovable/types/guest';
