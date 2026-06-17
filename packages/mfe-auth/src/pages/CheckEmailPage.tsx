import React from 'react';
import { Link } from 'react-router-dom';

export const CheckEmailPage: React.FC = () => (
  <div className="de-page de-page--login de-page--auth-shell">
    <div className="de-auth-shell">
      <aside className="de-auth-shell__hero">
        <h1>Do<span>•</span>events</h1>
        <p>Revisa tu bandeja de entrada para continuar.</p>
      </aside>
      <div className="de-card de-card--lovable de-login-card de-auth-shell__card">
        <h2>Confirma tu correo</h2>
        <p className="de-login-subtitle" style={{ textAlign: 'left' }}>
          Te enviamos un enlace de activación a tu correo. Ábrelo y pulsa activar para habilitar tu cuenta.
          Después podrás iniciar sesión con tu email y contraseña.
        </p>
        <Link to="/auth/login" className="de-link">Volver al inicio de sesión</Link>
      </div>
    </div>
  </div>
);

export default CheckEmailPage;
