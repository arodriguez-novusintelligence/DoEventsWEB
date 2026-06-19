import { DoEventsLogo } from '@doevents/shared';

export const AuthLogo = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-8">
    <div className="rounded-2xl bg-card px-6 py-4 shadow-md border border-border/60 ring-1 ring-primary/10">
      <DoEventsLogo width={180} height={52} />
    </div>
    <p className="text-center text-sm font-semibold text-foreground max-w-[260px] leading-snug">
      Organiza, descubre y vive eventos
    </p>
    <p className="text-center text-xs text-muted-foreground max-w-[220px]">
      Tu plataforma para crear experiencias memorables
    </p>
  </div>
);

export default AuthLogo;
