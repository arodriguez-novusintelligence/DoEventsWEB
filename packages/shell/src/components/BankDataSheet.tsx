import React, { useEffect, useState } from 'react';
import {
  BankAccountItem,
  Button,
  Loader,
  TextField,
  createBankAccount,
  fetchBankAccountsByUser,
  setDefaultBankAccount,
  useToast,
} from '@doevents/shared';

export interface BankDataSheetProps {
  open: boolean;
  userId: string;
  onClose: () => void;
}

type AccountMode = 'list' | 'cop' | 'usd';

export const BankDataSheet: React.FC<BankDataSheetProps> = ({ open, userId, onClose }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<AccountMode>('list');
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [form, setForm] = useState({
    banco: '',
    numeroCuenta: '',
    titular: '',
    tipoCuenta: '0',
    codigoSwift: '',
  });

  const loadAccounts = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const items = await fetchBankAccountsByUser(userId);
      setAccounts(items);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setMode('list');
      loadAccounts();
    }
  }, [open, userId]);

  if (!open) return null;

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.banco.trim() || !form.numeroCuenta.trim() || !form.titular.trim()) {
      showToast('Completa banco, número y titular', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createBankAccount({
        userID: userId,
        banco: form.banco.trim(),
        numeroCuenta: form.numeroCuenta.trim(),
        titular: form.titular.trim(),
        tipoCuenta: form.tipoCuenta,
        accountScope: mode === 'usd' ? 'INTERNACIONAL' : 'LOCAL',
        codigoSwift: mode === 'usd' ? form.codigoSwift.trim() : undefined,
        isDefault: accounts.length === 0,
      });
      showToast('Cuenta registrada', 'success');
      setForm({ banco: '', numeroCuenta: '', titular: '', tipoCuenta: '0', codigoSwift: '' });
      setMode('list');
      await loadAccounts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo registrar la cuenta', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      await setDefaultBankAccount(accountId);
      showToast('Cuenta predeterminada actualizada', 'success');
      await loadAccounts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar', 'error');
    }
  };

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">
      <div className="de-sheet de-sheet--bank" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <div>
            <h2>Cómo recibes los cobros</h2>
            <p className="de-sheet__subtitle">
              Elige tu método de cobro: cuenta en Colombia o internacional en dólares.
            </p>
          </div>
          <button type="button" className="de-sheet__close" onClick={onClose}>Cerrar</button>
        </header>

        {loading ? (
          <Loader />
        ) : mode === 'list' ? (
          <div className="de-sheet__body de-form-stack">
            <button type="button" className="de-bank-option" onClick={() => setMode('cop')}>
              <span className="de-bank-option__icon">🏦</span>
              <span>
                <strong>Cuenta en Colombia (COP)</strong>
                <small>Bancolombia, Davivienda, Nequi, etc.</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
            <button type="button" className="de-bank-option" onClick={() => setMode('usd')}>
              <span className="de-bank-option__icon">🌐</span>
              <span>
                <strong>Cuenta internacional (USD)</strong>
                <small>Es posible que se apliquen comisiones</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>

            <h3 className="de-bank-list__title">Cuentas inscritas</h3>
            {accounts.length === 0 ? (
              <p className="de-empty-state">Aún no tienes cuentas registradas.</p>
            ) : (
              <div className="de-bank-list">
                {accounts.map((account) => (
                  <div key={account.id} className="de-bank-card">
                    {account.isDefault && <span className="de-bank-card__badge">Predeterminado</span>}
                    <span className="de-bank-card__icon">{account.isInternational ? '🌐' : '🏦'}</span>
                    <div>
                      <strong>{account.banco || 'Cuenta bancaria'}</strong>
                      <span>
                        Nº: {account.numeroCuenta}
                        {account.isInternational ? ' (USD)' : ' (COP)'}
                      </span>
                    </div>
                    {!account.isDefault && (
                      <button type="button" className="de-bank-card__menu" onClick={() => handleSetDefault(account.id)}>
                        ⋯
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="de-sheet__body de-form-stack">
            <button type="button" className="de-search-page__back" onClick={() => setMode('list')}>← Volver</button>
            <TextField label="Banco" value={form.banco} onChange={(e) => update('banco', e.target.value)} variant="bordered" />
            <TextField label="Número de cuenta" value={form.numeroCuenta} onChange={(e) => update('numeroCuenta', e.target.value)} variant="bordered" />
            <TextField label="Titular" value={form.titular} onChange={(e) => update('titular', e.target.value)} variant="bordered" />
            {mode === 'usd' && (
              <TextField label="Código SWIFT" value={form.codigoSwift} onChange={(e) => update('codigoSwift', e.target.value)} variant="bordered" />
            )}
            <Button label={submitting ? 'Guardando…' : 'Registrar cuenta'} disabled={submitting} onClick={handleCreate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDataSheet;
