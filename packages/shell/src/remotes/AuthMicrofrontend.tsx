import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@doevents/shared';
import AuthRoutes from '@mfe-auth/AuthRoutes';

class AuthLoadErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AuthMicrofrontend error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="de-page de-page--login">
          <div className="de-card de-card--lovable" style={{ textAlign: 'center', gap: 16 }}>
            <p>No se pudo cargar el módulo de autenticación.</p>
            <p style={{ fontSize: 13, color: '#6B7280' }}>{this.state.error.message}</p>
            <Button label="Reintentar" tone="lovable" onClick={() => window.location.reload()} />
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AuthMicrofrontend: React.FC = () => (
  <AuthLoadErrorBoundary>
    <AuthRoutes />
  </AuthLoadErrorBoundary>
);
