import { getAuthToken, getCurrentEnv } from './client';

export interface CreateWompiPaymentLinkInput {
  eventId: string;
  reference: string;
  customerEmail: string;
  currency?: string;
  amount?: number;
  hasSeating?: boolean;
  eventName?: string;
  tickets: Array<Record<string, unknown>>;
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
  const response = await fetch(`${wompiBase()}/create-payment-link`, {
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

  const body = await response.json() as CreateWompiPaymentLinkResponse & {
    details?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.message || body.details || body.error || 'No se pudo crear el enlace de pago WOMPI');
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
