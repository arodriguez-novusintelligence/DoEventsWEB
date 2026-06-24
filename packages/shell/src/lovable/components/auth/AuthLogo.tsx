import { DoEventsLogo } from '@doevents/shared';
const AuthLogo = () => (
  <div className="flex flex-col items-center gap-2">
    <h1 className="text-5xl font-bold tracking-tight">
      <span className="text-primary">Do</span>
      <span className="text-primary mx-1">·</span>
      <span className="text-foreground">events</span>
    </h1>
    <div className="h-px w-40 bg-foreground/80" />
  </div>
);

export default AuthLogo;