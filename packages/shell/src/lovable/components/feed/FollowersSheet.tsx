import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lovable/components/ui/tabs';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Search, UserPlus, Check, Shield, X } from 'lucide-react';
import { users, type User } from '@lovable/data/mockData';
import { toast } from 'sonner';

export type ProfileListUser = {
  id: string;
interface FollowersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'followers' | 'following' | 'requests';
  followersCount?: number;
  followingCount?: number;
  onViewProfile?: (user: User) => void;
}

// Mock — derived from  users (excluding current "me")
const baseUsers = users.filter((u) => u.id !== 'me');
const initialRequests: User[] = [...baseUsers].slice(0, 3);

const UserRow = ({
  user,
  initiallyFollowing,
  onOpen,
}: {
  user: User;
  initiallyFollowing: boolean;
  onOpen?: () => void;
}) => {
  const [following, setFollowing] = useState(initiallyFollowing);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <button
        onClick={onOpen}
        className="flex flex-1 min-w-0 items-center gap-3 text-left active:opacity-70"
      >
        <Avatar className="h-11 w-11">
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
            @{user.name.toLowerCase().replace(/\s+/g, '')}
          </p>
        </div>
      </button>
      <Button
        size="sm"
        variant={following ? 'outline' : 'default'}
        className="h-8 shrink-0 rounded-full text-xs"
        onClick={() => setFollowing((p) => !p)}
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
  onAccept,
  onReject,
  onOpen,
}: {
  user: User;
  onAccept: () => void;
  onReject: () => void;
  onOpen?: () => void;
}) => (
  <div className="flex items-center gap-3 py-2.5">
    <button
      onClick={onOpen}
      className="flex flex-1 min-w-0 items-center gap-3 text-left active:opacity-70"
    >
      <Avatar className="h-11 w-11">
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
      onClick={onReject}
      aria-label="Rechazar solicitud"
    >
      <X className="h-4 w-4" />
    </Button>
    <Button
      size="icon"
      className="h-8 w-8 shrink-0 rounded-full"
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
  onViewProfile,
}: FollowersSheetProps) => {
  const [query, setQuery] = useState('');
  const [followers, setFollowers] = useState<User[]>(mockFollowers);
  const [requests, setRequests] = useState<User[]>(initialRequests);
  const followingIds = new Set(mockFollowing.map((u) => u.id));

  const filter = (list: User[]) =>
    list.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  const acceptRequest = (u: User) => {
    setRequests((prev) => prev.filter((x) => x.id !== u.id));
    setFollowers((prev) => [u, ...prev]);
    toast.success(`Aceptaste a ${u.name} como seguidor`);
  };

  const rejectRequest = (u: User) => {
    setRequests((prev) => prev.filter((x) => x.id !== u.id));
    toast(`Rechazaste la solicitud de ${u.name}`);
  };

  const open_ = (u: User) => {
    onOpenChange(false);
    onViewProfile?.(u);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-left text-base font-bold">Mis seguidores</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="flex h-full flex-col">
          <TabsList className="mx-5 grid grid-cols-3 bg-muted">
            <TabsTrigger value="followers" className="text-xs font-semibold">
              Seguidores ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs font-semibold">
              Seguidos ({mockFollowing.length})
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
            {filter(followers).map((u, i) => (
              <UserRow
                key={`${u.id}-${i}`}
                user={u}
                initiallyFollowing={followingIds.has(u.id)}
                onOpen={() => open_(u)}
              />
            ))}
          </TabsContent>

          <TabsContent value="following" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {filter(mockFollowing).map((u) => (
              <UserRow key={u.id} user={u} initiallyFollowing onOpen={() => open_(u)} />
            ))}
          </TabsContent>

          <TabsContent value="requests" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {filter(requests).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No tienes solicitudes pendientes
              </p>
            ) : (
              filter(requests).map((u) => (
                <RequestRow
                  key={u.id}
                  user={u}
                  onAccept={() => acceptRequest(u)}
                  onReject={() => rejectRequest(u)}
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