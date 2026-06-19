import { useState } from 'react';
import { Heart, MoreVertical, Star, MessageSquare, X, MapPin, Plus, ChevronRight, CalendarDays } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Dialog, DialogContent } from '@lovable/components/ui/dialog';
import { Drawer, DrawerContent } from '@lovable/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lovable/components/ui/alert-dialog';

export type MyEventStatus = 'activo' | 'finalizado' | 'inactivo' | 'reagendado' | 'cancelado' | 'borrador';

export interface EventReview {
  user: string;
  avatar?: string;
  date: string;
  rating: number;
  comment?: string;
}

export interface MyEventItem {
  id: string;
  image: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  status: MyEventStatus;
  canEdit?: boolean;
  canCancel?: boolean;
  reviews?: EventReview[];
}

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => {
      const filled = i <= Math.round(value);
      return (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={filled ? 'fill-primary text-primary' : 'text-primary'}
          strokeWidth={2}
        />
      );
    })}
  </div>
);

interface Props {
  events: MyEventItem[];
  onBack: () => void;
  onDuplicate?: (ev: MyEventItem) => void;
  onDelete?: (id: string) => void;
  onEdit?: (ev: MyEventItem) => void;
  onCancel?: (ev: MyEventItem) => void;
  onReschedule?: (ev: MyEventItem) => void;
  onInvite?: (ev: MyEventItem) => void;
  onCreate?: () => void;
  onOpenDetail?: (ev: MyEventItem) => void;
  actionLoading?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
}

const STATUS_STYLES: Record<MyEventStatus, { label: string; className: string; grayscale?: boolean }> = {
  activo: { label: 'activo', className: 'bg-primary text-primary-foreground' },
  borrador: { label: 'Borrador', className: 'bg-amber-100 text-amber-800', grayscale: true },
  finalizado: { label: 'Finalizado', className: 'bg-primary text-primary-foreground' },
  inactivo: { label: 'inactivo', className: 'bg-muted text-muted-foreground', grayscale: true },
  reagendado: { label: 'Reagendado', className: 'bg-amber-100 text-amber-700' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive text-destructive-foreground' },
};

type ActionKey = 'editar' | 'cancelar' | 'reprogramar' | 'invitar' | 'eliminar' | 'duplicar';

const ACTIONS: { key: ActionKey; label: string; danger?: boolean }[] = [
  { key: 'editar', label: 'Editar' },
  { key: 'cancelar', label: 'Cancelar evento', danger: true },
  { key: 'reprogramar', label: 'Reprogramar evento' },
  { key: 'invitar', label: 'Invitar usuarios' },
  { key: 'eliminar', label: 'Eliminar', danger: true },
  { key: 'duplicar', label: 'Duplicar' },
];

const Card = ({
  ev,
  onMore,
  onComments,
  isFav,
  onToggleFav,
  onClick,
}: {
  ev: MyEventItem;
  onMore: (ev: MyEventItem) => void;
  onComments: (ev: MyEventItem) => void;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onClick?: () => void;
}) => {
  const s = STATUS_STYLES[ev.status];
  const reviews = ev.reviews ?? [];
  const ratingCount = reviews.length;
  const avgRating = ratingCount ? reviews.reduce((a, r) => a + r.rating, 0) / ratingCount : 0;
  const commentCount = reviews.filter((r) => r.comment).length;

  return (
    <article
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm text-left transition-transform active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="relative h-28 w-full overflow-hidden bg-muted">
        {ev.image ? (
          <img
            src={ev.image}
            alt={ev.title}
            className={`h-full w-full object-cover ${s.grayscale ? 'grayscale' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
        )}
        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${s.className}`}>
          {s.label}
        </span>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleFav(ev.id); }}
            aria-label="Me gusta"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur text-foreground shadow-sm transition-transform active:scale-95"
          >
            <Heart
              className={`h-3.5 w-3.5 ${isFav ? 'fill-primary text-primary' : 'text-foreground'}`}
              strokeWidth={2.2}
            />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMore(ev); }}
            aria-label="Opciones"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur text-foreground shadow-sm transition-transform active:scale-95"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2">{ev.title}</h3>
        <p className="text-[11px] text-muted-foreground line-clamp-1">{ev.date}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{ev.location}</span>
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
          {ratingCount > 0 ? (
          <>
          <div className="flex items-center gap-1 text-primary">
            <Star className="h-3.5 w-3.5 fill-primary" strokeWidth={2} />
            <span className="text-xs font-bold">{avgRating.toFixed(1)}</span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onComments(ev); }}
            className="flex items-center gap-1 text-muted-foreground"
            aria-label="Ver comentarios"
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-xs font-semibold">{commentCount}</span>
          </button>
          </>
          ) : (
          <p className="text-[11px] text-muted-foreground">Sin calificaciones aún</p>
          )}
        </div>
      </div>
    </article>
  );
};

const ACTIONS_BY_STATUS: Record<MyEventStatus, ActionKey[]> = {
  activo: ['editar', 'cancelar', 'reprogramar', 'invitar', 'eliminar', 'duplicar'],
  borrador: ['editar', 'eliminar'],
  finalizado: ['duplicar', 'eliminar'],
  reagendado: ['duplicar'],
  cancelado: ['duplicar'],
  inactivo: ['editar', 'eliminar', 'duplicar'],
};

