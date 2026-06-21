/**
 * Alias port-map Lovable SignUp → mfe-auth (formulario real vía CreateAccountPage).
 * La UI Lovable vive en shell SignUpView; esta página expone el contrato mfe-auth.
 */
export { CreateAccountPage as SignUpPage, CreateAccountPage as default } from './CreateAccountPage';
