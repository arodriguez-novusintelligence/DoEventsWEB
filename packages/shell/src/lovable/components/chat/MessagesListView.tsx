import { useMemo, useState, useCallback, useEffect } from 'react';
import { parseEventDate, resolveEventImageUrl, searchUsers, type SearchUserResult } from '@doevents/shared';
import {
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Trash2,
  ChevronLeft,
  Search,
  Ban,
  PencilLine,
  Settings,
  Archive,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Badge } from '@lovable/components/ui/badge';
import { toast } from 'sonner';
import type { ChatAttendee, EventChatRoom, EventStatus, PrivateChat } from '@lovable/data/chatData';
import { cn } from '@lovable/lib/utils';
import ChatSettingsSheet from './ChatSettingsSheet';
import { StoryAvatar } from '../../../components/StoryAvatar';
import { useActiveStoryAuthors } from '../../../contexts/StoriesContext';

interface MessagesListViewProps {
  chatRooms: EventChatRoom[];
  privateChats?: PrivateChat[];
  groupChats?: PrivateChat[];
  contacts?: ChatAttendee[];
  onOpenChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onOpenPrivateChat?: (chatId: string) => void;
  onBack?: () => void;
  onBlockedClick?: () => void;
  onCreateConversation?: () => void;
  onStartDirectChat?: (userId: string) => void;
  onOpenUserProfile?: (userId: string) => void;
  currentUserId?: string;
  profileAvatar?: string;
  profileInitials?: string;
  onOpenStory?: (authorUserId: string) => void;
  onCreateStory?: () => void;
  archivedIds?: Set<string>;
  onArchiveChat?: (chatId: string, archive: boolean) => void;
  loading?: boolean;
}

type FilterKey = 'eventos' | 'interno' | 'grupos' | 'no_leidos' | 'archivados';

const ARCHIVED_STORAGE_KEY = 'archived-chats-v1';
const HIDDEN_EVENT_CHATS_KEY = 'hidden-event-chats-v1';

const loadArchived = (): Set<string> => {
  try {
    const v = localStorage.getItem(ARCHIVED_STORAGE_KEY);
    return new Set(v ? (JSON.parse(v) as string[]) : []);
  } catch {
    return new Set();
  }
};

const loadHiddenEventChats = (): Set<string> => {
  try {
    const v = localStorage.getItem(HIDDEN_EVENT_CHATS_KEY);
    return new Set(v ? (JSON.parse(v) as string[]) : []);
  } catch {
    return new Set();
  }
};

const sortByEventDate = (a: EventChatRoom, b: EventChatRoom) => {
  const da = parseEventDate(a.eventDateRaw || a.eventDate)?.getTime() ?? 0;
  const db = parseEventDate(b.eventDateRaw || b.eventDate)?.getTime() ?? 0;
  return da - db;
};

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  activo: { label: 'Activo', className: 'bg-success/10 text-success' },
  en_ejecucion: { label: 'En ejecución', className: 'bg-primary/10 text-primary' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
  finalizado: { label: 'Finalizado', className: 'bg-muted text-muted-foreground' },
};

