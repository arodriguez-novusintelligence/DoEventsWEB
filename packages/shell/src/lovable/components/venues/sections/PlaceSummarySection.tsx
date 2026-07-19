import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@lovable/components/ui/accordion';
import { Button } from '@lovable/components/ui/button';
import {
  FileText,
  MapPin,
  CalendarDays,
  RotateCcw,
  HelpCircle,
  Ticket,
  Pencil,
  Eye,
  Save,
  Megaphone,
  Check,
} from 'lucide-react';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';
import type { PlacePromoCodeBatch } from '@lovable/data/placeData';
import { facilidadesDetailed } from '@lovable/data/facilidadesOptions';
import { catalogSelectionLabels } from '@lovable/data/venueCatalogOptions';

interface PlaceSummarySectionProps {
  onEditStep?: (stepIndex: number) => void;
  onPreview?: () => void;
  onSaveDraft?: () => void;
  onPublish?: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
    <span className="shrink-0 text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-foreground">{value}</span>
  </div>
);

const SectionItem = ({
  value,
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  value: string;
  icon: React.ElementType;
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) => (
  <AccordionItem
    value={value}
    className="overflow-hidden rounded-2xl border-0 bg-card shadow-sm"
  >
    <AccordionTrigger className="px-4 py-3 hover:bg-secondary/30 hover:no-underline [&>svg]:text-primary">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-left text-sm font-medium text-foreground">{title}</span>
        <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-0 pb-0">
      <div className="divide-y divide-border/60 border-t border-border px-4 py-3">
        {children}
      </div>
      {onEdit && (
        <div className="px-4 pb-3 pt-1">
          <Button variant="outline" size="sm" onClick={onEdit} className="w-full gap-1.5 rounded-full">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      )}
    </AccordionContent>
  </AccordionItem>
);

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'soft';
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex flex-1 flex-col items-center gap-2 disabled:opacity-50"
  >
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground'
          : 'bg-primary/80 text-primary-foreground'
      }`}
    >
      <Icon className="h-6 w-6" />
    </div>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

function formatPrice(value: string, currency: string) {
  const n = Number(value);
  if (!value || !Number.isFinite(n) || n <= 0) return '—';
  return `${currency} $ ${n.toLocaleString('es-CO')}`;
}

function promoSummary(batches: PlacePromoCodeBatch[]) {
  if (!batches.length) {
    return <p className="py-1.5 text-sm text-muted-foreground">No hay códigos promocionales configurados.</p>;
  }
  return batches.map((b) => (
    <div key={b.id} className="py-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {b.currency} $ {b.value.toLocaleString('es-CO')} x {b.quantity}
        </span>
      </div>
      {b.description && <p className="text-xs text-muted-foreground">{b.description}</p>}
      <p className="mt-0.5 text-xs text-muted-foreground">
        {b.codes.length} código{b.codes.length !== 1 ? 's' : ''} generado{b.codes.length !== 1 ? 's' : ''}
      </p>
    </div>
  ));
}

const PlaceSummarySection = ({
  onEditStep,
  onPreview,
  onSaveDraft,
  onPublish,
}: PlaceSummarySectionProps) => {
  const { form, placeTypeLabel, publishing, canPublish, missingRequiredFields } = usePlaceForm();
  const [open, setOpen] = useState<string[]>(['info']);
  const promoEnabled = form.promoCodes.length > 0;
  const customPrices = Object.values(form.datePrices).filter((d) => d.price && !d.blocked).length;
  const blockedCount = form.blockedDates.length + Object.values(form.datePrices).filter((d) => d.blocked).length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
        <p className="text-xs text-muted-foreground">Resumen del lugar</p>
        <h2 className="text-lg font-bold text-foreground">{form.name.trim() || 'Sin nombre'}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Revisa cada sección. Puedes editar cualquier paso antes de publicar.
        </p>
      </div>

      <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-3">
        <SectionItem value="info" icon={FileText} title="Información principal" onEdit={() => onEditStep?.(0)}>
          <Row label="Nombre" value={form.name || '—'} />
          <Row label="Tipo" value={placeTypeLabel || '—'} />
          <Row label="Aforo" value={form.capacity ? `${form.capacity} personas` : '—'} />
          <Row label="Parqueadero" value={form.hasParking ? 'Sí' : 'No'} />
          <Row label="Descripción" value={form.description || '—'} />
          <Row
            label="Servicios incluidos"
            value={form.includedServices.length
              ? catalogSelectionLabels(form.includedServices).join(', ')
              : '—'}
          />
          <Row
            label="Accesibilidad"
            value={form.accessibility.length
              ? catalogSelectionLabels(form.accessibility).join(', ')
              : '—'}
          />
          <Row
            label="Seguridad"
            value={form.security.length
              ? catalogSelectionLabels(form.security).join(', ')
              : '—'}
          />
          <Row
            label="Facilidades"
            value={form.facilities.length
              ? form.facilities.map((f) => {
                  const label = facilidadesDetailed.find((d) => d.id === f.id)?.label || f.id;
                  return f.count > 1 ? `${label} (×${f.count})` : label;
                }).join(', ')
              : '—'}
          />
          <Row
            label="Eventos"
            value={form.allowedEventTypes.length ? form.allowedEventTypes.join(', ') : '—'}
          />
        </SectionItem>

        <SectionItem value="location" icon={MapPin} title="Ubicación y detalle del lugar" onEdit={() => onEditStep?.(1)}>
          <Row label="Dirección" value={form.address || '—'} />
          <Row label="Barrio" value={form.neighborhood || '—'} />
          <Row label="Ciudad" value={[form.city, form.department].filter(Boolean).join(', ') || '—'} />
          <Row label="Mapa de silletería" value={form.hasSeating ? 'Sí' : 'No'} />
        </SectionItem>

        <SectionItem value="datetime" icon={CalendarDays} title="Calendario y precios" onEdit={() => onEditStep?.(2)}>
          <Row
            label="Precio base"
            value={formatPrice(
              form.rentalUnit === 'month' ? form.pricing.perMonth : form.pricing.perDay,
              form.pricing.currency,
            )}
          />
          <Row label="Tipo de cobro" value={form.chargeType || (form.rentalUnit === 'month' ? 'por mes' : 'por día')} />
          <Row label="Días disponibles" value={form.selectedDates.length || '—'} />
          <Row label="Precios personalizados" value={customPrices || '—'} />
          <Row label="Días bloqueados" value={blockedCount || '—'} />
          <Row label="Horario" value={`${form.globalStartTime} — ${form.globalEndTime}`} />
          <Row
            label="Servicios adicionales"
            value={form.addonServices.length ? `${form.addonServices.length} configurado(s)` : '—'}
          />
        </SectionItem>

        <SectionItem value="promo" icon={Ticket} title="Códigos promocionales" onEdit={() => onEditStep?.(3)}>
          {!promoEnabled ? (
            <p className="py-1.5 text-sm text-muted-foreground">No hay códigos promocionales configurados.</p>
          ) : (
            promoSummary(form.promoCodes)
          )}
        </SectionItem>

        <SectionItem value="preferences" icon={RotateCcw} title="Preferencias y reembolso" onEdit={() => onEditStep?.(4)}>
          <Row
            label="Aprobación"
            value={form.bookingPreference === 'instant' ? 'Reserva inmediata' : 'Aprueba todas las reservas'}
          />
          <Row label="Política reembolso" value={form.refundPolicy || '—'} />
        </SectionItem>

        <SectionItem value="faq" icon={HelpCircle} title="Preguntas frecuentes" onEdit={() => onEditStep?.(5)}>
          {form.faqs.filter((f) => f.question.trim()).length === 0 ? (
            <p className="py-1.5 text-sm text-muted-foreground">Sin preguntas configuradas.</p>
          ) : (
            form.faqs
              .filter((f) => f.question.trim())
              .map((f) => (
                <div key={f.id} className="py-1.5 text-sm text-foreground">
                  • {f.question}
                </div>
              ))
          )}
        </SectionItem>
      </Accordion>

      {!canPublish && missingRequiredFields.length > 0 && (
        <p className="text-center text-xs text-destructive">
          Completa: {missingRequiredFields.join(', ')}
        </p>
      )}

      <div className="pt-4">
        <div className="flex items-start justify-around gap-2 pt-2">
          <ActionButton icon={Eye} label="Previsualizar" onClick={onPreview} variant="soft" />
          <ActionButton icon={Save} label="Guardar" onClick={onSaveDraft} variant="primary" />
          <ActionButton
            icon={Megaphone}
            label={publishing ? 'Publicando…' : 'Publicar'}
            onClick={onPublish}
            variant="soft"
            disabled={!canPublish || publishing}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaceSummarySection;
