export const NOTIFICATIONS_UPDATED_EVENT = 'de-notifications-updated';
export const SOCIAL_GRAPH_UPDATED_EVENT = 'de-social-graph-updated';

export function emitNotificationsUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}

export function emitSocialGraphUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SOCIAL_GRAPH_UPDATED_EVENT));
}
