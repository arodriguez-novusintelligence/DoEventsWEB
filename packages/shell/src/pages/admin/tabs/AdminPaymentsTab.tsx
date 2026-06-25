import React, { useEffect, useState } from 'react';
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
import { fetchAdminPayments, useToast, type AdminPaymentItem } from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { formatCop } from '../AdminLayout';

const STATUS_LABELS = {
  pendiente: { label: 'Pendiente', icon: Clock, className: 'border-border' },
  procesado: { label: 'Procesado', icon: AlertCircle, className: 'bg-secondary' },
  dispersado: { label: 'Dispersado', icon: CheckCircle2, className: 'bg-primary text-primary-foreground' },
};

export const AdminPaymentsTab: React.FC = () => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'payments' | 'disbursements'>('payments');
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [summary, setSummary] = useState({ pendingCop: 0, processedCop: 0, disbursedCop: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminPayments()
      .then((data) => {
        setPayments(data.payments || []);
        setSummary(data.summary || { pendingCop: 0, processedCop: 0, disbursedCop: 0 });
      })
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar pagos', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

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
                      <th className="py-2 pr-3">Evento</th>
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
                      return (
                        <tr key={payment.id} className="border-b border-border/60">
                          <td className="py-3 pr-3 font-mono text-xs">{payment.id}</td>
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
            <div className="space-y-3 p-4">
              <p className="text-sm text-muted-foreground">
                La carga masiva (.xlsx, .csv) se habilitará cuando el backoffice exponga archivos de dispersión.
              </p>
              <Button type="button" variant="outline" disabled>
                <Upload className="mr-2 h-4 w-4" />
                Seleccionar archivo
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Historial</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">No hay archivos de dispersión cargados todavía.</p>
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
