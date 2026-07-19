import { getCurrentEnv } from '../api/client';
import { isEphemeralMediaUrl, isExternalProfileUrl, isSignedS3Url, toPersistentMediaUrl } from './persistentMediaUrl';

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';

const DEVAWS_PROFILE_BUCKET = { bucket: 'doevents-profile-media-dev', region: 'sa-east-1' };
const DEVAWS_FEED_MEDIA_BUCKET = {
  bucket: 'aws-lambda-wall-social-media-dev-media-519010577666',
  region: 'us-east-1',
};

const PROFILE_BUCKETS: Record<string, { bucket: string; region: string }> = {
  qa: { bucket: 'doevents-profile-media-qa', region: 'us-east-2' },
  dev: DEVAWS_PROFILE_BUCKET,
  devaws: DEVAWS_PROFILE_BUCKET,
  prod: { bucket: 'doeventprofileimagesbucket', region: 'us-east-1' },
};

const CHAT_MEDIA_BUCKETS: Record<string, { bucket: string; region: string }> = {
  qa: { bucket: 'doeventschatroombucket', region: 'us-east-2' },
  dev: { bucket: 'doeventschatroombucket', region: 'us-east-1' },
  devaws: { bucket: 'doeventschatroombucket', region: 'us-east-1' },
  prod: { bucket: 'doeventschatroombucket', region: 'us-east-1' },
};

const EVENT_IMAGE_BUCKET = 'doeventimageeventbucket';
const EVENT_IMAGE_REGION = 'us-east-1';
const VENUE_IMAGE_BUCKET = 'doevent-venue-images';

const FEED_MEDIA_BUCKETS: Record<string, { bucket: string; region: string }> = {
  qa: { bucket: 'doevent-feed-media', region: 'us-east-2' },
  dev: DEVAWS_FEED_MEDIA_BUCKET,
  devaws: DEVAWS_FEED_MEDIA_BUCKET,
  prod: { bucket: 'doevent-feed-media', region: 'us-east-1' },
};

const QA_TO_DEVAWS_MEDIA_HOSTS: Record<string, { bucket: string; region: string }> = {
  'aws-lambda-wall-social-media-qa-media-519010577666': DEVAWS_FEED_MEDIA_BUCKET,
  'doevents-profile-media-qa': DEVAWS_PROFILE_BUCKET,
};

const FEED_MEDIA_KEY_PREFIXES = ['feed-media/', 'wall-media/', 'media/'];

const PROFILE_KEY_PREFIXES = [
  'profiles/',
  'fotosPerfil/',
  'covers/',
  'profile-images/',
  'profile/',
  'users/',
];

const CHAT_KEY_PREFIXES = [
  'chat/',
  'chat-media/',
  'media/',
  'rooms/',
];

const S3_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\-./]{2,}$/;
const IMAGE_EXT_PATTERN = /\.(jpe?g|png|gif|webp|bmp|mp4|mov|webm|m4v|avi)(\?.*)?$/i;

function bucketPublicUrl(bucket: string, region: string, key: string): string {
  const regionSegment = region === 'us-east-1' ? 's3' : `s3.${region}`;
  return `https://${bucket}.${regionSegment}.amazonaws.com/${key.replace(/^\/+/, '')}`;
}

function profilePublicUrl(key: string): string {
  const envName = getCurrentEnv().name;
  const cfg = PROFILE_BUCKETS[envName] || PROFILE_BUCKETS.qa;
  return bucketPublicUrl(cfg.bucket, cfg.region, key);
}

function eventPublicUrl(key: string): string {
  return bucketPublicUrl(EVENT_IMAGE_BUCKET, EVENT_IMAGE_REGION, key);
}

function feedMediaPublicUrl(key: string): string {
  const envName = getCurrentEnv().name;
  const cfg = FEED_MEDIA_BUCKETS[envName] || FEED_MEDIA_BUCKETS.qa;
  return bucketPublicUrl(cfg.bucket, cfg.region, key);
}

