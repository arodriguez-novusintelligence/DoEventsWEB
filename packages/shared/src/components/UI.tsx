import React, { useState } from 'react';
import { GoogleIcon } from './GoogleIcon';
import { AppleIcon } from './AppleIcon';
import { Colors } from '../theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  tone?: 'default' | 'lovable';
  label: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  tone = 'lovable',
  label,
  className = '',
  ...props
}) => {
  const base = variant === 'primary' ? 'de-btn-primary' : 'de-btn-secondary';
  const toneClass = tone === 'lovable'
    ? (variant === 'primary' ? 'de-btn-primary--lovable' : 'de-btn-secondary--lovable')
    : '';
  return (
    <button
      className={`${base} ${toneClass} ${className}`.trim()}
      {...props}
    >
      {label}
    </button>
  );
};

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  variant?: 'underline' | 'bordered';
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  id,
  variant = 'bordered',
  className = '',
  ...props
}) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  const inputClass = variant === 'bordered'
    ? `de-input de-input--bordered ${className}`.trim()
    : variant === 'underline'
      ? `de-input de-input--underline ${className}`.trim()
      : `de-input ${className}`.trim();
  const labelClass = variant === 'bordered' ? 'de-label de-label--lovable' : 'de-label';
  return (
    <div className="de-field-group">
      <label htmlFor={fieldId} className={labelClass}>{label}</label>
      <input id={fieldId} className={inputClass} {...props} />
    </div>
  );
};

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  variant?: 'underline' | 'bordered';
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  id,
  variant = 'underline',
  className = '',
  ...props
}) => {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  const [visible, setVisible] = useState(false);
  const inputClass = variant === 'bordered'
    ? `de-input de-input--bordered ${className}`.trim()
    : `de-input de-input--underline ${className}`.trim();
  const labelClass = variant === 'bordered' ? 'de-label de-label--lovable' : 'de-label';

  return (
    <div className="de-field-group de-password-field">
      <label htmlFor={fieldId} className={labelClass}>{label}</label>
      <input
        id={fieldId}
        className={inputClass}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        type="button"
        className="de-password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 3l18 18M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a11.62 11.62 0 01-2.34 3.57M6.61 6.61A11.8 11.8 0 001 12.5C2.73 16.89 7 20 12 20a10.9 10.9 0 004.12-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5z" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="13" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>
    </div>
  );
};

interface SocialLoginButtonsProps {
  onGoogle?: () => void;
  onApple?: () => void;
  googleEnabled?: boolean;
  appleEnabled?: boolean;
  googleLoading?: boolean;
  appleLoading?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogle,
  onApple,
  googleEnabled = true,
  appleEnabled = true,
  googleLoading = false,
  appleLoading = false,
}) => (
  <div className="de-oauth-row de-oauth-row--pill">
    <button
      type="button"
      className="de-oauth-btn de-oauth-btn--google de-oauth-btn--pill"
      onClick={onGoogle}
      disabled={!googleEnabled || googleLoading}
      title="Iniciar sesión con Google"
      aria-label="Iniciar sesión con Google"
    >
      <GoogleIcon size={24} />
    </button>
    <button
      type="button"
      className="de-oauth-btn de-oauth-btn--apple de-oauth-btn--pill"
      onClick={onApple}
      disabled={!appleEnabled || appleLoading}
      title="Iniciar sesión con Apple"
      aria-label="Iniciar sesión con Apple"
    >
      <AppleIcon size={22} color="#FFFFFF" />
    </button>
  </div>
);

interface GoogleOAuthButtonProps {
  onClick?: () => void;
  enabled?: boolean;
  loading?: boolean;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onClick,
  enabled = true,
  loading = false,
}) => (
  <div className="de-oauth-row de-oauth-row--single">
    <button
      type="button"
      className="de-oauth-btn de-oauth-btn--google"
      onClick={onClick}
      disabled={!enabled || loading}
      title="Iniciar sesión con Google"
      aria-label="Iniciar sesión con Google"
    >
      <GoogleIcon size={24} />
    </button>
  </div>
);

interface OAuthButtonsProps {
  onGoogle?: () => void;
  googleEnabled?: boolean;
  googleLoading?: boolean;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onGoogle,
  googleEnabled = false,
  googleLoading = false,
}) => (
  <GoogleOAuthButton onClick={onGoogle} enabled={googleEnabled} loading={googleLoading} />
);

export { Colors };
