type LeafletGlobal = typeof window & {
  L?: {
    map: (el: HTMLElement, opts?: object) => {
      setView: (c: [number, number], z: number) => void;
      on: (e: string, cb: (ev: { latlng: { lat: number; lng: number } }) => void) => void;
    };
    tileLayer: (url: string, opts: object) => { addTo: (map: unknown) => void };
    marker: (
      coords: [number, number],
      opts?: object,
    ) => {
      addTo: (map: unknown) => void;
      on: (e: string, cb: () => void) => void;
      getLatLng: () => { lat: number; lng: number };
      setLatLng: (c: [number, number]) => void;
    };
  };
};

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_INTEGRITY = {
  css: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
  js: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
};

let leafletPromise: Promise<NonNullable<LeafletGlobal['L']>> | null = null;

function appendStylesheet(href: string, integrity: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.integrity = integrity;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function appendScript(src: string, integrity: string): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
  if (existing) {
    return existing.dataset.loaded === 'true'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true });
        });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.head.appendChild(script);
  });
}

/** Carga Leaflet solo cuando hace falta (p. ej. wizard de ubicación). */
export async function loadLeaflet(): Promise<NonNullable<LeafletGlobal['L']>> {
  const win = window as LeafletGlobal;
  if (win.L) return win.L;
  if (!leafletPromise) {
    leafletPromise = (async () => {
      appendStylesheet(LEAFLET_CSS, LEAFLET_INTEGRITY.css);
      await appendScript(LEAFLET_JS, LEAFLET_INTEGRITY.js);
      if (!win.L) throw new Error('Leaflet unavailable');
      return win.L;
    })();
  }
  return leafletPromise;
}
