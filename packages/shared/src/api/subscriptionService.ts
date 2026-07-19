import { getAuthToken, getCurrentEnv } from './client';
import type { PlanUsageSnapshot, PlatformRole } from '../lib/planLimits';

export interface SubscriptionStatus {
  plan: 'free' | 'pro';
  platformRole: PlatformRole;
  usage: PlanUsageSnapshot;
  proExpiresAt?: string | null;
  proStartedAt?: string | null;
}

function subscriptionsBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.subscriptionsBase || `${env.apiBaseUrl}/subscriptions`;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function fetchSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const response = await fetch(
    `${subscriptionsBase()}/status/${encodeURIComponent(userId)}`,
    { headers: authHeaders() },
  );
  const body = await response.json() as SubscriptionStatus & { message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo cargar el estado de suscripción');
  }
  return body;
}

export async function createProSubscriptionPayment(userId: string): Promise<{
  urlPaymentLink?: string;
  reference?: string;
  freeCheckout?: boolean;
}> {
  const response = await fetch(`${subscriptionsBase()}/pro/checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  const body = await response.json() as {
    urlPaymentLink?: string;
    reference?: string;
    freeCheckout?: boolean;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo iniciar el pago del plan PRO');
  }
  return body;
}

export async function cancelProSubscription(userId: string): Promise<void> {
  const response = await fetch(`${subscriptionsBase()}/pro/cancel`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId }),
  });
  const body = await response.json() as { message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo cancelar el plan PRO');
  }
}

export async function confirmProSubscription(
  reference: string,
  options?: { transactionId?: string; status?: string },
): Promise<{ ok: boolean; plan?: string }> {
  const response = await fetch(`${subscriptionsBase()}/pro/confirm`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      reference,
      transactionId: options?.transactionId,
      status: options?.status,
    }),
  });
  const body = await response.json() as { ok?: boolean; plan?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo confirmar el pago del plan PRO');
  }
  return { ok: Boolean(body.ok), plan: body.plan };
}

export async function checkPublishLimit(
  userId: string,
  resource: 'event' | 'service' | 'place',
): Promise<{ allowed: boolean; reason?: string | null }> {
  const response = await fetch(`${subscriptionsBase()}/check-limit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userId, resource }),
  });
  const body = await response.json() as { allowed?: boolean; reason?: string | null; message?: string };
  if (!response.ok && response.status !== 403) {
    throw new Error(body.message || 'No se pudo validar el límite del plan');
  }
  return { allowed: Boolean(body.allowed), reason: body.reason };
}
