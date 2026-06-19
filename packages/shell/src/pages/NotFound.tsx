import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

export const NotFound = () => (
  <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-background px-6 text-center">
    <p className="text-6xl font-extrabold text-primary">404</p>
    <h1 className="mt-4 text-xl font-bold text-foreground">Página no encontrada</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      La ruta que buscas no existe o fue movida.
    </p>
    <Button type="button" className="mt-8 rounded-full" asChild>
      <Link to="/">
        <Home className="mr-2 h-4 w-4" />
        Ir al inicio
      </Link>
    </Button>
  </div>
);

export default NotFound;
