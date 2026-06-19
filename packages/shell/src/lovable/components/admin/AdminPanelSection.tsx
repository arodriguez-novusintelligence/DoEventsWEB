import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminPanelSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const AdminPanelSection = ({
  title,
  description,
  icon: Icon,
  children,
}: AdminPanelSectionProps) => (
  <div className="mx-auto max-w-6xl space-y-4">
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
    {children}
  </div>
);

export default AdminPanelSection;
