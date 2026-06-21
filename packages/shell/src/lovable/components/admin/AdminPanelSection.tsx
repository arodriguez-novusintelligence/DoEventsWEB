import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminPanelSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  children: ReactNode;
}

export const AdminPanelSection = ({
  title,
  description,
  icon: Icon,
  badge,
  children,
}: AdminPanelSectionProps) => (
  <div className="mx-auto max-w-6xl space-y-4">
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
            {badge && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
    {children}
  </div>
);

export default AdminPanelSection;
