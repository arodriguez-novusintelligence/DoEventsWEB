/**
 * Repara URLs de imagen firmadas (temporales) en Venues-qa y ServiceProviders-qa.
 * Uso: node infrastructure/aws/fix-qa-persistent-image-urls.js
 */
const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'us-east-2';
const VENUES_TABLE = process.env.VENUES_TABLE || 'Venues-qa';
const SERVICES_TABLE = process.env.SERVICES_TABLE || 'ServiceProviders-qa';
const DRY_RUN = process.env.DRY_RUN === '1';

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });

function isSigned(url) {
  return /X-Amz-Signature=/i.test(String(url || ''));
}

function toPersistent(url) {
  const raw = String(url || '').trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return raw;
  if (!isSigned(raw)) return raw.split('?')[0];
  try {
    const u = new URL(raw);
    const host = u.hostname;
    const path = u.pathname;
    const regional = host.match(/\.s3\.([a-z0-9-]+)\.amazonaws\.com$/i);
    const bucket = host.replace(/\.s3(\.[a-z0-9-]+)?\.amazonaws\.com$/i, '');
    const region = regional?.[1] || 'us-east-1';
    const segment = region === 'us-east-1' ? 's3' : `s3.${region}`;
    return `https://${bucket}.${segment}.amazonaws.com${path}`;
  } catch {
    return raw.split('?')[0];
  }
}

async function scanAll(tableName) {
  const items = [];
  let lastKey;
  do {
    const page = await ddb.scan({ TableName: tableName, ExclusiveStartKey: lastKey }).promise();
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function fixVenues() {
  const venues = await scanAll(VENUES_TABLE);
  let updated = 0;
  for (const venue of venues) {
    const id = venue.venue_id || venue.venueId;
    const images = String(venue.images || '');
    if (!images || !isSigned(images)) continue;
    const next = images
      .split(',')
      .map((part) => toPersistent(part.trim()))
      .filter(Boolean)
      .join(',');
    if (next === images) continue;
    updated += 1;
    console.log(`venue ${id}: ${images.slice(0, 80)}... -> ${next.slice(0, 80)}...`);
    if (!DRY_RUN) {
      await ddb.update({
        TableName: VENUES_TABLE,
        Key: { venue_id: id },
        UpdateExpression: 'SET images = :images',
        ExpressionAttributeValues: { ':images': next },
      }).promise();
    }
  }
  console.log(`Venues actualizados: ${updated}`);
}

async function fixServices() {
  const services = await scanAll(SERVICES_TABLE);
  let updated = 0;
  for (const service of services) {
    const { serviceId } = service;
    const profile = service.profileImageUrl;
    const gallery = Array.isArray(service.gallery) ? service.gallery : [];
    const nextProfile = profile ? toPersistent(profile) : profile;
    const nextGallery = gallery.map((url) => toPersistent(url)).filter(Boolean);
    const changed = (profile && nextProfile !== profile)
      || JSON.stringify(nextGallery) !== JSON.stringify(gallery);
    if (!changed) continue;
    updated += 1;
    console.log(`service ${serviceId}`);
    if (!DRY_RUN) {
      await ddb.update({
        TableName: SERVICES_TABLE,
        Key: { serviceId },
        UpdateExpression: 'SET profileImageUrl = :p, gallery = :g',
        ExpressionAttributeValues: {
          ':p': nextProfile || profile,
          ':g': nextGallery.length ? nextGallery : gallery,
        },
      }).promise();
    }
  }
  console.log(`Servicios actualizados: ${updated}`);
}

(async () => {
  console.log(`Region=${REGION} DRY_RUN=${DRY_RUN}`);
  await fixVenues();
  await fixServices();
  console.log('Listo.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
