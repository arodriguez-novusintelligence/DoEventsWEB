import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Loader,
  useToast,
  generateOtp,
  verifyOtp,
  RootState,
} from '@doevents/shared';

const OTP_LENGTH = 6;
const RETRY_SECONDS = 60;

interface OtpCardProps {
  title: string;
  label: string;
  onSuccessNavigate: string;
}

export const OtpCard: React.FC<OtpCardProps> = ({ title, label, onSuccessNavigate }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const email = useSelector((s: RootState) => s.secureData.email);
  const phone = useSelector((s: RootState) => s.secureData.phone);
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [retryDisabled, setRetryDisabled] = useState(true);
  const [countdown, setCountdown] = useState(RETRY_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!retryDisabled) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setRetryDisabled(false);
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryDisabled]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return;
    const next = [...otp];
    next[index] = text;
    setOtp(next);
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      const result = await generateOtp(email, userId, { phoneNumber: phone, sendVia: ['email', 'whatsapp'] });
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        setRetryDisabled(true);
        setCountdown(RETRY_SECONDS);
      }
    } catch {
      showToast('Error al reenviar el código OTP', 'error');
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      showToast('Ingresa el código completo de 6 dígitos', 'error');
      return;
    }
    try {
      const result = await verifyOtp(email, userId, code);
      if (result.success) {
        showToast(result.message, 'success');
        navigate(onSuccessNavigate);
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('Código OTP inválido', 'error');
    }
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <div className="de-card de-card--lovable de-login-card">
      <h2 className="de-login-welcome" style={{ textAlign: 'center', fontSize: 20 }}>{title}</h2>
      <p className="de-login-subtitle" style={{ textAlign: 'center' }}>{label}</p>

      <div className="de-otp-inputs">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            className="de-otp-input"
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            aria-label={`Dígito ${i + 1} del código OTP`}
          />
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#72767A' }}>
        {retryDisabled ? `Reenviar código en ${countdown}s` : 'Puedes solicitar un nuevo código'}
      </p>

      <Button
        variant="secondary"
        label="Solicitar nuevo código"
        disabled={retryDisabled}
        onClick={handleResend}
      />

      <Button
        label="Continuar"
        disabled={!isComplete}
        onClick={handleVerify}
      />
    </div>
  );
};

export const VerifyIdentityPage: React.FC = () => {
  const { showToast } = useToast();
  const email = useSelector((s: RootState) => s.secureData.email);
  const phone = useSelector((s: RootState) => s.secureData.phone);
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [bootstrapped, setBootstrapped] = React.useState(false);

  React.useEffect(() => {
    if (bootstrapped || !email || !userId) return;
    setBootstrapped(true);
    generateOtp(email, userId, { phoneNumber: phone, sendVia: ['email', 'whatsapp'] })
      .then((result) => showToast(result.message, result.success ? 'success' : 'error'))
      .catch(() => showToast('No se pudo enviar el código. Usa "Solicitar nuevo código".', 'error'));
  }, [bootstrapped, email, phone, userId, showToast]);

  return (
    <div className="de-page de-page--login">
      <div className="de-full-container">
        <OtpCard
          title="Activa tu cuenta"
          label={`Revisa tu correo ${email}${phone ? ` y WhatsApp ${phone}` : ''}. Ingresa el código de 6 dígitos para continuar.`}
          onSuccessNavigate="/auth/gustos"
        />
      </div>
    </div>
  );
};

export const OtpRecoveryAdvicePage: React.FC = () => {
  const email = useSelector((s: RootState) => s.secureData.email);
  const phone = useSelector((s: RootState) => s.secureData.phone);
  const navigate = useNavigate();

  return (
    <div className="de-page de-page--login">
      <div className="de-full-container">
        <OtpCard
          title="Recuperación de contraseña"
          label={`Hemos enviado al correo ${email}${phone ? ` o al número ${phone}` : ''} un código de verificación.`}
          onSuccessNavigate="/auth/new-password"
        />
      </div>
    </div>
  );
};
