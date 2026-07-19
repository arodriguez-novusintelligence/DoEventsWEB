import { getAuthToken, getCurrentEnv } from './client';
import { parseFetchResponse, toUserFacingError } from '../lib/apiError';
import type {
  PromoCodeBatch,
  PromoCodeCancellationRecord,
  PromoCodeRedemptionRecord,
  PromoCodeShareRecord,
} from './promoCodesService';

export interface VenuePromoCodesPayload {
  success?: boolean;
  venueId: string;
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

function promoBase(venueId: string): string {
  return `${getCurrentEnv().apiBaseUrl}/venues/venues/${encodeURIComponent(venueId)}/promo-codes`;
}

export async function fetchVenuePromoCodes(venueId: string): Promise<VenuePromoCodesPayload> {
  let response: Response;
  try {
    response = await fetch(promoBase(venueId), { headers: authHeaders() });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'los códigos promocionales del lugar'));
  }
  const data = await parseFetchResponse<VenuePromoCodesPayload>(
    response,
    'No se pudieron cargar los códigos promocionales del lugar',
  );
  return {
    venueId: data.venueId || venueId,
    batches: data.batches || [],
    shares: data.shares || [],
    cancellations: data.cancellations || [],
    sharesByCode: data.sharesByCode || {},
    cancellationByCode: data.cancellationByCode || {},
    redemptions: data.redemptions || {},
  };
}

export interface CreateVenuePromoBatchInput {
  description: string;
  value: number;
  quantity: number;
  currency: string;
}

export async function createVenuePromoCodeBatch(
  venueId: string,
  input: CreateVenuePromoBatchInput,
): Promise<PromoCodeBatch> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(venueId)}/batches`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la creación del lote de códigos del lugar'));
  }
  const data = await parseFetchResponse<{ batch?: PromoCodeBatch }>(
    response,
    'No se pudo crear el lote de códigos del lugar',
  );
  if (!data.batch) throw new Error('Respuesta inválida al crear códigos promocionales');
  return data.batch;
}

export async function syncVenuePromoCodes(
  venueId: string,
  batches: PromoCodeBatch[],
): Promise<void> {
  if (!batches.length) return;
  let response: Response;
  try {
    response = await fetch(`${promoBase(venueId)}/sync`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ batches }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la sincronización de códigos promocionales del lugar'));
  }
  await parseFetchResponse(response, 'No se pudieron sincronizar los códigos promocionales del lugar');
}

export async function validateVenuePromoCode(
  venueId: string,
  code: string,
): Promise<{ ok: boolean; reason?: string; value?: number; currency?: string }> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(venueId)}/validate`, {
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

export async function shareVenuePromoCode(
  venueId: string,
  input: import('./promoCodesService').SharePromoCodeInput,
): Promise<PromoCodeShareRecord> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(venueId)}/share`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el envío del código promocional del lugar'));
  }
  const data = await parseFetchResponse<{ share?: PromoCodeShareRecord }>(
    response,
    'No se pudo compartir el código promocional del lugar',
  );
  if (!data.share) throw new Error('Respuesta inválida al compartir el código');
  return data.share;
}

export async function cancelVenuePromoCode(
  venueId: string,
  promoCode: string,
  reason?: string | null,
): Promise<PromoCodeCancellationRecord> {
  let response: Response;
  try {
    response = await fetch(`${promoBase(venueId)}/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ promo_code: promoCode, reason: reason ?? null }),
    });
  } catch (err) {
    throw new Error(toUserFacingError(err, 'la cancelación del código promocional del lugar'));
  }
  const data = await parseFetchResponse<{ cancellation?: PromoCodeCancellationRecord }>(
    response,
    'No se pudo cancelar el código promocional del lugar',
  );
  if (!data.cancellation) throw new Error('Respuesta inválida al cancelar el código');
  return data.cancellation;
}
