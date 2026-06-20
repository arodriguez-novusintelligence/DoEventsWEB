import { CreateAccountPage } from 'mfeAuth/pages/CreateAccountPage';
import AuthLogo from '@lovable/components/auth/AuthLogo';

/**
 * Registro: envoltorio Lovable (`bg-secondary`) sobre formulario real mfe-auth.
 */
export const SignUpView = () => (
  <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary px-4 pb-12">
    <AuthLogo />
    <div className="rounded-2xl bg-card p-1 shadow-md border border-border/60">
      <CreateAccountPage />
    </div>
  </div>
);

export default SignUpView;
