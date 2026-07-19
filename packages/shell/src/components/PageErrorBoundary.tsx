import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { isChunkLoadError } from '../lib/lazyPage';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  error: Error | null;
}

class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page render error:', error, info);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const staleBundle = isChunkLoadError(error);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-foreground">
            {staleBundle ? 'Hay una versión nueva de la app' : 'No se pudo cargar esta página'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {staleBundle
              ? 'Recarga la página para obtener los archivos más recientes.'
              : 'Ocurrió un error al mostrar el contenido. Puedes reintentar o recargar.'}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {!staleBundle && (
              <button
                type="button"
                onClick={this.handleRetry}
                className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary"
              >
                Reintentar
              </button>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default PageErrorBoundary;
