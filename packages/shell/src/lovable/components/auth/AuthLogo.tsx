import { DoEventsLogo } from '@doevents/shared';

export const AuthLogo = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-8">
    <div className="rounded-2xl bg-card px-6 py-4 shadow-sm border border-border/50">
      <DoEventsLogo width={180} height={52} />
    </div>
    <p className="text-center text-sm font-medium text-muted-foreground max-w-[240px] leading-snug">
      Organiza, descubre y vive eventos
    </p>
  </div>
);

export default AuthLogo;
