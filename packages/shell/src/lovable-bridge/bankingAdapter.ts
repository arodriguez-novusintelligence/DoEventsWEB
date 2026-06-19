import type { BankAccountItem, CreateBankAccountInput } from '@doevents/shared';
import type { SavedPaymentMethod } from '@lovable/components/banking/BankingForm';

function inferMethodType(account: BankAccountItem): SavedPaymentMethod['type'] {
  const bank = (account.banco || '').toLowerCase();
  if (bank.includes('nequi')) return 'nequi';
  if (bank.includes('bancolombia')) return 'bancolombia';
  if (account.isInternational || account.accountScope === 'INTERNACIONAL') return 'international';
  if (bank.includes('paypal')) return 'paypal';
  return 'otros';
}

function inferCurrency(account: BankAccountItem): SavedPaymentMethod['currency'] {
  const c = (account.currency || 'COP').toUpperCase();
  if (c === 'USD' || c === 'EUR' || c === 'GBP' || c === 'MXN') return c;
  return 'COP';
}

export function bankAccountToSavedMethod(account: BankAccountItem): SavedPaymentMethod {
  const type = inferMethodType(account);
  const details = account.numeroCuenta || account.codigoSwift || '—';
  return {
    id: account.id,
    type,
    name: account.titular || account.banco || 'Cuenta bancaria',
    details,
    currency: inferCurrency(account),
    status: account.isDefault ? 'default' : 'active',
  };
}

export function savedMethodToCreateInput(
  method: SavedPaymentMethod,
  userId: string,
): CreateBankAccountInput | null {
  if (method.type === 'paypal') return null;

  const bankLabels: Record<SavedPaymentMethod['type'], string> = {
    bancolombia: 'Bancolombia',
    nequi: 'Nequi',
    otros: method.name || 'Otro banco',
    international: 'Cuenta internacional',
    paypal: 'PayPal',
  };

  return {
    userID: userId,
    banco: bankLabels[method.type],
    numeroCuenta: method.details.replace(/^IBAN\s+/i, ''),
    titular: method.name,
    accountScope: method.type === 'international' ? 'INTERNACIONAL' : 'LOCAL',
    isDefault: method.status === 'default',
  };
}

export function mapBankAccounts(accounts: BankAccountItem[]): SavedPaymentMethod[] {
  return accounts.map(bankAccountToSavedMethod);
}
