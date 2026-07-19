import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CreditCard,
  Lock,
  KeyRound,
  Smile,
  HandCoins,
  CalendarDays,
  Ticket,
  Settings2,
  Armchair,
  Map,
  Send,
  ShieldCheck,
  Check,
  X,
  Info,
  Eye,
  EyeOff,
  Building2,
  Loader2,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import { Switch } from '@lovable/components/ui/switch';
import { Textarea } from '@lovable/components/ui/textarea';
import PlanDetailView, { type PlanId } from '@lovable/components/legal/PlanDetailView';
import BankingHub from '@lovable/components/banking/BankingHub';
import { toast } from 'sonner';
import { updateProfileVisibility, getPreferences, saveUserPreferences } from '@doevents/shared';
import { useCompany } from '@lovable/contexts/CompanyContext';
import { useKyc } from '@lovable/contexts/KycContext';
import KycCertificationView from '@lovable/components/feed/KycCertificationView';
import { useNavigate } from 'react-router-dom';

interface Props {
  onBack: () => void;
  currentPlan?: PlanId;
  onUpgradePlan?: () => void;
  userId?: string;
  isPublicProfile?: boolean;
  onVisibilityChange?: (isPublic: boolean) => void;
  profileName?: string;
  profileEmail?: string;
  profilePhone?: string;
  profilePhoneNumber?: string;
  profileCountryCode?: string;
  profileDocument?: string;
  profileBio?: string;
  profileUsername?: string;
  profileBirthDate?: string;
  onSaveContact?: (data: {
    nombres: string;
    apellidos: string;
    phone: string;
    username: string;
    bio: string;
    fecha?: string;
    phonePrefix?: string;
  }) => Promise<void>;
}

type SubView = null | 'password-email' | 'password-sent' | 'password-token' | 'gustos' | 'bancarios' | 'plan-detail' | 'kyc';

import { PhoneCountryFields, splitGuestPhone } from '@lovable/components/guests/PhoneCountryFields';

const INTEREST_TAGS = [
  'Salud y bienestar', 'Artes escénicas', 'Educación', 'Comunidad y cultura',
  'Viajes y actividades al aire libre', 'Pasatiempos e intereses especiales',
  'Actividades escolares', 'Música', 'Familia', 'Cine, medios y entretenimiento',
  'Deportes y fitness', 'Moda y belleza', 'Comida y bebida', 'Gobierno y política',
  'Ciencia y tecnología', 'Automóviles, barcos y aeronáutica', 'Iniciativa social',
  'Festivales y actividades de temporada', 'Hogar y estilo de vida',
];

