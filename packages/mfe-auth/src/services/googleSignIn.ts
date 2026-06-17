import { getEnvironment } from '@config/environments/index';
import {
  persistEnrollmentUserId,
  persistPendingOAuthUser,
  persistSession,
  setAuthData,
  setAuthenticated,
} from '@doevents/shared';
import type { AppDispatch } from '@doevents/shared';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; error?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
            itp_support?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: {
            isDisplayMoment: () => boolean;
            isDisplayed: () => boolean;
            isNotDisplayed: () => boolean;
            getNotDisplayedReason: () => string;
            isSkippedMoment: () => boolean;
            getSkippedReason: () => string;
            isDismissedMoment: () => boolean;
            getDismissedReason: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
            },
          ) => void;
        };
      };
    };
  }
}

let gsiScriptLoaded = false;
const PROMPT_TIMEOUT_MS = 45000;

function loadGoogleScript(): Promise<void> {
  if (gsiScriptLoaded && window.google?.accounts?.id) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      gsiScriptLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gsiScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('No se pudo cargar Google Sign-In'));
    document.head.appendChild(script);
  });
}

function decodeJwtPayload(token: string): Record<string, string> {
  const base64 = token.split('.')[1];
  const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}

function isCognitoConfigured(): boolean {
  const env = getEnvironment();
  return (
    env.cognito.clientId.length > 0 &&
    !env.cognito.clientId.startsWith('CONFIGURE_') &&
    env.cognito.userPoolId.length > 0 &&
    !env.cognito.userPoolId.startsWith('CONFIGURE_') &&
    env.cognito.domain.length > 0
  );
}

function mapGoogleCredentialError(error?: string): string {
  if (!error) return 'Inicio de sesión con Google cancelado';
  const messages: Record<string, string> = {
    popup_closed_by_user: 'Cerraste la ventana de Google antes de completar el inicio de sesión.',
    access_denied: 'No autorizaste el acceso con tu cuenta de Google.',
    invalid_client: 'La configuración de Google OAuth no es válida para este dominio.',
    browser_not_supported: 'Tu navegador no es compatible con Google Sign-In.',
  };
  return messages[error] || `No se pudo iniciar sesión con Google (${error}).`;
}

type AuthOutcome = 'pending' | 'success' | 'error' | 'cancelled';

function createAuthSession() {
  let outcome: AuthOutcome = 'pending';
  return {
    isDone: () => outcome !== 'pending',
    succeed: (run: () => void) => {
      if (outcome !== 'pending') return;
      outcome = 'success';
      run();
    },
    fail: (run: () => void) => {
      if (outcome !== 'pending') return;
      outcome = 'error';
      run();
    },
    cancel: (run: () => void) => {
      if (outcome !== 'pending') return;
      outcome = 'cancelled';
      run();
    },
  };
}

export function loginWithGoogleCognito(): void {
  const env = getEnvironment();
  const params = new URLSearchParams({
    client_id: env.cognito.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: env.cognito.redirectSignIn,
    identity_provider: 'Google',
  });
  window.location.href = `https://${env.cognito.domain}/oauth2/authorize?${params.toString()}`;
}

async function syncGoogleUserWithBackend(
  credential: string,
  dispatch: AppDispatch,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
  onNeedsGustos: (userId: string) => void,
): Promise<boolean> {
  const env = getEnvironment();
  const payload = decodeJwtPayload(credential);

  try {
    const response = await fetch(env.endpoints.googleOAuth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          user: {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            givenName: payload.given_name || '',
            familyName: payload.family_name || '',
            photo: payload.picture || '',
          },
        },
      }),
    });

    const body = await response.json();

    if (body.success && body.data?.token) {
      persistSession(body.data.token, body.data.user.userId);
      dispatch(setAuthData({ token: body.data.token, idUser: body.data.user.userId }));
      dispatch(setAuthenticated(true));
      onSuccess('Inicio de sesión con Google exitoso');
      return true;
    }
    if (body.data?.codigoRespuesta === 3) {
      persistPendingOAuthUser({
        provider: 'google',
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          givenName: payload.given_name || '',
          familyName: payload.family_name || '',
          photo: payload.picture || '',
        },
      });
      persistEnrollmentUserId(body.data.userId);
      dispatch(setAuthData({ token: '', idUser: body.data.userId }));
      onNeedsGustos(body.data.userId);
      return true;
    }
    onError(body.message || 'Error al autenticar con Google');
    return false;
  } catch {
    onError('Error al conectar con el servidor DoEvents');
    return false;
  }
}

