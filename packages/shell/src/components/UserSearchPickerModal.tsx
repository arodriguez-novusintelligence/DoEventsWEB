import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { searchUsers, useToast, UserAvatar, resolveUserAvatarUrl } from '@doevents/shared';
import { Input } from '@lovable/components/ui/input';
import { Button } from '@lovable/components/ui/button';

export interface UserSearchResult {
  id: string;
  name: string;
  username?: string;
  email?: string;
  initials: string;
  avatarUrl?: string;
}

interface UserSearchPickerModalProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  confirmLabel?: string;
  alreadyAssigned?: string[];
  multiSelect?: boolean;
  onConfirm: (users: UserSearchResult[]) => void;
  onClose: () => void;
  onSelectSingle?: (user: UserSearchResult) => void;
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DE';
}

function normalizeSearchQuery(raw: string): string {
  return raw.trim().replace(/^@+/, '');
}

function isSearchReady(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('@')) return trimmed.length > 1;
  return trimmed.length >= 2;
}

function buildSearchTerm(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('@')) return trimmed;
  return normalizeSearchQuery(trimmed);
}

export const UserSearchPickerModal: React.FC<UserSearchPickerModalProps> = ({
  title,
  subtitle,
  searchPlaceholder = 'Nombre, @usuario o correo',
  confirmLabel = 'Asignar seleccionados',
  alreadyAssigned = [],
  multiSelect = true,
  onConfirm,
  onClose,
  onSelectSingle,
}) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(async (rawQuery: string) => {
    if (!isSearchReady(rawQuery)) {
      setResults([]);
      setSearched(false);
      return;
    }
    const searchTerm = buildSearchTerm(rawQuery);
    const requestId = ++requestIdRef.current;
    setSearching(true);
    setSearched(true);
    try {
      const users = await searchUsers(searchTerm);
      if (requestId !== requestIdRef.current) return;
      setResults(
        users
          .map((u) => ({
            id: String(u.id || '').trim(),
            name: u.name || u.username || 'Usuario',
            username: u.username,
            email: u.email,
            initials: initialsFromName(u.name || u.username || 'U'),
            avatarUrl: resolveUserAvatarUrl(u.imagen || u.fotoPerfilUrl, u.id),
          }))
          .filter((u) => u.id),
      );
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      showToast(err instanceof Error ? err.message : 'Error al buscar usuarios', 'error');
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) setSearching(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isSearchReady(query)) {
      setResults([]);
      setSearched(false);
      return undefined;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const toggle = (id: string) => {
    if (!multiSelect && onSelectSingle) {
      const user = results.find((u) => u.id === id);
      if (user) onSelectSingle(user);
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const picked = results.filter((u) => selected.has(u.id));
    if (!picked.length) {
      showToast('Selecciona al menos un usuario', 'error');
      return;
    }
    onConfirm(picked);
  };

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="flex max-h-[88vh] w-full max-w-md flex-col rounded-3xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 pr-2">
            <h3 className="text-base font-bold text-primary">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-1.5 text-xs font-semibold text-foreground">Buscar por nombre de usuario</p>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void runSearch(query); }}
                placeholder={searchPlaceholder}
                className="h-11 rounded-xl pl-9"
                autoFocus
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0 rounded-xl px-4"
              disabled={searching || !isSearchReady(query)}
              onClick={() => void runSearch(query)}
            >
              {searching ? '…' : 'Buscar'}
            </Button>
          </div>

          {multiSelect && (
            <p className="mb-3 text-xs text-muted-foreground">
              Seleccionados: <span className="font-bold text-primary">{selected.size}</span>
            </p>
          )}

          <div className="space-y-2">
            {searching && (
              <p className="py-4 text-center text-sm text-muted-foreground">Buscando…</p>
            )}
            {!searching && searched && results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
            )}
            {!searching && !searched && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Escribe @usuario o el nombre para ver resultados al instante.
              </p>
            )}
            {results.map((u) => {
              const isAlready = alreadyAssigned.includes(u.id);
              const isSelected = selected.has(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={isAlready}
                  onClick={() => toggle(u.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    isAlready
                      ? 'cursor-not-allowed border-border/50 opacity-50'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-secondary/50'
                  }`}
                >
                  <UserAvatar name={u.name} imageUrl={u.avatarUrl} userId={u.id} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.username ? `@${u.username.replace(/^@/, '')}` : u.email || ''}
                    </p>
                  </div>
                  {isAlready && (
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Asignado</span>
                  )}
                  {multiSelect && isSelected && !isAlready && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {multiSelect && (
          <div className="border-t border-border px-5 py-4">
            <Button
              type="button"
              className="w-full rounded-full py-5 font-bold"
              disabled={selected.size === 0}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default UserSearchPickerModal;
