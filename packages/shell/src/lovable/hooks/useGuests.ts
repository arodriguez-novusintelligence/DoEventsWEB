/**
 * Hook de invitados — empalme Lovable sobre integración API real (`useApiGuests`).
 *
 * - Sin datos mock; grupos por defecto se crean vía backend cuando aplica.
 * - Usar en páginas bridge (`GuestsHubPage`, modales de invitados).
 * - `onSearchUser` en modales delega matching vía `searchUsers` de `@doevents/shared`.
 */
export {
  useApiGuests as useGuests,
  useApiGuests,
} from '../../lovable-bridge/useApiGuests';

export type { Guest, GuestGroup, CreateGuestRequest } from '@lovable/types/guest';
