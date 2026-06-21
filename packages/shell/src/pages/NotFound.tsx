import { Link } from 'react-router-dom';
import { Home, MapPinOff, Search } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

export const NotFound = () => (
  <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-secondary px-6 pb-24 text-center">
    <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
      <MapPinOff className="h-7 w-7 text-primary" />
    </div>
    <p className="mt-3 text-3xl font-extrabold text-primary">404</p>
    <h1 className="mt-4 text-xl font-extrabold text-foreground">Página no encontrada</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      La ruta que buscas no existe o fue movida. Vuelve al inicio o explora eventos cercanos.
    </p>
    <div className="mt-8 flex w-full flex-col gap-3">
      <Button type="button" className="w-full rounded-full" asChild>
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Ir al inicio
        </Link>
      </Button>
      <Button type="button" variant="outline" className="w-full rounded-full" asChild>
        <Link to="/events">
          <Search className="mr-2 h-4 w-4" />
          Explorar eventos
        </Link>
      </Button>
    </div>
    </div>
  </div>
);

export default NotFound;
