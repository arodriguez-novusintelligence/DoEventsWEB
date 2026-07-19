import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import {
  createAdminDisbursement,
  fetchAdminDisbursements,
  fetchAdminPayments,
  useToast,
  type AdminDisbursementItem,
  type AdminPaymentItem,
} from '@doevents/shared';
import type { EventChatRoom } from '@lovable/data/chatData';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import EventSalesDetail from '@lovable/components/admin/EventSalesDetail';
import { formatCop } from '../AdminLayout';

const SALE_CATEGORY_LABELS: Record<string, string> = {
  evento: 'Evento',
  lugar: 'Lugar',
  servicio: 'Servicio',
};

const STATUS_LABELS = {
  pendiente: { label: 'Pendiente', icon: Clock, className: 'border-border' },
  procesado: { label: 'Procesado', icon: AlertCircle, className: 'bg-secondary' },
  dispersado: { label: 'Dispersado', icon: CheckCircle2, className: 'bg-primary text-primary-foreground' },
};

function paymentToEventRoom(payment: AdminPaymentItem): EventChatRoom {
  return {
    id: payment.eventId,
    eventId: payment.eventId,
    eventName: payment.eventName,
    eventDate: payment.eventStartDate || '',
    eventDateRaw: payment.eventStartDate,
    eventStatus: 'activo',
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    attendees: [],
    messages: [],
  };
}

export const AdminPaymentsTab: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<'payments' | 'disbursements'>('payments');
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [disbursements, setDisbursements] = useState<AdminDisbursementItem[]>([]);
  const [summary, setSummary] = useState({ pendingCop: 0, processedCop: 0, disbursedCop: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadPayments = () => {
    setLoading(true);
    void fetchAdminPayments()
      .then((data) => {
        setPayments(data.payments || []);
        setSummary(data.summary || { pendingCop: 0, processedCop: 0, disbursedCop: 0 });
      })
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar pagos', 'error'))
      .finally(() => setLoading(false));
  };

  const loadDisbursements = () => {
    void fetchAdminDisbursements()
      .then(setDisbursements)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar dispersiones', 'error'));
  };

  useEffect(() => {
    loadPayments();
    loadDisbursements();
  }, [showToast]);

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showToast('Selecciona un archivo', 'error');
      return;
    }
    setUploading(true);
    try {
      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const totalRecords = Math.max(lines.length - 1, 1);
      const amountMatch = text.match(/[\d.,]+/g);
      const totalAmount = amountMatch
        ? amountMatch.map((v) => Number(v.replace(/\./g, '').replace(',', '.'))).filter((n) => !Number.isNaN(n) && n > 0).pop() || 0
        : 0;

      const created = await createAdminDisbursement({
        fileName: selectedFile.name,
        totalRecords,
        totalAmount,
      });
      setDisbursements((prev) => [created, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(`Archivo ${selectedFile.name} cargado`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar archivo', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (selectedPayment && (!selectedPayment.saleCategory || selectedPayment.saleCategory === 'evento')) {
    return (
      <EventSalesDetail
        event={paymentToEventRoom(selectedPayment)}
        onBack={() => setSelectedPayment(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestión de Pagos</h2>
          <p className="text-sm text-muted-foreground">Pagos diarios y dispersión a cuentas bancarias</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeSection === 'payments' ? 'default' : 'outline'}
          onClick={() => setActiveSection('payments')}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Pagos por Ventas
        </Button>
        <Button
          type="button"
          variant={activeSection === 'disbursements' ? 'default' : 'outline'}
          onClick={() => setActiveSection('disbursements')}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Dispersión
        </Button>
      </div>

      {activeSection === 'payments' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard label="Pendiente" value={formatCop(summary.pendingCop)} icon={Clock} iconClass="text-muted-foreground" />
            <SummaryCard label="Procesado" value={formatCop(summary.processedCop)} icon={AlertCircle} iconClass="text-primary" />
            <SummaryCard label="Dispersado" value={formatCop(summary.disbursedCop)} icon={CheckCircle2} iconClass="text-green-600" />
          </div>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Recaudación diaria</h3>
            </div>
            <div className="overflow-x-auto p-4">
              {loading && <p className="text-sm text-muted-foreground">Cargando pagos...</p>}
              {!loading && payments.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay ventas registradas con órdenes aprobadas.</p>
              )}
              {payments.length > 0 && (
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Tipo</th>
                      <th className="py-2 pr-3">Concepto</th>
                      <th className="py-2 pr-3">Organizador</th>
                      <th className="py-2 pr-3 text-right">Vendidos</th>
                      <th className="py-2 pr-3 text-right">Ocup.</th>
                      <th className="py-2 pr-3 text-right">Bruto</th>
                      <th className="py-2 pr-3 text-right">Comisión</th>
                      <th className="py-2 pr-3 text-right">Neto</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const status = STATUS_LABELS[payment.status];
                      const Icon = status.icon;
                      const isEvent = !payment.saleCategory || payment.saleCategory === 'evento';
                      const saleType = payment.saleCategory
                        ? SALE_CATEGORY_LABELS[payment.saleCategory]
                        : 'Evento';
                      return (
                        <tr
                          key={payment.id}
                          className={`border-b border-border/60 ${isEvent ? 'cursor-pointer hover:bg-accent/30' : ''}`}
                          onClick={() => isEvent && setSelectedPayment(payment)}
                        >
                          <td className="py-3 pr-3 font-mono text-xs">{payment.id}</td>
                          <td className="py-3 pr-3">
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              {saleType}
                            </span>
                          </td>
                          <td className="py-3 pr-3 font-medium">{payment.eventName}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{payment.organizer}</td>
                          <td className="py-3 pr-3 text-right">{payment.ticketsSold}/{payment.totalTickets}</td>
                          <td className="py-3 pr-3 text-right">{payment.occupancy}%</td>
                          <td className="py-3 pr-3 text-right">{formatCop(payment.grossAmount)}</td>
                          <td className="py-3 pr-3 text-right text-muted-foreground">{formatCop(payment.commission)}</td>
                          <td className="py-3 pr-3 text-right font-medium">{formatCop(payment.netAmount)}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                              <Icon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Cargar archivo de dispersión</h3>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="dsb-file" className="text-sm font-medium">Archivo (.xlsx, .csv)</label>
                <Input
                  id="dsb-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="button" onClick={() => void handleFileUpload()} disabled={!selectedFile || uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Cargando…' : 'Cargar'}
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Historial</h3>
            </div>
            <div className="overflow-x-auto p-4">
              {disbursements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay archivos de dispersión cargados todavía.</p>
              ) : (
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Archivo</th>
                      <th className="py-2 pr-3">Carga</th>
                      <th className="py-2 pr-3 text-right">Registros</th>
                      <th className="py-2 pr-3 text-right">Monto</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursements.map((d) => (
                      <tr key={d.id} className="border-b border-border/60">
                        <td className="py-3 pr-3 font-mono text-xs">{d.id}</td>
                        <td className="py-3 pr-3 font-medium">{d.fileName}</td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {new Date(d.uploadedAt).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 pr-3 text-right">{d.totalRecords}</td>
                        <td className="py-3 pr-3 text-right">{formatCop(d.totalAmount)}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${iconClass || 'text-primary'}`} />
      </div>
    </div>
  );
}

export default AdminPaymentsTab;
