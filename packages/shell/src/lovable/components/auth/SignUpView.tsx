import { CreateAccountPage } from 'mfeAuth/pages/CreateAccountPage';

/**
 * Registro: envoltorio Lovable (`bg-secondary`) sobre formulario real mfe-auth.
 */
export const SignUpView = () => (
  <div className="min-h-screen bg-secondary">
    <CreateAccountPage />
  </div>
);

export default SignUpView;
