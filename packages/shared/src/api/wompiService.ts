import { getAuthToken, getCurrentEnv } from './client';

export interface CreateWompiPaymentLinkInput {
  eventId?: string;
  reference: string;
  customerEmail: string;
  currency?: string;
  amount?: number;
  hasSeating?: boolean;
  eventName?: string;
  tickets?: Array<Record<string, unknown>>;
  categoriesAndSeats?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface CreateWompiPaymentLinkResponse {
  urlPaymentLink?: string | null;
  paymentRequired?: boolean;
  paymentStatus?: string;
  freeCheckout?: boolean;
  redirectUrl?: string | null;
  amount?: number;
  reference?: string;
  eventName?: string;
  message?: string;
}

function wompiBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.wompiBase || `${env.apiBaseUrl}/checkouts`;
}

const RENTAL_ORDER_HINT = ' Si la reserva expiró, vuelve a reservar y paga dentro de 15 minutos.';

function humanizePaymentBackendMessage(raw: string): string {
  const text = raw.trim();
  const upper = text.toUpperCase();

  if (upper.includes('ORDER NOT FOUND')) {
    return `No encontramos la orden de pago.${RENTAL_ORDER_HINT}`;
  }
  if (upper.includes('ORDER EXPIRED')) {
    return 'La reserva expiró. Vuelve a seleccionar fechas y crea una nueva reserva.';
  }
  if (upper.includes('ORDER ALREADY PAID')) {
    return 'Esta reserva ya fue pagada. Revisa Mis Compras.';
  }
  if (upper.includes('ORDER IS NOT A RENTAL ORDER')) {
    return 'La orden no corresponde a una reserva de lugar o servicio.';
  }
  if (upper.includes('INVALID ORDER TOTAL')) {
    return 'El total de la reserva no es válido. Intenta crear la reserva nuevamente.';
  }
  if (upper.includes('SERVER CONFIGURATION ERROR')) {
    return 'La pasarela de pago no está configurada en este entorno. Intenta más tarde o contacta soporte.';
  }
  if (upper.includes('ERROR VALIDATING RENTAL ORDER')) {
    return `No se pudo validar tu reserva antes del pago.${RENTAL_ORDER_HINT}`;
  }
  if (upper.includes('FAILED TO CREATE PAYMENT LINK')) {
    return 'Wompi no pudo generar el enlace de pago. Verifica tus datos e intenta de nuevo.';
  }
  if (upper.includes('MISSING REQUIRED FIELDS')) {
    return 'Faltan datos para iniciar el pago. Revisa tu correo e intenta de nuevo.';
  }
  if (upper.includes('TICKETS ARRAY IS REQUIRED')) {
    return 'No hay boletas seleccionadas para pagar.';
  }
  if (upper.includes('NO TICKETS FOUND FOR EVENT')) {
    return 'No hay boletas disponibles para este evento.';
  }

  return text;
}

function formatPaymentError(
  body: CreateWompiPaymentLinkResponse & { details?: unknown; error?: unknown; errorType?: string },
  statusCode?: number,
): string {
  const detailText = typeof body.details === 'string' ? body.details.trim() : '';
  if (detailText) {
    return humanizePaymentBackendMessage(detailText);
  }

  if (body.details && typeof body.details === 'object') {
    const err = body.details as { error?: { messages?: Record<string, string[]>; reason?: string }; message?: string };
    const messages = err.error?.messages;
    if (messages) {
      const parts = Object.entries(messages).flatMap(([field, msgs]) =>
        (msgs || []).map((msg) => `${field}: ${msg}`),
      );
      if (parts.length) return parts.join('; ');
    }
    if (err.error?.reason) return humanizePaymentBackendMessage(String(err.error.reason));
    if (err.message) return humanizePaymentBackendMessage(String(err.message));
    try {
      const serialized = JSON.stringify(body.details);
      if (serialized && serialized !== '{}') return humanizePaymentBackendMessage(serialized);
    } catch {
      /* fall through */
    }
  }

  const baseMessage = body.message || body.error?.toString();
  if (baseMessage) {
    return humanizePaymentBackendMessage(String(baseMessage));
  }

  if (statusCode === 502 || statusCode === 503) {
    return 'El servicio de pagos no está disponible temporalmente. Intenta en unos segundos.';
  }
  if (statusCode === 401 || statusCode === 403) {
    return 'Tu sesión expiró. Inicia sesión nuevamente para continuar con el pago.';
  }

  return 'No se pudo iniciar el pago con Wompi. Intenta de nuevo.';
}

/** Mensaje legible para errores de pago Wompi (API o red). */
export function resolveWompiPaymentError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'No se pudo procesar el pago. Intenta de nuevo.';
  }

  const message = error.message.trim();
  if (!message) return 'No se pudo procesar el pago. Intenta de nuevo.';

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return `No se pudo conectar con la pasarela de pago.${RENTAL_ORDER_HINT}`;
  }

  return humanizePaymentBackendMessage(message);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function createWompiPaymentLink(
  input: CreateWompiPaymentLinkInput,
): Promise<CreateWompiPaymentLinkResponse> {
  let response: Response;
  try {
    response = await fetch(`${wompiBase()}/create-payment-link`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        eventId: input.eventId,
        event_id: input.eventId,
        reference: input.reference,
        customerEmail: input.customerEmail,
        customer_email: input.customerEmail,
        currency: input.currency || 'COP',
        amount: input.amount,
        hasSeating: input.hasSeating,
        eventName: input.eventName,
        tickets: input.tickets,
        categoriesAndSeats: input.categoriesAndSeats,
        metadata: input.metadata,
      }),
    });
  } catch (err) {
    throw new Error(resolveWompiPaymentError(err));
  }

  let body: CreateWompiPaymentLinkResponse & { details?: string; error?: string; errorType?: string };
  try {
    body = await response.json() as CreateWompiPaymentLinkResponse & {
      details?: string;
      error?: string;
      errorType?: string;
    };
  } catch {
    throw new Error(
      response.ok
        ? 'Respuesta inválida del servidor de pagos'
        : resolveWompiPaymentError(new Error(`Error del servidor de pagos (${response.status})`)),
    );
  }

  if (!response.ok) {
    throw new Error(formatPaymentError(body, response.status));
  }

  return body;
}

export async function getWompiTransaction(transactionId: string): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${wompiBase()}/transaction-wompi/${encodeURIComponent(transactionId)}`,
    { headers: authHeaders() },
  );
  const body = await response.json() as Record<string, unknown> & { message?: string };
  if (!response.ok) {
    throw new Error(body.message || 'No se pudo consultar la transacción WOMPI');
  }
  return body;
}
