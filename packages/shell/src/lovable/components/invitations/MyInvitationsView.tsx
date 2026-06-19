import { useState } from 'react';
import { Heart, Ticket, Mail, Loader2 } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import type { InvitationEvent } from '@lovable/data/invitationsData';

interface MyInvitationsViewProps {
  onBack: () => void;
  invitations?: InvitationEvent[];
  loading?: boolean;
  onOpenInvitation?: (invitation: InvitationEvent) => void;
}

const statusLabel: Record<InvitationEvent['status'], string> = {
  pendiente: 'Invitación pendiente',
  aceptada: 'Invitación aceptada',
  rechazada: 'Invitación rechazada',
};

const statusBadgeClass: Record<InvitationEvent['status'], string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  aceptada: 'bg-emerald-100 text-emerald-800',
  rechazada: 'bg-destructive/10 text-destructive',
};

const MyInvitationsView = ({
  onBack,
  invitations = [],
  loading = false,
  onOpenInvitation,
}: MyInvitationsViewProps) => {
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
      <ProfileSectionBanner
        title="Mis invitaciones a eventos"
        subtitle={`${invitations.length} invitación${invitations.length === 1 ? '' : 'es'} recibida${invitations.length === 1 ? '' : 's'}`}
        icon={Ticket}
        onBack={onBack}
      />

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando invitaciones…</p>
          </div>
        ) : invitations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sin invitaciones</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">
            Cuando te inviten a un evento, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <button
              key={inv.id}
              type="button"
              onClick={() => onOpenInvitation?.(inv)}
              className="flex w-full items-stretch gap-3 rounded-2xl bg-card shadow-sm text-left overflow-hidden transition-colors hover:bg-accent/40"
            >
              {inv.image ? (
                <img src={inv.image} alt={inv.title} className="h-36 w-28 flex-shrink-0 object-cover" />
              ) : (
                <div className="flex h-36 w-28 flex-shrink-0 items-center justify-center bg-muted text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
              <div className="flex-1 min-w-0 py-3 pr-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground leading-snug flex-1">{inv.title}</h3>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLiked((p) => ({ ...p, [inv.id]: !p[inv.id] }));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Heart
                      className={`h-4 w-4 ${liked[inv.id] ? 'fill-primary text-primary' : 'text-primary'}`}
                    />
                  </span>
                </div>
                <p className="text-xs text-foreground mt-2 font-mono">
                  {new Date(inv.receivedAt).toLocaleString('es-CO')}
                </p>
                <p className="text-xs text-muted-foreground mt-3">{inv.inviter}</p>
                <span className={`inline-block mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass[inv.status]}`}>
                  {statusLabel[inv.status]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default MyInvitationsView;