function openGoogleAccountPicker(
  clientId: string,
  onCredential: (credential: string) => void,
  onError: (message: string) => void,
  onCancel: () => void,
): () => void {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '10000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'rgba(15, 23, 42, 0.45)';
  overlay.style.padding = '16px';

  const panel = document.createElement('div');
  panel.style.background = '#ffffff';
  panel.style.borderRadius = '16px';
  panel.style.padding = '20px 24px 24px';
  panel.style.boxShadow = '0 20px 50px rgba(15, 23, 42, 0.25)';
  panel.style.maxWidth = '360px';
  panel.style.width = '100%';
  panel.style.textAlign = 'center';

  const title = document.createElement('p');
  title.textContent = 'Continúa con Google';
  title.style.margin = '0 0 16px';
  title.style.fontSize = '16px';
  title.style.fontWeight = '700';
  title.style.color = '#0f172a';

  const buttonHost = document.createElement('div');
  buttonHost.style.display = 'flex';
  buttonHost.style.justifyContent = 'center';

  panel.appendChild(title);
  panel.appendChild(buttonHost);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let settled = false;
  const finish = (run?: () => void) => {
    if (settled) return;
    settled = true;
    window.setTimeout(() => overlay.remove(), 0);
    run?.();
  };

  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (settled) return;
      if (response.credential) {
        const credential = response.credential;
        finish(() => onCredential(credential));
        return;
      }
      finish(() => {
        if (response.error) {
          onError(mapGoogleCredentialError(response.error));
        } else {
          onCancel();
        }
      });
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
  });

  window.google!.accounts.id.renderButton(buttonHost, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    width: 300,
    text: 'signin_with',
    shape: 'pill',
    logo_alignment: 'left',
  });

  const tryAutoOpen = (attempt = 0) => {
    if (settled) return;
    const googleBtn = buttonHost.querySelector('[role="button"]') as HTMLElement | null;
    if (googleBtn) {
      googleBtn.click();
      return;
    }
    if (attempt < 8) {
      window.setTimeout(() => tryAutoOpen(attempt + 1), 80 * (attempt + 1));
      return;
    }
    finish(() => onError('No se pudo abrir el selector de cuenta de Google. Intenta de nuevo.'));
  };

  window.setTimeout(() => tryAutoOpen(), 80);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      finish(onCancel);
    }
  });

  return () => finish();
}

export async function loginWithGoogleDirect(
  dispatch: AppDispatch,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
  onNeedsGustos: (userId: string) => void,
): Promise<void> {
  const clientId = getEnvironment().oauth.google.clientId;
  if (!clientId) {
    onError('Google Client ID no configurado');
    return;
  }

  await loadGoogleScript();

  return new Promise((resolve) => {
    const session = createAuthSession();
    let cleanupPicker: (() => void) | undefined;

    const finish = () => {
      cleanupPicker?.();
      resolve();
    };

    const timeoutId = window.setTimeout(() => {
      session.fail(() => {
        onError('Google tardó demasiado en responder. Intenta de nuevo o usa email/contraseña.');
      });
      finish();
    }, PROMPT_TIMEOUT_MS);

    const clearTimeoutAndFinish = () => {
      window.clearTimeout(timeoutId);
      finish();
    };

    const handleCredential = async (credential: string) => {
      window.clearTimeout(timeoutId);
      const ok = await syncGoogleUserWithBackend(
        credential,
        dispatch,
        (msg) => session.succeed(() => onSuccess(msg)),
        (msg) => session.fail(() => onError(msg)),
        (userId) => session.succeed(() => onNeedsGustos(userId)),
      );
      if (!ok && !session.isDone()) {
        session.fail(() => onError('Error al autenticar con Google'));
      }
      clearTimeoutAndFinish();
    };

    cleanupPicker = openGoogleAccountPicker(
      clientId,
      handleCredential,
      (msg) => {
        session.fail(() => onError(msg));
        clearTimeoutAndFinish();
      },
      () => {
        session.cancel(() => onError('Inicio de sesión con Google cancelado'));
        clearTimeoutAndFinish();
      },
    );
  });
}

export async function loginWithGoogle(
  dispatch: AppDispatch,
  onSuccess: (message: string) => void,
  onError: (message: string) => void,
  onNeedsGustos: (userId: string) => void,
): Promise<void> {
  if (isCognitoConfigured()) {
    loginWithGoogleCognito();
    return;
  }
  await loginWithGoogleDirect(dispatch, onSuccess, onError, onNeedsGustos);
}

export { isCognitoConfigured };
