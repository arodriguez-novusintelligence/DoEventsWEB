import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@lovable/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { Search, UserPlus, Check, Shield, X } from 'lucide-react';
import { toast } from 'sonner';

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
  onViewProfile?: (user: ProfileListUser) => void;
}

const UserRow = ({
  user,
  initiallyFollowing,
  onOpen,
}: {
  user: ProfileListUser;
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

const FollowersSheet = ({
  open,
  onOpenChange,
  defaultTab = 'followers',
  followersList = [],
  followingList = [],
  onViewProfile,
}: FollowersSheetProps) => {
  const [query, setQuery] = useState('');
  const [followers, setFollowers] = useState<ProfileListUser[]>(followersList);
  const [following, setFollowing] = useState<ProfileListUser[]>(followingList);

  useEffect(() => {
    if (open) {
      setFollowers(followersList);
      setFollowing(followingList);
    }
  }, [open, followersList, followingList]);

  const filter = (list: ProfileListUser[]) =>
    list.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  const followingIds = new Set(following.map((u) => u.id));

  const open_ = (u: ProfileListUser) => {
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
          <TabsList className="mx-5 grid grid-cols-2 bg-muted">
            <TabsTrigger value="followers" className="text-xs font-semibold">
              Seguidores ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="text-xs font-semibold">
              Seguidos ({following.length})
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
            {filter(followers).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aún no tienes seguidores</p>
            ) : (
              filter(followers).map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  initiallyFollowing={followingIds.has(u.id)}
                  onOpen={() => open_(u)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-0 flex-1 overflow-y-auto px-5 pb-8">
            {filter(following).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aún no sigues a nadie</p>
            ) : (
              filter(following).map((u) => (
                <UserRow key={u.id} user={u} initiallyFollowing onOpen={() => open_(u)} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default FollowersSheet;
