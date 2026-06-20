import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, Lock, Mail } from 'lucide-react';
import {
  generateOtp,
  initApiClient,
  loginUser,
  persistEnrollmentUserId,
  persistPendingLoginCredentials,
  persistSession,
  setAuthData,
  setAuthenticated,
  setSecureData,
  SocialLoginButtons,
  useToast,
} from '@doevents/shared';
import { getEnvironment } from '@config/environments/index';
import { loginWithGoogle } from 'mfeAuth/services/googleSignIn';
import { redirectToOAuth } from 'mfeAuth/services/oauthService';
import AuthLogo from '@lovable/components/auth/AuthLogo';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';

export const LoginView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const env = getEnvironment();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const busy = loading || googleLoading || facebookLoading || appleLoading;
  const isValid = email.trim() !== '' && password.trim() !== '';

  const goToApp = () => {
    navigate('/', { replace: true });
    window.setTimeout(() => {
      if (window.location.pathname.startsWith('/auth')) {
        window.location.assign('/');
      }
    }, 300);
  };

  const notify = (message: string, type: 'success' | 'error' = 'error') => {
    showToast(message, type);
  };

  const handleLogin = async () => {
    if (!isValid || loading) return;
    setLoading(true);
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

  const handleFacebookLogin = () => {
    if (!env.oauth.facebook.enabled) {
      notify('Inicio de sesión con Facebook no está disponible en este entorno', 'error');
      return;
    }
    setFacebookLoading(true);
    redirectToOAuth('Facebook');
  };

  const handleAppleLogin = () => {
    if (!env.oauth.apple.enabled) {
      notify('Inicio de sesión con Apple no está disponible en este entorno', 'error');
      return;
    }
    setAppleLoading(true);
    redirectToOAuth('SignInWithApple');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary px-4 pb-12">
      <AuthLogo />

      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/60">
        <h1 className="text-xl font-extrabold text-foreground">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accede con tu correo o continúa con tus redes sociales.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-primary" />
              Correo electrónico
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid && !loading) void handleLogin();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-primary" />
              Contraseña
            </Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValid && !loading) void handleLogin();
              }}
            />
          </div>

          <Button
            type="button"
            className="w-full rounded-full"
            disabled={!isValid || busy}
            onClick={() => void handleLogin()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>

          <div className="text-center">
            <Link to="/auth/forgot-password" className="text-xs font-semibold text-primary">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="button" variant="outline" className="w-full rounded-full" asChild>
            <Link to="/auth/register">Crear cuenta</Link>
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
          </div>
        </div>

        <SocialLoginButtons
          onGoogle={handleGoogleLogin}
          onFacebook={handleFacebookLogin}
          onApple={handleAppleLogin}
          googleEnabled={env.oauth.google.enabled}
          facebookEnabled={env.oauth.facebook.enabled}
          appleEnabled={env.oauth.apple.enabled}
          googleLoading={googleLoading}
          facebookLoading={facebookLoading}
          appleLoading={appleLoading}
        />
      </div>
    </div>
  );
};

export default LoginView;