const EditProfileView = ({
  onBack,
  currentPlan = 'free',
  onUpgradePlan,
  userId,
  isPublicProfile = true,
  onVisibilityChange,
  profileName = '',
  profileEmail = '',
  profilePhone = '',
  profilePhoneNumber = '',
  profileCountryCode = '',
  profileDocument = '',
  profileBio = '',
  profileUsername = '',
  profileBirthDate = '',
  onSaveContact,
}: Props) => {
  const navigate = useNavigate();
  const [subView, setSubView] = useState<SubView>(null);
  const [saving, setSaving] = useState(false);
  const [contactOpen, setContactOpen] = useState(true);
  const [subOpen, setSubOpen] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(!isPublicProfile);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const { company, loading: companyLoading } = useCompany();
  const { status: kycStatus } = useKyc();

  useEffect(() => {
    setPrivateProfile(!isPublicProfile);
  }, [isPublicProfile]);

  const handleVisibilityToggle = async (nextPrivate: boolean) => {
    if (!userId || visibilityBusy) return;
    setVisibilityBusy(true);
    const previous = privateProfile;
    setPrivateProfile(nextPrivate);
    try {
      await updateProfileVisibility(userId, !nextPrivate);
      onVisibilityChange?.(!nextPrivate);
      toast.success(
        nextPrivate
          ? 'Perfil privado: solo tus seguidores verán tu contenido'
          : 'Perfil público: todos pueden ver tu contenido',
      );
    } catch (err) {
      setPrivateProfile(previous);
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la visibilidad');
    } finally {
      setVisibilityBusy(false);
    }
  };

  // Contact form
  const nameParts = profileName.split(' ').filter(Boolean);
  const phoneParts = splitGuestPhone(profilePhone, profileCountryCode, profilePhoneNumber);
  const [nombres, setNombres] = useState(nameParts[0] || '');
  const [apellidos, setApellidos] = useState(nameParts.slice(1).join(' ') || '');
  const [fecha, setFecha] = useState(profileBirthDate || '');
  const [phonePrefix, setPhonePrefix] = useState(phoneParts.phoneIndicative);
  const [phone, setPhone] = useState(phoneParts.phoneNumber);
  const [email] = useState(profileEmail || '');
  const [username, setUsername] = useState(profileUsername || '');
  const usernameOk = username.trim().length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(username.trim());
  const [descripcion, setDescripcion] = useState(profileBio || '');

  // Password recovery flow
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [tokenDigits, setTokenDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secondsLeft, setSecondsLeft] = useState(139);
  const tokenRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (subView !== 'gustos') return;
    let cancelled = false;
    setGustosLoading(true);
    void getPreferences()
      .then((res) => {
        if (cancelled) return;
        const catalog = (res.data || [])
          .map((p) => ({ id: Number(p.id), name: p.name }))
          .filter((p) => Number.isFinite(p.id) && p.id > 0 && p.name);
        setPreferenceCatalog(catalog);
        if (!interests.length && catalog.length) {
          setInterests(catalog.slice(0, 3).map((p) => p.name));
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('No se pudieron cargar las preferencias');
      })
      .finally(() => {
        if (!cancelled) setGustosLoading(false);
      });
    return () => { cancelled = true; };
  }, [subView]);

  useEffect(() => {
    if (subView !== 'password-token') return;
    setSecondsLeft(139);
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [subView]);

  // Interests
  const [preferenceCatalog, setPreferenceCatalog] = useState<Array<{ id: number; name: string }>>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [gustosLoading, setGustosLoading] = useState(false);
  const [gustosSaving, setGustosSaving] = useState(false);
  const [createsEvents, setCreatesEvents] = useState<'si' | 'no'>('si');
  const [providesServices, setProvidesServices] = useState<'si' | 'no'>('si');
  const [hasVenue, setHasVenue] = useState<'si' | 'no'>('si');

  // Bank data
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Ahorros');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [holderId, setHolderId] = useState('');

  const handleSendRecovery = () => {
    if (!recoveryEmail.trim() || !/\S+@\S+\.\S+/.test(recoveryEmail)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    setSubView('password-sent');
  };

  const handleTokenChange = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...tokenDigits];
    next[i] = v;
    setTokenDigits(next);
    if (v && i < 5) tokenRefs.current[i + 1]?.focus();
  };

  const toggleInterest = (tag: string) => {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  // ============ Sub-views ============
  if (subView === 'plan-detail') {
    return (
      <PlanDetailView
        planId={currentPlan}
        onBack={() => setSubView(null)}
        onUpgrade={() => {
          onUpgradePlan?.();
          setSubView(null);
        }}
      />
    );
  }

  if (subView === 'password-email') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-4 pb-24">
        <button onClick={() => setSubView(null)} className="flex items-center text-primary mb-4">
          <ChevronLeft className="h-5 w-5" /> <span className="text-sm">Atrás</span>
        </button>
        <h1 className="text-2xl font-bold text-primary mb-3">Olvide mi contraseña</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Recuerda que este proceso restablecerá la contraseña y posteriormente enviaremos un código
          de seguridad a tu correo electrónico.
        </p>
        <div className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
          <div>
            <Label className="text-sm font-semibold">Correo Electronico</Label>
            <Input
              value={recoveryEmail}
              onChange={(e) => { setRecoveryEmail(e.target.value); setEmailError(false); }}
              placeholder="Ingresa tu correo electronico"
              className={`mt-2 border-0 border-b rounded-none px-0 focus-visible:ring-0 ${emailError ? 'border-destructive' : ''}`}
            />
            {emailError && <p className="text-xs text-destructive mt-2">Este campo es obligatorio</p>}
          </div>
          <Button
            onClick={handleSendRecovery}
            disabled={!recoveryEmail}
            className="w-full rounded-full bg-primary hover:bg-primary/90 disabled:opacity-100"
          >
            Enviar
          </Button>
        </div>
      </div>
    );
  }

  if (subView === 'password-sent') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-20 pb-24">
        <div className="rounded-2xl bg-card shadow-sm p-8 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center">
            <Send className="h-14 w-14 text-success" strokeWidth={2.2} />
          </div>
          <h2 className="text-lg font-bold text-foreground leading-snug">
            Hemos enviado un token de seguridad a tu correo electrónico registrado.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Por favor, revisa la bandeja de entrada de tu correo y sigue las instrucciones para recuperar tu clave.
          </p>
          <Button onClick={() => setSubView('password-token')} className="w-full rounded-full">
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (subView === 'password-token') {
    const complete = tokenDigits.every((d) => d !== '');
    return (
      <div className="mx-auto max-w-lg px-4 pt-10 pb-24">
        <div className="flex justify-center mb-6">
          <Lock className="h-16 w-16 text-primary" strokeWidth={2} />
        </div>
        <div className="rounded-2xl bg-card shadow-sm p-6 space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-primary">Ingreso de Token</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa el código de seguridad enviado a tu correo electrónico o celular.
            </p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-left">
            <p className="text-xs font-semibold text-primary">Cambio de contraseña (BACKEND_REQUIRED)</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              La validación del token y el cambio de contraseña se realizan vía Cognito/shared; no se simula éxito local.
            </p>
          </div>
          <div className="flex justify-center gap-2.5">
            {tokenDigits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (tokenRefs.current[i] = el)}
                value={d}
                onChange={(e) => handleTokenChange(i, e.target.value)}
                inputMode="numeric"
                maxLength={1}
                className="h-12 w-10 border-b-2 border-muted-foreground/40 text-center text-2xl font-bold text-primary focus:border-primary focus:outline-none bg-transparent"
              />
            ))}
          </div>
          <div className="text-center space-y-2">
            <p className="text-primary font-semibold">{mmss}</p>
            <button
              onClick={() => { setSecondsLeft(139); setTokenDigits(['', '', '', '', '', '']); toast.success('Nuevo código enviado'); }}
              className="text-sm text-primary/70 underline"
            >
              Solicitar nuevo código
            </button>
          </div>
          <Button
            disabled={!complete}
            onClick={() => {
              toast.info('El cambio de contraseña requiere integración con el servicio de autenticación (BACKEND_REQUIRED).');
              setSubView(null);
            }}
            className="w-full rounded-full"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (subView === 'gustos') {
    return (
      <div className="mx-auto max-w-lg px-4 pt-4 pb-28">
        <button onClick={() => setSubView(null)} className="flex items-center text-foreground mb-4">
          <ChevronLeft className="h-5 w-5" /> <span className="text-sm">Atrás</span>
        </button>
        <div className="mb-4">
          <div className="h-1.5 w-full bg-primary/15 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="text-right text-xs text-primary mt-1">60%</p>
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">Gustos y servicios</h1>
        <p className="text-sm font-medium text-foreground mb-4">
          Selecciona algunos eventos a los cuales te gusta ir o participar
        </p>
        {gustosLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
        <>
        <div className="rounded-2xl bg-card shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {(preferenceCatalog.length ? preferenceCatalog.map((p) => p.name) : INTEREST_TAGS).map((tag) => {
              const active = interests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {[
            { q: '¿Te gustaría crear eventos?', val: createsEvents, set: setCreatesEvents },
            { q: '¿Prestas servicios para eventos?', val: providesServices, set: setProvidesServices },
            { q: '¿Cuentas con un lugar/sitio/negocio para realizar eventos?', val: hasVenue, set: setHasVenue },
          ].map(({ q, val, set }) => (
            <div key={q}>
              <p className="text-sm font-medium text-foreground mb-1.5">{q}</p>
              <div className="flex gap-8">
                {(['si', 'no'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        val === opt ? 'border-primary' : 'border-muted-foreground/40'
                      }`}
                    >
                      {val === opt && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm capitalize">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        </>
        )}
        <Button
          disabled={gustosSaving || gustosLoading || !userId || interests.length === 0}
          onClick={() => {
            void (async () => {
              if (!userId) return;
              const catalog = preferenceCatalog.length
                ? preferenceCatalog
                : INTEREST_TAGS.map((name, index) => ({ id: index + 1, name }));
              const selectedIds = catalog
                .filter((p) => interests.includes(p.name))
                .map((p) => p.id);
              if (!selectedIds.length) {
                toast.error('Selecciona al menos un gusto');
                return;
              }
              setGustosSaving(true);
              try {
                const result = await saveUserPreferences({
                  userId,
                  preferences: selectedIds,
                  createEvents: createsEvents,
                  provideServices: providesServices,
                  havePlace: hasVenue,
                });
                toast.success(result.message || 'Gustos guardados');
                setSubView(null);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'No se pudieron guardar los gustos');
              } finally {
                setGustosSaving(false);
              }
            })();
          }}
          className="mt-8 w-full rounded-full"
        >
          {gustosSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : 'Guardar gustos'}
        </Button>
      </div>
    );
  }

  if (subView === 'kyc') {
    return <KycCertificationView onBack={() => setSubView(null)} />;
  }

  if (subView === 'bancarios') {
    return <BankingHub onBack={() => setSubView(null)} />;
  }


  // ============ Main: Edit profile ============
  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-32 space-y-4 bg-[hsl(var(--secondary))] min-h-screen">
      <button onClick={onBack} className="flex items-center text-primary -mb-1">
        <ChevronLeft className="h-5 w-5" /> <span className="text-sm">Atrás</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold text-primary">Editar mis datos</h1>
      </div>

      {/* Datos de contacto accordion */}
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
        <button
          onClick={() => setContactOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4"
        >
          <span className="font-bold text-foreground">Datos de contacto</span>
          {contactOpen ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-primary" />}
        </button>
        {contactOpen && (
          <div className="px-5 pb-6 pt-1 space-y-5">
            <FloatField label="Nombres" value={nombres} onChange={setNombres} />
            <FloatField label="Apellidos" value={apellidos} onChange={setApellidos} />
            <div>
              <Label className="text-sm font-semibold">Fecha de nacimiento</Label>
              <div className="mt-1 flex items-center border-b border-muted-foreground/20">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="flex-1 bg-transparent py-2 text-sm focus:outline-none [color-scheme:light]"
                />
              </div>
            </div>
            <PhoneCountryFields
              indicative={phonePrefix}
              number={phone}
              onIndicativeChange={setPhonePrefix}
              onNumberChange={setPhone}
              indicativeLabel="Código de país"
              numberLabel="Número de celular"
            />
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">Correo electrónico</Label>
              <input
                value={email}
                disabled
                className="mt-1 w-full border-b border-muted-foreground/20 bg-transparent py-2 text-sm text-muted-foreground"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Nombre de usuario</Label>
              <div className="mt-1 flex items-center border-b border-muted-foreground/20">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                />
                {usernameOk && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary">
                    <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Descripción perfil</Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="mt-1 border-0 border-b rounded-none px-0 focus-visible:ring-0 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {(company?.companyName || company?.accountType === 'company' || company?.accountType === 'business') && (
        <div className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Datos de empresa</span>
          </div>
          {companyLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Cargando información…
            </p>
          ) : (
            <>
              {company?.companyName && (
                <div>
                  <p className="text-xs text-muted-foreground">Nombre comercial</p>
                  <p className="text-sm font-medium text-foreground">{company.companyName}</p>
                </div>
              )}
              {company?.companyIndustry && (
                <div>
                  <p className="text-xs text-muted-foreground">Industria</p>
                  <p className="text-sm font-medium text-foreground">{company.companyIndustry}</p>
                </div>
              )}
              {company?.companyWebsite && (
                <div>
                  <p className="text-xs text-muted-foreground">Sitio web</p>
                  <p className="text-sm font-medium text-primary">{company.companyWebsite}</p>
                </div>
              )}
              {company?.companyDescription && (
                <div>
                  <p className="text-xs text-muted-foreground">Descripción</p>
                  <p className="text-sm text-foreground leading-relaxed">{company.companyDescription}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mi suscripción */}
      <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
        <button
          onClick={() => setSubOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-4"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-muted-foreground">Mi suscripción</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground/80 px-2 py-1 text-xs font-semibold text-background">
                <CreditCard className="h-3 w-3" /> Plan {currentPlan}
              </span>
              <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">Activo</span>
            </div>
          </div>
          {subOpen ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-primary" />}
        </button>
        {subOpen && (
          <div className="px-5 pb-5 pt-1 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground">Tu plan incluye:</p>
              <button onClick={() => setSubView('plan-detail')} className="text-sm font-semibold text-primary">
                Ver detalles
              </button>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3"><CalendarDays className="h-5 w-5 text-primary shrink-0" /> 8 Eventos gratis al año</li>
              <li className="flex items-start gap-3"><Ticket className="h-5 w-5 text-primary shrink-0" /> 100 Boletos por evento</li>
              <li className="flex items-start gap-3"><Settings2 className="h-5 w-5 text-primary shrink-0" /> Configuración de boletos</li>
              <li className="flex items-start gap-3"><Armchair className="h-5 w-5 text-primary shrink-0" /> Diseña el Plano de Sillas y ubicaciones de tu Evento personalizado</li>
              <li className="flex items-start gap-3"><Map className="h-5 w-5 text-primary shrink-0" /> Cerca de ti: Mapa de Eventos, Lugares y Servicios</li>
            </ul>
            <button onClick={() => setSubView('plan-detail')} className="text-sm font-semibold text-primary">
              + 12 beneficios más...
            </button>
            <Button
              variant="outline"
              onClick={() => onUpgradePlan?.()}
              className="w-full rounded-xl border-muted-foreground/20"
            >
              <HandCoins className="mr-2 h-4 w-4" /> Gestionar suscripción
            </Button>
            <button
              onClick={() => toast.error('Suscripción cancelada')}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold text-destructive"
            >
              <X className="h-4 w-4" /> Cancelar suscripción
            </button>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground leading-relaxed">
          Actualmente los límites de publicación de eventos no están activos. Próximamente se habilitará el{' '}
          <span className="font-semibold text-primary">Plan PRO</span> con funcionalidades adicionales de pago.
        </p>
      </div>

      {/* Perfil privado */}
      <div className="flex items-center gap-3 rounded-2xl bg-card shadow-sm px-4 py-4">
        <Lock className="h-6 w-6 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-foreground">Perfil privado</p>
          <p className="text-xs text-muted-foreground">
            {privateProfile
              ? 'Solo tus seguidores pueden ver tu perfil, eventos, lugares y servicios'
              : 'Tu perfil y publicaciones son visibles para todos'}
          </p>
        </div>
        <Switch
          checked={privateProfile}
          disabled={!userId || visibilityBusy}
          onCheckedChange={(v) => void handleVisibilityToggle(v)}
        />
      </div>

      {/* Action rows */}
      <ActionRow icon={<KeyRound className="h-5 w-5 text-primary" />} label="Cambiar Contraseña"
        onClick={() => navigate('/auth/forgot-password')} />
      <ActionRow icon={<Smile className="h-5 w-5 text-primary" />} label="Editar gustos"
        onClick={() => setSubView('gustos')} />
      <ActionRow icon={<HandCoins className="h-5 w-5 text-primary" />} label="Editar / Agregar datos bancarios"
        onClick={() => setSubView('bancarios')} />
      <button
        type="button"
        onClick={() => setSubView('kyc')}
        className="flex w-full items-center gap-3 rounded-2xl bg-primary/5 px-4 py-4 shadow-sm border border-primary/20"
      >
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 text-left">
          <p className="font-bold text-foreground">Certificar mi identidad</p>
          <p className="text-xs text-muted-foreground">
            {kycStatus === 'verified' ? 'Identidad verificada' : 'Verifica tu identidad para mayor confianza'}
          </p>
        </div>
        {kycStatus === 'verified' ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Activo</span>
        ) : (
          <ChevronRight className="h-5 w-5 text-primary" />
        )}
      </button>

      <div className="pt-3">
        <Button
          disabled={saving}
          onClick={() => {
            void (async () => {
              setSaving(true);
              try {
                if (onSaveContact) {
                  await onSaveContact({
                    nombres,
                    apellidos,
                    phone,
                    phonePrefix,
                    username,
                    bio: descripcion,
                    fecha,
                  });
                } else {
                  toast.success('Cambios guardados');
                }
                onBack();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
              } finally {
                setSaving(false);
              }
            })();
          }}
          className="w-full rounded-full py-6 text-base font-bold"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
};

const FloatField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-sm font-semibold">{label}</Label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full border-b border-muted-foreground/20 bg-transparent py-2 text-sm focus:border-primary focus:outline-none"
    />
  </div>
);

const ActionRow = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-2xl bg-card shadow-sm px-4 py-4"
  >
    {icon}
    <span className="flex-1 text-left font-bold text-foreground">{label}</span>
    <ChevronRight className="h-5 w-5 text-primary" />
  </button>
);

export default EditProfileView;
