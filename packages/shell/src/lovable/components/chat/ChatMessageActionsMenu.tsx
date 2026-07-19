import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Copy,
  CornerUpLeft,
  MoreHorizontal,
  Pencil,
  Smile,
  Trash2,
  UserMinus,
  X,
} from 'lucide-react';
import type { ChatMessage } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import ChatReactionPicker from './ChatReactionPicker';

const MENU_VIEWPORT_PADDING = 8;
const MENU_GAP = 6;
const MENU_ESTIMATED_WIDTH = 260;
const MENU_ESTIMATED_HEIGHT = 320;

export interface ChatMessageActionsHandlers {
  onReply?: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onKick?: () => void;
  onReact?: (emoji: string) => void;
  onClose: () => void;
}

interface ChatMessageActionsListProps extends ChatMessageActionsHandlers {
  message: ChatMessage;
  isAdmin?: boolean;
  canModerate?: boolean;
  showKickUser?: boolean;
}

export const ChatMessageActionsList = ({
  message,
  isAdmin = false,
  canModerate = false,
  showKickUser = true,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onReport,
  onKick,
  onReact,
  onClose,
}: ChatMessageActionsListProps) => (
  <>
    {onReact && !message.isAnnouncement && (
      <div className="px-1 pb-1">
        <p className="mb-1 flex items-center gap-2 px-2 text-sm font-semibold text-primary">
          <Smile className="h-4 w-4" /> Reaccionar
        </p>
        <ChatReactionPicker onSelect={(emoji) => onReact(emoji)} />
      </div>
    )}
    {!message.isOwn && !message.isAnnouncement && onReply && (
      <button
        type="button"
        onClick={onReply}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
      >
        <CornerUpLeft className="h-4 w-4" /> Responder
      </button>
    )}
    <button
      type="button"
      onClick={onCopy}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent"
    >
      <Copy className="h-4 w-4" /> Copiar selección
    </button>
    {message.isOwn && !message.isAnnouncement && onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent"
      >
        <Pencil className="h-4 w-4" /> Editar
      </button>
    )}
    {(message.isOwn || (isAdmin && canModerate)) && !message.isAnnouncement && onDelete && (
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-accent"
      >
        <Trash2 className="h-4 w-4" /> Eliminar
      </button>
    )}
    {!message.isOwn && !message.isAnnouncement && onReport && (
      <button
        type="button"
        onClick={onReport}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent"
      >
        <AlertCircle className="h-4 w-4" /> Reportar
      </button>
    )}
    {!message.isOwn && isAdmin && canModerate && showKickUser && onKick && (
      <button
        type="button"
        onClick={onKick}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-accent"
      >
        <UserMinus className="h-4 w-4" /> Expulsar usuario
      </button>
    )}
    <button
      type="button"
      onClick={onClose}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent"
    >
      <X className="h-4 w-4" /> Cerrar
    </button>
  </>
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewportSize() {
  return {
    width: window.innerWidth || document.documentElement.clientWidth || 0,
    height: window.innerHeight || document.documentElement.clientHeight || 0,
  };
}

/** Posición fixed que mantiene el menú completamente dentro del viewport móvil. */
export function computeMenuPosition(
  anchor: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  menuSize: { width: number; height: number },
  preferAlign: 'start' | 'end' = 'end',
): { top: number; left: number; maxWidth: number; maxHeight: number } {
  const { width: vw, height: vh } = getViewportSize();
  const pad = MENU_VIEWPORT_PADDING;
  const maxWidth = Math.max(180, Math.min(menuSize.width, vw - pad * 2));
  const maxHeight = Math.max(160, Math.min(menuSize.height, vh - pad * 2));

  const spaceAbove = anchor.top - pad;
  const spaceBelow = vh - anchor.bottom - pad;
  const placeAbove = spaceAbove >= maxHeight || spaceAbove > spaceBelow;

  let top = placeAbove
    ? anchor.top - maxHeight - MENU_GAP
    : anchor.bottom + MENU_GAP;
  top = clamp(top, pad, Math.max(pad, vh - maxHeight - pad));

  // Preferir anclar al lado del botón según align, pero voltear si se sale.
  let left = preferAlign === 'end'
    ? anchor.right - maxWidth
    : anchor.left;
  left = clamp(left, pad, Math.max(pad, vw - maxWidth - pad));

  return { top, left, maxWidth, maxHeight };
}

