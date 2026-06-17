import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  TextField,
  useToast,
  getUserByEmail,
  sendPasswordResetLink,
} from '@doevents/shared';

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast('Ingresa tu correo electrónico', 'error');
      return;
    }
    setLoading(true);
    try {
      const users = await getUserByEmail(email.trim().toLowerCase());
      if (!users.length) {
        showToast('No se encontró un usuario con ese correo', 'error');
        return;
      }
      const userId = users[0].id;
      const result = await sendPasswordResetLink(email.trim().toLowerCase(), userId);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) setSent(true);
    } catch {
      showToast('Error al enviar el enlace', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="de-page de-page--login de-page--auth-shell">
      <div className="de-auth-shell">
        <aside className="de-auth-shell__hero">
          <h1>Do<span>•</span>events</h1>
          <p>Te enviaremos un enlace seguro para restablecer tu contraseña.</p>
        </aside>
        <div className="de-card de-card--lovable de-login-card de-auth-shell__card">
          <h2>Recuperar contraseña</h2>
          {sent ? (
            <>
              <p>Revisa tu correo. Te enviamos un enlace válido por 60 minutos.</p>
              <Link to="/auth/login" className="de-link">Volver al inicio de sesión</Link>
            </>
          ) : (
            <>
              <TextField label="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} variant="bordered" />
              <Button label={loading ? 'Enviando…' : 'Enviar enlace'} tone="lovable" disabled={loading || !email.trim()} onClick={handleSubmit} />
              <Link to="/auth/login" className="de-link">Volver al inicio de sesión</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const NewPasswordPage: React.FC = () => null;
