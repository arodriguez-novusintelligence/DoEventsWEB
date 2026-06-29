import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@lovable/components/ui/dialog';
import { Button } from '@lovable/components/ui/button';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { Textarea } from '@lovable/components/ui/textarea';
import { Label } from '@lovable/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { reportPublication, useToast } from '@doevents/shared';
export interface ReportTarget {
  targetType: 'post' | 'profile';
  postId?: string;
  postTitle?: string;
  postAuthor?: string;
  profileId?: string;
  profileName?: string;
  profileUsername?: string;
  reporterName?: string;
}

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ReportTarget | null;
  onReported?: (info: { adminsNotified: number }) => void;
}

const REASONS = [
  'Spam o contenido engañoso',
  'Discurso de odio o discriminación',
  'Violencia o contenido peligroso',
  'Acoso o intimidación',
  'Desnudez o contenido sexual',
  'Información falsa o fraude',
  'Suplantación de identidad',
  'Propiedad intelectual',
];

const ReportPostDialog = ({ open, onOpenChange, target, onReported }: ReportPostDialogProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelected(new Set());
    setOtherChecked(false);
    setOtherText('');
    setSubmitting(false);
  };

  const toggle = (reason: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  };

  const isProfileReport = target?.targetType === 'profile';
  const title = isProfileReport ? 'Denunciar perfil' : 'Denunciar publicación';
  const placeholder = isProfileReport
    ? 'Cuéntanos qué está mal con este perfil...'
    : 'Cuéntanos qué está mal con esta publicación...';

  const reportBody = target
    ? {
        target_type: target.targetType,
        post_id: target.postId,
        post_title: target.postTitle,
        post_author: target.postAuthor,
        profile_id: target.profileId,
        profile_name: target.profileName,
        profile_username: target.profileUsername,
        reporter_name: target.reporterName ?? 'Tú',
        reasons: Array.from(selected),
        other_reason: otherChecked ? otherText.trim() : undefined,
      }
    : null;

  const canSubmit =
    !!target &&
    !submitting &&
    (selected.size > 0 || (otherChecked && otherText.trim().length >= 3));

  const handleSubmit = async () => {
    if (!target || !canSubmit) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-report', {
        body: reportBody,
      });

      if (error) {
        const { error: insertError } = await supabase.from('post_reports').insert({
          target_type: target.targetType,
          post_id: target.postId ?? null,
          post_title: target.postTitle ?? null,
          post_author: target.postAuthor ?? null,
          profile_id: target.profileId ?? null,
          profile_name: target.profileName ?? null,
          profile_username: target.profileUsername ?? null,
          reporter_name: target.reporterName ?? 'Tú',
          reasons: Array.from(selected),
          other_reason: otherChecked ? otherText.trim() : null,
        });
        if (insertError) throw insertError;
      }

      const adminsNotified = (data as { admins_notified?: number })?.admins_notified ?? 0;
      toast.success('Denuncia enviada', {
        description: 'Los administradores fueron notificados. Gracias por tu reporte.',
      });
      onReported?.({ adminsNotified });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('[ReportPostDialog]', err);
      toast.error('No se pudo enviar la denuncia', {
        description: 'Intenta nuevamente en unos minutos.',
      });
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Selecciona uno o varios motivos. Tu denuncia es confidencial y será revisada
            por los administradores.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {REASONS.map((reason) => {
            const id = `reason-${reason}`;
            return (
              <label
                key={reason}
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
              >
                <Checkbox
                  id={id}
                  checked={selected.has(reason)}
                  onCheckedChange={() => toggle(reason)}
                />
                <span className="text-sm text-foreground">{reason}</span>
              </label>
            );
          })}

          <label
            htmlFor="reason-other"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
          >
            <Checkbox
              id="reason-other"
              checked={otherChecked}
              onCheckedChange={(c) => setOtherChecked(c === true)}
            />
            <span className="text-sm font-semibold text-foreground">Otro</span>
          </label>

          {otherChecked && (
            <div className="space-y-2 pl-1">
              <Label htmlFor="other-text" className="text-xs text-muted-foreground">
                Describe el motivo (mínimo 3 caracteres)
              </Label>
              <Textarea
                id="other-text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={placeholder}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar denuncia'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPostDialog;