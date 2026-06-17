import React, { useEffect, useState } from 'react';
import {
  Ban,
  BarChart3,
  DollarSign,
  Info,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  PartyPopper,
  Phone,
  Search,
  Shield,
  Star,
  Ticket,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  deleteAdminUser,
  fetchAdminPlatformRoles,
  fetchAdminUserActivity,
  getAdminUser,
  searchAdminUsers,
  updateAdminUser,
  useToast,
  type AdminPlatformRole,
  type AdminSupportProfile,
  type AdminUserActivityResponse,
  type AdminUserSummary,
} from '@doevents/shared';

type Step = 'search' | 'select' | 'profile';

export const AdminSupportTab: React.FC = () => {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdminUserSummary[]>([]);
  const [profile, setProfile] = useState<AdminSupportProfile | null>(null);
  const [userMeta, setUserMeta] = useState<AdminUserSummary | null>(null);
  const [activity, setActivity] = useState<AdminUserActivityResponse | null>(null);
  const [roles, setRoles] = useState<AdminPlatformRole[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const [selectedRole, setSelectedRole] = useState('user');

  useEffect(() => {
    void fetchAdminPlatformRoles().then(setRoles).catch(() => undefined);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const users = await searchAdminUsers(query.trim(), 20);
      if (!users.length) {
        showToast('No se encontraron usuarios', 'error');
        return;
      }
      setResults(users);
      setStep('select');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al buscar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const [data, act] = await Promise.all([
        getAdminUser(userId),
        fetchAdminUserActivity(userId).catch(() => null),
      ]);
      if (!data.profile) throw new Error('Perfil no disponible');
      setProfile(data.profile);
      setUserMeta(data);
      setActivity(act);
      setSelectedPlan((data.plan === 'pro' ? 'pro' : 'free'));
      setSelectedRole(data.platformRole || 'user');
      setStep('profile');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!profile) return;
    await loadProfile(profile.id);
  };

  const patchUser = async (patch: Parameters<typeof updateAdminUser>[1], message: string) => {
    if (!profile) return;
    setLoading(true);
    try {
      const updated = await updateAdminUser(profile.id, patch);
      setUserMeta(updated);
      showToast(message, 'success');
      await refreshUser();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const blockUser = () => void patchUser({ status: 'blocked' }, 'Usuario bloqueado');
  const unblockUser = () => void patchUser({ status: 'active', blacklisted: false }, 'Usuario desbloqueado');
  const blacklistUser = () => void patchUser({ blacklisted: true, status: 'blocked' }, 'Usuario en lista negra');
  const savePlan = () => void patchUser({ plan: selectedPlan }, `Plan actualizado a ${selectedPlan}`);
  const saveRole = () => void patchUser({ platformRole: selectedRole }, 'Rol actualizado');

  const deleteUser = async (blacklist: boolean) => {
    if (!profile) return;
    const msg = blacklist
      ? '¿Eliminar usuario y añadirlo a lista negra? No podrá volver a registrarse.'
      : '¿Eliminar usuario de la aplicación?';
    if (!window.confirm(msg)) return;
    setLoading(true);
    try {
      await deleteAdminUser(profile.id, { blacklist });
      showToast(blacklist ? 'Usuario eliminado y en lista negra' : 'Usuario eliminado', 'success');
      reset();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('search');
    setQuery('');
    setResults([]);
    setProfile(null);
    setUserMeta(null);
    setActivity(null);
  };

  const isBlocked = ['blocked', 'suspended', 'deleted'].includes(String(userMeta?.status || profile?.accountStatus || '').toLowerCase());

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {step !== 'search' && (
        <button type="button" onClick={step === 'profile' ? reset : () => setStep('search')} className="text-sm text-muted-foreground">
          ← Atrás
        </button>
      )}

      {step === 'search' && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Search className="h-5 w-5 text-primary" />
            Buscar usuario
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Busca por nombre, @usuario, correo o ID para gestionar la cuenta.</p>
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="Nombre, correo o ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            />
            <button
              type="button"
              disabled={loading || !query.trim()}
              onClick={() => void handleSearch()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {step === 'select' && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-bold">Resultados</h2>
          <div className="mt-3 space-y-2">
            {results.map((user) => (
              <button
                key={user.userId}
                type="button"
                disabled={loading}
                onClick={() => void loadProfile(user.userId)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-left hover:bg-secondary/50"
              >
                <div>
                  <p className="font-medium">{user.nombre || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.platformRole || 'user'} · {user.plan || 'free'} · {user.status || 'active'}
                    {user.blacklisted ? ' · lista negra' : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">Ver perfil →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'profile' && profile && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {profile.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{profile.fullName}</h2>
                <p className="text-sm text-muted-foreground">{profile.username}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge label={userMeta?.platformRole || profile.platformRole || 'user'} />
                  <Badge label={userMeta?.plan || profile.subscriptionPlan} />
                  <Badge label={userMeta?.status || profile.accountStatus || 'active'} danger={isBlocked} />
                  {userMeta?.blacklisted && <Badge label="Lista negra" danger />}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-semibold">Plan y rol</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="text-muted-foreground">Plan</span>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as 'free' | 'pro')}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted-foreground">Rol de plataforma</span>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {(roles.length ? roles : [
                    { id: 'user', label: 'Usuario' },
                    { id: 'operation', label: 'Operaciones' },
                    { id: 'support', label: 'Soporte' },
                    { id: 'admin', label: 'Administrador' },
                  ]).map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionBtn onClick={savePlan} disabled={loading}>Guardar plan</ActionBtn>
              <ActionBtn onClick={saveRole} disabled={loading}>Guardar rol</ActionBtn>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <ProfileStat icon={<PartyPopper className="h-5 w-5 text-indigo-500" />} label="Eventos" value={profile.eventsCreated} />
            <ProfileStat icon={<MapPin className="h-5 w-5 text-blue-500" />} label="Lugares" value={profile.venues} />
            <ProfileStat icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} label="Servicios" value={profile.services} />
            <ProfileStat icon={<Ticket className="h-5 w-5 text-orange-400" />} label="Boletas" value={profile.ticketsPurchased} />
          </div>

          {activity?.content && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-semibold">Contenido publicado</h3>
              <div className="mt-3 space-y-3 text-sm">
                <ContentGroup title="Eventos" items={activity.content.events.map((e) => ({ id: e.id, label: e.nombre }))} />
                <ContentGroup title="Lugares" items={activity.content.venues.map((v) => ({ id: v.venueId, label: v.name }))} />
                <ContentGroup title="Servicios" items={activity.content.services.map((s) => ({ id: s.serviceId, label: s.name }))} />
              </div>
            </section>
          )}

          {activity?.auditLog && activity.auditLog.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-semibold">Actividad administrativa</h3>
              <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                {activity.auditLog.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border px-3 py-2">
                    <p>{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.type} · {item.createdAt}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <h3 className="font-semibold text-destructive">Acciones de moderación</h3>
            {!isBlocked ? (
              <button type="button" disabled={loading} onClick={blockUser} className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/90 px-4 py-3 text-sm font-semibold text-destructive-foreground">
                <Ban className="h-4 w-4" /> Bloquear usuario
              </button>
            ) : (
              <button type="button" disabled={loading} onClick={unblockUser} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-600">
                <UserCheck className="h-4 w-4" /> Desbloquear usuario
              </button>
            )}
            <button type="button" disabled={loading} onClick={blacklistUser} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive px-4 py-3 text-sm font-semibold text-destructive">
              <Shield className="h-4 w-4" /> Lista negra (bloquear re-registro)
            </button>
            <button type="button" disabled={loading} onClick={() => void deleteUser(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground">
              <Trash2 className="h-4 w-4" /> Eliminar y lista negra
            </button>
          </section>

          <button type="button" onClick={reset} className="w-full rounded-xl border border-border py-2 text-sm font-semibold">
            Nueva búsqueda
          </button>
        </div>
      )}
    </div>
  );
};

function Badge({ label, danger }: { label?: string; danger?: boolean }) {
  if (!label) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${danger ? 'bg-destructive/10 text-destructive' : 'bg-secondary'}`}>
      {label}
    </span>
  );
}

function ActionBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
      {children}
    </button>
  );
}

function ContentGroup({ title, items }: { title: string; items: Array<{ id: string; label: string }> }) {
  if (!items.length) return <p className="text-muted-foreground">{title}: ninguno</p>;
  return (
    <div>
      <p className="font-medium">{title} ({items.length})</p>
      <ul className="mt-1 space-y-1 text-muted-foreground">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="truncate">· {item.label}</li>
        ))}
        {items.length > 5 && <li>… y {items.length - 5} más</li>}
      </ul>
    </div>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-3 flex items-center justify-between">{icon}<span className="text-xl font-bold">{value}</span></div>
    </div>
  );
}

export default AdminSupportTab;
