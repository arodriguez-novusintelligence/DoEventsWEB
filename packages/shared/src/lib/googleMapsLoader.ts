import { getEnvironment } from '../../../../config/environments/index';

/** Resuelve la API key de Google Maps (DEV/QA/prod). */
export function getGoogleMapsApiKey(): string {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const fromVite = env?.VITE_GOOGLE_MAPS_API_KEY
      || env?.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    if (fromVite) return fromVite;
  }
  return getEnvironment().googleMapsApiKey || '';
}

export function getGoogleMapsChannel(): string | undefined {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    const channel = env?.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    return channel || undefined;
  }
  return undefined;
}

let loadPromise: Promise<typeof google> | null = null;

/** Carga el script de Google Maps una sola vez. */
export function loadGoogleMapsScript(callbackName = '__initGoogleMaps'): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No window'));
  }
  if ((window as Window & { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as Window & { google: typeof google }).google);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const key = getGoogleMapsApiKey();
    if (!key) {
      reject(new Error('Missing Google Maps API key (VITE_GOOGLE_MAPS_API_KEY)'));
      return;
    }
    const channel = getGoogleMapsChannel();
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      resolve((window as Window & { google: typeof google }).google);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=${callbackName}${channel ? `&channel=${encodeURIComponent(channel)}` : ''}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
