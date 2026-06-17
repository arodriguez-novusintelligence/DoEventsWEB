import { getAuthToken, getCurrentEnv } from './client';

export interface AIEventDraft {
  type?: 'event' | 'service_publish' | 'venue_publish';
  title?: string;
  city?: string;
  locationLabel?: string;
  neighborhood?: string;
  dateHint?: string;
  timeHint?: string;
  capacity?: number;
  venueId?: string | null;
  serviceIds?: string[];
  isPrivate?: boolean;
  summary?: string;
  venue?: { id?: string; name?: string; capacity?: number };
  services?: Array<{ id?: string; name?: string; minPrice?: number }>;
  /** Borrador de servicio */
  sector?: string;
  role?: string;
  categories?: string[];
  keywords?: string[];
  price?: number;
  priceLabel?: string;
  availability?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  refundPolicy?: string;
  status?: 'collecting' | 'awaiting_confirmation' | 'awaiting_image' | 'awaiting_refund' | 'created' | 'cancelled' | 'ready' | string;
  /** Borrador de lugar */
  venueType?: string;
  serviceId?: string;
}

export interface AIChatAction {
  type: string;
  id?: string;
  path?: string;
  label?: string;
  draft?: AIEventDraft;
}

export interface AIChatAttachment {
  type: 'image';
  galleryImageId?: string;
  key?: string;
  url?: string;
  previewUrl?: string;
  fileName?: string;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  draft?: AIEventDraft | null;
  attachments?: AIChatAttachment[];
  actions?: AIChatAction[];
  expectsMedia?: 'service_image' | 'event_image' | 'venue_image' | null;
  results?: {
    events?: unknown[];
    services?: unknown[];
    venues?: unknown[];
    createdService?: {
      id?: string;
      serviceId?: string;
      name?: string;
      city?: string;
      minPrice?: number | null;
      profileImageUrl?: string;
      imageUrl?: string;
    };
    createdEvent?: { id?: string; eventId?: string; name?: string; city?: string; path?: string; imageUrl?: string };
    createdVenue?: { id?: string; venueId?: string; name?: string; city?: string; path?: string; imageUrl?: string };
    updatedService?: { serviceId?: string; name?: string; city?: string; minPrice?: number | null };
    updatedVenue?: { venueId?: string; name?: string; city?: string; capacity?: number; basePrice?: number };
    deletedService?: { serviceId?: string; name?: string };
    deletedEvent?: { eventId?: string; name?: string };
    deletedVenue?: { venueId?: string; name?: string };
  } | null;
}

export interface AIChatResponse {
  sessionId: string;
  reply: string;
  draft?: AIEventDraft | null;
  results?: AIChatResponse['draft'] extends infer _ ? {
    events?: unknown[];
    services?: unknown[];
    venues?: unknown[];
  } : never;
  intent?: string;
  entities?: Record<string, unknown>;
  agentsUsed?: string[];
  pendingQuestions?: string[];
  actions?: AIChatAction[];
  expectsMedia?: 'service_image' | 'event_image' | 'venue_image' | null;
  suggestions?: string[];
  meta?: { confidence?: number; cursorApi?: boolean; model?: string };
  error?: string;
}

function aiBase(): string {
  return getCurrentEnv().endpoints.aiAssistant;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function sendAIAssistantMessage(
  message: string,
  options: {
    userId?: string;
    sessionId?: string;
    attachments?: AIChatAttachment[];
  } = {},
): Promise<AIChatResponse> {
  const response = await fetch(`${aiBase()}/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      userId: options.userId,
      sessionId: options.sessionId,
      attachments: options.attachments,
    }),
  });
  const body = await response.json().catch(() => ({})) as AIChatResponse & { error?: string };
  if (!response.ok) throw new Error(body.error || 'No se pudo contactar al asistente IA');
  return body;
}

export async function resetAIAssistantSession(sessionId: string): Promise<void> {
  const response = await fetch(`${aiBase()}/sessions/${encodeURIComponent(sessionId)}/reset`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || 'No se pudo reiniciar la conversación');
  }
}

export async function fetchAIAssistantHealth(): Promise<{ cursorApi?: { ok?: boolean } }> {
  const response = await fetch(`${aiBase()}/health`, { headers: authHeaders() });
  if (!response.ok) return {};
  return response.json() as Promise<{ cursorApi?: { ok?: boolean } }>;
}

export interface AIAgentJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reply?: string;
  draft?: AIEventDraft | null;
  results?: AIChatResponse['results'];
  error?: string;
  sessionId?: string;
}

export async function startAIAgentJob(
  message: string,
  options: { userId?: string; sessionId?: string } = {},
): Promise<{ jobId: string }> {
  const response = await fetch(`${aiBase()}/jobs/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      userId: options.userId,
      sessionId: options.sessionId,
      type: 'composite_plan',
    }),
  });
  const body = await response.json().catch(() => ({})) as { jobId?: string; error?: string };
  if (!response.ok || !body.jobId) throw new Error(body.error || 'No se pudo iniciar el plan en background');
  return { jobId: body.jobId };
}

export async function fetchAIAgentJob(jobId: string): Promise<AIAgentJob> {
  const response = await fetch(`${aiBase()}/jobs/${encodeURIComponent(jobId)}`, {
    headers: authHeaders(),
  });
  const body = await response.json().catch(() => ({})) as AIAgentJob & { error?: string };
  if (!response.ok) throw new Error(body.error || 'No se pudo consultar el trabajo IA');
  return body;
}

export async function pollAIAgentJob(
  jobId: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<AIAgentJob> {
  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 90000;
  const started = Date.now();
  for (;;) {
    const job = await fetchAIAgentJob(jobId);
    if (job.status === 'completed' || job.status === 'failed') return job;
    if (Date.now() - started > timeoutMs) {
      throw new Error('El plan en background tardó demasiado. Intenta de nuevo.');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
