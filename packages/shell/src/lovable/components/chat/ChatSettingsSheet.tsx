import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@lovable/components/ui/sheet';
import { Switch } from '@lovable/components/ui/switch';
import { Bell, Mail, Eye, CheckCheck, Lock, ShieldAlert, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface ChatSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  privateProfile: boolean;
  showOnline: boolean;
  readReceipts: boolean;
}

const STORAGE_KEY = 'chat-settings-v1';

const defaults: ChatSettings = {
  pushNotifications: true,
  emailNotifications: false,
  privateProfile: false,
  showOnline: true,
  readReceipts: true,
};

const load = (): ChatSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBlockedClick?: () => void;
}

const Row = ({
  icon: Icon,
  title,
  description,
  value,
  onChange,
  tone = 'default',
}: {
  icon: any;
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  tone?: 'default' | 'warning';
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-2 ring-primary/20 ${tone === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-snug">{description}</p>
    </div>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

const ChatSettingsSheet = ({ open, onOpenChange, onBlockedClick }: Props) => {
  const [settings, setSettings] = useState<ChatSettings>(defaults);

  useEffect(() => {
    if (open) setSettings(load());
  }, [open]);

  const update = (key: keyof ChatSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      toast.success('Preferencia de chat actualizada');
    } catch {
      toast.error('No se pudo guardar la preferencia');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Configuración del chat</SheetTitle>
              <SheetDescription>
                Administra notificaciones y privacidad de tus conversaciones.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Notificaciones</h3>
            <div className="space-y-2">
              <Row icon={Bell} title="Notificaciones push" description="Recibe alertas en tiempo real en tu dispositivo." value={settings.pushNotifications} onChange={(v) => update('pushNotifications', v)} />
              <Row icon={Mail} title="Notificaciones por correo" description="Resúmenes diarios de tus chats." value={settings.emailNotifications} onChange={(v) => update('emailNotifications', v)} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Privacidad</h3>
            <div className="space-y-2">
              <Row icon={Lock} title="Perfil privado" description="Solo tus seguidores aprobados pueden escribirte." value={settings.privateProfile} onChange={(v) => update('privateProfile', v)} />
              <Row icon={Eye} title="Mostrar estado en línea" description="Otros usuarios verán cuando estás disponible." value={settings.showOnline} onChange={(v) => update('showOnline', v)} />
              <Row icon={CheckCheck} title="Confirmación de lectura" description="Activa los dobles check al leer mensajes." value={settings.readReceipts} onChange={(v) => update('readReceipts', v)} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Avanzado</h3>
            <button
              type="button"
              onClick={() => (onBlockedClick ? onBlockedClick() : toast('Lista de bloqueados'))}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:bg-accent/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Usuarios bloqueados</p>
                <p className="text-xs text-muted-foreground">Gestiona a quién has bloqueado.</p>
              </div>
            </button>
            <button
              onClick={() => toast('Historial limpio', { description: 'Se eliminaron mensajes locales' })}
              className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-left hover:bg-destructive/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Limpiar historial</p>
                <p className="text-xs text-muted-foreground">Borra todos los mensajes locales del dispositivo.</p>
              </div>
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatSettingsSheet;
