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
    ) => Promise<{ name?: string[]; tel?: string[] }[]>;
  };
};

export function isDeviceContactsSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return Boolean((navigator as ContactPickerNavigator).contacts?.select);
}

export async function pickDeviceContacts(): Promise<DeviceContact[]> {
  const nav = navigator as ContactPickerNavigator;
  if (!nav.contacts?.select) {
    throw new Error(
      'Tu navegador no permite acceder a los contactos. En móvil usa Chrome; también puedes agregar invitados manualmente.',
    );
  }
  const picked = await nav.contacts.select(['name', 'tel'], { multiple: true });
  const results: DeviceContact[] = [];
  picked.forEach((entry, index) => {
    const name = entry.name?.[0]?.trim() || `Contacto ${index + 1}`;
    const phone = entry.tel?.[0]?.trim() || '';
    if (!phone) return;
    results.push({
      id: `device-${index}-${phone.replace(/\D/g, '')}`,
      name,
      phone,
    });
  });
  if (!results.length) {
    throw new Error('No se seleccionaron contactos con teléfono válido.');
  }
  return results;
}
