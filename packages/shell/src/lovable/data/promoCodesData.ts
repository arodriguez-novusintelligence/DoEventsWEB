import type { PromoCodeBatch } from './eventFormData';

export const generatePromoCode = (prefix: string = 'DOE'): string => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) suffix += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) suffix += digits[Math.floor(Math.random() * digits.length)];
  return `${prefix}-${suffix}`;
};

export const generateUniquePromoCodes = (
  count: number,
  existing: Set<string> = new Set(),
  prefix: string = 'DOE',
): string[] => {
  const out: string[] = [];
  while (out.length < count) {
    const code = generatePromoCode(prefix);
    if (existing.has(code)) continue;
    existing.add(code);
    out.push(code);
  }
  return out;
};
