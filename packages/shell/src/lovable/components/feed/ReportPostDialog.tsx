import { useState } from 'react';
import { Flag, AlertCircle } from 'lucide-react';
import { reportPublication, useToast } from '@doevents/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lovable/components/ui/dialog';
import { Button } from '@lovable/components/ui/button';
import { Textarea } from '@lovable/components/ui/textarea';

const REASONS = [
  { id: 'inappropriate', label: 'Contenido inapropiado' },
  { id: 'spam', label: 'Spam o engañoso' },
  { id: 'harassment', label: 'Acoso o violencia' },
  { id: 'other', label: 'Otro' },
];

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationId: string | null;
  onReported?: () => void;
}

export const ReportPostDialog = ({
  open,
  onOpenChange,
  publicationId,
  onReported,
}: ReportPostDialogProps) => {
  const { showToast } = useToast();
  const [reason, setReason] = useState('inappropriate');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!publicationId) {
      showToast('No se pudo identificar la publicación', 'error');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reportPublication(publicationId, { reason, details: details.trim() });
      showToast('Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.', 'success');
      setDetails('');
      setReason('inappropriate');
      onReported?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo enviar el reporte';
      setSubmitError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Reportar publicación
          </DialogTitle>
          <DialogDescription>
            Indica por qué consideras que esta publicación debe ser revisada por nuestro equipo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            {REASONS.map((item) => (
              <label
                key={item.id}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                  reason === item.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:bg-accent/50'
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={item.id}
                  checked={reason === item.id}
                  onChange={() => setReason(item.id)}
                  className="accent-primary"
                />
                {item.label}
              </label>
            ))}
          </div>
          <Textarea
            placeholder="Detalles adicionales (opcional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPostDialog;
