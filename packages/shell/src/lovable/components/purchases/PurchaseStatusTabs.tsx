import type { PurchaseTabStatus } from '../../../lovable-bridge/purchasesAdapter';

const TABS: { key: PurchaseTabStatus; label: string }[] = [
  { key: 'aprobada', label: 'Aprobadas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'cancelada', label: 'Canceladas' },
  { key: 'finalizada', label: 'Finalizadas' },
];

interface PurchaseStatusTabsProps {
  activeTab: PurchaseTabStatus;
  counts: Record<PurchaseTabStatus, number>;
  onChange: (tab: PurchaseTabStatus) => void;
}

export function PurchaseStatusTabs({ activeTab, counts, onChange }: PurchaseStatusTabsProps) {
  return (
    <div className="border-b border-border/60">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : tab.key === 'finalizada'
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PurchaseStatusTabs;
