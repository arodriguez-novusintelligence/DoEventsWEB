import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lovable/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Search, UserPlus, Check, Shield, X, Loader2, MoreVertical, UserMinus, Ban } from 'lucide-react';
import { toast } from 'sonner';
import {
  followUser,
  unfollowUser,
  fetchPendingFollowRequests,
  fetchFollowersList,
  respondFollowRequest,
  removeFollower,
  blockFollower,
  resolveUserAvatarUrl,
  SOCIAL_GRAPH_UPDATED_EVENT,
  type FollowRequestItem,
} from '@doevents/shared';

export type ProfileListUser = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  username?: string;
};

interface FollowersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'followers' | 'following' | 'requests';
  followersList?: ProfileListUser[];
  followingList?: ProfileListUser[];
  currentUserId?: string;
  onViewProfile?: (user: ProfileListUser) => void;
  onFollowersChange?: (followers: ProfileListUser[]) => void;
}

function filterUsers(list: ProfileListUser[], query: string): ProfileListUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (u) => u.name.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q),
  );
}

function toSheetUser(request: FollowRequestItem): ProfileListUser {
  const name = request.name || 'Usuario';
  return {
    id: request.userId || request.id,
    name,
    initials: name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'DE',
    avatarUrl: resolveUserAvatarUrl(request.avatarUrl, request.userId || request.id) || undefined,
  };
}

const UserRow = ({
  user,
  initiallyFollowing,
  canToggleFollow,
  canManageFollower,
  onToggleFollow,
  onRemoveFollower,
  onBlockFollower,
  onOpen,
}: {
  user: ProfileListUser;
  initiallyFollowing: boolean;
  canToggleFollow: boolean;
  canManageFollower?: boolean;
  onToggleFollow?: (userId: string, nextFollowing: boolean) => Promise<void>;
  onRemoveFollower?: (userId: string) => Promise<void>;
  onBlockFollower?: (userId: string) => Promise<void>;
  onOpen?: () => void;
}) => {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setFollowing(initiallyFollowing);
  }, [initiallyFollowing, user.id]);

  const handleToggle = async () => {
    if (!canToggleFollow || !onToggleFollow || busy) return;
    const next = !following;
    setBusy(true);
    try {
      await onToggleFollow(user.id, next);
      setFollowing(next);
    } catch {
      // toast handled upstream
    } finally {
      setBusy(false);
    }
  };

  const runManage = async (action: 'remove' | 'block') => {
    if (busy) return;
    setBusy(true);
    setMenuOpen(false);
    try {
      if (action === 'remove') await onRemoveFollower?.(user.id);
      else await onBlockFollower?.(user.id);
    } catch {
      // toast handled upstream
    } finally {
      setBusy(false);
    }
  };

  const avatarSrc = resolveUserAvatarUrl(user.avatarUrl, user.id);

  return (
    <div className="relative flex items-center gap-3 py-2.5">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
      >
        <Avatar className="h-11 w-11">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
          </div>
          {user.username && (
            <p className="truncate text-xs text-muted-foreground">{user.username}</p>
          )}
        </div>
      </button>
      {canManageFollower && (
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-full"
            disabled={busy}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Opciones del seguidor"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
                onClick={() => void runManage('remove')}
              >
                <UserMinus className="h-4 w-4 text-primary" />
                Eliminar seguidor
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                onClick={() => void runManage('block')}
              >
                <Ban className="h-4 w-4" />
                Bloquear
              </button>
            </div>
          )}
        </div>
      )}
      {canToggleFollow && !canManageFollower && (
        <Button
          size="sm"
          variant={following ? 'outline' : 'default'}
          className="h-8 shrink-0 rounded-full text-xs"
          disabled={busy}
          onClick={() => void handleToggle()}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : following ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              Siguiendo
            </>
          ) : (
            <>
              <UserPlus className="mr-1 h-3.5 w-3.5" />
              Seguir
            </>
          )}
        </Button>
      )}
    </div>
  );
};

