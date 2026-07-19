import { ChevronLeft, Heart, MailOpen, Loader2 } from 'lucide-react';
import type { InvitationEvent } from '@lovable/data/invitationsData';

interface MyInvitationsViewProps {
  onBack: () => void;
  invitations?: InvitationEvent[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onOpenInvitation?: (inv: InvitationEvent) => void;
}

const MyInvitationsView = ({
  onBack,
  invitations = [],
  loading = false,
  loadError = null,
  onRetry,
  onOpenInvitation,
}: MyInvitationsViewProps) => {
  const formatReceived = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
          >
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
              <MailOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight text-primary-foreground">Mis invitaciones</h1>
              <p className="text-xs text-primary-foreground/80">
                {loading ? 'Cargando…' : `${invitations.length} invitación${invitations.length === 1 ? '' : 'es'} recibida${invitations.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm">Cargando invitaciones…</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-semibold text-destructive">{loadError}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {!loading && !loadError && invitations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <MailOpen className="h-7 w-7 text-primary" />
            </div>
            <p className="text-base font-bold text-foreground">No tienes invitaciones pendientes</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando te inviten a un evento, aparecerá aquí.
            </p>
          </div>
        )}

        {!loading && !loadError && invitations.length > 0 && (
          <div className="space-y-4">
            {invitations.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => onOpenInvitation?.(inv)}
                className="flex w-full items-stretch gap-3 overflow-hidden rounded-2xl bg-card text-left shadow-sm transition-colors hover:bg-accent/40"
              >
                <img
                  src={inv.image || undefined}
                  alt={inv.title}
                  className="h-36 w-28 flex-shrink-0 bg-muted object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied === '1') return;
                    img.dataset.fallbackApplied = '1';
                    img.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="min-w-0 flex-1 py-3 pr-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex-1 text-base font-bold leading-snug text-foreground">{inv.title}</h3>
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-4 w-4 text-primary" />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs text-foreground">{formatReceived(inv.receivedAt)}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{inv.inviter}</p>
                  <p className="mt-1 text-sm text-foreground">
                    {inv.status === 'aceptada'
                      ? 'Invitación aceptada'
                      : inv.status === 'rechazada'
                        ? 'Invitación rechazada'
                        : 'Invitación pendiente'}
                  </p>
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
