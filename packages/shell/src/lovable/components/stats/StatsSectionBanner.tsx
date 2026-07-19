import { ChevronLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface StatsBannerStat {
  value: string | number;
  label: string;
}

interface StatsSectionBannerProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onBack: () => void;
  stats?: StatsBannerStat[];
  summary?: ReactNode;
  rightAction?: ReactNode;
}

/**
 * Banner de sección de estadísticas (mismo formato que Códigos promocionales):
 * gradiente, botón Atrás, icono + título + evento, KPIs y barra resumen.
 */
const StatsSectionBanner = ({
  title,
  subtitle,
  icon: Icon,
  onBack,
  stats,
  summary,
  rightAction,
}: StatsSectionBannerProps) => (
  <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-8 pt-5">
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Atrás
        </button>
        {rightAction}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold leading-tight text-primary-foreground">{title}</h1>
          <p className="truncate text-xs text-primary-foreground/80">{subtitle}</p>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div
          className={`mt-5 grid gap-2 ${
            stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          }`}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-primary-foreground/15 p-3 text-center backdrop-blur"
            >
              <div className="text-lg font-extrabold text-primary-foreground">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-primary-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {summary != null && summary !== false && (
        <div className="mt-3 rounded-xl bg-primary-foreground/10 px-3 py-2 text-center text-[11px] text-primary-foreground/90 backdrop-blur">
          {summary}
        </div>
      )}
    </div>
  </div>
);

export default StatsSectionBanner;
