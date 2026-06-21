import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { CreateAccountPage } from 'mfeAuth/pages/CreateAccountPage';
import AuthLogo from '@lovable/components/auth/AuthLogo';

/**
 * Registro: envoltorio Lovable (`bg-secondary`) sobre formulario real mfe-auth.
 */
export const SignUpView = () => (
  <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary px-4 pb-12">
    <AuthLogo />
    <div className="rounded-2xl bg-card p-6 shadow-md border border-border/60">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <UserPlus className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Crear cuenta</h1>
          <p className="text-xs text-muted-foreground">Únete a Do.Events</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Descubre eventos, lugares y servicios cerca de ti.
      </p>
      <div className="mt-4 rounded-xl border border-border/40 bg-secondary/50 p-1">
        <CreateAccountPage />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/auth/login" className="font-semibold text-primary">
          Iniciar sesión
        </Link>
      </p>
    </div>
  </div>
);

export default SignUpView;
