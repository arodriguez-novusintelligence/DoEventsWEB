/**
 * Smoke API Descubre (lugares + servicios). Exit 0 solo si ambos tienen datos cerca de Ricaurte.
 *   node scripts/smoke-discover-marketplace.mjs
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

async function getJson(path, headers = {}) {
  const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json', ...headers } });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

const tokenRes = await postJson('/auth/generateToken', {});
const token = tokenRes.json?.token || tokenRes.json?.accessToken || '';
if (!token) {
  console.error('FAIL: no service token');
  process.exit(1);
}
const auth = { Authorization: token };
const venuesRes = await getJson(
  `/venues/venues?latitude=${LAT}&longitude=${LNG}&maxDistance=${RADIUS_KM}&limit=40&status=active`,
  auth,
);
const venues = venuesRes.json?.venues || [];
const servicesRes = await postJson(
  '/services/nearby',
  { latitude: LAT, longitude: LNG, maxDistanceKm: RADIUS_KM, limit: 40 },
  auth,
);
const services = servicesRes.json?.services || servicesRes.json?.items || [];
const report = {
  api: API,
  venuesCount: Array.isArray(venues) ? venues.length : -1,
  servicesCount: Array.isArray(services) ? services.length : -1,
  venueSample: (venues || []).slice(0, 3).map((v) => v.name),
  serviceSample: (services || []).slice(0, 3).map((s) => s.name),
};
console.log(JSON.stringify(report, null, 2));
if (!(venuesRes.ok && servicesRes.ok && venues.length > 0 && services.length > 0)) {
  console.error('FAIL: marketplace smoke');
  process.exit(1);
}
console.log('PASS: Descubre marketplace smoke');
