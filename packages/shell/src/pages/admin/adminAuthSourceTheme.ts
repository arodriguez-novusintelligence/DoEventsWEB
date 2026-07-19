import type { CSSProperties } from 'react';

/** Colores del donut «Origen» (referencia Lovable / panel admin). */
export const AUTH_SOURCE_COLORS: Record<string, string> = {
  Google: '#6979F8',
  Email: '#8B97FA',
  Apple: '#f59e0b',
  Facebook: '#ef4444',
};

export const AUTH_SOURCE_ORDER = ['Google', 'Email', 'Apple', 'Facebook'] as const;

export type AuthSourceLabel = (typeof AUTH_SOURCE_ORDER)[number];

export function normalizeAuthSourceLabel(raw?: string | null): AuthSourceLabel | string {
  const value = String(raw || 'Email').trim();
  const lower = value.toLowerCase();
  if (lower.includes('google')) return 'Google';
  if (lower.includes('apple')) return 'Apple';
  if (lower.includes('facebook')) return 'Facebook';
  if (lower.includes('email') || lower.includes('credential') || lower.includes('password')) return 'Email';
  if (value in AUTH_SOURCE_COLORS) return value;
  return 'Email';
}

export function getAuthSourceColor(raw?: string | null): string {
  const label = normalizeAuthSourceLabel(raw);
  return AUTH_SOURCE_COLORS[label] || AUTH_SOURCE_COLORS.Email;
}

export function authSourceBadgeStyle(raw?: string | null): CSSProperties {
  const color = getAuthSourceColor(raw);
  return {
    color,
    borderColor: `${color}55`,
    backgroundColor: `${color}18`,
  };
}
