/**
 * Smoke API Descubre — eventos cercanos (geo feed).
 *   node scripts/smoke-discover-nearby-events.mjs
 */
const API = (process.env.DISCOVER_SMOKE_API || 'https://api-dev.doeventsapp.com').replace(/\/$/, '');
const LAT = Number(process.env.DISCOVER_SMOKE_LAT || '4.2805');
const LNG = Number(process.env.DISCOVER_SMOKE_LNG || '-74.7740');
const RADIUS_KM = Number(process.env.DISCOVER_SMOKE_RADIUS_KM || '100');

async function postJson(path, body, headers = {}) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

const tokenRes = await postJson('/auth/generateToken', {});
const token = tokenRes.json?.token || tokenRes.json?.accessToken || '';
if (!token) {
  console.error('FAIL: no service token');
  process.exit(1);
}

const dd = String(new Date().getDate()).padStart(2, '0');
const mm = String(new Date().getMonth() + 1).padStart(2, '0');
const yyyy = new Date().getFullYear();
const fechaActual = `${dd}/${mm}/${yyyy}`;

const nearbyRes = await postJson(
  '/events-feed/eventsFeed',
  {
    userID: '',
    offset: 0,
    limit: 80,
    fechaActual,
    maxDistanceKm: RADIUS_KM,
    userLocation: { latitude: LAT, longitude: LNG },
  },
  { Authorization: token },
);

const items = nearbyRes.json?.items || nearbyRes.json?.events || [];
const report = {
  api: API,
  nearbyCount: Array.isArray(items) ? items.length : -1,
  sample: (items || []).slice(0, 3).map((e) => ({
    name: e.nombre || e.name,
    distancia: e.distancia,
    lat: e.latitude ?? e.ubicacion?.latitude,
  })),
};

console.log(JSON.stringify(report, null, 2));
if (!(nearbyRes.ok && items.length > 0)) {
  console.error('FAIL: nearby events smoke');
  process.exit(1);
}
console.log('PASS: Descubre nearby events smoke');
