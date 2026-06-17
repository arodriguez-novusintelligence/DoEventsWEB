import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  DoEventsLogo,
  TextField,
  PasswordField,
  SocialLoginButtons,
  useToast,
  loginUser,
  generateOtp,
  setAuthData,
  setAuthenticated,
  setSecureData,
  persistSession,
  persistEnrollmentUserId,
  persistPendingLoginCredentials,
  initApiClient,
} from '@doevents/shared';
import { getEnvironment } from '@config/environments/index';
import { loginWithGoogle } from '../services/googleSignIn';
import { redirectToOAuth } from '../services/oauthService';
import { LoginDemoAccountsSheet, type DemoAccount } from '../components/LoginDemoAccountsSheet';

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Usuario QA completo',
    email: 'qa-full@doeventsapp.com',
    password: 'QaTest123!',
    description: 'Perfil con eventos, chat y boletas',
  },
  {
    label: 'Guía DoEvents',
    email: 'guia@doeventsapp.com',
    password: 'GuiaDemo2026!',
    description: 'Organizadora demo para pruebas multiusuario',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const env = getEnvironment();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [demoOpen, setDemoOpen] = useState(false);

  const notify = (message: string, type: 'success' | 'error' = 'error') => {
    setStatusMessage(message);
    showToast(message, type);
  };

  const goToApp = () => {
    navigate('/', { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname.startsWith('/auth')) {
        window.location.assign('/');
      }
    }, 300);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(
        dispatch,
        (msg) => {
          notify(msg, 'success');
          goToApp();
        },
        (msg) => notify(msg, 'error'),
        () => navigate('/auth/terms', { replace: true }),
      );
    } catch {
      notify('No se pudo completar el inicio de sesión con Google', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = () => {
    if (!env.oauth.apple.enabled) {
      notify('Inicio de sesión con Apple no está disponible en este entorno', 'error');
      return;
    }
    setAppleLoading(true);
    redirectToOAuth('SignInWithApple');
  };

  const isValid = email.trim() !== '' && password.trim() !== '';

  const handleLogin = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setStatusMessage('Iniciando sesión...');
    initApiClient(getEnvironment());
    try {
      const response = await loginUser({ email: email.trim(), password });
      if (response.success && response.data?.token) {
        const token = response.data.token;
        const userId = response.data.user.userId;
        dispatch(setAuthData({ token, idUser: userId }));
        dispatch(setAuthenticated(true));
        persistSession(token, userId);
        notify('Nos alegra que hagas parte de esta red de Eventers', 'success');
        goToApp();
        return;
      }
      notify('Respuesta inesperada del servidor', 'error');
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string; data?: { codigoRespuesta?: number; userId?: string; phone?: string; email?: string } } };
        message?: string;
      };
      const data = axiosError.response?.data;
      notify(data?.message || axiosError.message || 'Error al iniciar sesión', 'error');

      const codigo = data?.data?.codigoRespuesta;
      if (codigo === 2 && data?.data) {
        const { userId, phone, email: userEmail } = data.data;
        dispatch(setAuthData({ token: '', idUser: userId! }));
        dispatch(setSecureData({ phone: phone || '', email: userEmail || email }));
        try {
          const otpResult = await generateOtp(userEmail || email, userId!);
          notify(otpResult.message, otpResult.success ? 'success' : 'error');
          if (otpResult.success) navigate('/auth/verify-identity', { replace: true });
        } catch {
          notify('Error al enviar verificación', 'error');
        }
      }
      if (codigo === 3 && data?.data?.userId) {
        persistPendingLoginCredentials(email.trim().toLowerCase(), password);
        persistEnrollmentUserId(data.data.userId);
        dispatch(setAuthData({ token: '', idUser: data.data.userId }));
        navigate('/auth/terms', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const applyDemoAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setStatusMessage(`Cuenta demo seleccionada: ${account.label}`);
  };

  return (
    <div className="de-page de-page--login-mobile">
      <div className="de-login-mobile">
        <div className="de-login-mobile__logo">
          <DoEventsLogo />
        </div>

        <div className="de-card de-login-card de-login-card--front">
          {statusMessage && (
            <div className="de-gustos-banner de-gustos-banner--info">{statusMessage}</div>
          )}

          <TextField
            label="Correo electrónico"
            type="email"
            variant="underline"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading || googleLoading || appleLoading}
          />

          <PasswordField
            label="Contraseña"
            variant="underline"
            placeholder="Ingresa la contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading || googleLoading || appleLoading}
          />

          <button
            type="button"
            className="de-btn-pill-primary"
            disabled={!isValid || loading || googleLoading || appleLoading}
            onClick={handleLogin}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <Link to="/auth/register" className="de-link-btn">
            <button type="button" className="de-btn-pill-secondary">
              Crear cuenta
            </button>
          </Link>

          <div className="de-forgot-wrap">
            <Link to="/auth/forgot-password" className="de-link">Olvide mi contraseña</Link>
          </div>

          <button
            type="button"
            className="de-login-demo-link"
            onClick={() => setDemoOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 10v6M12 7h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Ver cuentas demo
          </button>
        </div>

        <div className="de-login-social">
          <div className="de-divider-row de-divider-row--login">
            <div className="de-divider-line" />
            <span className="de-divider-text">Inicio sesión con otro medio</span>
            <div className="de-divider-line" />
          </div>

          <SocialLoginButtons
            onGoogle={handleGoogleLogin}
            onApple={handleAppleLogin}
            googleEnabled={env.oauth.google.enabled}
            appleEnabled
            googleLoading={googleLoading}
            appleLoading={appleLoading}
          />
        </div>
      </div>

      <LoginDemoAccountsSheet
        open={demoOpen}
        accounts={DEMO_ACCOUNTS}
        onClose={() => setDemoOpen(false)}
        onSelect={applyDemoAccount}
      />
    </div>
  );
};
