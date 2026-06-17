import React from 'react';
import { Button } from '@doevents/shared';

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  description?: string;
}

interface LoginDemoAccountsSheetProps {
  open: boolean;
  accounts: DemoAccount[];
  onClose: () => void;
  onSelect: (account: DemoAccount) => void;
}

export const LoginDemoAccountsSheet: React.FC<LoginDemoAccountsSheetProps> = ({
  open,
  accounts,
  onClose,
  onSelect,
}) => {
  if (!open) return null;

  return (
    <div
      className="de-login-demo-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-demo-title"
      onClick={onClose}
    >
      <div
        className="de-login-demo-sheet__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="login-demo-title" className="de-login-demo-sheet__title">
          Cuentas demo
        </h3>
        <p className="de-login-demo-sheet__subtitle">
          Selecciona una cuenta para completar el formulario. Luego pulsa Iniciar Sesión.
        </p>
        <div className="de-login-demo-sheet__list">
          {accounts.map((account) => (
            <button
              key={account.email}
              type="button"
              className="de-login-demo-sheet__item"
              onClick={() => {
                onSelect(account);
                onClose();
              }}
            >
              <strong>{account.label}</strong>
              <span>{account.email}</span>
            </button>
          ))}
        </div>
        <Button label="Cerrar" variant="secondary" tone="lovable" onClick={onClose} />
      </div>
    </div>
  );
};

export default LoginDemoAccountsSheet;
