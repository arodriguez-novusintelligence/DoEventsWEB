import { getAuthToken, getCurrentEnv } from './client';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';
import type {
  PromoCodeBatch,
  PromoCodeCancellationRecord,
  PromoCodeRedemptionRecord,
  PromoCodeShareRecord,
} from './promoCodesService';

export interface ServicePromoCodesPayload {
  success?: boolean;
  serviceId: string;
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

function promoBase(serviceId: string): string {
  return `${getCurrentEnv().apiBaseUrl}/services/${encodeURIComponent(serviceId)}/promo-codes`;
}

export async function fetchServicePromoCodes(serviceId: string): Promise<ServicePromoCodesPayload> {
  let response: Response;
  try {
    response = await fetch(promoBase(serviceId), { headers: authHeaders() });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'los códigos promocionales del servicio'));
  }
  const data = await parseFetchResponse<ServicePromoCodesPayload>(
    response,
    'No se pudieron cargar los códigos promocionales del servicio',
  );
  return {
    serviceId: data.serviceId || serviceId,
    batches: data.batches || [],
    shares: data.shares || [],
    cancellations: data.cancellations || [],
    sharesByCode: data.sharesByCode || {},
    cancellationByCode: data.cancellationByCode || {},
    redemptions: data.redemptions || {},
  };
}

export interface CreateServicePromoBatchInput {
  description: string;
  value: number;
  quantity: number;
  currency: string;
}

export async function createServicePromoCodeBatch(
  serviceId: string,
  input: CreateServicePromoBatchInput,
): Promise<PromoCodeBatch> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(serviceId)}/batches`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la creación del lote de códigos del servicio'));
  }
  const data = await parseFetchResponse<{ batch?: PromoCodeBatch }>(
    response,
    'No se pudo crear el lote de códigos del servicio',
  );
  if (!data.batch) throw new Error('Respuesta inválida al crear códigos promocionales');
  return data.batch;
}

export async function syncServicePromoCodes(
  serviceId: string,
  batches: PromoCodeBatch[],
): Promise<void> {
  if (!batches.length) return;
  let response: Response;
  try {
    response = await fetch(`${promoBase(serviceId)}/sync`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ batches }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la sincronización de códigos promocionales del servicio'));
  }
  await parseFetchResponse(response, 'No se pudieron sincronizar los códigos promocionales del servicio');
}

export async function shareServicePromoCode(
  serviceId: string,
  input: import('./promoCodesService').SharePromoCodeInput,
): Promise<PromoCodeShareRecord> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(serviceId)}/share`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el envío del código promocional del servicio'));
  }
  const data = await parseFetchResponse<{ share?: PromoCodeShareRecord }>(
    response,
    'No se pudo compartir el código promocional del servicio',
  );
  if (!data.share) throw new Error('Respuesta inválida al compartir el código');
  return data.share;
}

export async function cancelServicePromoCode(
  serviceId: string,
  promoCode: string,
  reason?: string | null,
): Promise<PromoCodeCancellationRecord> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(serviceId)}/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ promo_code: promoCode, reason: reason || null }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la cancelación del código promocional del servicio'));
  }
  const data = await parseFetchResponse<{ cancellation?: PromoCodeCancellationRecord }>(
    response,
    'No se pudo cancelar el código promocional del servicio',
  );
  if (!data.cancellation) throw new Error('Respuesta inválida al cancelar el código');
  return {
    id: data.cancellation.id || promoCode,
    promo_code: data.cancellation.promo_code || promoCode,
    reason: data.cancellation.reason ?? null,
    created_at: data.cancellation.created_at || new Date().toISOString(),
  };
}

export async function validateServicePromoCode(
  serviceId: string,
  code: string,
): Promise<{ ok: boolean; reason?: string; value?: number; currency?: string }> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(serviceId)}/validate`, {
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
