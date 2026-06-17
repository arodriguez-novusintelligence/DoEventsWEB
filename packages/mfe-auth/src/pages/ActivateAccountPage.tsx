import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Loader, verifyAuthLink, useToast } from '@doevents/shared';

/**
 * Activa la cuenta al abrir el enlace enviado por correo tras el registro email/contraseña.
 */
export const ActivateAccountPage: React.FC = () => {
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Activando tu cuenta...');

  useEffect(() => {
    const token = params.get('token');
    const userId = params.get('userId');
    const email = (params.get('email') || '').trim().toLowerCase();

    if (!token || !userId) {
      setStatus('error');
      setMessage('El enlace de activación no es válido. Revisa tu correo o vuelve a registrarte.');
      return;
    }

    let cancelled = false;

    verifyAuthLink(email, userId, token, 'activation')
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Tu cuenta fue activada correctamente.');
          showToast('Cuenta activada. Ya puedes iniciar sesión.', 'success');
        } else {
          setStatus('error');
          setMessage(result.message || 'No pudimos activar tu cuenta.');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setMessage('El enlace expiró o ya fue usado. Crea tu cuenta nuevamente o contacta soporte.');
      });

    return () => {
      cancelled = true;
    };
  }, [params, showToast]);

  if (status === 'loading') {
    return (
      <div className="de-page de-page--login de-page--auth-shell">
        <div className="de-auth-shell">
          <div className="de-card de-card--lovable de-login-card de-auth-shell__card">
            <Loader />
            <p className="de-login-subtitle" style={{ textAlign: 'center' }}>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="de-page de-page--login de-page--auth-shell">
      <div className="de-auth-shell">
        <aside className="de-auth-shell__hero">
          <h1>Do<span>•</span>events</h1>
          <p>{status === 'success' ? 'Tu cuenta ya está lista.' : 'No pudimos completar la activación.'}</p>
        </aside>
        <div className="de-card de-card--lovable de-login-card de-auth-shell__card">
          <h2>{status === 'success' ? 'Cuenta activada' : 'Enlace no válido'}</h2>
          <p className="de-login-subtitle" style={{ textAlign: 'left' }}>{message}</p>
          {status === 'success' ? (
            <Link to="/auth/login" className="de-link-btn">
              <Button label="Iniciar sesión" tone="lovable" type="button" />
            </Link>
          ) : (
            <>
              <Link to="/auth/register" className="de-link-btn">
                <Button variant="secondary" tone="lovable" label="Crear cuenta" type="button" />
              </Link>
              <div style={{ textAlign: 'center' }}>
                <Link to="/auth/login" className="de-link">Volver al inicio de sesión</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivateAccountPage;
