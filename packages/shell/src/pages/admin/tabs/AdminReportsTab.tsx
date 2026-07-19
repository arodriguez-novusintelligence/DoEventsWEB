import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  FileText,
  Flag,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldOff,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  fetchAdminReports,
  patchAdminReport,
  useToast,
  type AdminReportAction,
  type AdminReportItem,
  type AdminReportStatus,
} from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import { Textarea } from '@lovable/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lovable/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lovable/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lovable/components/ui/table';

const statusConfig: Record<AdminReportStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-destructive/10 text-destructive' },
  reviewing: { label: 'En revisión', className: 'border border-border bg-background' },
  resolved: { label: 'Resuelta', className: 'bg-primary text-primary-foreground' },
  dismissed: { label: 'Descartada', className: 'bg-secondary text-muted-foreground' },
};

const accountStatusConfig = {
  active: { label: 'Activa', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  warned: { label: 'Advertida', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspendida', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  blocked: { label: 'Bloqueada', className: 'bg-red-100 text-red-700 border-red-200' },
};

const actionLabels: Record<AdminReportAction, string> = {
  none: 'Sin acción',
  warning: 'Enviar advertencia',
  suspend_24h: 'Suspender 24 horas',
  suspend_7d: 'Suspender 7 días',
  suspend_30d: 'Suspender 30 días',
  permanent_block: 'Bloquear permanentemente',
  content_removed: 'Retirar contenido',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

const defaultMessageFor = (action: AdminReportAction, target: AdminReportItem) => {
  const name = target.target_username;
  switch (action) {
    case 'warning':
      return {
        subject: 'Advertencia de moderación',
        message: `Hola ${name}, recibimos reportes sobre tu actividad reciente. Te pedimos revisar nuestras normas comunitarias.`,
      };
    case 'suspend_24h':
      return { subject: 'Cuenta suspendida 24 horas', message: `Hola ${name}, tu cuenta ha sido suspendida temporalmente por 24 horas.` };
    case 'suspend_7d':
      return { subject: 'Cuenta suspendida 7 días', message: `Hola ${name}, tu cuenta queda suspendida por 7 días.` };
    case 'suspend_30d':
      return { subject: 'Cuenta suspendida 30 días', message: `Hola ${name}, tu cuenta queda suspendida por 30 días.` };
    case 'permanent_block':
      return { subject: 'Cuenta bloqueada permanentemente', message: `Hola ${name}, tu cuenta ha sido bloqueada de forma definitiva.` };
    case 'content_removed':
      return { subject: 'Publicación retirada', message: `Hola ${name}, retiramos una de tus publicaciones por incumplir nuestras normas.` };
    default:
      return { subject: '', message: '' };
  }
};

export const AdminReportsTab: React.FC = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [summary, setSummary] = useState({ pending: 0, posts: 0, profiles: 0, activeSanctions: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'post' | 'profile'>('all');
  const [selected, setSelected] = useState<AdminReportItem | null>(null);
  const [status, setStatus] = useState<AdminReportStatus>('reviewing');
  const [action, setAction] = useState<AdminReportAction>('none');
  const [notes, setNotes] = useState('');
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyChannel, setNotifyChannel] = useState<'in-app' | 'email'>('in-app');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReports();
      setReports(data.reports || []);
      setSummary(data.summary || { pending: 0, posts: 0, profiles: 0, activeSanctions: 0 });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar denuncias', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reports.filter((report) => {
      const byType = filter === 'all' || report.target_type === filter;
      const text = [
        report.target_name,
        report.target_username,
        report.reporter_name,
        report.reasons.join(' '),
        report.other_reason,
      ].filter(Boolean).join(' ').toLowerCase();
      return byType && (!needle || text.includes(needle));
    });
  }, [filter, reports, search]);

  const openManage = (report: AdminReportItem) => {
    setSelected(report);
    setStatus(report.status);
    setAction(report.action_taken);
    setNotes(report.admin_notes || '');
    const defaults = defaultMessageFor(report.action_taken, report);
    setNotifySubject(defaults.subject);
    setNotifyMessage(defaults.message);
    setNotifyChannel('in-app');
  };

  const onActionChange = (value: AdminReportAction) => {
    setAction(value);
    if (selected) {
      const defaults = defaultMessageFor(value, selected);
      setNotifySubject(defaults.subject);
      setNotifyMessage(defaults.message);
    }
  };

  const handleLiftSanction = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await patchAdminReport(selected.id, {
        status: 'resolved',
        actionTaken: 'none',
        adminNotes: notes.trim(),
        notifySubject: 'Sanción levantada',
        notifyMessage: `Hola ${selected.target_username}, hemos restablecido tu cuenta.`,
        notifyChannel,
        liftSanction: true,
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      showToast('Sanción levantada y usuario notificado', 'success');
      setSelected(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al levantar sanción', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await patchAdminReport(selected.id, {
        status,
        actionTaken: action,
        adminNotes: notes.trim(),
        notifySubject: notifySubject.trim(),
        notifyMessage: notifyMessage.trim(),
        notifyChannel,
      });
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(null);
      if (action === 'permanent_block') showToast('Cuenta bloqueada permanentemente', 'success');
      else if (action.startsWith('suspend')) showToast('Cuenta suspendida y notificada', 'success');
      else if (action === 'warning') showToast('Advertencia enviada al usuario', 'success');
      else showToast('Denuncia actualizada', 'success');
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar denuncia', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-7 w-7 text-destructive" />
          <div>
            <h2 className="text-2xl font-bold">Denuncias y bloqueos</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona reportes, suspende temporalmente o bloquea cuentas con notificación al usuario.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Pendientes', value: summary.pending, icon: AlertTriangle, iconClass: 'text-destructive' },
          { label: 'Posts/Reposts', value: summary.posts, icon: FileText, iconClass: 'text-primary' },
          { label: 'Perfiles', value: summary.profiles, icon: UserX, iconClass: 'text-primary' },
          { label: 'Sanciones activas', value: summary.activeSanctions, icon: Ban, iconClass: 'text-destructive' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <Icon className={`h-8 w-8 ${card.iconClass}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Flag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Listado de denuncias</h3>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar denuncia..."
                className="pl-9"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-full sm:w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="post">Posts/Reposts</SelectItem>
                <SelectItem value="profile">Perfiles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando denuncias…</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Denunciado</TableHead>
                    <TableHead>Motivos</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                          {report.target_type === 'profile' ? 'Perfil' : 'Post/Repost'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[210px]">
                        <p className="text-sm font-medium">{report.target_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.target_username} · denuncia de {report.reporter_name}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <p className="line-clamp-2 text-sm">
                          {[...report.reasons, report.other_reason].filter(Boolean).join(', ')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${accountStatusConfig[report.account_status].className}`}>
                          {accountStatusConfig[report.account_status].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusConfig[report.status].className}`}>
                          {statusConfig[report.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(report.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" size="sm" onClick={() => openManage(report)}>
                          Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No hay denuncias para mostrar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar denuncia</DialogTitle>
            <DialogDescription>
              {selected ? `${selected.target_name} (${selected.target_username})` : ''}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-semibold">Motivos reportados</p>
                <p className="mt-1 text-muted-foreground">
                  {[...selected.reasons, selected.other_reason].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Estado de la denuncia</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as AdminReportStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="reviewing">En revisión</SelectItem>
                      <SelectItem value="resolved">Resuelta</SelectItem>
                      <SelectItem value="dismissed">Descartada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Acción sobre la cuenta</Label>
                  <Select value={action} onValueChange={(v) => onActionChange(v as AdminReportAction)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(actionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notas internas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
              </div>

              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Bell className="h-4 w-4" />
                  Notificación al usuario
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                  <div className="space-y-1.5">
                    <Label>Asunto</Label>
                    <Input value={notifySubject} onChange={(e) => setNotifySubject(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Canal</Label>
                    <Select value={notifyChannel} onValueChange={(v) => setNotifyChannel(v as 'in-app' | 'email')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-app">En la app</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Aclaración / motivo</Label>
                  <Textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} rows={4} maxLength={1500} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              {selected && (selected.account_status === 'suspended' || selected.account_status === 'warned') && (
                <Button type="button" variant="outline" onClick={() => void handleLiftSanction()} disabled={saving}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Levantar sanción
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelected(null)} disabled={saving}>
                Cancelar
              </Button>
              {action === 'permanent_block' ? (
                <Button type="button" variant="destructive" onClick={() => void handleSave()} disabled={saving}>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Bloquear y notificar
                </Button>
              ) : (
                <Button type="button" onClick={() => void handleSave()} disabled={saving}>
                  {action === 'none' ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                  {action === 'none' ? 'Guardar' : 'Aplicar y notificar'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReportsTab;
