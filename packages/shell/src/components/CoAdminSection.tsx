import React, { useState } from 'react';
import {
  assignCoAdmin,
  isEntityOwner,
  searchUsers,
  useToast,
  type CoAdminEntityType,
} from '@doevents/shared';

interface CoAdminSectionProps {
  entityType: CoAdminEntityType;
  entityId: string;
  ownerUserId: string;
  currentUserId?: string | null;
  coAdminIds?: string[];
  entityName?: string;
  onAssigned?: (coAdminIds: string[]) => void;
}

export const CoAdminSection: React.FC<CoAdminSectionProps> = ({
  entityType,
  entityId,
  ownerUserId,
  currentUserId,
  coAdminIds = [],
  entityName,
  onAssigned,
}) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; username?: string; nombre?: string }>>([]);
  const [localCoAdmins, setLocalCoAdmins] = useState(coAdminIds);

  if (!isEntityOwner(currentUserId, ownerUserId)) {
    return null;
  }

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      showToast('Escribe al menos 2 caracteres', 'error');
      return;
    }
    setSearching(true);
    try {
      const users = await searchUsers(q);
      setResults(
        users
          .map((u) => ({
            id: String(u.id || '').trim(),
            username: u.username,
            nombre: u.name || u.username || 'Usuario',
          }))
          .filter((u) => u.id),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al buscar usuarios', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = async (targetUserId: string) => {
    if (!currentUserId) return;
    setAssigning(true);
    try {
      const updated = await assignCoAdmin({
        entityType,
        entityId,
        ownerUserId: currentUserId,
        coAdminUserId: targetUserId,
      });
      setLocalCoAdmins(updated);
      onAssigned?.(updated);
      setResults([]);
      setQuery('');
      showToast('Co-administrador designado. Se envió una notificación.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo designar co-admin', 'error');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-bold">Co-administradores</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Invita a otro usuario para que también pueda editar {entityName || 'este contenido'}.
        </p>
      </div>

      {localCoAdmins.length > 0 && (
        <ul className="text-sm space-y-1">
          {localCoAdmins.map((id) => (
            <li key={id} className="text-muted-foreground">• Usuario {id}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuario o nombre"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={searching}
          onClick={() => void handleSearch()}
          className="rounded-xl bg-muted px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {searching ? '…' : 'Buscar'}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
            >
              <span className="text-sm truncate">
                {user.nombre || user.username}
                {user.username && user.nombre ? ` (@${user.username})` : ''}
              </span>
              <button
                type="button"
                disabled={assigning || localCoAdmins.includes(user.id) || user.id === ownerUserId}
                onClick={() => void handleAssign(user.id)}
                className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {localCoAdmins.includes(user.id) ? 'Ya asignado' : 'Designar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoAdminSection;