function looksLikeFeedMediaKey(raw: string): boolean {
  if (raw.includes('://') || raw.startsWith('data:')) return false;
  return FEED_MEDIA_KEY_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

function looksLikeVenueImageKey(raw: string): boolean {
  if (raw.includes('://') || raw.startsWith('data:')) return false;
  return raw.startsWith('venues/');
}

function venuePublicUrl(key: string): string {
  return bucketPublicUrl(VENUE_IMAGE_BUCKET, EVENT_IMAGE_REGION, key);
}

export function chatMediaPublicUrl(key: string): string {
  const envName = getCurrentEnv().name;
  const cfg = CHAT_MEDIA_BUCKETS[envName] || CHAT_MEDIA_BUCKETS.qa;
  return bucketPublicUrl(cfg.bucket, cfg.region, key);
}

function extractS3ObjectKey(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (PROFILE_KEY_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (!/amazonaws\.com$/i.test(url.hostname) && !url.hostname.includes('.s3.')) {
      return null;
    }
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    return key || null;
  } catch {
    return null;
  }
}

function rewriteProfileBucketUrl(url: string): string {
  const envName = getCurrentEnv().name;
  if (envName === 'prod') return url;

  const cfg = PROFILE_BUCKETS[envName] || PROFILE_BUCKETS.qa;
  const prodBucket = PROFILE_BUCKETS.prod.bucket;

  if (!url.includes(prodBucket) && !url.includes('doevents-profile-media-qa')) return url;

  const key = extractS3ObjectKey(url);
  if (!key) return url;

  return bucketPublicUrl(cfg.bucket, cfg.region, key);
}

function rewriteQaMediaHostForDev(url: string): string {
  const envName = getCurrentEnv().name;
  if (envName !== 'devaws' && envName !== 'dev') return url;

  const key = extractS3ObjectKey(url);
  if (!key) return url;

  for (const [qaHost, cfg] of Object.entries(QA_TO_DEVAWS_MEDIA_HOSTS)) {
    if (url.includes(qaHost)) {
      return bucketPublicUrl(cfg.bucket, cfg.region, key);
    }
  }
  return url;
}

function looksLikeBareS3Key(raw: string): boolean {
  if (raw.includes('://') || raw.startsWith('data:')) return false;
  if (!S3_KEY_PATTERN.test(raw)) return false;
  return raw.includes('/') || PROFILE_KEY_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

function looksLikeChatMediaKey(raw: string): boolean {
  if (raw.includes('://') || raw.startsWith('data:')) return false;
  return CHAT_KEY_PREFIXES.some((prefix) => raw.startsWith(prefix));
}

function looksLikeBareEventImageKey(raw: string): boolean {
  if (raw.includes('://') || raw.startsWith('data:')) return false;
  return IMAGE_EXT_PATTERN.test(raw);
}

export function isPlaceholderEventImage(url?: string | null): boolean {
  const raw = String(url || '').trim();
  if (!raw) return true;
  if (/images\.unsplash\.com/i.test(raw)) return true;
  if (/1574629810360-7efbbe195018/i.test(raw)) return true;
  return false;
}

export function resolveImageUrl(url?: string | null): string | undefined {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('data:')) return raw;
  if (isSignedS3Url(raw)) return raw;
  if (isExternalProfileUrl(raw)) return raw;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    const persistent = toPersistentMediaUrl(raw);
    if (persistent) {
      const rewritten = rewriteQaMediaHostForDev(persistent);
      if (rewritten.includes('doeventprofileimagesbucket') || rewritten.includes('doevents-profile-media')) {
        return rewriteProfileBucketUrl(rewritten);
      }
      if (rewritten.includes('doevent-venue-images')) {
        return rewritten;
      }
      return rewritten;
    }
    if (isEphemeralMediaUrl(raw)) return undefined;
    const rewritten = rewriteQaMediaHostForDev(raw);
    if (rewritten.includes('doeventprofileimagesbucket') || rewritten.includes('doevents-profile-media')) {
      return rewriteProfileBucketUrl(rewritten);
    }
    if (rewritten.includes('doevent-venue-images')) {
      return rewritten;
    }
    return rewritten;
  }

  if (looksLikeChatMediaKey(raw)) {
    return chatMediaPublicUrl(raw);
  }

  if (looksLikeFeedMediaKey(raw)) {
    return feedMediaPublicUrl(raw);
  }

  if (looksLikeVenueImageKey(raw)) {
    return venuePublicUrl(raw);
  }

  if (raw.includes('doevent-feed-media')) {
    return raw;
  }

  if (looksLikeBareS3Key(raw)) {
    return profilePublicUrl(raw);
  }

  if (looksLikeBareEventImageKey(raw)) {
    return eventPublicUrl(raw);
  }

  return raw;
}

export function resolveEventImageUrl(url?: string | null): string {
  return resolveImageUrl(url) || DEFAULT_EVENT_IMAGE;
}

export function resolveEventVideoUrl(url?: string | null): string | undefined {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  if (/^(www\.)?youtube\.com|youtu\.be/i.test(raw)) {
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }
  return resolveImageUrl(raw);
}

export function appendImageCacheBuster(
  url?: string | null,
  version?: string | number | null,
): string | undefined {
  const raw = String(url || '').trim();
  if (!raw) return undefined;
  if (isSignedS3Url(raw)) return raw;
  const resolved = resolveImageUrl(raw);
  if (!resolved) return undefined;
  if (version == null || version === '') return resolved;
  const token = encodeURIComponent(String(version));
  return resolved.includes('?') ? `${resolved}&v=${token}` : `${resolved}?v=${token}`;
}

export { DEFAULT_EVENT_IMAGE };
