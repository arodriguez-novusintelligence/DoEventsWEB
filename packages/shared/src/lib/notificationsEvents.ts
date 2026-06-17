export const NOTIFICATIONS_UPDATED_EVENT = 'de-notifications-updated';

export function emitNotificationsUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}
