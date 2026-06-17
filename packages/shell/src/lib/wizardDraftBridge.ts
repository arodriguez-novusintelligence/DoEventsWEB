import {
  emitNotificationsUpdated,
  triggerNotification,
} from '@doevents/shared';

export type WizardDraftKind = 'event' | 'venue' | 'service';

const DRAFT_NOTIFY_COOLDOWN_MS = 30 * 60 * 1000;

function draftNotifyKey(userId: string, kind: WizardDraftKind, entityId: string): string {
  return `doevents.draft-notify.${userId}.${kind}.${entityId}`;
}

export function editRouteForDraft(kind: WizardDraftKind, entityId: string): string {
  if (kind === 'event') return `/events/${entityId}/edit`;
  if (kind === 'venue') return `/places/${entityId}/edit`;
  return `/services/${entityId}/edit`;
}

export async function notifyWizardDraftReminder(options: {
  userId: string;
  kind: WizardDraftKind;
  entityId: string;
  title: string;
  skipIfRecent?: boolean;
}): Promise<void> {
  const { userId, kind, entityId, title, skipIfRecent = true } = options;
  if (!userId || !entityId) return;

  const storageKey = draftNotifyKey(userId, kind, entityId);
  if (skipIfRecent) {
    try {
      const last = Number(localStorage.getItem(storageKey) || '0');
      if (last && Date.now() - last < DRAFT_NOTIFY_COOLDOWN_MS) return;
    } catch { /* ignore */ }
  }

  const route = editRouteForDraft(kind, entityId);
  const kindLabel = kind === 'event' ? 'evento' : kind === 'venue' ? 'lugar' : 'servicio';

  try {
    await triggerNotification({
      triggerId: 'wizard_draft_reminder',
      userId,
      channels: ['inApp'],
      metadata: {
        type: 'wizard_draft_reminder',
        entityType: kind,
        entityId,
        eventId: kind === 'event' ? entityId : undefined,
        venueId: kind === 'venue' ? entityId : undefined,
        serviceId: kind === 'service' ? entityId : undefined,
        route,
        title: `Borrador de ${kindLabel}`,
        body: `Tienes un borrador sin publicar: «${title}». Toca para continuar editando.`,
        message: `Tienes un borrador de ${kindLabel} «${title}» pendiente. Continúa donde lo dejaste.`,
        eventName: title,
      },
    });
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch { /* ignore */ }
    emitNotificationsUpdated();
  } catch {
    // no bloquear flujo de guardado
  }
}

export function localDraftKey(userId: string, kind: WizardDraftKind): string {
  return `doevents.wizard-draft.${kind}.${userId}`;
}

export function saveLocalWizardDraft<T>(userId: string, kind: WizardDraftKind, data: T): void {
  try {
    localStorage.setItem(localDraftKey(userId, kind), JSON.stringify({
      savedAt: new Date().toISOString(),
      data,
    }));
  } catch { /* ignore quota */ }
}

export function loadLocalWizardDraft<T>(userId: string, kind: WizardDraftKind): T | null {
  try {
    const raw = localStorage.getItem(localDraftKey(userId, kind));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: T };
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function clearLocalWizardDraft(userId: string, kind: WizardDraftKind): void {
  try {
    localStorage.removeItem(localDraftKey(userId, kind));
  } catch { /* ignore */ }
}