const MessagesListView = ({
  chatRooms,
  privateChats: privateChatsProp,
  groupChats: groupChatsProp,
  contacts,
  onOpenChat,
  onDeleteChat,
  onOpenPrivateChat,
  onBack,
  onBlockedClick,
  onCreateConversation,
  onStartDirectChat,
  onOpenUserProfile,
  currentUserId,
  profileAvatar,
  profileInitials = 'YO',
  onOpenStory,
  onCreateStory,
  archivedIds,
  onArchiveChat,
  loading = false,
}: MessagesListViewProps) => {
  const privateChats = privateChatsProp ?? [];
  const [showPast, setShowPast] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('eventos');
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [archived, setArchived] = useState<Set<string>>(() => archivedIds ?? loadArchived());
  const [hiddenEventChats, setHiddenEventChats] = useState<Set<string>>(() => loadHiddenEventChats());
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [userSearchResults, setUserSearchResults] = useState<SearchUserResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const { hasActiveStory } = useActiveStoryAuthors();

  const handleContactStoryClick = (contactId: string, chatId: string) => {
    if (contactId && hasActiveStory(contactId)) {
      onOpenStory?.(contactId);
      return;
    }
    onOpenPrivateChat?.(chatId);
  };

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setUserSearchResults([]);
      setUserSearchError(null);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setSearchingUsers(true);
      setUserSearchError(null);
      searchUsers(q)
        .then((users) => setUserSearchResults(
          users.filter((u) => u.id && u.id !== currentUserId),
        ))
        .catch((err) => {
          setUserSearchResults([]);
          setUserSearchError(err instanceof Error ? err.message : 'No se pudo buscar usuarios');
        })
        .finally(() => setSearchingUsers(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search, currentUserId]);

  const markImageBroken = useCallback((roomId: string) => {
    setBrokenImages((prev) => new Set(prev).add(roomId));
  }, []);

  const toggleArchive = (id: string) => {
    const isArchived = archived.has(id);
    if (onArchiveChat) {
      onArchiveChat(id, !isArchived);
      setArchived((prev) => {
        const next = new Set(prev);
        if (isArchived) next.delete(id);
        else next.add(id);
        return next;
      });
      toast(isArchived ? 'Conversación restaurada' : 'Conversación archivada');
      return;
    }
    setArchived((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
    toast(isArchived ? 'Conversación restaurada' : 'Conversación archivada');
  };

  const notArchived = (id: string) => !archived.has(id);
  const notHidden = (id: string) => !hiddenEventChats.has(id);

  const visibleEventRooms = useMemo(
    () => chatRooms.filter((r) => notHidden(r.id)),
    [chatRooms, hiddenEventChats],
  );

  const handleDeleteEventChat = useCallback((chatId: string) => {
    if (onDeleteChat) {
      onDeleteChat(chatId);
    }
    setHiddenEventChats((prev) => {
      const next = new Set(prev);
      next.add(chatId);
      try { localStorage.setItem(HIDDEN_EVENT_CHATS_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
    toast('Chat eliminado de la lista');
  }, [onDeleteChat]);

  const activeRooms = visibleEventRooms
    .filter(r => (r.eventStatus === 'activo' || r.eventStatus === 'en_ejecucion') && notArchived(r.id))
    .sort(sortByEventDate);

  const pastRooms = visibleEventRooms
    .filter(r => (r.eventStatus === 'finalizado' || r.eventStatus === 'cancelado') && notArchived(r.id))
    .sort(sortByEventDate);

  const filteredPrivate = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = privateChats.filter(c => notArchived(c.id));
    if (!q) return base;
    return base.filter(c => c.user.name.toLowerCase().includes(q));
  }, [search, archived, privateChats]);

  const unreadPrivate = privateChats.filter(c => c.unreadCount > 0 && notArchived(c.id));
  const unreadEvents = visibleEventRooms.filter(c => c.unreadCount > 0 && notArchived(c.id));

  const archivedPrivate = privateChats.filter(c => archived.has(c.id));
  const archivedEvents = visibleEventRooms.filter(c => archived.has(c.id));

  const counts = {
    eventos: visibleEventRooms.filter((r) => notArchived(r.id)).length,
    interno: privateChats.filter((c) => notArchived(c.id)).length,
    grupos: (groupChatsProp?.length || 0) + visibleEventRooms.filter(c => c.attendees.length > 2 && notArchived(c.id)).length,
    no_leidos: unreadPrivate.length + unreadEvents.length,
    archivados: archived.size,
  };

  const renderRoom = (room: EventChatRoom) => {
    const status = statusConfig[room.eventStatus];
    const imageSrc = room.eventImage && !brokenImages.has(room.id)
      ? resolveEventImageUrl(room.eventImage)
      : '';
    return (
      <button
        key={room.id}
        onClick={() => onOpenChat(room.id)}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 shadow-sm transition-colors hover:bg-accent/40 border border-border/60"
      >
        {imageSrc ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
            <img
              src={imageSrc}
              alt={room.eventName}
              className="h-full w-full object-cover"
              onError={() => markImageBroken(room.id)}
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/30">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-foreground line-clamp-1">{room.eventName}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{room.eventDate}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{room.lastMessage}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
              {status.label}
            </span>
            {room.unreadCount > 0 && (
              <Badge className="h-4 min-w-[16px] rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </button>
    );
  };

  const renderPastRoom = (room: EventChatRoom) => {
    const status = statusConfig[room.eventStatus];
    const imageSrc = room.eventImage && !brokenImages.has(room.id)
      ? resolveEventImageUrl(room.eventImage)
      : '';
    return (
      <div
        key={room.id}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 border border-border/60 opacity-90"
      >
        <button
          type="button"
          onClick={() => onOpenChat(room.id)}
          className="flex flex-1 items-center gap-3 min-w-0 text-left"
        >
          {imageSrc ? (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <img
                src={imageSrc}
                alt={room.eventName}
                className="h-full w-full object-cover"
                onError={() => markImageBroken(room.id)}
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/30">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold text-foreground line-clamp-1">{room.eventName}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{room.eventDate}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{room.lastMessage}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                {status.label}
              </span>
              {room.unreadCount > 0 && (
                <Badge className="h-4 min-w-[16px] rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {room.unreadCount > 99 ? '99+' : room.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleDeleteEventChat(room.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          aria-label="Eliminar chat"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderPrivateChat = (chat: PrivateChat) => (
    <div
      key={chat.id}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition-colors hover:bg-accent/40"
    >
      <button
        type="button"
        className="relative shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          if (chat.user.id && hasActiveStory(chat.user.id)) {
            onOpenStory?.(chat.user.id);
            return;
          }
          if (chat.user.id && onOpenUserProfile) onOpenUserProfile(chat.user.id);
          else onOpenPrivateChat?.(chat.id);
        }}
        aria-label={`Ver ${hasActiveStory(chat.user.id) ? 'historia' : 'perfil'} de ${chat.user.name}`}
      >
        <StoryAvatar
          userId={chat.user.id}
          name={chat.user.name}
          imageUrl={chat.user.avatar}
          size={48}
          isOnline={chat.user.isOnline}
          showOnlineStatus
        />
      </button>
      <button
        type="button"
        onClick={() => onOpenPrivateChat?.(chat.id)}
        className="flex flex-1 items-center gap-3 min-w-0 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-foreground truncate">{chat.user.name}</span>
            {chat.unreadCount > 0 && (
              <Badge className="h-5 min-w-[20px] shrink-0 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{chat.lastMessage}</p>
        </div>
      </button>
    </div>
  );

  const renderUserSearchResult = (user: SearchUserResult) => {
    const displayName = user.name || user.nombreCompleto || user.username || 'Usuario';
    const avatar = user.imagen || user.fotoPerfilUrl;
    const initials = displayName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div
        key={user.id}
        className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-card p-3"
      >
        <button
          type="button"
          className="shrink-0"
          onClick={() => user.id && onOpenUserProfile?.(user.id)}
          aria-label={`Ver perfil de ${displayName}`}
        >
          <Avatar className="h-12 w-12">
            {avatar ? <AvatarImage src={avatar} alt={displayName} className="object-cover" /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-extrabold">{initials}</AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-extrabold text-foreground truncate">{displayName}</p>
          {user.username && (
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => user.id && onStartDirectChat?.(user.id)}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground"
        >
          Chatear
        </button>
      </div>
    );
  };

  const withArchive = (id: string, node: React.ReactNode) => (
    <div key={id} className="relative group">
      {node}
      <button
        onClick={(e) => { e.stopPropagation(); toggleArchive(id); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full bg-card/90 border border-border/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm ring-2 ring-primary/20"
        aria-label="Archivar"
      >
        <Archive className="h-3.5 w-3.5" />
      </button>
    </div>
  );



  const FilterChip = ({ value, label, count }: { value: FilterKey; label: string; count?: number }) => (
    <button
      onClick={() => setFilter(value)}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition-all',
        filter === value
          ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
          : 'bg-card text-muted-foreground border-border/60 hover:bg-accent/40'
      )}
    >
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="mx-auto max-w-lg">
        {/* Brand header row */}
        <div className="bg-card px-4 py-3 border-b border-border/60 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} className="flex items-center text-primary">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xl font-extrabold text-primary">Do</span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-xl font-extrabold text-foreground border-b-2 border-primary">events</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (onBlockedClick ? onBlockedClick() : toast('Lista de bloqueados'))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
                aria-label="Bloqueados"
              >
                <Ban className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => (onCreateConversation ? onCreateConversation() : toast('Nueva conversación'))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                aria-label="Nueva conversación"
              >
                <PencilLine className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
                aria-label="Configuración"
              >
                <Settings className="h-4 w-4" />
              </button>
              <StoryAvatar
                userId={currentUserId}
                name="Tu historia"
                imageUrl={profileAvatar}
                size={36}
                isOwn
                isOnline
                showOnlineStatus
                onCreateStory={onCreateStory}
                onClick={() => {
                  if (currentUserId && hasActiveStory(currentUserId)) {
                    onOpenStory?.(currentUserId);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones o usuarios..."
              className="w-full rounded-full border border-border/60 bg-card pl-10 pr-4 py-3 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Contactos con historias */}
        <div className="mt-3 overflow-x-auto px-4 no-scrollbar">
          <div className="flex items-start gap-4 pb-2">
            <div className="flex flex-col items-center gap-1 shrink-0 w-16">
              <StoryAvatar
                userId={currentUserId}
                name="Tu historia"
                imageUrl={profileAvatar}
                size={56}
                isOwn
                isOnline
                showOnlineStatus
                onCreateStory={onCreateStory}
                onClick={() => {
                  if (currentUserId && hasActiveStory(currentUserId)) {
                    onOpenStory?.(currentUserId);
                  }
                }}
              />
              <span className="text-[10px] font-medium text-foreground truncate w-full text-center">Tu historia</span>
            </div>
            {(contacts
              ? contacts.map((contact) => ({ contact, chatId: contact.id }))
              : privateChats.slice(0, 12).map((c) => ({ contact: c.user, chatId: c.id }))
            ).map(({ contact, chatId }) => (
              <div
                key={chatId}
                className="flex flex-col items-center gap-1 shrink-0 w-16"
              >
                <StoryAvatar
                  userId={contact.id}
                  name={contact.name}
                  imageUrl={contact.avatar}
                  size={56}
                  isOnline={contact.isOnline}
                  showOnlineStatus
                  onClick={() => handleContactStoryClick(contact.id, chatId)}
                />
                <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                  {contact.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-2 overflow-x-auto px-4 no-scrollbar">
          <div className="flex items-center gap-2 pb-2">
            <FilterChip value="eventos" label="Chat de eventos" count={counts.eventos} />
            <FilterChip value="interno" label="Chat privado" count={counts.interno} />
            <FilterChip value="grupos" label="Grupos" count={counts.grupos} />
            <FilterChip value="no_leidos" label="No leídos" count={counts.no_leidos} />
            <FilterChip value="archivados" label="Archivados" count={counts.archivados} />
          </div>
        </div>

        {/* User search results */}
        {search.trim().length >= 2 && (
          <div className="px-4 pt-3 space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              Usuarios en Do.Events
            </h2>
            {searchingUsers && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card py-6 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
                <p className="text-sm font-extrabold text-muted-foreground">Buscando usuarios…</p>
              </div>
            )}
            {userSearchError && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-6 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-sm font-extrabold text-foreground">Error en la búsqueda</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">{userSearchError}</p>
              </div>
            )}
            {!searchingUsers && !userSearchError && userSearchResults.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/25 border-border/60 bg-card py-6 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-extrabold text-foreground">Sin resultados</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  No encontramos usuarios con ese nombre. Verifica que estén registrados en la app.
                </p>
              </div>
            )}
            {userSearchResults.map((user) => renderUserSearchResult(user))}
          </div>
        )}

        {/* List */}
        <div className="px-4 pt-2 space-y-2">
          {loading && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card py-10 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <p className="text-sm font-extrabold text-muted-foreground">Cargando conversaciones…</p>
            </div>
          )}
          {!loading && filter === 'archivados' && (
            counts.archivados > 0 ? (
              <>
                {archivedPrivate.map((c) => (
                  <div key={c.id} className="relative">
                    {renderPrivateChat(c)}
                    <button
                      onClick={() => toggleArchive(c.id)}
                      className="absolute right-3 top-3 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold text-primary"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
                {archivedEvents.map((r) => (
                  <div key={r.id} className="relative">
                    {renderRoom(r)}
                    <button
                      onClick={() => toggleArchive(r.id)}
                      className="absolute right-3 top-3 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold text-primary"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </>
            ) : (
              <EmptyState text="No tienes chats archivados" />
            )
          )}
          {!loading && filter === 'interno' && (
            filteredPrivate.length > 0 ? (
              filteredPrivate.map((c) => withArchive(c.id, renderPrivateChat(c)))
            ) : (
              <EmptyState text="No tienes chats internos" />
            )
          )}

          {!loading && filter === 'no_leidos' && (
            (unreadPrivate.length + unreadEvents.length) > 0 ? (
              <>
                {unreadPrivate.map((c) => withArchive(c.id, renderPrivateChat(c)))}
                {unreadEvents.map((r) => withArchive(r.id, renderRoom(r)))}
              </>
            ) : (
              <EmptyState text="Todo al día, sin mensajes nuevos" />
            )
          )}

          {!loading && filter === 'grupos' && (
            ((groupChatsProp?.length || 0) + visibleEventRooms.filter(c => c.attendees.length > 2 && notArchived(c.id)).length) > 0 ? (
              <>
                {(groupChatsProp || []).filter(c => notArchived(c.id)).map((c) => withArchive(c.id, renderPrivateChat(c)))}
                {visibleEventRooms.filter(c => c.attendees.length > 2 && notArchived(c.id)).map((r) => withArchive(r.id, renderRoom(r)))}
              </>
            ) : (
              <EmptyState text="No perteneces a ningún grupo aún" />
            )
          )}

          {!loading && filter === 'eventos' && (
            <>
              {activeRooms.length > 0 && activeRooms.map((r) => withArchive(r.id, renderRoom(r)))}
              {pastRooms.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowPast(p => !p)}
                    className="flex w-full items-center justify-between mb-3"
                  >
                    <h2 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">
                      Finalizados / Cancelados ({pastRooms.length})
                    </h2>
                    {showPast ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {showPast && (
                    <div className="space-y-2">
                      {pastRooms.map((room) => renderPastRoom(room))}
                    </div>
                  )}
                </div>
              )}
              {visibleEventRooms.length === 0 && <EmptyState text="No tienes chats de eventos" />}
            </>
          )}
        </div>
      </div>

      <ChatSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} onBlockedClick={onBlockedClick} />
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="mx-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-card py-16 text-center shadow-sm">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
      <MessageSquare className="h-7 w-7 text-primary" strokeWidth={2} />
    </div>
    <p className="text-sm font-extrabold text-foreground">{text}</p>
  </div>
);

export default MessagesListView;
