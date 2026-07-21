/**
 * Test mínimo — síntesis de eventos cercanos desde catálogo (issue #10).
 *   node scripts/test-discover-nearby-filters.mjs
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildNearbyFromCatalog(catalog, lat, lng, radiusKm, existing = []) {
  const seen = new Set(existing.map((e) => e.id).filter(Boolean));
  const merged = [...existing];
  for (const event of catalog) {
    if (!event.id || seen.has(event.id)) continue;
    const elat = Number(event.latitude ?? event.ubicacion?.latitude);
    const elng = Number(event.longitude ?? event.ubicacion?.longitude);
    if (!Number.isFinite(elat) || !Number.isFinite(elng)) continue;
    const distance = haversineKm(lat, lng, elat, elng);
    if (distance > radiusKm) continue;
    merged.push({ ...event, distancia: distance });
    seen.add(event.id);
  }
  return merged.sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
}

const LAT = 4.2805;
const LNG = -74.774;
const catalog = [
  { id: 'a', nombre: 'Ricaurte', latitude: 4.2855, longitude: -74.772, estatus: 'activo' },
  { id: 'b', nombre: 'Lejos', latitude: 4.711, longitude: -74.0721, estatus: 'activo' },
  { id: 'c', nombre: 'Sin geo', estatus: 'activo' },
  { id: 'd', nombre: 'Stale distancia', latitude: 4.2855, longitude: -74.772, distancia: 99999, estatus: 'activo' },
];

const withStale = buildNearbyFromCatalog(catalog, LAT, LNG, 100, []);
const ricaurte = withStale.filter((e) => e.nombre === 'Ricaurte' || e.nombre === 'Stale distancia');

if (withStale.length < 2 || ricaurte.length < 2) {
  console.error('FAIL: catalog synthesis', { count: withStale.length, ricaurte: ricaurte.length });
  process.exit(1);
}

console.log('PASS: discover nearby catalog synthesis');