const RequestRow = ({
  user,
  busy,
  onAccept,
  onReject,
  onOpen,
}: {
  user: ProfileListUser;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onOpen?: () => void;
}) => (
  <div className="flex items-center gap-3 py-2.5">
    <button
      type="button"
      onClick={onOpen}
      className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
    >
      <Avatar className="h-11 w-11">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
          {user.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">quiere seguirte</p>
      </div>
    </button>
    <Button
      size="icon"
      variant="outline"
      className="h-8 w-8 shrink-0 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
      disabled={busy}
      onClick={onReject}
      aria-label="Rechazar solicitud"
    >
      <X className="h-4 w-4" />
    </Button>
    <Button
      size="icon"
      className="h-8 w-8 shrink-0 rounded-full"
      disabled={busy}
      onClick={onAccept}
      aria-label="Aceptar solicitud"
    >
      <Check className="h-4 w-4" />
    </Button>
  </div>
);

const FollowersSheet = ({
  open,
  onOpenChange,
  defaultTab = 'followers',
  followersList = [],
  followingList = [],
  currentUserId,
  onViewProfile,
  onFollowersChange,
}: FollowersSheetProps) => {
  const [query, setQuery] = useState('');
  const [requests, setRequests] = useState<ProfileListUser[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [localFollowingIds, setLocalFollowingIds] = useState<Set<string>>(new Set());
  const [localFollowers, setLocalFollowers] = useState<ProfileListUser[]>(followersList);

  useEffect(() => {
    setLocalFollowers(followersList);
  }, [followersList]);

  const followingIds = useMemo(() => {
    const ids = new Set(followingList.map((u) => u.id));
    localFollowingIds.forEach((id) => ids.add(id));
    return ids;
  }, [followingList, localFollowingIds]);

  const loadRequests = useCallback(async () => {
    if (!currentUserId) {
      setRequests([]);
      return;
    }
    setLoadingRequests(true);
    try {
      const pending = await fetchPendingFollowRequests(currentUserId);
      setRequests(pending.map(toSheetUser).filter((u) => u.id));
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!open) return;
    void loadRequests();
  }, [open, loadRequests]);

  useEffect(() => {
    if (!open || !currentUserId) return;
    const refreshLists = () => {
      void loadRequests();
    };
    window.addEventListener(SOCIAL_GRAPH_UPDATED_EVENT, refreshLists);
    return () => window.removeEventListener(SOCIAL_GRAPH_UPDATED_EVENT, refreshLists);
  }, [open, currentUserId, loadRequests]);

  const handleToggleFollow = async (targetId: string, shouldFollow: boolean) => {
    if (!currentUserId || currentUserId === targetId) return;
    try {
      if (shouldFollow) {
        const result = await followUser(currentUserId, targetId);
        if (result.status === 'pending') {
          toast.success(result.message || 'Solicitud de seguimiento enviada');
        } else {
          setLocalFollowingIds((prev) => new Set(prev).add(targetId));
          toast.success(result.message || 'Ahora sigues a este usuario');
        }
      } else {
        await unfollowUser(currentUserId, targetId);
        setLocalFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        toast.success('Dejaste de seguir a este usuario');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el seguimiento');
      throw err;
    }
  };

  const acceptRequest = async (user: ProfileListUser) => {
    if (!currentUserId) return;
    setBusyRequestId(user.id);
    try {
      await respondFollowRequest(currentUserId, user.id, 'accept');
      setRequests((prev) => prev.filter((x) => x.id !== user.id));
      const freshFollowers = await fetchFollowersList(currentUserId).catch(() => []);
      const next = freshFollowers.map((entry) => toSheetUser({
        id: entry.id,
        userId: entry.id,
        name: entry.name,
        avatarUrl: entry.avatarUrl,
      }));
      setLocalFollowers(next);
      onFollowersChange?.(next);
      toast.success(`Aceptaste a ${user.name} como seguidor`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la solicitud');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!currentUserId) return;
    await removeFollower(currentUserId, followerId);
    setLocalFollowers((prev) => {
      const next = prev.filter((f) => f.id !== followerId);
      onFollowersChange?.(next);
      return next;
    });
    toast.success('Seguidor eliminado');
  };

  const handleBlockFollower = async (followerId: string) => {
    if (!currentUserId) return;
    await blockFollower(currentUserId, followerId);
    setLocalFollowers((prev) => {
      const next = prev.filter((f) => f.id !== followerId);
      onFollowersChange?.(next);
      return next;
    });
    toast.success('Usuario bloqueado');
  };

  const rejectRequest = async (user: ProfileListUser) => {
    if (!currentUserId) return;
    setBusyRequestId(user.id);
    try {
      await respondFollowRequest(currentUserId, user.id, 'reject');
      setRequests((prev) => prev.filter((x) => x.id !== user.id));
      toast(`Rechazaste la solicitud de ${user.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo rechazar la solicitud');
    } finally {
      setBusyRequestId(null);
    }
  };

  const openProfile = (user: ProfileListUser) => {
    onOpenChange(false);
    onViewProfile?.(user);
  };

  const filteredFollowers = filterUsers(localFollowers, query);
  const filteredFollowing = filterUsers(followingList, query);
  const filteredRequests = filterUsers(requests, query);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="px-5 pb-3 pt-5">
          <SheetTitle className="text-left text-base font-bold">Mis seguidores</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
          <TabsList className="mx-5 grid grid-cols-3 bg-muted">
            <TabsTrigger value="followers" className="text-xs font-semibold">
              Seguidores ({localFollowers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs font-semibold">
              Seguidos ({followingList.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs font-semibold">
              Solicitudes ({requests.length})
            </TabsTrigger>
          </TabsList>

          <div className="px-5 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar"
                className="h-10 rounded-full bg-muted pl-9 text-sm"
              />
            </div>
          </div>

          <TabsContent value="followers" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {filteredFollowers.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no tienes seguidores
              </p>
            ) : (
              filteredFollowers.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  initiallyFollowing={followingIds.has(u.id)}
                  canToggleFollow={false}
                  canManageFollower={Boolean(currentUserId && currentUserId !== u.id)}
                  onRemoveFollower={handleRemoveFollower}
                  onBlockFollower={handleBlockFollower}
                  onOpen={() => openProfile(u)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {filteredFollowing.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no sigues a nadie
              </p>
            ) : (
              filteredFollowing.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  initiallyFollowing
                  canToggleFollow={Boolean(currentUserId && currentUserId !== u.id)}
                  onToggleFollow={handleToggleFollow}
                  onOpen={() => openProfile(u)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {loadingRequests ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No tienes solicitudes pendientes
              </p>
            ) : (
              filteredRequests.map((u) => (
                <RequestRow
                  key={u.id}
                  user={u}
                  busy={busyRequestId === u.id}
                  onAccept={() => void acceptRequest(u)}
                  onReject={() => void rejectRequest(u)}
                  onOpen={() => openProfile(u)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default FollowersSheet;
