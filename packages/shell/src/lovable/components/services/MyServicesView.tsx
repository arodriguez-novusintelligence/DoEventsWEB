import { useState } from 'react';
import { Home, Smile, Briefcase, Plus, ChevronRight, ChevronLeft, DollarSign, Star, MessageSquare, X, MoreVertical, Heart } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Button } from '@lovable/components/ui/button';
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
import { ServiceFormData, initialFormData } from '@lovable/data/servicesData';
import StepUnified, { SECTION_ORDER } from './StepUnified';
import StepConditions from './StepConditions';
import ServiceSummary from './ServiceSummary';
import BookingSheet from './BookingSheet';
import PaymentGatewaySheet from './PaymentGatewaySheet';
import { BookingData } from './BookingSheet';
import { toast } from 'sonner';
import { publishStatusLabel } from '@doevents/shared';
import EditPageToolbar from '../../../components/EditPageToolbar';
import { Drawer, DrawerContent } from '@lovable/components/ui/drawer';
const getServiceImage = (service: ServiceFormData): string | undefined =>
  service.coverImagePreview || service.coverImageUrl || service.gallery[0]?.preview || service.gallery[0]?.url;

interface ServiceReview {
  user: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
}

function getReviewsForService(_service: ServiceFormData): ServiceReview[] {
  return [];
}

