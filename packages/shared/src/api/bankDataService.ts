import { getAuthToken, getCurrentEnv } from './client';

export interface BankAccountItem {
  id: string;
  userID?: string;
  banco?: string;
  numeroCuenta?: string;
  titular?: string;
  tipoCuenta?: string;
  accountScope?: string;
  isInternational?: boolean;
  isDefault?: boolean;
  codigoSwift?: string;
  currency?: string;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function fetchBankAccountsByUser(userId: string): Promise<BankAccountItem[]> {
  const response = await fetch(
    `${getCurrentEnv().endpoints.bankDataByUser}/${encodeURIComponent(userId)}`,
    { headers: authHeaders() },
  );
  if (response.status === 404) return [];
  const body = await response.json() as {
    data?: { items?: BankAccountItem[] };
    items?: BankAccountItem[];
  };
  if (!response.ok) {
    throw new Error('No se pudieron cargar las cuentas bancarias');
  }
  return body.data?.items || body.items || [];
}

export interface CreateBankAccountInput {
  userID: string;
  banco: string;
  numeroCuenta: string;
  titular: string;
  tipoCuenta?: string;
  accountScope?: 'LOCAL' | 'INTERNACIONAL';
  codigoSwift?: string;
  isDefault?: boolean;
}

export async function createBankAccount(input: CreateBankAccountInput): Promise<BankAccountItem> {
  const response = await fetch(getCurrentEnv().endpoints.createBankData, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      ...input,
      isInternational: input.accountScope === 'INTERNACIONAL',
    }),
  });
  const body = await response.json() as { data?: BankAccountItem; message?: string; success?: boolean };
  if (!response.ok || body.success === false) {
    throw new Error(body.message || 'No se pudo registrar la cuenta');
  }
  return body.data || { id: '', ...input };
}

export async function setDefaultBankAccount(accountId: string): Promise<void> {
  const response = await fetch(
    `${getCurrentEnv().endpoints.setDefaultBankData}/${encodeURIComponent(accountId)}/predeterminado`,
    { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ isDefault: true }) },
  );
  if (!response.ok) throw new Error('No se pudo marcar la cuenta predeterminada');
}
