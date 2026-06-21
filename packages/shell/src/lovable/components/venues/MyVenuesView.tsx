import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Star, MessageSquare, X, MoreVertical, Building2, Users, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchVenueCalifications, publishStatusLabel } from '@doevents/shared';
import { Drawer, DrawerContent } from '@lovable/components/ui/drawer';
import { Dialog, DialogContent } from '@lovable/components/ui/dialog';
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
import type { PublishedVenueDraft } from './VenueCreator';
import VenueDetailReservation from './VenueDetailReservation';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';

interface VenueReview {
  user: string;
  date: string;
  rating: number;
  comment?: string;
}

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={i <= Math.round(value) ? 'fill-primary text-primary' : 'text-primary'}
        strokeWidth={2}
      />
    ))}
  </div>
);

interface MyVenuesViewProps {
  venues?: PublishedVenueDraft[];
  initialCreate?: boolean;
  onBack: () => void;
  onVenuePublished?: (venue: PublishedVenueDraft) => void;
  onGoToWall?: () => void;
  onOpenVenue?: (venue: PublishedVenueDraft) => void;
  onCreateVenue?: () => void;
  onEditVenue?: (venue: PublishedVenueDraft) => void;
  onDeleteVenue?: (venue: PublishedVenueDraft) => void | Promise<void>;
  onDuplicateVenue?: (venue: PublishedVenueDraft) => void | Promise<void>;
}

