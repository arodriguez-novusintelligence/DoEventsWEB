import { useCallback, useEffect, useState } from 'react';
import { Search, X, UserPlus, BookUser, ChevronDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { searchUsers } from '@doevents/shared';
import { EventHost } from '@lovable/data/eventFormData';

interface HostPickerModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (host: EventHost) => void;
  existingIds: string[];
}

type TabKey = 'search' | 'manual';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'search', label: 'Buscar contacto' },
  { key: 'manual', label: 'Manual' },
];

type SearchUserRow = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  initials: string;
};

const Avatar = ({ user }: { user: SearchUserRow }) => (
  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 ring-2 ring-primary/20 text-sm font-extrabold text-primary">
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
  user: SearchUserRow;
  added: boolean;
  onAdd: () => void;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary px-3 py-2.5 shadow-sm">
    <Avatar user={user} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-extrabold text-foreground">{user.name}</p>
      {user.username && <p className="truncate text-xs text-primary">@{user.username.replace(/^@/, '')}</p>}
      {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
    </div>
    <button
      type="button"
      onClick={onAdd}
      disabled={added}
      className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-extrabold text-primary-foreground transition-opacity disabled:opacity-50"
    >
      {added ? 'Agregado' : 'Agregar'}
    </button>
  </div>
);

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DE';
}

const HostPickerModal = ({ open, onClose, onAdd, existingIds }: HostPickerModalProps) => {
  const [tab, setTab] = useState<TabKey>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUserRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [manual, setManual] = useState({
    name: '',
    email: '',
    countryCode: '+57',
    phone: '',
    role: '',
  });

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    setSearched(true);
    setSearchError(false);
    try {
      const users = await searchUsers(trimmed);
      setResults(
        users
          .map((u) => ({
            id: String(u.id || '').trim(),
            name: u.name || u.username || 'Usuario',
            username: u.username,
            email: u.email,
            avatar: u.imagen || u.fotoPerfilUrl,
            initials: initialsFromName(u.name || u.username || 'U'),
          }))
          .filter((u) => u.id),
      );
    } catch {
      setResults([]);
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open || tab !== 'search') return;
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [open, tab, query, runSearch]);

  if (!open) return null;

  const addPlatform = (u: SearchUserRow) => {
    onAdd({
      id: u.id,
      name: u.name,
      username: u.username ? `@${u.username.replace(/^@/, '')}` : undefined,
      email: u.email,
      avatar: u.avatar,
      initials: u.initials,
      source: 'platform',
    });
  };

  const addManual = () => {
    if (!manual.name.trim()) return;
    if (manual.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manual.email.trim())) return;
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
    'w-full rounded-xl border border-border/60 bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl border border-border/60 bg-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Seleccionar anfitrión</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Busca en la plataforma o agrega manualmente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-border/60 px-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative flex-1 px-3 py-3 text-sm transition-colors ${
                  active ? 'font-extrabold text-primary' : 'font-medium text-muted-foreground hover:text-foreground'
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

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'search' && (
            <div className="space-y-3">
              <p className="text-sm font-extrabold text-foreground">
                Buscar por nombre, @usuario, email o teléfono
              </p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="@usuario, nombre o email"
                  className={`${inputCls} pl-9 pr-9 ring-2 ring-primary/20 border-primary/40`}
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
                {query.trim().length < 2 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <Search className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escribe al menos 2 caracteres para buscar usuarios de Do•events
                    </p>
                  </div>
                ) : searching ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                    <p className="text-sm font-extrabold text-foreground">Buscando…</p>
                  </div>
                ) : searchError ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                      <AlertCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <p className="text-sm font-extrabold text-destructive">Error al buscar usuarios</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1.5 rounded-full shadow-sm"
                      onClick={() => void runSearch(query)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reintentar
                    </Button>
                  </div>
                ) : searched && results.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <UserPlus className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No se encontraron usuarios con “{query}”
                    </p>
                  </div>
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
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                <BookUser className="h-4 w-4 shrink-0" />
                Agrega un anfitrión que no está registrado en la plataforma.
              </div>
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
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-extrabold text-primary-foreground shadow-sm disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" /> Agregar anfitrión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostPickerModal;
