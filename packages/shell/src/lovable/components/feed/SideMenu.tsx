import {
  Home,
  Ticket,
  MessageSquare,
  ScanLine,
  Map as MapIcon,
  UsersRound,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  RefreshCcw,
  LogOut,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { StoryAvatar } from '../../../components/StoryAvatar';
import TermsConditionsView from '@lovable/components/legal/TermsConditionsView';
import PrivacyPolicyView from '@lovable/components/legal/PrivacyPolicyView';
import PlatformCostsView from '@lovable/components/legal/PlatformCostsView';
import RefundPolicyView from '@lovable/components/invitations/RefundPolicyView';

type LegalDoc = 'costs' | 'terms' | 'privacy' | 'refund' | null;

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (section: string) => void;
  onGoToTickets?: () => void;
  onGoToAdmin?: () => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  profileName?: string;
  profileUsername?: string;
  profileAvatar?: string;
  profileUserId?: string;
  unreadMessages?: number;
  onOpen?: () => void;
}

const SideMenu = ({
  open,
  onOpenChange,
  onNavigate,
  onGoToTickets,
  onGoToAdmin,
  isAdmin = false,
  onLogout,
  profileName,
  profileUsername,
  profileAvatar,
  profileUserId,
  unreadMessages = 0,
  onOpen,
}: SideMenuProps) => {
  const displayName = profileName?.trim() || 'Invitado';
  const displayUsername = profileUsername?.trim() || '@usuario';
  const [activeDoc, setActiveDoc] = useState<LegalDoc>(null);

  useEffect(() => {
    if (open) onOpen?.();
  }, [open, onOpen]);

  const go = (section: string) => {
    onNavigate?.(section);
    onOpenChange(false);
  };

  const openDoc = (doc: LegalDoc) => {
    setActiveDoc(doc);
    onOpenChange(false);
  };

  const mainItems: { label: string; icon: typeof Home; onClick: () => void; badge?: number }[] = [
    { label: 'Feed', icon: Home, onClick: () => go('wall') },
    {
      label: 'Mis Compras',
      icon: Ticket,
      onClick: () => {
        onGoToTickets?.();
        onOpenChange(false);
      },
    },
    {
      label: 'Mensajes',
      icon: MessageSquare,
      onClick: () => go('mensajes'),
      badge: unreadMessages,
    },
    { label: 'Control de accesos', icon: ScanLine, onClick: () => go('control-accesos') },
    { label: 'Mapa', icon: MapIcon, onClick: () => go('mapa') },
    { label: 'Gestión de invitados', icon: UsersRound, onClick: () => go('invitados') },
  ];

  const adminItems: {
    label: string;
    icon: typeof Sparkles;
    onClick: () => void;
    pro?: boolean;
    adminOnly?: boolean;
  }[] = [
    { label: 'Asistente IA', icon: Sparkles, onClick: () => go('ai-assistant'), pro: true },
    {
      label: 'Panel de administración',
      icon: ShieldCheck,
      onClick: () => {
        onGoToAdmin?.();
        onOpenChange(false);
      },
      adminOnly: true,
    },
  ];

  const visibleAdminItems = adminItems.filter((item) => !item.adminOnly || isAdmin);

  const supportItems: { label: string; icon: typeof CircleDollarSign; onClick: () => void }[] = [
    { label: 'Costos de la plataforma', icon: CircleDollarSign, onClick: () => openDoc('costs') },
    { label: 'Términos y Condiciones', icon: FileText, onClick: () => openDoc('terms') },
    { label: 'Política de seguridad', icon: ShieldCheck, onClick: () => openDoc('privacy') },
    { label: 'Recaudos y Reembolsos', icon: RefreshCcw, onClick: () => openDoc('refund') },
  ];

  if (activeDoc) {
    const close = () => setActiveDoc(null);
    return (
      <div className="fixed inset-0 z-[1100] bg-background overflow-y-auto overscroll-contain">
        {activeDoc === 'costs' && <PlatformCostsView onBack={close} />}
        {activeDoc === 'terms' && <TermsConditionsView onBack={close} />}
        {activeDoc === 'privacy' && <PrivacyPolicyView onBack={close} />}
        {activeDoc === 'refund' && <RefundPolicyView onBack={close} />}
      </div>
    );
  }

  const menuLayer = (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-foreground/40 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[9999] flex h-full w-[84%] max-w-[320px] flex-col bg-[hsl(var(--primary-deep))] text-primary-foreground transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Profile */}
        <div className="flex items-center gap-3 px-5 pt-12 pb-5">
          <button
            onClick={() => go('perfil')}
            className="flex flex-1 items-center gap-3 rounded-lg p-1 -m-1 text-left transition-colors hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
            aria-label="Ir a mi perfil"
          >
            <StoryAvatar
              userId={profileUserId}
              name={displayName}
              imageUrl={profileAvatar}
              size={48}
              isOwn
              onClick={() => go('perfil')}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-primary-foreground">{displayName}</p>
              <p className="truncate text-xs text-primary-foreground/60">{displayUsername}</p>
            </div>
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10"
            aria-label="Cerrar menú"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {/* Principal */}
          <div className="mt-2">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground/50">
              Principal
            </p>
            <div className="mt-2 space-y-0.5">
              {mainItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  <span className="flex-1 text-left text-[14px] font-medium">{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 ? (
                    <span
                      className="ml-auto inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#FF3B30] px-1.5 text-[11px] font-bold leading-none text-white"
                      aria-label={`${item.badge} mensajes sin leer`}
                    >
                      {item.badge > 999 ? '999+' : item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Administración — Asistente IA (PRO) + Panel admin (solo administradores) */}
          {visibleAdminItems.length > 0 && (
            <div className="mt-7">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground/50">
                Administración
              </p>
              <div className="mt-2 space-y-0.5">
                {visibleAdminItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    <span className="flex-1 text-left text-[14px] font-medium">{item.label}</span>
                    {item.pro && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-950">
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Soporte */}
          <div className="mt-7">
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground/50">
              Soporte
            </p>
            <div className="mt-2 space-y-0.5">
              {supportItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10 active:bg-primary-foreground/15"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  <span className="text-[14px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cerrar sesión */}
        <div className="border-t border-primary-foreground/10 px-3 py-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="text-[14px] font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );

  return createPortal(menuLayer, document.body);
};

export default SideMenu;
