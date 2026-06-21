/**
 * Hook de invitados — empalme Lovable sobre integración API real (`useApiGuests`).
 *
 * - Sin datos mock; grupos por defecto se crean vía backend cuando aplica.
 * - Usar en páginas bridge (`GuestsHubPage`, modales de invitados).
 * - `onSearchUser` en modales delega matching vía `searchUsers` de `@doevents/shared`.
 * - Export dual `useGuests` / `useApiGuests` para paridad imports Lovable.
 *
 * Retorno típico: `guests`, `groups`, `loading`, `loadError`, `refresh`, `createGuest`,
 * `updateGuest`, `deleteGuest`, `moveToGroup`, `searchUsers`.
 */
import { useApiGuests } from '../../lovable-bridge/useApiGuests';

export {
  useApiGuests as useGuests,
  useApiGuests,
};

export type { Guest, GuestGroup, CreateGuestRequest } from '@lovable/types/guest';

export default useApiGuests;
