import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  ChevronLeft,
  Flag,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

export type AdminTabId =
  | 'home'
  | 'reports'
  | 'refunds'
  | 'support'
  | 'payments'
  | 'admin'
  | 'newusers';

const TABS: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Inicio', icon: LayoutDashboard },
  { id: 'reports', label: 'Denuncias', icon: Flag },
  { id: 'refunds', label: 'Reembolsos', icon: RefreshCw },
  { id: 'support', label: 'Soporte', icon: Search },
  { id: 'payments', label: 'Pagos', icon: Banknote },
  { id: 'admin', label: 'Usuarios', icon: Users },
  { id: 'newusers', label: 'Nuevos', icon: UserPlus },
];

interface Props {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<Props> = ({ activeTab, onTabChange, children }) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('es-CO', { hour12: false });

  return (
    <div className="min-h-screen bg-background pb-36">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-6 pt-6 text-primary-foreground">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          Atrás
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-foreground/15 p-3 backdrop-blur">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de administración</h1>
            <p className="text-sm text-primary-foreground/80">Backoffice de do.events</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`inline-flex shrink-0 items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-6">{children}</main>
      <p className="pointer-events-none fixed bottom-24 right-4 text-[10px] text-muted-foreground/60">
        Hora servidor: {time}
      </p>
    </div>
  );
};

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'emerald' | 'amber' | 'destructive';
}) {
  const accentClass = accent === 'emerald'
    ? 'text-emerald-600'
    : accent === 'amber'
      ? 'text-amber-600'
      : accent === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accentClass}`}>
        {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </article>
  );
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

export default AdminLayout;
