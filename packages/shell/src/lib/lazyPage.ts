import { lazy, type ComponentType } from 'react';

const RETRY_DELAY_MS = 400;
const MAX_RETRIES = 3;

const CHUNK_LOAD_ERROR =
  /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed|error loading dynamically imported module/i;

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_LOAD_ERROR.test(error.message);
}

async function importWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = MAX_RETRIES,
): Promise<{ default: T }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;
      if (!isChunkLoadError(error) || attempt >= retries) break;
      await new Promise((resolve) => {
        window.setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1));
      });
    }
  }
  throw lastError;
}

export function lazyPage<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() => importWithRetry(factory));
}

export function lazyNamedPage<T extends ComponentType<unknown>>(
  factory: () => Promise<Record<string, T>>,
  exportName: keyof Record<string, T> & string,
) {
  return lazy(() => importWithRetry(async () => {
    const module = await factory();
    const component = module[exportName];
    if (!component) {
      throw new Error(`Lazy export "${exportName}" not found`);
    }
    return { default: component };
  }));
}