const MyVenuesView = ({
  venues: venuesProp,
  initialCreate = false,
  onBack,
  onVenuePublished,
  onGoToWall,
  onOpenVenue,
  onCreateVenue,
  onEditVenue,
  onDeleteVenue,
  onDuplicateVenue,
}: MyVenuesViewProps) => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(initialCreate);
  const [venues, setVenues] = useState<PublishedVenueDraft[]>(venuesProp ?? []);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedVenue, setSelectedVenue] = useState<PublishedVenueDraft | null>(null);
  const [reviewsFor, setReviewsFor] = useState<PublishedVenueDraft | null>(null);
  const [venueReviews, setVenueReviews] = useState<VenueReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [actionsFor, setActionsFor] = useState<PublishedVenueDraft | null>(null);
  const [editingVenue, setEditingVenue] = useState<PublishedVenueDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublishedVenueDraft | null>(null);

  useEffect(() => {
    if (venuesProp) setVenues(venuesProp);
  }, [venuesProp]);

  useEffect(() => {
    if (!reviewsFor) {
      setVenueReviews([]);
      return;
    }
    let cancelled = false;
    setLoadingReviews(true);
    fetchVenueCalifications(reviewsFor.id)
      .then((rows) => {
        if (cancelled) return;
        setVenueReviews(rows.map((r) => ({
          user: r.authorName || 'Usuario',
          date: r.createdAt ? new Date(r.createdAt).toLocaleString('es-CO') : '—',
          rating: Number(r.rating) || 0,
          comment: r.comment || undefined,
        })));
      })
      .catch(() => {
        if (!cancelled) setVenueReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });
    return () => { cancelled = true; };
  }, [reviewsFor]);

  const openVenue = (venue: PublishedVenueDraft) => {
    if (onOpenVenue) onOpenVenue(venue);
    else setSelectedVenue(venue);
  };

  const startCreate = () => {
    if (onCreateVenue) onCreateVenue();
    else setIsCreating(true);
  };

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDuplicate = async (v: PublishedVenueDraft) => {
    if (onDuplicateVenue) {
      await onDuplicateVenue(v);
    } else {
      const copy: PublishedVenueDraft = {
        ...v,
        id: `${v.id}-copy-${Date.now()}`,
        name: `${v.name} (copia)`,
      };
      setVenues((prev) => [copy, ...prev]);
      toast.success('Lugar duplicado');
    }
    setActionsFor(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (onDeleteVenue) {
      await onDeleteVenue(deleteTarget);
    } else {
      setVenues((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success('Lugar eliminado');
    }
    setDeleteTarget(null);
    setActionsFor(null);
  };

  if (selectedVenue) {
    return (
      <VenueDetailReservation
        venue={selectedVenue}
        onBack={() => setSelectedVenue(null)}
        onFinish={() => setSelectedVenue(null)}
      />
    );
  }

  if (editingVenue) {
    navigate(`/places/${editingVenue.id}/edit`);
    setEditingVenue(null);
    return null;
  }

  if (isCreating) {
    navigate('/places/publish');
    setIsCreating(false);
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary pb-32">
      <ProfileSectionBanner
        title="Mis lugares de eventos"
        subtitle={`${venues.length} lugar${venues.length === 1 ? '' : 'es'} en tu catálogo`}
        icon={Building2}
        onBack={onBack}
      />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {venues.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/25 bg-card p-10 text-center shadow-sm">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Aún no has publicado lugares</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea tu primer espacio para recibir reservas de eventos.
            </p>
            <button
              type="button"
              onClick={() => (onCreateVenue ? onCreateVenue() : navigate('/places/publish'))}
              className="mt-4 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Crear lugar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {venues.map((v) => {
              const isFav = favorites.has(v.id);
              const statusLabel = publishStatusLabel(v.status);
              return (
                <article
                  key={v.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm text-left transition-transform active:scale-[0.98] cursor-pointer"
                  onClick={() => openVenue(v)}
                >
                  <div className="relative h-28 w-full overflow-hidden bg-muted">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {statusLabel && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(v.id);
                        }}
                        aria-label="Me gusta"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur text-foreground shadow-sm transition-transform active:scale-95"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${isFav ? 'fill-primary text-primary' : 'text-foreground'}`}
                          strokeWidth={2.2}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionsFor(v);
                        }}
                        aria-label="Opciones"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur text-foreground shadow-sm transition-transform active:scale-95"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2">
                      {v.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {v.type}
                    </p>
                    {v.capacity ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary">
                        <Users className="h-3 w-3" /> Capacidad {v.capacity}
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center justify-end border-t border-border/60 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewsFor(v);
                        }}
                        className="flex items-center gap-1 text-muted-foreground"
                        aria-label="Ver comentarios"
                      >
                        <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                        <span className="text-xs font-semibold">Opiniones</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <button
          onClick={startCreate}
          className="mt-4 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-5 text-left shadow-sm transition-colors hover:border-primary hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">Crea tu Lugar para Eventos</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Agrega un nuevo lugar a tu catálogo
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-primary" />
        </button>
      </main>

      <Drawer open={!!reviewsFor} onOpenChange={(o) => !o && setReviewsFor(null)}>
        <DrawerContent className="max-h-[85vh]">
          {reviewsFor && (() => {
            const rs = venueReviews;
            const avg = rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0;
            return (
              <div className="mx-auto w-full max-w-lg px-4 pb-6">
                <p className="mt-1 text-center text-xs text-muted-foreground">Arrastra hacia arriba para expandir</p>
                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-primary">Comentarios</h2>
                    <p className="mt-1 text-sm text-foreground">{reviewsFor.name}</p>
                  </div>
                  <button
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
                    <span className="text-2xl font-extrabold text-primary">{avg.toFixed(1)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{rs.length} calificaciones</p>
                    <Stars value={avg} size={18} />
                  </div>
                </div>

                <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto">
                  {loadingReviews && (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Cargando opiniones…</p>
                    </div>
                  )}
                  {!loadingReviews && rs.length === 0 && (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                        <MessageSquare className="h-7 w-7 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Aún no hay opiniones</p>
                      <p className="mt-1 text-xs text-muted-foreground">Las calificaciones aparecerán aquí</p>
                    </div>
                  )}
                  {rs.map((r, i) => (
                    <div key={i} className="rounded-2xl bg-primary/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                            {r.user.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary leading-tight">{r.user}</p>
                            <p className="text-xs text-muted-foreground">{r.date}</p>
                          </div>
                        </div>
                        <Stars value={r.rating} size={16} />
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm font-medium text-foreground">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DrawerContent>
      </Drawer>

      <Dialog open={!!actionsFor} onOpenChange={(o) => !o && setActionsFor(null)}>
        <DialogContent className="max-w-xs rounded-2xl p-0 overflow-hidden">
          <button
            onClick={() => {
              if (actionsFor) {
                if (onEditVenue) onEditVenue(actionsFor);
                else setEditingVenue(actionsFor);
              }
              setActionsFor(null);
            }}
            className="w-full py-4 text-center text-base font-semibold text-primary hover:bg-accent/40"
          >
            Editar
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={() => setDeleteTarget(actionsFor)}
            className="w-full py-4 text-center text-base font-semibold text-destructive hover:bg-accent/40"
          >
            Eliminar
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={() => actionsFor && void handleDuplicate(actionsFor)}
            className="w-full py-4 text-center text-base font-semibold text-primary hover:bg-accent/40"
          >
            Duplicar
          </button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este lugar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará &quot;{deleteTarget?.name}&quot; de tus lugares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyVenuesView;
