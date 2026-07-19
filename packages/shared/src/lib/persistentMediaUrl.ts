const SIGNED_S3_QUERY_KEYS = ['X-Amz-Signature', 'X-Amz-Algorithm', 'X-Amz-Credential', 'X-Amz-Date'];

export function isSignedS3Url(url?: string | null): boolean {
  const raw = String(url || '').trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return SIGNED_S3_QUERY_KEYS.some((key) => parsed.searchParams.has(key));
  } catch {
    return /X-Amz-Signature=/i.test(raw);
  }
}

export function isExternalProfileUrl(url?: string | null): boolean {
  const raw = String(url || '').trim();
  if (!raw) return false;
  return /googleusercontent\.com|fbcdn\.net|graph\.facebook|appleid\.apple\.com|gravatar\.com/i.test(raw);
}

export function isEphemeralMediaUrl(url?: string | null): boolean {
  const raw = String(url || '').trim();
  if (!raw) return true;
  if (raw.startsWith('blob:')) return true;
  if (isSignedS3Url(raw)) return true;
  if (/^\/assets\//i.test(raw)) return true;
  if (/qa\.doeventsapp\.com\/assets\//i.test(raw)) return true;
  if (/doeventsapp\.com\/assets\//i.test(raw)) return true;
  return false;
}

function bucketPublicUrl(bucket: string, region: string, key: string): string {
  const regionSegment = region === 'us-east-1' ? 's3' : `s3.${region}`;
  return `https://${bucket}.${regionSegment}.amazonaws.com/${key.replace(/^\/+/, '')}`;
}

function inferRegionFromS3Host(hostname: string): string {
  const regional = hostname.match(/\.s3\.([a-z0-9-]+)\.amazonaws\.com$/i);
  if (regional?.[1]) return regional[1];
  return 'us-east-1';
}

function inferBucketFromS3Host(hostname: string): string | null {
  if (!hostname.includes('amazonaws.com')) return null;
  if (hostname === 's3.amazonaws.com') return null;
  return hostname.replace(/\.s3(\.[a-z0-9-]+)?\.amazonaws\.com$/i, '') || null;
}

/** Convierte URLs firmadas o con query en URL pública estable (sin credenciales temporales). */
export function toPersistentMediaUrl(url?: string | null): string | undefined {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('blob:')) return undefined;
  if (raw.startsWith('data:')) return raw;
  if (/^\/assets\//i.test(raw)) return undefined;
  if (/qa\.doeventsapp\.com\/assets\//i.test(raw)) return undefined;
  if (/doeventsapp\.com\/assets\//i.test(raw)) return undefined;

  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
    try {
      const parsed = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
      const path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      if (!path) return undefined;

      const bucket = inferBucketFromS3Host(parsed.hostname);
      if (bucket) {
        const region = inferRegionFromS3Host(parsed.hostname);
        return bucketPublicUrl(bucket, region, path);
      }

      if (!isSignedS3Url(raw)) {
        return `${parsed.origin}${parsed.pathname}`;
      }
      return undefined;
    } catch {
      const withoutQuery = raw.split('?')[0];
      return withoutQuery || undefined;
    }
  }

  if (/^[A-Za-z0-9][A-Za-z0-9_\-./]{2,}$/.test(raw) && raw.includes('/')) {
    return raw;
  }

  return undefined;
}

export function pickPersistentGalleryUrl(item: {
  signedUrl?: string;
  publicUrl?: string;
  url?: string;
  key?: string;
}): string {
  const candidates = [item.publicUrl, item.url, item.key, item.signedUrl];
  for (const candidate of candidates) {
    const persistent = toPersistentMediaUrl(candidate);
    if (persistent) return persistent;
  }
  return '';
}

/** Prefiere URL firmada de S3; si no, resuelve keys/URLs públicas estables. */
export function resolveUserMediaDisplayUrl(
  signed?: string | null,
  ...candidates: (string | null | undefined)[]
): string | undefined {
  const signedRaw = String(signed || '').trim();
  if (signedRaw) {
    if (isSignedS3Url(signedRaw)) return signedRaw;
    if (isExternalProfileUrl(signedRaw)) return signedRaw;
  }

  for (const candidate of candidates) {
    const raw = String(candidate || '').trim();
    if (!raw) continue;
    if (isExternalProfileUrl(raw)) return raw;
    if (isSignedS3Url(raw)) return raw;
  }

  for (const candidate of candidates) {
    const raw = String(candidate || '').trim();
    if (!raw) continue;
    if (isEphemeralMediaUrl(raw)) continue;
    const persistent = toPersistentMediaUrl(raw);
    if (persistent) return persistent;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  }
  return undefined;
}
