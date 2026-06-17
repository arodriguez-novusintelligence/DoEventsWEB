import { ChevronLeft } from 'lucide-react';

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="text-base font-bold text-primary mt-5 mb-2">{title}</h2>
    <div className="space-y-3 text-sm text-foreground leading-relaxed">{children}</div>
  </div>
);

export const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-3">
    <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
    <div className="space-y-2 text-sm text-foreground leading-relaxed">{children}</div>
  </div>
);

export const Bullet = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2">
    <span className="text-primary mt-1">•</span>
    <p className="flex-1">{children}</p>
  </div>
);

export const Notice = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 mt-3">
    <p className="font-bold text-foreground mb-1">{title}</p>
    <p className="text-sm text-foreground leading-relaxed">{children}</p>
  </div>
);

export const LegalDocLayout = ({
  title,
  onBack,
  intro,
  children,
}: {
  title: string;
  onBack: () => void;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="mx-auto max-w-lg pb-24 min-h-screen bg-background">
    <div className="px-4 pt-4">
      <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-4">
        <ChevronLeft className="h-5 w-5" />
        Atras
      </button>
      <h1 className="text-2xl font-extrabold text-primary leading-tight mb-4">{title}</h1>
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        {intro && (
          <p className="text-sm text-foreground leading-relaxed">{intro}</p>
        )}
        {children}
      </div>
    </div>
  </div>
);
