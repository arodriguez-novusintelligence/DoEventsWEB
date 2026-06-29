import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Loader,
  useToast,
  persistEnrollmentUserId,
  persistPendingOAuthUser,
  persistSession,
  setAuthData,
  setAuthenticated,
  persistOAuthDisplayName,
} from '@doevents/shared';
import { getEnvironment } from '@config/environments/index';
import { resolveOAuthFromCognito } from '../services/oauthCallback';

/**
 * Procesa el callback OAuth de Cognito Hosted UI.
 * Cognito redirige aquí con ?code=... tras login con Google/Facebook/Apple.
 */
export const OAuthCallbackPage: React.FC = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState('Procesando autenticación...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');

    if (error) {
      showToast(errorDesc || error, 'error');
      navigate('/auth/login');
      return;
    }

    if (!code) {
      showToast('No se recibió código de autorización', 'error');
      navigate('/auth/login');
      return;
    }

    const exchangeCode = async () => {
      const env = getEnvironment();
      setStatus('Intercambiando código por tokens...');

      try {
        const tokenUrl = `https://${env.cognito.domain}/oauth2/token`;
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: env.cognito.clientId,
          code,
          redirect_uri: env.cognito.redirectSignIn,
        });

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        const tokens = await response.json();

        if (!response.ok) {
          throw new Error(tokens.error_description || tokens.error || 'Error al obtener tokens');
        }

        const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        const email = payload.email || '';
        const sub = payload.sub || '';

        setStatus('Sincronizando con DoEvents...');

        const providerName = payload.identities?.[0]?.providerName || 'Google';
        const { endpoint, pendingProvider } = resolveOAuthFromCognito(providerName, env);

        const backendResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              user: {
                id: sub,
                email,
                name: payload.name || email,
                givenName: payload.given_name || '',
                familyName: payload.family_name || '',
                photo: payload.picture || '',
              },
            },
          }),
        });

        const result = await backendResponse.json();

        if (result.success && result.data?.token) {
          const { token, user } = result.data;
          persistSession(
            token,
            user.userId,
            payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' '),
          );
          dispatch(setAuthData({ token, idUser: user.userId }));
          dispatch(setAuthenticated(true));
          showToast('Inicio de sesión exitoso', 'success');
          navigate('/');
        } else if (result.data?.codigoRespuesta === 3) {
          persistOAuthDisplayName(
            payload.name,
            payload.given_name,
            payload.family_name,
          );
          const oauthUser = {
            id: sub,
            email,
            name: payload.name || email,
            givenName: payload.given_name || '',
            familyName: payload.family_name || '',
            photo: payload.picture || '',
          };
          persistPendingOAuthUser({
            provider: pendingProvider,
            user: oauthUser,
          });
          persistEnrollmentUserId(result.data.userId);
          dispatch(setAuthData({ token: '', idUser: result.data.userId }));
          navigate('/auth/terms', { replace: true });
        } else {
          throw new Error(result.message || 'Error al sincronizar usuario');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error en autenticación OAuth';
        showToast(message, 'error');
        navigate('/auth/login');
      }
    };

    exchangeCode();
  }, [searchParams, navigate, showToast, dispatch]);

  return (
    <div className="de-page">
      <Loader />
      <p style={{ marginTop: 16, textAlign: 'center' }}>{status}</p>
    </div>
  );
};

export default OAuthCallbackPage;
