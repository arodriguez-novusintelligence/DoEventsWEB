import { useMemo, useState } from 'react';
import { Search, X, UserPlus, BookUser, Pencil, ChevronDown } from 'lucide-react';
import { EventHost } from '@lovable/data/eventFormData';
import { platformUsers, searchPlatformUsers, PlatformUser } from '@lovable/data/platformUsers';

import { searchUsers } from '@doevents/shared';
interface HostPickerModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (host: EventHost) => void;
  existingIds: string[];
}

type TabKey = 'search' | 'manual' | 'contacts';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'search', label: 'Buscar contacto' },
  { key: 'manual', label: 'Manual' },
  { key: 'contacts', label: 'Contactos' },
];

const Avatar = ({ user }: { user: PlatformUser }) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-bold text-primary">
    {user.avatar ? (
      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
    ) : (
      user.initials
    )}
  </div>
);

const UserRow = ({
  user,
  added,
  onAdd,
}: {
  user: PlatformUser;
  added: boolean;
  onAdd: () => void;
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-secondary px-3 py-2.5">
    <Avatar user={user} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
      <p className="truncate text-xs text-primary">{user.username}</p>
      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
    </div>
    <button
      type="button"
      onClick={onAdd}
      disabled={added}
      className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity disabled:opacity-50"
    >
      {added ? 'Agregado' : 'Agregar'}
    </button>
  </div>
);

const HostPickerModal = ({ open, onClose, onAdd, existingIds }: HostPickerModalProps) => {
  const [tab, setTab] = useState<TabKey>('search');
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState({
    name: '',
    email: '',
    countryCode: '+57',
    phone: '',
    role: '',
  });

  const results = useMemo(() => searchPlatformUsers(query), [query]);

  if (!open) return null;

  const addPlatform = (u: PlatformUser) => {
    onAdd({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      initials: u.initials,
      phone: u.phone,
      countryCode: u.countryCode,
      source: u.id.startsWith('u-') ? 'platform' : 'contact',
    });
  };

  const addManual = () => {
    if (!manual.name.trim()) return;
    onAdd({
      id: `host-${Date.now()}`,
      name: manual.name.trim(),
      email: manual.email.trim() || undefined,
      phone: manual.phone.trim() || undefined,
      countryCode: manual.countryCode,
      role: manual.role.trim() || undefined,
      initials: manual.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      source: 'manual',
    });
    setManual({ name: '', email: '', countryCode: '+57', phone: '', role: '' });
  };

  const inputCls =
    'w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/50 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-lg font-bold text-foreground">Seleccionar anfitrión</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative flex-1 px-3 py-3 text-sm font-semibold transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'search' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Buscar por nombre, @usuario o email
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="@usuario, nombre o email"
                  className={`${inputCls} pl-9 pr-9 ring-2 ring-primary/40 border-primary`}
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                    aria-label="Limpiar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {query.trim() === '' ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Empieza a escribir para buscar usuarios de Do•events
                  </p>
                ) : results.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron usuarios con “{query}”
                  </p>
                ) : (
                  results.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      added={existingIds.includes(u.id)}
                      onAdd={() => addPlatform(u)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'manual' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Agrega un anfitrión que no está registrado en la plataforma.
              </p>
              <input
                type="text"
                value={manual.name}
                onChange={(e) => setManual({ ...manual, name: e.target.value })}
                placeholder="Nombre del anfitrión"
                className={inputCls}
              />
              <input
                type="text"
                value={manual.role}
                onChange={(e) => setManual({ ...manual, role: e.target.value })}
                placeholder="Rol (opcional)"
                className={inputCls}
              />
              <input
                type="email"
                value={manual.email}
                onChange={(e) => setManual({ ...manual, email: e.target.value })}
                placeholder="Correo electrónico"
                className={inputCls}
              />
              <div className="flex gap-2">
                <div className="relative w-28">
                  <select
                    value={manual.countryCode}
                    onChange={(e) => setManual({ ...manual, countryCode: e.target.value })}
                    className={`${inputCls} appearance-none pr-8`}
                  >
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+52">🇲🇽 +52</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                </div>
                <input
                  type="tel"
                  value={manual.phone}
                  onChange={(e) => setManual({ ...manual, phone: e.target.value })}
                  placeholder="Número de celular"
                  className={`${inputCls} flex-1`}
                />
              </div>
              <button
                type="button"
                onClick={addManual}
                disabled={!manual.name.trim()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" /> Agregar anfitrión
              </button>
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-accent/60 p-3 text-xs text-accent-foreground">
                <BookUser className="h-4 w-4 shrink-0" />
                Estos son contactos de demostración importados desde tu agenda.
              </div>
              {platformUsers.slice(0, 6).map((u) => (
                <UserRow
                  key={`c-${u.id}`}
                  user={u}
                  added={existingIds.includes(u.id)}
                  onAdd={() => addPlatform(u)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostPickerModal;