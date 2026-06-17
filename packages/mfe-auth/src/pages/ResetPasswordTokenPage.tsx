import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, TextField, useToast, resetPasswordWithToken } from '@doevents/shared';

export const ResetPasswordTokenPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const token = params.get('token') || '';
  const userId = params.get('userId') || '';
  const email = params.get('email') || '';
  const isValid = password.length >= 8 && password === confirmPassword && Boolean(token && userId);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await resetPasswordWithToken(email, userId, token, password);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) navigate('/auth/login', { replace: true });
    } catch {
      showToast('No se pudo actualizar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !userId) {
    return (
      <div className="de-page de-page--login">
        <div className="de-card de-card--lovable de-login-card">
          <h2>Enlace inválido</h2>
          <p>Solicita un nuevo enlace de recuperación.</p>
          <Link to="/auth/forgot-password" className="de-link">Recuperar contraseña</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="de-page de-page--login de-page--auth-shell">
      <div className="de-auth-shell">
        <aside className="de-auth-shell__hero">
          <h1>Do<span>•</span>events</h1>
          <p>Crea una contraseña segura para volver a entrar a tu cuenta.</p>
        </aside>
        <div className="de-card de-card--lovable de-login-card de-auth-shell__card">
          <h2>Nueva contraseña</h2>
          <TextField label="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} variant="bordered" />
          <TextField label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} variant="bordered" />
          <Button label={loading ? 'Guardando…' : 'Actualizar contraseña'} tone="lovable" disabled={!isValid || loading} onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordTokenPage;