function useAnchoredMenuPosition(
  open: boolean,
  anchorRef: { current: HTMLElement | null },
  menuRef: { current: HTMLElement | null },
  preferAlign: 'start' | 'end',
) {
  const [coords, setCoords] = useState<{ top: number; left: number; maxWidth: number; maxHeight: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setCoords(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const measured = menuRef.current?.getBoundingClientRect();
      const menuSize = {
        width: measured?.width || MENU_ESTIMATED_WIDTH,
        height: measured?.height || MENU_ESTIMATED_HEIGHT,
      };
      setCoords(computeMenuPosition(rect, menuSize, preferAlign));
    };

    update();
    // Recalcular tras paint con tamaño real del menú
    const raf = window.requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, menuRef, preferAlign]);

  return coords;
}

interface ChatMessageActionsPopoverProps extends ChatMessageActionsListProps {
  align?: 'start' | 'end';
}

export const ChatMessageActionsPopover = ({
  align = 'end',
  ...listProps
}: ChatMessageActionsPopoverProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const coords = useAnchoredMenuPosition(open, buttonRef, menuRef, align);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    window.addEventListener('touchstart', handler);
    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const close = () => {
    listProps.onClose();
    setOpen(false);
  };

  const wrap = (handler?: () => void) => () => {
    handler?.();
    setOpen(false);
  };

  const menu = open && coords ? (
    <div
      ref={menuRef}
      className="fixed z-[80] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl"
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.maxWidth,
        maxWidth: `min(${coords.maxWidth}px, calc(100vw - ${MENU_VIEWPORT_PADDING * 2}px))`,
        maxHeight: coords.maxHeight,
      }}
      onClick={(event) => event.stopPropagation()}
      role="menu"
    >
      <ChatMessageActionsList
        {...listProps}
        onReply={listProps.onReply ? wrap(listProps.onReply) : undefined}
        onCopy={wrap(listProps.onCopy)}
        onEdit={listProps.onEdit ? wrap(listProps.onEdit) : undefined}
        onDelete={listProps.onDelete ? wrap(listProps.onDelete) : undefined}
        onReport={listProps.onReport ? wrap(listProps.onReport) : undefined}
        onKick={listProps.onKick ? wrap(listProps.onKick) : undefined}
        onReact={listProps.onReact
          ? (emoji: string) => {
              listProps.onReact?.(emoji);
              setOpen(false);
            }
          : undefined}
        onClose={close}
      />
    </div>
  ) : open ? (
    // Primer frame: montar fuera de vista para medir tamaño real
    <div
      ref={menuRef}
      className="fixed z-[80] rounded-2xl border border-border bg-card p-2 shadow-xl opacity-0 pointer-events-none"
      style={{ top: 0, left: 0, width: MENU_ESTIMATED_WIDTH }}
      aria-hidden
    >
      <ChatMessageActionsList {...listProps} onClose={close} />
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative shrink-0 self-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Opciones del mensaje"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground',
          open && 'bg-accent text-foreground',
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
};

interface ChatMessageContextMenuProps extends ChatMessageActionsListProps {
  position: { x: number; y: number };
}

export const ChatMessageContextMenu = ({
  position,
  ...listProps
}: ChatMessageContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState(() =>
    computeMenuPosition(
      {
        left: position.x,
        top: position.y,
        right: position.x,
        bottom: position.y,
        width: 0,
        height: 0,
      },
      { width: MENU_ESTIMATED_WIDTH, height: MENU_ESTIMATED_HEIGHT },
      'start',
    ),
  );

  useLayoutEffect(() => {
    const measured = menuRef.current?.getBoundingClientRect();
    const menuSize = {
      width: measured?.width || MENU_ESTIMATED_WIDTH,
      height: measured?.height || MENU_ESTIMATED_HEIGHT,
    };
    setCoords(
      computeMenuPosition(
        {
          left: position.x,
          top: position.y,
          right: position.x,
          bottom: position.y,
          width: 0,
          height: 0,
        },
        menuSize,
        'start',
      ),
    );
  }, [position.x, position.y]);

  useEffect(() => {
    const handler = () => listProps.onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [listProps.onClose]);

  const node = (
    <div
      ref={menuRef}
      className="fixed z-[80] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl"
      style={{
        top: coords.top,
        left: coords.left,
        width: coords.maxWidth,
        maxWidth: `min(${coords.maxWidth}px, calc(100vw - ${MENU_VIEWPORT_PADDING * 2}px))`,
        maxHeight: coords.maxHeight,
      }}
      onClick={(event) => event.stopPropagation()}
      role="menu"
    >
      <ChatMessageActionsList {...listProps} />
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
};
