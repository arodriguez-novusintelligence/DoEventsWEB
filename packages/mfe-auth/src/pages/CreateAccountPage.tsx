import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  PasswordField,
  SocialLoginButtons,
  TextField,
  fileToBase64,
  sendActivationLink,
  useToast,
  createUser,
  setSecureData,
  DEFAULT_PROFILE_IMAGE_BASE64,
  CreateAccountData,
} from '@doevents/shared';
import { getEnvironment } from '@config/environments/index';
import { loginWithGoogle } from '../services/googleSignIn';
import { redirectToOAuth } from '../services/oauthService';
import { TermsDialog } from '../components/TermsDialog';

const COUNTRIES = [
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+1849', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+51', name: 'Peru', flag: '🇵🇪' },
];

export type CreateAccountPageProps = {
  /** Oculta chrome legacy cuando el formulario va embebido en SignUpView Lovable. */
  embedded?: boolean;
};

export const CreateAccountPage: React.FC<CreateAccountPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const env = getEnvironment();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const [form, setForm] = useState<CreateAccountData>({
    name: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    indicativo: '+57',
    username: '',
    birthDate: '',
    fotoPerfilBase64: DEFAULT_PROFILE_IMAGE_BASE64,
  });

  const update = (field: keyof CreateAccountData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const filteredCountries = useMemo(
    () => COUNTRIES.filter(
      (country) => country.name.toLowerCase().includes(countrySearch.toLowerCase())
        || country.code.includes(countrySearch),
    ),
    [countrySearch],
  );

  const isValid = Boolean(
    form.name.trim()
    && form.lastName.trim()
    && form.phone.trim()
    && form.email.trim()
    && form.birthDate
    && form.password
    && form.confirmPassword
    && acceptedTerms
    && form.password === form.confirmPassword
    && form.password.length >= 8,
  );

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(URL.createObjectURL(file));
      update('fotoPerfilBase64', base64);
    } catch {
      showToast('No se pudo cargar la foto de perfil', 'error');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      showToast('Completa todos los campos requeridos', 'error');
      return;
    }
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      dispatch(setSecureData({ email, phone: `${form.indicativo}${form.phone}` }));
      const result = await createUser(form);
      if (result.success) {
        const userId = result.data.userID;
        const linkResult = await sendActivationLink(email, userId);
        showToast(linkResult.message, linkResult.success ? 'success' : 'error');
        if (linkResult.success) navigate('/auth/check-email');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      showToast(axiosError.response?.data?.message || 'Error al crear cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!acceptedTerms) {
      showToast('Acepta los términos antes de continuar con Google', 'error');
      return;
    }
    setGoogleLoading(true);
    try {
      await loginWithGoogle(
        dispatch,
        (msg) => {
          showToast(msg, 'success');
          navigate('/');
        },
        (msg) => showToast(msg, 'error'),
        () => navigate('/auth/terms'),
      );
    } catch {
      showToast('No se pudo completar el registro con Google', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookRegister = () => {
    if (!acceptedTerms) {
      showToast('Acepta los términos antes de continuar con Facebook', 'error');
      return;
    }
    if (!env.oauth.facebook.enabled) {
      showToast('Registro con Facebook no está disponible en este entorno', 'error');
      return;
    }
    setFacebookLoading(true);
    redirectToOAuth('Facebook');
  };

  const handleAppleRegister = () => {
    if (!acceptedTerms) {
      showToast('Acepta los términos antes de continuar con Apple', 'error');
      return;
    }
    if (!env.oauth.apple.enabled) {
      showToast('Registro con Apple no está disponible en este entorno', 'error');
      return;
    }
    setAppleLoading(true);
    redirectToOAuth('SignInWithApple');
  };

  const busy = loading || googleLoading || facebookLoading || appleLoading;

  return (
    <div className={embedded ? 'de-signup-embedded' : 'de-page de-page--signup'}>
      {!embedded && (
        <div className="de-signup-header">
          <button type="button" className="de-signup-back" onClick={() => navigate('/auth/login')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Atras</span>
          </button>
          <div className="de-signup-progress">
            <div className="de-signup-progress__track">
              <div className="de-signup-progress__fill" style={{ width: '40%' }} />
            </div>
            <span className="de-signup-progress__label">40%</span>
          </div>
        </div>
      )}

      {!embedded && (
        <div className="de-signup-intro">
          <h1>Crear cuenta</h1>
          <p>Crear la cuenta con tus redes o ingresar tu correo electrónico</p>
        </div>
      )}

      <div className="de-signup-body">
        <div className="de-signup-social">
          <SocialLoginButtons
            onGoogle={handleGoogleRegister}
            onFacebook={handleFacebookRegister}
            onApple={handleAppleRegister}
            googleEnabled={env.oauth.google.enabled}
            facebookEnabled={env.oauth.facebook.enabled}
            appleEnabled={env.oauth.apple.enabled}
            googleLoading={googleLoading}
            facebookLoading={facebookLoading}
            appleLoading={appleLoading}
          />
        </div>

        <div className="de-divider-row de-divider-row--signup">
          <div className="de-divider-line" />
          <span className="de-divider-text">Crea cuenta con correo electrónico</span>
          <div className="de-divider-line" />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="de-signup-card">
            <div className="de-signup-avatar-wrap">
              <button
                type="button"
                className="de-signup-avatar-btn"
                onClick={() => fileRef.current?.click()}
                aria-label="Subir foto de perfil"
              >
                {avatarPreview && <img src={avatarPreview} alt="" />}
                <span className="de-signup-avatar-overlay">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 7h3l2-3h6l2 3h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            <TextField
              label="Nombre(s)"
              variant="underline"
              placeholder="Ingresa tu(s) nombre(s)"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              disabled={busy}
              autoComplete="given-name"
            />
            <TextField
              label="Apellido(s)"
              variant="underline"
              placeholder="Ingresa tu(s) apellido(s)"
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              disabled={busy}
              autoComplete="family-name"
            />
            <TextField
              label="Fecha de nacimiento"
              variant="underline"
              type="date"
              value={form.birthDate || ''}
              onChange={(e) => update('birthDate', e.target.value)}
              disabled={busy}
            />

            <div className="de-field-group">
              <label className="de-label">Número de celular</label>
              <div className="de-signup-phone-row">
                <div className="de-signup-country-wrap">
                  <button
                    type="button"
                    className="de-signup-country-btn"
                    onClick={() => setCountryOpen((open) => !open)}
                    disabled={busy}
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  {countryOpen && (
                    <div className="de-signup-country-menu">
                      <input
                        className="de-input de-input--bordered"
                        placeholder="Buscar país"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                      />
                      {filteredCountries.map((country) => (
                        <button
                          key={`${country.code}-${country.name}`}
                          type="button"
                          className="de-signup-country-item"
                          onClick={() => {
                            setSelectedCountry(country);
                            update('indicativo', country.code);
                            setCountryOpen(false);
                            setCountrySearch('');
                          }}
                        >
                          <span>{country.flag}</span>
                          <span style={{ width: 56 }}>{country.code}</span>
                          <span>{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  className="de-signup-phone-input"
                  type="tel"
                  placeholder="Ingresa tu número de celular"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  disabled={busy}
                  autoComplete="tel-national"
                />
              </div>
            </div>

            <TextField
              label="Correo electrónico"
              variant="underline"
              type="email"
              placeholder="Ingresa tu correo electrónico"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              disabled={busy}
              autoComplete="email"
            />

            <div className="de-field-group de-signup-username-wrap">
              <label className="de-label" htmlFor="signup-username">Nombre de usuario (Opcional)</label>
              <input
                id="signup-username"
                className="de-input de-input--underline"
                placeholder="Ingresa un nombre de usuario"
                value={form.username || ''}
                onChange={(e) => update('username', e.target.value)}
                disabled={busy}
                autoComplete="username"
              />
              {form.username?.trim() && (
                <span className="de-signup-username-check" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>

            <PasswordField
              label="Contraseña"
              variant="underline"
              placeholder="Ingresa tu contraseña"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirmar Contraseña"
              variant="underline"
              placeholder="Confirma tu contraseña"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              disabled={busy}
              autoComplete="new-password"
            />
          </div>

          <label className="de-signup-terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={busy}
            />
            <span>
              Aceptar{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTermsOpen(true);
                }}
              >
                términos, condiciones y tratamiento de datos personales.
              </button>
            </span>
          </label>

          <div className="de-signup-submit">
            <button
              type="submit"
              className="de-btn-pill-primary"
              disabled={!isValid || busy}
            >
              {loading ? 'Creando cuenta...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>

      <TermsDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => setAcceptedTerms(true)}
      />
    </div>
  );
};

export default CreateAccountPage;