const MyEventsView = ({
  events,
  onBack,
  onDuplicate,
  onDelete,
  onEdit,
  onCancel,
  onReschedule,
  onInvite,
  onCreate,
  onOpenDetail,
  actionLoading,
  searchQuery,
  onSearchQueryChange,
}: Props) => {
  const [selected, setSelected] = useState<MyEventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyEventItem | null>(null);
  const [reviewsFor, setReviewsFor] = useState<MyEventItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAction = (key: ActionKey) => {
    if (!selected || actionLoading) return;
    if (key === 'duplicar') onDuplicate?.(selected);
    else if (key === 'eliminar') setDeleteTarget(selected);
    else if (key === 'editar') onEdit?.(selected);
    else if (key === 'cancelar') onCancel?.(selected);
    else if (key === 'reprogramar') onReschedule?.(selected);
    else if (key === 'invitar') onInvite?.(selected);
    setSelected(null);
  };

  const availableActions = selected
    ? ACTIONS.filter((a) => {
        const allowed = ACTIONS_BY_STATUS[selected.status];
        if (!allowed.includes(a.key)) return false;
        if (a.key === 'editar' && selected.canEdit === false) return false;
        if (a.key === 'cancelar' && selected.canCancel === false) return false;
        return true;
      })
    : [];

  const reviewsList = reviewsFor?.reviews ?? [];
  const reviewsCount = reviewsList.length;
  const reviewsAvg = reviewsCount ? reviewsList.reduce((a, r) => a + r.rating, 0) / reviewsCount : 0;

  const handleOpenDetail = (ev: MyEventItem) => {
    if (!ev.id) return;
    onOpenDetail?.(ev);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-28">
      <ProfileSectionBanner
        title="Mis Eventos"
        subtitle={`${events.length} Evento${events.length === 1 ? '' : 's'} publicado${events.length === 1 ? '' : 's'}`}
        icon={CalendarDays}
        onBack={onBack}
      />

      <div className="px-4 pt-4">
        {onSearchQueryChange && (
          <input
            type="search"
            value={searchQuery || ''}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar mis eventos..."
            className="mb-3 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm"
          />
        )}

        {events.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/30 bg-card px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <p className="text-base font-bold text-foreground">Aún no has publicado eventos</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea tu primer evento y compártelo con tu comunidad
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {events.map((e) => (
              <Card
                key={e.id}
                ev={e}
                onMore={setSelected}
                onComments={setReviewsFor}
                isFav={favorites.has(e.id)}
                onToggleFav={toggleFav}
                onClick={onOpenDetail ? () => handleOpenDetail(e) : undefined}
              />
            ))}
          </div>
        )}

        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Plus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">Crear Mis Eventos</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Agrega un nuevo evento a tu catálogo</p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-[280px] rounded-2xl p-0 overflow-hidden gap-0">
          <div className="divide-y divide-border">
            {availableActions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => handleAction(a.key)}
                className={`w-full px-4 py-3 text-center text-sm font-semibold ${
                  a.danger ? 'text-destructive' : 'text-primary'
                } hover:bg-secondary/50`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Drawer open={!!reviewsFor} onOpenChange={(o) => !o && setReviewsFor(null)}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg px-4 pb-6">
            <p className="mt-1 text-center text-xs text-muted-foreground">Arrastra hacia arriba para expandir</p>
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-primary">Comentarios</h2>
                <p className="mt-1 text-sm text-foreground">{reviewsFor?.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewsFor(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 border-t border-border" />
            <div className="mt-4 rounded-2xl bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary">Estadísticas de Calificaciones</h3>
                <span className="text-2xl font-extrabold text-primary">{reviewsAvg.toFixed(1)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{reviewsCount} calificaciónes</p>
                <Stars value={reviewsAvg} size={18} />
              </div>
            </div>
            <div className="mt-3 space-y-3 overflow-y-auto">
              {reviewsList.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay comentarios.</p>
              )}
              {reviewsList.map((r, i) => (
                <div key={i} className="rounded-2xl bg-primary/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-secondary">
                        {r.avatar && <img src={r.avatar} alt={r.user} className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary leading-tight">{r.user}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                    </div>
                    <Stars value={r.rating} size={16} />
                  </div>
                  {r.comment && <p className="mt-2 text-sm font-semibold text-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este evento?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              {deleteTarget?.status === 'finalizado' ? (
                <>
                  <span className="block font-semibold text-foreground">
                    Este evento ya finalizó. Lo ideal es conservarlo para demostrar tu experiencia como organizador.
                  </span>
                  <span className="block">
                    Si lo eliminas, no podrás recuperarlo y perderás las estadísticas asociadas (ventas, invitados, accesos y reembolsos).
                  </span>
                </>
              ) : (
                <span>
                  Esta acción no se puede deshacer. Se perderán las estadísticas del evento.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar evento</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget?.id) onDelete?.(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyEventsView;
