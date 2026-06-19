import { DoEventsLogo } from '@doevents/shared';

export const AuthLogo = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-10">
    <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 px-8 py-6 shadow-lg border border-border/60 ring-1 ring-primary/15">
      <DoEventsLogo width={200} height={58} />
    </div>
    <div className="space-y-1 text-center">
      <p className="text-base font-bold text-foreground max-w-[280px] leading-snug">
        Organiza, descubre y vive eventos
      </p>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Tu plataforma para crear experiencias memorables
      </p>
    </div>
  </div>
);

export default AuthLogo;