const Stars = ({ rating, size = 12 }: { rating: number; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-[${size}px] w-[${size}px] ${s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
};

interface MyServicesViewProps {
  onBack: (formData?: ServiceFormData) => void;
  onPublish?: (data: ServiceFormData[]) => void;
  onServicePublished?: (service: ServiceFormData) => void | Promise<void>;
  publishedServices?: ServiceFormData[];
  defaultProfileImageUrl?: string;
  initialForm?: ServiceFormData;
  mode?: 'create' | 'edit';
  submitLabel?: string;
  onEditService?: (service: ServiceFormData) => void;
  onDeleteService?: (service: ServiceFormData) => void | Promise<void>;
  onDuplicateService?: (service: ServiceFormData) => void | Promise<void>;
  onOpenService?: (service: ServiceFormData) => void;
}

const TOTAL_STEPS = SECTION_ORDER.length;

// Steps: -1=list of published services, 0=empty state, 1=wizard, TOTAL_STEPS=conditions, TOTAL_STEPS+1=summary, TOTAL_STEPS+2=success
const MyServicesView = ({
  onBack,
  onPublish,
  onServicePublished,
  publishedServices = [],
  defaultProfileImageUrl,
  initialForm,
  mode = 'create',
  submitLabel,
  onEditService,
  onDeleteService,
  onDuplicateService,
  onOpenService,
}: MyServicesViewProps) => {
  const hasPublished = publishedServices.length > 0;

  const [currentStep, setCurrentStep] = useState(initialForm ? 1 : (hasPublished ? -1 : 0));
  const [formData, setFormData] = useState<ServiceFormData>(initialForm || initialFormData);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [servicesList, setServicesList] = useState<ServiceFormData[]>(publishedServices);

  // Booking state
  const [bookingService, setBookingService] = useState<ServiceFormData | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Reviews state
  const [reviewsFor, setReviewsFor] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [actionsFor, setActionsFor] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const toggleFav = (i: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const updateForm = (partial: Partial<ServiceFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
  };

  const handleFinishConditions = () => {
    setCurrentStep(TOTAL_STEPS + 1);
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (!formData.sectors.length) {
      toast.error('Selecciona al menos un sector de servicio.');
      return;
    }
    const hasActivities = formData.sectors.some(
      (sector) => (formData.activities[sector] || []).length > 0,
    );
    if (!hasActivities) {
      toast.error('Selecciona al menos una actividad.');
      return;
    }
    const allActs = formData.sectors.flatMap((sector) =>
      (formData.activities[sector] || []).map((activity) => ({ sector, activity })),
    );
    const missingPrice = allActs.some(({ sector, activity }) => {
      const key = `${sector}::${activity}`;
      const pricing = formData.activityPricing[key];
      return !pricing?.cost || Number(pricing.cost) <= 0;
    });
    if (missingPrice) {
      toast.error('Indica un precio válido para cada actividad.');
      return;
    }
    if (formData.latitude == null || formData.longitude == null) {
      toast.error('Configura la ubicación del servicio.');
      return;
    }
    if (!formData.selectedDates.length) {
      toast.error('Selecciona al menos un día disponible.');
      return;
    }
    if (!formData.refundPolicy.trim()) {
      toast.error('Selecciona una política de reembolso.');
      return;
    }
    if (!formData.coverImageUrl && !formData.coverImageFile) {
      toast.error('Debes subir una foto del servicio o usar tu foto de perfil');
      return;
    }

    setPublishing(true);
    try {
      await onServicePublished?.(formData);
      const newList =
        editingIndex >= 0
          ? servicesList.map((s, i) => (i === editingIndex ? formData : s))
          : [...servicesList, formData];
      setServicesList(newList);
      onPublish?.(newList);
      if (!onServicePublished) {
        setCurrentStep(TOTAL_STEPS + 2);
        toast('¡Servicio publicado con éxito!');
      }
    } catch {
      /* el padre muestra el error */
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    const newList =
      editingIndex >= 0
        ? servicesList.map((s, i) => (i === editingIndex ? formData : s))
        : [...servicesList, formData];

    setServicesList(newList);
    onPublish?.(newList);
    toast('Borrador guardado correctamente');
    setCurrentStep(-1);
  };

  const startNewService = () => {
    setFormData(initialFormData);
    setEditingIndex(-1);
    setActiveSectionIndex(0);
    setCurrentStep(1);
  };

  const openService = (index: number) => {
    setFormData(servicesList[index]);
    setEditingIndex(index);
    setCurrentStep(TOTAL_STEPS + 1);
  };

  const handleProceedToPayment = (data: BookingData) => {
    setBookingData(data);
    setBookingService(null);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('¡Reserva confirmada! Revisa tu correo.', { duration: 4000 });
    setShowPayment(false);
    setBookingData(null);
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    const service = servicesList[deleteTarget];
    if (onDeleteService && service) {
      await onDeleteService(service);
    } else {
      setServicesList((prev) => prev.filter((_, i) => i !== deleteTarget));
      toast.success('Servicio eliminado');
    }
    setDeleteTarget(null);
    setActionsFor(null);
  };

  const handleDuplicate = async (index: number) => {
    const original = servicesList[index];
    if (onDuplicateService) {
      await onDuplicateService(original);
    } else {
      const copy: ServiceFormData = {
        ...original,
        sectors: [...original.sectors],
        activities: { ...original.activities },
        activityOthers: { ...original.activityOthers },
        activityPricing: { ...original.activityPricing },
        pricingTypes: [...original.pricingTypes],
        pricingDetails: [...original.pricingDetails],
        selectedDates: [...original.selectedDates],
        blockedDates: [...original.blockedDates],
        selectedDays: [...original.selectedDays],
        daySchedules: original.daySchedules.map((d) => ({ ...d })),
        faqs: original.faqs.map((f) => ({ ...f })),
      };
      setServicesList((prev) => [...prev, copy]);
      toast.success('Servicio duplicado');
    }
    setActionsFor(null);
  };

  const openServiceDetail = (service: ServiceFormData, index: number) => {
    if (onOpenService) onOpenService(service);
    else setBookingService(service);
  };

  const handleEditSave = async () => {
    setPublishing(true);
    try {
      await onServicePublished?.(formData);
    } catch {
      /* el padre muestra el error */
    } finally {
      setPublishing(false);
    }
  };

  if (mode === 'edit') {
    return (
      <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-28">
        <div className="sticky top-0 z-10 bg-secondary px-4 pt-4 pb-2">
          <button type="button" onClick={() => onBack(formData)} className="flex items-center gap-1 text-sm font-medium text-primary">
            <ChevronLeft className="h-4 w-4" /> Volver al servicio
          </button>
          <h1 className="mt-2 text-2xl font-bold text-primary">Editar servicio</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Abre la sección que quieras cambiar y guarda todo al final.
          </p>
        </div>
        <div className="px-4 pt-4">
          <StepUnified
            formData={formData}
            updateForm={updateForm}
            onNext={() => undefined}
            activeSectionIndex={activeSectionIndex}
            onSectionChange={setActiveSectionIndex}
            defaultProfileImageUrl={defaultProfileImageUrl}
            editMode
          />
        </div>
        <EditPageToolbar
          saving={publishing}
          dirty={false}
          onSave={handleEditSave}
          saveLabel={submitLabel || 'Guardar cambios'}
        />
      </div>
    );
  }

  // ── Published services list ──────────────────────────────────────────────
  if (currentStep === -1) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary">
        <ProfileSectionBanner
          title="Mis Servicios"
          subtitle={`${servicesList.length} servicio${servicesList.length === 1 ? '' : 's'} en tu catálogo`}
          icon={Briefcase}
          onBack={() => onBack(formData)}
        />

        <div className="px-4 pt-4 pb-28">
          <div className="grid grid-cols-2 gap-3">
            {servicesList.map((service, i) => {
              const activitiesCount = service.sectors.reduce(
                (acc, s) => acc + (service.activities[s]?.length || 0),
                0
              );
              const allActivities = service.sectors.flatMap((s) =>
                (service.activities[s] || []).map((act) => ({ sector: s, activity: act }))
              );
              const highestPricing = allActivities.reduce<{ cost: number; currency: string } | null>((best, { sector, activity }) => {
                const p = service.activityPricing[`${sector}::${activity}`];
                if (!p || !p.cost) return best;
                const num = Number(p.cost);
                return !best || num > best.cost ? { cost: num, currency: p.currency } : best;
              }, null);
              const img = getServiceImage(service);
              const statusLabel = publishStatusLabel((service as ServiceFormData & { status?: string }).status);
              const reviewsList = getReviewsForService(service);
              const reviewsAvg = reviewsList.length
                ? (reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsList.length).toFixed(1)
                : null;

              return (
                <div
                  key={service.serviceId || i}
                  role="button"
                  tabIndex={0}
                  onClick={() => openServiceDetail(service, i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openServiceDetail(service, i);
                    }
                  }}
                  className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm text-left transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-muted">
                    {img ? (
                      <img src={img} alt={service.sectors.join(', ') || 'Servicio'} className="h-full w-full object-cover" loading="lazy" />
                    ) : defaultProfileImageUrl ? (
                      <img src={defaultProfileImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {statusLabel && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(i);
                        }}
                        aria-label="Me gusta"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur text-foreground shadow-sm transition-transform active:scale-95"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${favorites.has(i) ? 'fill-primary text-primary' : 'text-foreground'}`}
                          strokeWidth={2.2}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionsFor(i);
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
                      {service.sectors.join(', ') || 'Servicio'}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {activitiesCount} actividad{activitiesCount !== 1 ? 'es' : ''}
                    </p>
                    {highestPricing && highestPricing.cost > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary">
                        <DollarSign className="h-3 w-3" /> {highestPricing.currency} {highestPricing.cost.toLocaleString()}
                      </p>
                    )}
                    {reviewsAvg ? (
                    <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary" strokeWidth={2} />
                        <span className="text-xs font-bold">{reviewsAvg}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewsFor(i);
                        }}
                        className="flex items-center gap-1 text-muted-foreground"
                        aria-label="Ver comentarios"
                      >
                        <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                        <span className="text-xs font-semibold">{reviewsList.length}</span>
                      </button>
                    </div>
                    ) : (
                    <p className="mt-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                      Sin reseñas aún
                    </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={startNewService}
            className="mt-4 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Plus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">Crear Mis Servicios</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Agrega un nuevo servicio a tu catálogo
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </div>

        {/* Booking sheet */}
        {bookingService && (
          <BookingSheet
            open={!!bookingService}
            onOpenChange={(o) => !o && setBookingService(null)}
            service={bookingService}
            onProceedToPayment={handleProceedToPayment}
          />
        )}

        {/* Payment gateway */}
        <PaymentGatewaySheet
          open={showPayment}
          onOpenChange={(o) => { setShowPayment(o); if (!o) setBookingData(null); }}
          booking={bookingData}
          onSuccess={handlePaymentSuccess}
        />

        {/* Reviews drawer */}
        <Drawer open={reviewsFor !== null} onOpenChange={(o) => !o && setReviewsFor(null)}>
          <DrawerContent className="mx-auto max-w-lg rounded-t-3xl bg-card px-4 pb-8 pt-2">
            {reviewsFor !== null && (
              <div className="flex flex-col">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3 pt-1">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {servicesList[reviewsFor]?.sectors.join(', ') || 'Servicio'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Reseñas de clientes</p>
                  </div>
                  <button
                    onClick={() => setReviewsFor(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {(() => {
                  const service = reviewsFor !== null ? servicesList[reviewsFor] : null;
                  const list = service ? getReviewsForService(service) : [];
                  const avg = list.length
                    ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1)
                    : null;
                  return (
                    <>
                      {avg ? (
                      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-secondary p-4">
                        <div className="text-3xl font-bold text-foreground">{avg}</div>
                        <div className="flex flex-col gap-0.5">
                          <Stars rating={Math.round(Number(avg))} size={14} />
                          <p className="text-xs text-muted-foreground">{list.length} reseña(s)</p>
                        </div>
                      </div>
                      ) : (
                      <p className="mb-4 rounded-2xl bg-secondary p-4 text-center text-sm text-muted-foreground">
                        Aún no hay reseñas para este servicio.
                      </p>
                      )}
                      <div className="flex flex-col gap-3">
                        {list.map((r, idx) => (
                          <div key={idx} className="rounded-2xl bg-secondary p-4">
                            <div className="mb-2 flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                {r.avatar}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{r.user}</p>
                                <p className="text-[11px] text-muted-foreground">{r.date}</p>
                              </div>
                              <div className="ml-auto">
                                <Stars rating={r.rating} size={10} />
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setReviewsFor(null)}
                        className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
                      >
                        Cerrar
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </DrawerContent>
        </Drawer>

        <Dialog open={actionsFor !== null} onOpenChange={(o) => !o && setActionsFor(null)}>
          <DialogContent className="max-w-xs rounded-2xl p-0 overflow-hidden">
            <button
              onClick={() => {
                if (actionsFor !== null) {
                  const service = servicesList[actionsFor];
                  if (onEditService && service) onEditService(service);
                  else openService(actionsFor);
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
              onClick={() => actionsFor !== null && void handleDuplicate(actionsFor)}
              className="w-full py-4 text-center text-base font-semibold text-primary hover:bg-accent/40"
            >
              Duplicar
            </button>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este servicio?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará el servicio de tu catálogo.
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
  }



  // ── Empty state ──────────────────────────────────────────────────────────
  if (currentStep === 0) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary">
        <div className="flex items-center gap-2 px-4 pt-4">
          <button onClick={() => onBack(formData)} className="flex items-center gap-1 text-sm font-medium text-primary">
            <ChevronLeft className="h-4 w-4" /> Volver
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Home className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Parece que aún no has creado los servicios que ofreces para eventos.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Agrega tus servicios para que los participantes puedan ver todo lo que ofreces
          </p>
          <Button
            onClick={() => { setFormData(initialFormData); setEditingIndex(-1); setCurrentStep(1); }}
            className="mt-8 w-full rounded-full py-6 text-base font-semibold"
          >
            Crear mis servicios
          </Button>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (currentStep === TOTAL_STEPS + 2) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-secondary px-8 text-center">
        <div className="rounded-3xl bg-card p-10 shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Smile className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">¡Todo listo!</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Tu servicio fue publicado con éxito. Los puedes ver en tu perfil.
          </p>
          <Button
            onClick={() => setCurrentStep(-1)}
            variant="outline"
            className="mt-4 w-full rounded-full py-5 text-sm font-semibold border-primary text-primary"
          >
            Ver mis servicios
          </Button>
          <Button onClick={() => onBack(formData)} className="mt-3 w-full rounded-full py-6 text-base font-semibold">
            Ir a mi perfil
          </Button>
        </div>
      </div>
    );
  }

  const isUnifiedStep = currentStep >= 1 && currentStep <= SECTION_ORDER.length;
  const isConditionsStep = currentStep === TOTAL_STEPS;
  const isSummaryStep = currentStep === TOTAL_STEPS + 1;
  const isEditing = editingIndex >= 0;

  const displayStep = isUnifiedStep ? activeSectionIndex + 1 : TOTAL_STEPS + 1;

  const title = isSummaryStep
    ? 'Resumen'
    : isConditionsStep
    ? 'Condiciones de pago'
    : isEditing
    ? 'Editar servicio'
    : 'Nuevo servicio';

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-secondary px-4 pt-4 pb-2">
        <button
          onClick={() => {
            if (isSummaryStep) {
              // Always allow going back to conditions (or list if editing)
              if (isEditing) {
                setCurrentStep(-1);
              } else {
                setCurrentStep(TOTAL_STEPS);
              }
            } else if (isConditionsStep) {
              setCurrentStep(1);
              setActiveSectionIndex(SECTION_ORDER.length - 1);
            } else if (activeSectionIndex > 0) {
              setActiveSectionIndex(activeSectionIndex - 1);
            } else {
              // Back to list (if has services) or empty state
              setCurrentStep(servicesList.length > 0 ? -1 : 0);
            }
          }}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>
        <h1 className="mt-2 text-2xl font-bold text-primary">{title}</h1>

        {/* Step indicator - only show during wizard, not summary */}
        {!isSummaryStep && (
          <div className="mt-3 flex items-center justify-center gap-0">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    displayStep > s
                      ? 'bg-primary text-primary-foreground'
                      : displayStep === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {displayStep > s ? '✓' : s}
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div className={`h-0.5 w-6 ${displayStep > s ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="px-4 pt-4">
        {isUnifiedStep && (
          <StepUnified
            formData={formData}
            updateForm={updateForm}
            onNext={() => setCurrentStep(TOTAL_STEPS)}
            activeSectionIndex={activeSectionIndex}
            onSectionChange={setActiveSectionIndex}
            defaultProfileImageUrl={defaultProfileImageUrl}
          />
        )}
        {isConditionsStep && (
          <StepConditions
            formData={formData}
            updateForm={updateForm}
            onFinish={handleFinishConditions}
          />
        )}
        {isSummaryStep && (
          <ServiceSummary
            formData={formData}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            isEditing={isEditing}
            onEdit={() => { setActiveSectionIndex(0); setCurrentStep(1); }}
          />
        )}
      </div>
    </div>
  );
};

export default MyServicesView;
