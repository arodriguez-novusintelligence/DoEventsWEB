import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import {
  getUserByEmail,
  sendPasswordResetLink,
  useToast,
} from '@doevents/shared';
import AuthLogo from '@lovable/components/auth/AuthLogo';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';

export const ForgotPasswordView = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      showToast('Ingresa tu correo electrónico', 'error');
      return;
    }
    setLoading(true);
    try {
      const users = await getUserByEmail(normalized);
      if (!users.length) {
        showToast('No se encontró un usuario con ese correo', 'error');
        return;
      }
      const result = await sendPasswordResetLink(normalized, users[0].id);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) setSent(true);
    } catch {
      showToast('Error al enviar el enlace', 'error');
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
        <h1 className="text-xl font-extrabold text-foreground">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Te enviaremos un enlace seguro para restablecer tu contraseña.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <p className="text-sm text-foreground">
              Revisa tu correo. Te enviamos un enlace válido por 60 minutos.
            </p>
            <Button type="button" className="w-full rounded-full" asChild>
              <Link to="/auth/login">Volver al inicio de sesión</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-primary" />
                Correo electrónico
              </Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) void handleSubmit();
                }}
              />
            </div>
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={loading || !email.trim()}
              onClick={() => void handleSubmit()}
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;
