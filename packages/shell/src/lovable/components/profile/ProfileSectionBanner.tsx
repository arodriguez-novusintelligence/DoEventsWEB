import { ChevronLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProfileSectionBannerProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onBack: () => void;
  backLabel?: string;
  rightAction?: ReactNode;
}

const ProfileSectionBanner = ({
  title,
  subtitle,
  icon: Icon,
  onBack,
  backLabel = 'Atrás',
  rightAction,
}: ProfileSectionBannerProps) => (
  <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-5">
    <div className="mx-auto max-w-lg">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-medium text-primary-foreground/90"
      >
        <ChevronLeft className="h-5 w-5" />
        {backLabel}
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold leading-tight text-primary-foreground">{title}</h1>
          <p className="text-xs text-primary-foreground/80">{subtitle}</p>
        </div>
        {rightAction}
      </div>
    </div>
  </div>
);

export default ProfileSectionBanner;
