import { getAuthToken, manageEventsNestedApiUrl } from './client';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';

export interface PromoCodeBatch {
  id: string;
  currency: string;
  value: number;
  quantity: number;
  description: string;
  codes: string[];
  createdAt?: string;
  persisted?: boolean;
  editable?: boolean;
  editableCount?: number;
  redeemedCount?: number;
  cancelledCount?: number;
  codeStatuses?: Record<string, string>;
}

export interface PromoCodeShareRecord {
  id: string;
  promo_code: string;
  recipient_id: string;
  recipient_name: string;
  recipient_username: string;
  recipient_email: string | null;
  recipient_phone?: string | null;
  channels: string[];
  message: string | null;
  organizer_name: string | null;
  created_at: string;
}

export interface PromoCodeCancellationRecord {
  id: string;
  promo_code: string;
  reason: string | null;
  created_at: string;
}

export interface PromoCodeRedemptionRecord {
  code: string;
  orderId: string;
  redeemedAt: string;
  user: {
    id: string;
    name: string;
    initials: string;
    username: string;
    avatar?: string;
  };
  ticketType: string;
  ticketQty: number;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
}

export interface EventPromoCodesPayload {
  success?: boolean;
  eventId: string;
  batches: PromoCodeBatch[];
  shares: PromoCodeShareRecord[];
  cancellations: PromoCodeCancellationRecord[];
  sharesByCode: Record<string, PromoCodeShareRecord[]>;
  cancellationByCode: Record<string, PromoCodeCancellationRecord>;
  redemptions: Record<string, PromoCodeRedemptionRecord>;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function promoBase(eventId: string): string {
  return manageEventsNestedApiUrl(`/${encodeURIComponent(eventId)}/promo-codes`);
}

export async function fetchEventPromoCodes(eventId: string): Promise<EventPromoCodesPayload> {
  let response: Response;
  try {
    response = await fetch(promoBase(eventId), { headers: authHeaders() });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'los códigos promocionales'));
  }
  const data = await parseFetchResponse<EventPromoCodesPayload>(response, 'No se pudieron cargar los códigos promocionales');
  return {
    eventId: data.eventId || eventId,
    batches: data.batches || [],
    shares: data.shares || [],
    cancellations: data.cancellations || [],
    sharesByCode: data.sharesByCode || {},
    cancellationByCode: data.cancellationByCode || {},
    redemptions: data.redemptions || {},
  };
}

export interface CreatePromoBatchInput {
  description: string;
  value: number;
  quantity: number;
  currency: string;
}

export async function createEventPromoCodeBatch(
  eventId: string,
  input: CreatePromoBatchInput,
): Promise<PromoCodeBatch> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(eventId)}/batches`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la creación del lote de códigos'));
  }
  const data = await parseFetchResponse<{ batch?: PromoCodeBatch }>(response, 'No se pudo crear el lote de códigos');
  if (!data.batch) throw new Error('Respuesta inválida al crear códigos promocionales');
  return data.batch;
}

export interface UpdatePromoBatchInput {
  description?: string;
  value: number;
  currency: string;
}

export async function updateEventPromoCodeBatch(
  eventId: string,
  batchId: string,
  input: UpdatePromoBatchInput,
): Promise<PromoCodeBatch> {
  let response: Response;
  try {
    response = await fetch(
      `${promoBase(eventId)}/batches/${encodeURIComponent(batchId)}`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(input),
      },
    );
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la actualización del lote de códigos'));
  }
  const data = await parseFetchResponse<{ batch?: PromoCodeBatch }>(
    response,
    'No se pudo actualizar el lote de códigos',
  );
  if (!data.batch) throw new Error('Respuesta inválida al actualizar códigos promocionales');
  return data.batch;
}

export async function syncEventPromoCodes(
  eventId: string,
  batches: PromoCodeBatch[],
): Promise<{ created: number; updated: number }> {
  if (!batches.length) return { created: 0, updated: 0 };
  let response: Response;
  try {
    response = await fetch(`${promoBase(eventId)}/sync`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ batches }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la sincronización de códigos promocionales'));
  }
  const data = await parseFetchResponse<{ created?: number; updated?: number }>(
    response,
    'No se pudieron sincronizar los códigos promocionales',
  );
  return {
    created: Number(data.created || 0),
    updated: Number(data.updated || 0),
  };
}

export interface SharePromoCodeInput {
  promo_code: string;
  recipient_id: string;
  recipient_name: string;
  recipient_username: string;
  recipient_email?: string | null;
  recipient_phone?: string | null;
  channels: string[];
  message?: string | null;
  organizer_name?: string | null;
}

export async function shareEventPromoCode(
  eventId: string,
  input: SharePromoCodeInput,
): Promise<PromoCodeShareRecord & { warnings?: string[] }> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(eventId)}/share`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el envío del código promocional'));
  }
  const data = await parseFetchResponse<{ share?: PromoCodeShareRecord; warnings?: string[] }>(
    response,
    'No se pudo compartir el código promocional',
  );
  if (!data.share) throw new Error('Respuesta inválida al compartir el código');
  return { ...data.share, warnings: data.warnings || [] };
}

export async function cancelEventPromoCode(
  eventId: string,
  promoCode: string,
  reason?: string | null,
): Promise<PromoCodeCancellationRecord> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(eventId)}/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ promo_code: promoCode, reason: reason || null }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la cancelación del código promocional'));
  }
  const data = await parseFetchResponse<{ cancellation?: PromoCodeCancellationRecord }>(
    response,
    'No se pudo cancelar el código promocional',
  );
  if (!data.cancellation) throw new Error('Respuesta inválida al cancelar el código');
  return {
    id: data.cancellation.id || promoCode,
    promo_code: data.cancellation.promo_code || promoCode,
    reason: data.cancellation.reason ?? null,
    created_at: data.cancellation.created_at || new Date().toISOString(),
  };
}

export async function validateEventPromoCode(
  eventId: string,
  code: string,
): Promise<{ ok: boolean; reason?: string; value?: number; currency?: string }> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(eventId)}/validate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ promo_code: code }),
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }
  if (!response.ok) return { ok: false, reason: 'request_failed' };
  return response.json();
}

export async function redeemEventPromoCode(
  eventId: string,
  code: string,
  options?: {
    orderId?: string;
    discount?: number;
    ticketQty?: number;
    subtotal?: number;
    serviceFee?: number;
    total?: number;
  },
): Promise<{ ok: boolean; reason?: string }> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(eventId)}/redeem`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        promo_code: code,
        orderId: options?.orderId,
        discount: options?.discount,
        ticketQty: options?.ticketQty,
        subtotal: options?.subtotal,
        serviceFee: options?.serviceFee,
        total: options?.total,
      }),
    });
  } catch {
    return { ok: false, reason: 'network_error' };
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { reason?: string; error?: string };
    return { ok: false, reason: body.reason || body.error || 'request_failed' };
  }
  return response.json();
}
