export interface ApiErrorBody {
  message?: string;
  error?: string | { message?: string; code?: string };
  statusDesc?: string;
  statusMessage?: string;
  mensaje?: string;
  detalle?: string;
  code?: string;
}

export function extractApiMessage(body: ApiErrorBody | null | undefined, fallback: string): string {
  if (!body) return fallback;
  if (typeof body.error === 'object' && body.error?.message) return body.error.message;
  if (typeof body.error === 'string' && body.error.trim()) return body.error;
  if (body.message?.trim()) return body.message;
  if (body.statusDesc?.trim()) return body.statusDesc;
  if (body.statusMessage?.trim()) return body.statusMessage;
  if (body.mensaje?.trim()) return body.mensaje;
  if (body.detalle?.trim()) return body.detalle;
  return fallback;
}

export function toUserFacingError(err: unknown, context: string): string {
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (/failed to fetch|networkerror|network error|load failed|fetch failed/i.test(msg)) {
      return `No pudimos conectar con ${context}. Revisa tu internet e intenta de nuevo. Si el problema continúa, escribe a soporte@doeventsapp.com indicando la hora del error.`;
    }
    if (/cors|cross-origin/i.test(msg)) {
      return `No se pudo completar la operación por un problema de conexión con el servidor (${context}). Intenta de nuevo en unos segundos o contacta a soporte.`;
    }
    if (msg) return msg;
  }
  return `Ocurrió un error en ${context}. Intenta de nuevo o contacta a soporte@doeventsapp.com.`;
}

export async function parseFetchResponse<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  let body: ApiErrorBody = {};
  const raw = await response.text();
  if (raw) {
    try {
      body = JSON.parse(raw) as ApiErrorBody;
    } catch {
      if (!response.ok) {
        throw new Error(
          response.status === 502
            ? 'El servicio no está disponible temporalmente. Intenta en unos minutos.'
            : fallback,
        );
      }
    }
  }

  if (!response.ok) {
    throw new Error(extractApiMessage(body, fallback));
  }

  return (raw ? JSON.parse(raw) : {}) as T;
}
