import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lovable/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Search, UserPlus, Check, Shield, Users, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { followUser, unfollowUser, fetchPendingFollowRequests, respondFollowRequest } from '@doevents/shared';

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
  followersCount?: number;
  followingCount?: number;
  followersList?: ProfileListUser[];
  followingList?: ProfileListUser[];
  currentUserId?: string;
  onFollowChange?: () => void;
  onViewProfile?: (user: ProfileListUser) => void;
}

const UserRow = ({
  user,
  initiallyFollowing,
  currentUserId,
  onFollowChange,
  onOpen,
}: {
  user: ProfileListUser;
  initiallyFollowing: boolean;
  currentUserId?: string;
  onFollowChange?: () => void;
  onOpen?: () => void;
}) => {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, setPending] = useState(false);
  const isSelf = currentUserId && user.id === currentUserId;

  const toggleFollow = async () => {
    if (!currentUserId || isSelf || pending) return;
    setPending(true);
    try {
      if (following) {
        await unfollowUser(currentUserId, user.id);
        setFollowing(false);
        toast.success(`Dejaste de seguir a ${user.name}`);
      } else {
        const result = await followUser(currentUserId, user.id);
        setFollowing(true);
        toast.success(result.status === 'pending' ? 'Solicitud enviada' : `Sigues a ${user.name}`);
      }
      onFollowChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el seguimiento');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        onClick={onOpen}
        className="flex flex-1 min-w-0 items-center gap-3 text-left active:opacity-70"
      >
        <Avatar className="h-11 w-11">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {user.username ? `@${user.username.replace(/^@/, '')}` : ''}
          </p>
        </div>
      </button>
      <Button
        size="sm"
        variant={following ? 'outline' : 'default'}
        className="h-8 shrink-0 rounded-full text-xs"
        disabled={!currentUserId || isSelf || pending}
        onClick={() => void toggleFollow()}
      >
        {following ? (
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
    </div>
  );
};

const RequestRow = ({
  user,
  currentUserId,
  onFollowChange,
  onOpen,
}: {
  user: ProfileListUser;
  currentUserId?: string;
  onFollowChange?: () => void;
  onOpen?: () => void;
}) => {
  const [pending, setPending] = useState(false);

  const accept = async () => {
    if (!currentUserId || pending) return;
    setPending(true);
    try {
      await respondFollowRequest(currentUserId, user.id, 'accept');
      toast.success(`Aceptaste a ${user.name}`);
      onFollowChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo aceptar la solicitud');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        onClick={onOpen}
        className="flex flex-1 min-w-0 items-center gap-3 text-left active:opacity-70"
      >
        <Avatar className="h-11 w-11">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">Quiere seguirte</p>
        </div>
      </button>
      <Button
        size="sm"
        className="h-8 shrink-0 rounded-full text-xs"
        disabled={!currentUserId || pending}
        onClick={() => void accept()}
      >
        {pending ? '…' : 'Aceptar'}
      </Button>
    </div>
  );
};

const FollowersSheet = ({
  open,
  onOpenChange,
  defaultTab = 'followers',
  followersList = [],
  followingList = [],
  currentUserId,
  onFollowChange,
  onViewProfile,
}: FollowersSheetProps) => {
  const [query, setQuery] = useState('');
  const [followers, setFollowers] = useState<ProfileListUser[]>(followersList);
  const [following, setFollowing] = useState<ProfileListUser[]>(followingList);
  const [requests, setRequests] = useState<ProfileListUser[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (open) {
      setFollowers(followersList);
      setFollowing(followingList);
    }
  }, [open, followersList, followingList]);

  useEffect(() => {
    if (!open || !currentUserId) {
      setRequests([]);
      return;
    }
    let cancelled = false;
    setLoadingRequests(true);
    fetchPendingFollowRequests(currentUserId)
      .then((rows) => {
        if (cancelled) return;
        setRequests(rows.map((r) => ({
          id: r.userId,
          name: r.name,
          initials: r.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('') || '?',
          avatarUrl: r.avatarUrl || undefined,
        })));
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRequests(false);
      });
    return () => { cancelled = true; };
  }, [open, currentUserId]);

  const filter = (list: ProfileListUser[]) =>
    list.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  const followingIds = new Set(following.map((u) => u.id));

  const open_ = (u: ProfileListUser) => {
    onOpenChange(false);
    onViewProfile?.(u);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto h-[85vh] max-w-lg rounded-t-2xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-2 text-left text-base font-bold">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Seguidores y seguidos
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={defaultTab === 'requests' ? 'requests' : defaultTab} className="flex h-full flex-col">
          <TabsList className="mx-5 grid grid-cols-3 rounded-xl bg-muted p-1">
            <TabsTrigger value="followers" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Seguidores ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Seguidos ({following.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
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

          <TabsContent value="followers" className="mt-0 flex-1 overflow-y-auto divide-y divide-border/40 px-5 pb-8">
            {filter(followers).length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Aún no tienes seguidores</p>
                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  Comparte tu perfil para conectar con más personas.
                </p>
              </div>
            ) : (
              filter(followers).map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  initiallyFollowing={followingIds.has(u.id)}
                  currentUserId={currentUserId}
                  onFollowChange={onFollowChange}
                  onOpen={() => open_(u)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0 flex-1 overflow-y-auto divide-y divide-border/40 px-5 pb-8">
            {filter(following).length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <UserPlus className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Aún no sigues a nadie</p>
                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  Descubre perfiles en el feed y empieza a seguir.
                </p>
              </div>
            ) : (
              filter(following).map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  initiallyFollowing
                  currentUserId={currentUserId}
                  onFollowChange={onFollowChange}
                  onOpen={() => open_(u)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {loadingRequests ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Cargando solicitudes…</p>
              </div>
            ) : filter(requests).length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Sin solicitudes pendientes</p>
                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  Las solicitudes de seguimiento aparecerán aquí.
                </p>
              </div>
            ) : (
              filter(requests).map((u) => (
                <RequestRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUserId}
                  onFollowChange={onFollowChange}
                  onOpen={() => open_(u)}
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
