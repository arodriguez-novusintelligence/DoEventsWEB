import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lovable/components/ui/select';

export const PHONE_COUNTRIES = [
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+52', name: 'México', flag: '🇲🇽' },
  { code: '+34', name: 'España', flag: '🇪🇸' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: '+1849', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
] as const;

export function normalizePhoneIndicative(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '+57';
  return raw.startsWith('+') ? raw : `+${raw.replace(/\D/g, '')}`;
}

export function normalizePhoneNumber(value?: string): string {
  return String(value || '').replace(/\D/g, '');
}

export function composeFullPhone(indicative?: string, number?: string): string {
  const ind = normalizePhoneIndicative(indicative).replace(/\D/g, '');
  const num = normalizePhoneNumber(number);
  if (!num) return '';
  return `${ind}${num}`;
}

interface PhoneCountryFieldsProps {
  indicative: string;
  number: string;
  onIndicativeChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  numberLabel?: string;
  indicativeLabel?: string;
  /** z-index alto cuando el select está dentro de un modal anidado */
  selectContentClassName?: string;
}

export function PhoneCountryFields({
  indicative,
  number,
  onIndicativeChange,
  onNumberChange,
  numberLabel = 'Número de teléfono',
  indicativeLabel = 'Código de país',
  selectContentClassName,
}: PhoneCountryFieldsProps) {
  const normalized = normalizePhoneIndicative(indicative);
  const selected = PHONE_COUNTRIES.find((c) => c.code === normalized) || PHONE_COUNTRIES[0];

  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="col-span-2 space-y-2">
        <Label>{indicativeLabel}</Label>
        <Select value={selected.code} onValueChange={onIndicativeChange}>
          <SelectTrigger className="gap-1">
            <SelectValue placeholder="+57" />
          </SelectTrigger>
          <SelectContent className={selectContentClassName}>
            {PHONE_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="inline-flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-3 space-y-2">
        <Label>{numberLabel}</Label>
        <Input
          inputMode="numeric"
          value={number}
          onChange={(e) => onNumberChange(normalizePhoneNumber(e.target.value))}
          placeholder="3001234567"
        />
      </div>
    </div>
  );
}

export function splitGuestPhone(phone?: string, indicative?: string, number?: string) {
  if (indicative || number) {
    return {
      phoneIndicative: normalizePhoneIndicative(indicative || '+57'),
      phoneNumber: normalizePhoneNumber(number || phone),
    };
  }
  const raw = String(phone || '').trim();
  if (!raw) {
    return { phoneIndicative: '+57', phoneNumber: '' };
  }
  const match = PHONE_COUNTRIES
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find((country) => raw.startsWith(country.code));
  if (match) {
    return {
      phoneIndicative: match.code,
      phoneNumber: normalizePhoneNumber(raw.slice(match.code.length)),
    };
  }
  return {
    phoneIndicative: '+57',
    phoneNumber: normalizePhoneNumber(raw),
  };
}
