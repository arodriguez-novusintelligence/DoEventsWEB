export interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select: (
      properties: string[],
      options?: { multiple?: boolean },
    ) => Promise<{ name?: string[]; tel?: string[]; email?: string[] }[]>;
    getProperties?: () => Promise<string[]>;
  };
};

export type DeviceContactsCapability = 'native' | 'file-only';

function getContactsApi(): ContactPickerNavigator['contacts'] | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  if (!window.isSecureContext) return null;
  const nav = navigator as ContactPickerNavigator;
  if (!nav.contacts || typeof nav.contacts.select !== 'function') return null;
  return nav.contacts;
}

/** Detección síncrona: Contact Picker API disponible en este navegador. */
export function isDeviceContactsSupported(): boolean {
  return Boolean(getContactsApi());
}

/**
 * ¿Parece un teléfono móvil? Útil para UX (siempre ofrecer “Importar del teléfono”).
 */
export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  if (typeof window !== 'undefined' && window.matchMedia?.( '(pointer: coarse)' ).matches) {
    return true;
  }
  return false;
}

export function getDeviceContactsCapability(): DeviceContactsCapability {
  return isDeviceContactsSupported() ? 'native' : 'file-only';
}

export function getNativeContactsHelpMessage(): string {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) {
    return [
      'En iPhone, Safari no abre la agenda nativa por defecto.',
      'Opciones:',
      '1) Activa “Contact Picker API” en Ajustes → Safari → Avanzado → Feature Flags (si aparece), recarga y vuelve a intentar.',
      '2) O exporta contactos desde la app Contactos (.vcf) y usa “Importar archivo”.',
      'En Android, usa Chrome para elegir contactos directamente de tu teléfono.',
    ].join('\n');
  }
  if (/Android/i.test(ua)) {
    return 'Abre DoEvents en Chrome para Android para seleccionar contactos de tu teléfono. Si usas otro navegador, importa un archivo .vcf/.csv.';
  }
  return 'Tu navegador no permite abrir la agenda del teléfono. Usa Chrome en Android o importa un archivo .vcf/.csv exportado.';
}

function normalizePhone(raw: string): string {
  return String(raw || '').trim();
}

function toDeviceContacts(
  entries: Array<{ name?: string; phone?: string }>,
): DeviceContact[] {
  const results: DeviceContact[] = [];
  const seen = new Set<string>();
  entries.forEach((entry, index) => {
    const name = String(entry.name || '').trim() || `Contacto ${index + 1}`;
    const phone = normalizePhone(entry.phone || '');
    if (!phone) return;
    const key = phone.replace(/\D/g, '');
    if (!key || seen.has(key)) return;
    seen.add(key);
    results.push({
      id: `device-${index}-${key}`,
      name,
      phone,
    });
  });
  return results;
}

/**
 * Abre el selector nativo de contactos del sistema (Chrome Android / Safari con flag).
 * No hace fallback a archivos: eso lo decide la UI.
 */
export async function pickDeviceContacts(): Promise<DeviceContact[]> {
  const contactsApi = getContactsApi();
  if (!contactsApi) {
    const err = new Error(getNativeContactsHelpMessage());
    (err as Error & { code?: string }).code = 'CONTACTS_UNSUPPORTED';
    throw err;
  }

  let properties = ['name', 'tel'];
  try {
    if (typeof contactsApi.getProperties === 'function') {
      const available = await contactsApi.getProperties();
      properties = ['name', 'tel'].filter((p) => available.includes(p));
      if (!properties.includes('tel')) {
        const err = new Error('Este navegador no permite leer números de teléfono de contactos.');
        (err as Error & { code?: string }).code = 'CONTACTS_NO_TEL';
        throw err;
      }
      if (!properties.includes('name')) properties = ['tel', ...properties];
    }
  } catch (probeErr) {
    if ((probeErr as Error & { code?: string }).code) throw probeErr;
    // Si getProperties falla, intentamos select con name+tel de todas formas.
  }

  let picked: { name?: string[]; tel?: string[] }[] = [];
  try {
    picked = await contactsApi.select(properties, { multiple: true });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    const message = err instanceof Error ? err.message : String(err);
    if (name === 'AbortError' || /cancel/i.test(message)) {
      const cancelErr = new Error('Importación cancelada.');
      (cancelErr as Error & { code?: string }).code = 'CONTACTS_CANCELLED';
      throw cancelErr;
    }
    const fail = new Error(
      message || 'No se pudo abrir la agenda de contactos del teléfono.',
    );
    (fail as Error & { code?: string }).code = 'CONTACTS_SELECT_FAILED';
    throw fail;
  }

  const flattened = (picked || []).flatMap((entry, index) => {
    const name = entry.name?.[0]?.trim() || `Contacto ${index + 1}`;
    const phones = (entry.tel || []).map((t) => t.trim()).filter(Boolean);
    if (!phones.length) return [{ name, phone: '' }];
    return phones.map((phone) => ({ name, phone }));
  });

  const results = toDeviceContacts(flattened);
  if (!results.length) {
    const err = new Error('No se seleccionaron contactos con teléfono válido.');
    (err as Error & { code?: string }).code = 'CONTACTS_EMPTY';
    throw err;
  }
  return results;
}

function parseVcf(text: string): DeviceContact[] {
  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  const entries: Array<{ name?: string; phone?: string }> = [];
  cards.forEach((card) => {
    const lines = card.split(/\r?\n/);
    let name = '';
    const phones: string[] = [];
    lines.forEach((line) => {
      const raw = line.trim();
      if (/^FN[;:]/i.test(raw)) {
        name = raw.replace(/^FN[^:]*:/i, '').trim();
      } else if (!name && /^N[;:]/i.test(raw)) {
        const parts = raw.replace(/^N[^:]*:/i, '').split(';');
        name = [parts[1], parts[0]].filter(Boolean).join(' ').trim();
      } else if (/^TEL/i.test(raw)) {
        phones.push(raw.replace(/^TEL[^:]*:/i, '').trim());
      }
    });
    if (phones.length) {
      phones.forEach((phone) => entries.push({ name, phone }));
    } else {
      entries.push({ name, phone: '' });
    }
  });
  return toDeviceContacts(entries);
}

function parseCsvOrTxt(text: string): DeviceContact[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const entries: Array<{ name?: string; phone?: string }> = [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('name') || header.includes('nombre') || header.includes('phone') || header.includes('tel');
  const start = hasHeader ? 1 : 0;
  for (let i = start; i < lines.length; i += 1) {
    const cols = lines[i].split(/[,;\t]/).map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length === 1) {
      const phoneMatch = cols[0].match(/(\+?\d[\d\s()-]{6,}\d)/);
      if (phoneMatch) {
        entries.push({
          name: cols[0].replace(phoneMatch[1], '').trim() || `Contacto ${i}`,
          phone: phoneMatch[1],
        });
      }
      continue;
    }
    const name = cols[0] || cols[1] || `Contacto ${i}`;
    const phone = cols.find((c, idx) => idx > 0 && /\d{7,}/.test(c.replace(/\D/g, ''))) || cols[1] || '';
    entries.push({ name, phone });
  }
  return toDeviceContacts(entries);
}

export async function importContactsFromFile(file: File): Promise<DeviceContact[]> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  let results: DeviceContact[] = [];
  if (lower.endsWith('.vcf') || /BEGIN:VCARD/i.test(text)) {
    results = parseVcf(text);
  } else {
    results = parseCsvOrTxt(text);
  }
  if (!results.length) {
    throw new Error('No se encontraron contactos con teléfono en el archivo.');
  }
  return results;
}
