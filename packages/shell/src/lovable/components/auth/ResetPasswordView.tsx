import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { resetPasswordWithToken, useToast } from '@doevents/shared';
import AuthLogo from '@lovable/components/auth/AuthLogo';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';

export const ResetPasswordView = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = params.get('token') || '';
  const userId = params.get('userId') || '';
  const email = params.get('email') || '';
  const linkValid = Boolean(token && userId);
  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const isValid = passwordLongEnough && passwordsMatch && linkValid;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const result = await resetPasswordWithToken(email, userId, token, password);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        setSuccess(true);
        window.setTimeout(() => navigate('/auth/login', { replace: true }), 1500);
      }
    } catch {
      showToast('No se pudo actualizar la contraseña', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary px-4 pb-12">
      <div className="pt-4">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <AuthLogo />

      <div className="rounded-2xl bg-card p-6 shadow-md border border-border/60">
        {!linkValid ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Enlace inválido</h1>
            <p className="text-sm text-muted-foreground">
              El enlace de recuperación expiró o no es válido. Solicita uno nuevo.
            </p>
            <Button type="button" className="w-full rounded-full" asChild>
              <Link to="/auth/forgot-password">Recuperar contraseña</Link>
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Contraseña actualizada</h1>
            <p className="text-sm text-muted-foreground">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button type="button" className="w-full rounded-full" asChild>
              <Link to="/auth/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-foreground">Nueva contraseña</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea una contraseña segura de al menos 8 caracteres.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password" className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-primary" />
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && !passwordLongEnough && (
                  <p className="text-xs text-destructive">La contraseña debe tener al menos 8 caracteres.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm" className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-primary" />
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="reset-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="pr-11"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isValid && !loading) void handleSubmit();
                    }}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
                )}
              </div>

              <Button
                type="button"
                className="w-full rounded-full"
                disabled={!isValid || loading}
                onClick={() => void handleSubmit()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  'Actualizar contraseña'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;
