import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Search, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import {
  fetchAdminStaffUsers,
  updateAdminUser,
  useToast,
  type AdminStaffUser,
} from '@doevents/shared';

type StaffStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'cerrado';
type PlatformRole = 'admin' | 'support' | 'operation' | 'user';

const STATUS_LABELS: Record<StaffStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Activo',
  rechazado: 'Rechazado',
  cerrado: 'Bloqueado',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  support: 'Support',
  operation: 'Operation',
  user: 'Usuario',
};

function formatUserDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO');
}

export const AdminStaffTab: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminStaffUser[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | StaffStatus>('todos');
  const [selected, setSelected] = useState<AdminStaffUser | null>(null);
  const [assignRole, setAssignRole] = useState<PlatformRole | ''>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (query = debouncedSearch) => {
    setLoading(true);
    try {
      const data = await fetchAdminStaffUsers({ query, limit: 100 });
      setUsers(data.users || []);
      setSummary(data.summary || {});
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => users.filter((user) => {
    const matchesStatus = filterStatus === 'todos' || user.staffStatus === filterStatus;
    return matchesStatus;
  }), [users, filterStatus]);

  const patchUser = async (user: AdminStaffUser, patch: Parameters<typeof updateAdminUser>[1], successMessage: string) => {
    try {
      await updateAdminUser(user.userId, patch);
      showToast(successMessage, 'success');
      await load();
      setSelected(null);
      setAssignRole('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar', 'error');
    }
  };

  const grantPlatformRole = async () => {
    if (!selected || !assignRole) return;
    if (assignRole === 'user') {
      await patchUser(selected, { platformRole: 'user', status: 'active' }, 'Rol de usuario restaurado');
      return;
    }
    await patchUser(
      selected,
      { platformRole: assignRole, staffStatus: 'aprobado', staffRole: assignRole },
      assignRole === 'admin'
        ? 'Permisos de administrador otorgados. El usuario recibirá una notificación.'
        : `Rol ${ROLE_LABELS[assignRole]} otorgado. El usuario recibirá una notificación.`,
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Administración de Usuarios</h2>
        <p className="text-sm text-muted-foreground">
          Consulta y gestiona todos los usuarios registrados en la aplicación
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CountCard label="Total" value={summary.total ?? users.length} icon={Users} color="text-primary" />
        <CountCard label="Activos" value={summary.active ?? summary.approved ?? 0} icon={UserCheck} color="text-green-500" />
        <CountCard label="Bloqueados" value={summary.blocked ?? summary.closed ?? 0} icon={UserX} color="text-red-500" />
        <CountCard label="Administradores" value={summary.admins ?? 0} icon={ShieldCheck} color="text-indigo-500" />
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Usuarios registrados</h3>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm"
                placeholder="Buscar por nombre, @usuario, correo o ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Activos</option>
              <option value="rechazado">Rechazados</option>
              <option value="cerrado">Bloqueados</option>
            </select>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Cargando usuarios...</p>}
          {!loading && filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {search.trim()
                ? `No se encontraron usuarios para "${search.trim()}".`
                : 'No hay usuarios registrados para mostrar.'}
            </p>
          )}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2">Nombre</th>
                    <th className="px-3 py-2">Correo</th>
                    <th className="px-3 py-2">Usuario</th>
                    <th className="px-3 py-2">Registro</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Rol</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.userId} className="border-b border-border/60">
                      <td className="px-3 py-3 font-medium">{user.fullName || user.nombre || user.email}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{user.email}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {user.username ? `@${String(user.username).replace(/^@+/, '')}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">{formatUserDate(user.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                          {STATUS_LABELS[user.staffStatus || 'aprobado']}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {user.platformRole && user.platformRole !== 'user' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">
                            <ShieldCheck className="h-3 w-3" />
                            {ROLE_LABELS[user.platformRole] || user.platformRole}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Usuario</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          {user.platformRole !== 'admin' && (
                            <button
                              type="button"
                              className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
                              onClick={() => {
                                setSelected(user);
                                setAssignRole('admin');
                              }}
                            >
                              Hacer admin
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded-lg border border-border p-1.5"
                            onClick={() => {
                              setSelected(user);
                              setAssignRole((user.platformRole as PlatformRole) || 'user');
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
            <h3 className="text-lg font-bold">Gestionar permisos</h3>
            <p className="mt-1 text-sm text-muted-foreground">{selected.fullName || selected.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              El usuario recibirá una notificación por correo y en la campana de la app.
            </p>
            <div className="mt-4 space-y-3">
              <select
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value as PlatformRole | '')}
              >
                <option value="">Selecciona rol de plataforma</option>
                <option value="user">Usuario estándar</option>
                <option value="admin">Administrador</option>
                <option value="support">Soporte</option>
                <option value="operation">Operaciones</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => setSelected(null)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={!assignRole}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                onClick={() => void grantPlatformRole()}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function CountCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminStaffTab;
