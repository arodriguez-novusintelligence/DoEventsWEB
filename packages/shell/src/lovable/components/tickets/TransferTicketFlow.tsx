import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Check,
  ArrowLeftRight,
  UserPlus,
  AlertCircle,
  Search,
  X,
  Calendar,
  Clock,
} from 'lucide-react';
import { searchUsers } from '@doevents/shared';
import type { Ticket } from '@lovable/data/ticketsData';
import { toast } from 'sonner';

export interface BoletaEntry {
  id: string;
  code: string;
  date: string;
  qrData: string;
  qrUrl?: string;
  value: number;
  ticketInstanceId: string;
}

export interface TransferRecipient {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  initials: string;
}

interface Props {
  ticket: Ticket;
  entries: BoletaEntry[];
  currentUserId?: string;
  onClose: () => void;
  onCompleted: (transferredIds: string[], recipient: TransferRecipient) => Promise<void>;
}

type Step = 'select' | 'summary' | 'searchUser' | 'confirm' | 'success';

const formatCOP = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

const TRANSFER_STEPS: Step[] = ['select', 'summary', 'searchUser', 'confirm', 'success'];

const TransferStepProgress = ({ current }: { current: Step }) => {
  const idx = TRANSFER_STEPS.indexOf(current);
  if (idx < 0 || current === 'success') return null;
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 pt-3">
      {TRANSFER_STEPS.slice(0, -1).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 max-w-14 rounded-full transition-colors ${i <= idx ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  );
};

const initialsFrom = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';

const TransferTicketFlow = ({ ticket, entries, currentUserId, onClose, onCompleted }: Props) => {
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set(entries[0]?.id ? [entries[0].id] : []));
  const [recipient, setRecipient] = useState<TransferRecipient | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TransferRecipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedEntries = useMemo(() => entries.filter((e) => selected.has(e.id)), [entries, selected]);
  const totalValue = selectedEntries.reduce((s, e) => s + e.value, 0);

  useEffect(() => {
    if (step !== 'searchUser') return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchUsers(q)
        .then((users) => {
          if (cancelled) return;
          setResults(
            users
              .filter((u) => !currentUserId || u.id !== currentUserId)
              .map((u) => {
              const name = u.name || u.username || u.email || 'Usuario';
              const username = u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : '';
              return {
                id: u.id || u.email || name,
                name,
                username,
                email: u.email,
                avatar: u.imagen,
                initials: initialsFrom(name),
              };
            }),
          );
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, step, currentUserId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === entries.length) setSelected(new Set());
    else setSelected(new Set(entries.map((e) => e.id)));
  };

  const confirmTransfer = async () => {
    if (!recipient || submitting) return;
    setSubmitting(true);
    try {
      await onCompleted(Array.from(selected), recipient);
      setStep('success');
      toast.success('Boletas compartidas correctamente', {
        description: 'Se generó un nuevo código QR asociado al perfil del destinatario.',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo compartir las boletas');
    } finally {
      setSubmitting(false);
    }
  };

  const qrImage = (entry: BoletaEntry, size = 200) =>
    entry.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(entry.qrData)}`;

  const entryLocationLabel = (entry: BoletaEntry) => {
    const lower = ticket.category.toLowerCase();
    if (lower.includes('silla') || lower.includes('asiento') || lower.includes('seat')) {
      return `Silla - ${entry.code}`;
    }
    if (lower.includes('vip') || lower.includes('palco')) {
      return `${ticket.category} - ${entry.code}`;
    }
    return `Entrada - ${entry.code}`;
  };

  if (entries.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-secondary px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <AlertCircle className="h-7 w-7 text-primary" />
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">No hay boletas para transferir</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Este ticket no tiene entradas disponibles para compartir.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-secondary overflow-y-auto">
      <TransferStepProgress current={step} />
      {step === 'select' && (
        <div className="min-h-screen flex flex-col pb-40">
          <div className="px-4 pt-4">
            <button type="button" onClick={onClose} className="flex items-center gap-1 text-primary font-medium">
              <ChevronLeft className="h-5 w-5" /> Atrás
            </button>
          </div>

          <div className="px-4 pt-3">
            <h1 className="text-2xl font-extrabold text-foreground">Selecciona las boletas a compartir</h1>
            <p className="text-sm text-muted-foreground mt-1">Toca cada boleta que quieras compartir con otro usuario.</p>
          </div>

          <div className="px-4 pt-5">
            <button type="button" onClick={toggleAll} className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded border-2 grid place-items-center ${
                selected.size === entries.length ? 'bg-primary border-primary' : 'border-primary'
              }`}>
                {selected.size === entries.length && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
              <span className="font-bold text-foreground">Seleccionar todas las boletas</span>
            </button>
            <p className="text-sm text-primary mt-3">
              {selected.size} de {entries.length} boletas seleccionadas
            </p>
          </div>

          <div className="px-4 pt-5 space-y-4">
            {entries.map((e) => {
              const isSel = selected.has(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`w-full text-left rounded-3xl bg-card overflow-hidden border-2 transition-all ${
                    isSel ? 'border-primary shadow-md' : 'border-transparent shadow-sm'
                  }`}
                >
                  <div className="relative h-40">
                    {ticket.eventImage ? (
                      <img src={ticket.eventImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className={`absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center ${
                      isSel ? 'bg-primary' : 'bg-card/80 border border-border'
                    }`}>
                      {isSel && <Check className="h-5 w-5 text-primary-foreground" />}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Categoría</p>
                        <span className="inline-block mt-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary uppercase">
                          {ticket.category}
                        </span>
                        <p className="mt-2 text-sm font-extrabold text-foreground">{entryLocationLabel(e)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Puerta</p>
                        <p className="mt-1 text-sm font-extrabold text-foreground">{ticket.entrance || 'Entrada principal'}</p>
                      </div>
                    </div>
                    <div className="flex justify-center pt-2">
                      <img src={qrImage(e)} alt="QR" className="h-32 w-32" />
                    </div>
                    <p className="text-center text-xs font-medium text-muted-foreground break-all">{e.qrData}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Boletas a compartir</span>
                <span className="text-2xl font-extrabold text-primary">{selected.size}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => setStep('summary')}
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="min-h-screen flex flex-col pb-36">
          <div className="px-4 pt-4">
            <button type="button" onClick={() => setStep('select')} className="flex items-center gap-1 text-primary font-medium">
              <ChevronLeft className="h-5 w-5" /> Volver
            </button>
            <h1 className="mt-3 text-2xl font-extrabold text-primary leading-tight">
              Resumen de boletas a compartir
            </h1>
            <p className="text-sm text-foreground mt-2">Revisa los detalles antes de proceder</p>
          </div>

          <div className="px-4 pt-5 space-y-5">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-extrabold text-foreground">¡Importante!</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Al compartir, la boleta queda asociada al perfil del destinatario con un nuevo QR. Revisa bien los datos antes de continuar.
              </p>
            </div>

            <div>
              <p className="font-bold text-foreground mb-3">({selected.size}) Boletas a compartir con:</p>
              <button
                type="button"
                onClick={() => setStep('searchUser')}
                className={`w-full rounded-2xl border-2 border-dashed py-4 px-4 flex items-center justify-center gap-2 transition-colors ${
                  recipient ? 'border-primary bg-primary/5' : 'border-primary/50'
                }`}
              >
                {recipient ? (
                  <div className="flex items-center gap-3">
                    {recipient.avatar ? (
                      <img src={recipient.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
                        {recipient.initials}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{recipient.username || recipient.email}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-primary">Seleccionar destinatario</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-3xl bg-card shadow-sm overflow-hidden">
              {ticket.eventImage && (
                <div className="h-44">
                  <img src={ticket.eventImage} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-extrabold text-foreground">{ticket.eventTitle}</h2>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Categoría</p>
                    <span className="inline-block mt-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground uppercase">
                      {ticket.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Asiento</p>
                    <p className="mt-1 text-sm font-extrabold text-foreground">{ticket.seatLabel || ticket.seat || 'General'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 space-y-3">
            <div className="mx-auto max-w-lg space-y-3">
              <button
                type="button"
                disabled={!recipient}
                onClick={() => setStep('confirm')}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow disabled:opacity-50"
              >
                Compartir boletas
              </button>
              <button type="button" onClick={onClose} className="w-full rounded-full border-2 border-primary py-3 text-sm font-bold text-primary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'searchUser' && (
        <div className="min-h-screen px-4 pt-4 pb-8">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => setStep('summary')} className="mt-2 text-primary">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-extrabold text-primary leading-tight">
              Buscar usuario para compartir
            </h1>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold text-foreground mb-2">Buscar por nombre de usuario o correo</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@usuario o correo"
                className="w-full rounded-2xl bg-card border border-border pl-12 pr-12 py-3.5 text-base outline-none focus:border-primary"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-foreground/70 grid place-items-center">
                  <X className="h-4 w-4 text-background" />
                </button>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {searching ? 'Buscando…' : `${results.length} resultado${results.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="mt-4 divide-y divide-border">
            {results.map((u) => {
              const isSel = recipient?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { setRecipient(u); setStep('summary'); }}
                  className="w-full py-3 flex items-center gap-3 text-left"
                >
                  <div className={`h-6 w-6 rounded border-2 grid place-items-center ${
                    isSel ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {isSel && <Check className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
                      {u.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{u.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{u.username}</p>
                    {u.email && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                  </div>
                </button>
              );
            })}
            {!searching && query.trim() && results.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No encontramos usuarios con ese criterio.</p>
            )}
          </div>
        </div>
      )}

      {step === 'confirm' && recipient && (
        <div className="min-h-screen pb-32">
          <div className="px-4 pt-4">
            <button type="button" onClick={() => setStep('summary')} className="text-foreground">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 pt-6 flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-primary grid place-items-center shadow-lg">
              <ArrowLeftRight className="h-12 w-12 text-primary-foreground" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold text-foreground">Confirmar compartir boleta</h1>
          </div>

          <div className="px-4 pt-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-2">Compartir boleta con:</p>
              <div className="rounded-2xl bg-card p-4 flex items-center gap-3 shadow-sm">
                {recipient.avatar ? (
                  <img src={recipient.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold">
                    {recipient.initials}
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-foreground">{recipient.name}</p>
                  <p className="text-sm text-muted-foreground">{recipient.username || recipient.email}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-2">Evento</p>
              <div className="rounded-2xl bg-card p-3 flex gap-3 shadow-sm">
                {ticket.eventImage && (
                  <img src={ticket.eventImage} alt="" className="h-20 w-20 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-extrabold text-foreground">{ticket.eventTitle}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground" /> {ticket.eventDate}
                  </div>
                  {ticket.startTime && (
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" /> {ticket.startTime}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide font-bold text-muted-foreground mb-2">Boletas ({selectedEntries.length})</p>
              <div className="space-y-4">
                {selectedEntries.map((e, idx) => (
                  <div key={e.id} className="rounded-2xl bg-card overflow-hidden shadow-sm">
                    {ticket.eventImage && (
                      <div className="h-32">
                        <img src={ticket.eventImage} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Boleta</p>
                        <p className="font-extrabold text-foreground">Boleta #{idx + 1}</p>
                        <p className="mt-3 text-[10px] uppercase font-bold text-muted-foreground">Categoría</p>
                        <span className="inline-block mt-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground uppercase">
                          {ticket.category}
                        </span>
                        {e.value > 0 && (
                          <>
                            <p className="mt-3 text-[10px] uppercase font-bold text-muted-foreground">Valor</p>
                            <p className="font-extrabold text-primary">{formatCOP(e.value)}</p>
                          </>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Fecha</p>
                        <p className="font-extrabold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" /> {ticket.eventDate}
                        </p>
                        {ticket.startTime && (
                          <>
                            <p className="mt-3 text-[10px] uppercase font-bold text-muted-foreground">Hora</p>
                            <p className="font-extrabold text-foreground flex items-center gap-1.5">
                              <Clock className="h-4 w-4" /> {ticket.startTime}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="col-span-2 border-t border-border pt-3 flex flex-col items-center">
                        <img src={qrImage(e)} alt="QR" className="h-32 w-32" />
                        <p className="mt-2 text-xs text-muted-foreground tracking-wider break-all text-center">{e.qrData}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border-l-4 border-primary p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">
                Al confirmar, se generará un nuevo QR vinculado al perfil del destinatario.
              </p>
            </div>

            {totalValue > 0 && (
              <div className="rounded-2xl bg-card p-4 flex justify-between items-center shadow-sm">
                <span className="font-bold text-foreground">Total a transferir</span>
                <span className="text-xl font-extrabold text-primary">{formatCOP(totalValue)}</span>
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4">
            <div className="mx-auto max-w-lg">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmTransfer()}
                className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow disabled:opacity-50"
              >
                {submitting ? 'Compartiendo…' : 'Confirmar y compartir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && recipient && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="h-28 w-28 rounded-full bg-primary grid place-items-center shadow-xl">
            <Check className="h-16 w-16 text-primary-foreground" strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-foreground">¡Boleta compartida!</h1>
          <p className="mt-3 text-foreground">
            {selectedEntries.length} {selectedEntries.length === 1 ? 'boleta compartida' : 'boletas compartidas'} con{' '}
            <span className="font-bold">{recipient.name}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full max-w-md rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow"
          >
            Listo
          </button>
        </div>
      )}
    </div>
  );
};

export default TransferTicketFlow;
