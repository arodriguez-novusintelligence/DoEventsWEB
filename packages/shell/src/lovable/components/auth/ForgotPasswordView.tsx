import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, MessageCircle } from 'lucide-react';
import {
  getUserByEmail,
  resetPasswordWithToken,
  sendPasswordResetLink,
  useToast,
} from '@doevents/shared';
import AuthLogo from '@lovable/components/auth/AuthLogo';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';

export const ForgotPasswordView = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentVia, setSentVia] = useState<string[]>([]);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const whatsappSent = sentVia.includes('whatsapp');
  const emailSent = sentVia.includes('email') || (sent && sentVia.length === 0);
  const canResetWithOtp = Boolean(userId && otp.trim().length >= 4);
  const passwordsOk = password.length >= 8 && password === confirmPassword;

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
      const uid = users[0].id;
      setUserId(uid);
      const result = await sendPasswordResetLink(normalized, uid);
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        setSent(true);
        setSentVia(Array.isArray(result.sentVia) ? result.sentVia : []);
      }
    } catch {
      showToast('Error al enviar el enlace', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithOtp = async () => {
    if (!canResetWithOtp || !passwordsOk || resetting) return;
    setResetting(true);
    try {
      const result = await resetPasswordWithToken(
        email.trim().toLowerCase(),
        userId,
        '',
        password,
        otp.trim(),
      );
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        window.setTimeout(() => navigate('/auth/login', { replace: true }), 1200);
      }
    } catch {
      showToast('No se pudo actualizar la contraseña', 'error');
    } finally {
      setResetting(false);
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
          Te enviaremos un enlace al correo y un código por WhatsApp si tienes teléfono registrado.
        </p>

        {sent ? (
          <div className="mt-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm text-foreground">
                {emailSent && whatsappSent
                  ? 'Revisa tu correo (enlace válido por 60 minutos) y tu WhatsApp (código de 6 dígitos).'
                  : emailSent
                    ? 'Revisa tu correo. Te enviamos un enlace válido por 60 minutos.'
                    : 'Revisa tu WhatsApp. Te enviamos un código de 6 dígitos válido por 60 minutos.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold text-primary">
                {emailSent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
                    <Mail className="h-3.5 w-3.5" /> Correo
                  </span>
                )}
                {whatsappSent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </span>
                )}
              </div>
            </div>

            {whatsappSent && (
              <div className="space-y-4 rounded-xl border border-border/70 bg-secondary/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  ¿Recibiste el código por WhatsApp?
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reset-otp">Código de 6 dígitos</Label>
                  <Input
                    id="reset-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    disabled={resetting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-pass" className="flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-primary" />
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="reset-pass"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={resetting}
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="reset-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={resetting}
                      className="pr-11"
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
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
                  )}
                </div>
                <Button
                  type="button"
                  className="w-full rounded-full"
                  disabled={!canResetWithOtp || !passwordsOk || resetting}
                  onClick={() => void handleResetWithOtp()}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando…
                    </>
                  ) : (
                    'Restablecer con código'
                  )}
                </Button>
              </div>
            )}

            <Button type="button" className="w-full rounded-full" variant="outline" asChild>
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
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                'Enviar enlace'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordView;
