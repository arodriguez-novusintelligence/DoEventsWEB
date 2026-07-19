import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lovable/components/ui/tabs';
import { Heart, Loader2, Repeat2 } from 'lucide-react';
import type { FeedUiUser as User } from '@doevents/shared';
import { resolveUserAvatarUrl } from '@doevents/shared';

interface InteractionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  likedBy: User[];
  repostedBy?: User[];
  loading?: boolean;
  error?: string | null;
  defaultTab?: 'likes' | 'reposts';
  onViewProfile?: (user: User) => void;
}

const UserRow = ({ user, onViewProfile }: { user: User; onViewProfile?: (user: User) => void }) => {
  const avatarUrl = resolveUserAvatarUrl(user.avatarUrl, user.id) || user.avatarUrl;
  return (
    <button
      type="button"
      onClick={() => onViewProfile?.(user)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
    >
      <Avatar className="h-10 w-10 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={user.name} /> : null}
        <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
          {user.initials || user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
      </div>
    </button>
  );
};

const InteractionsSheet = ({
  open,
  onOpenChange,
  likedBy,
  repostedBy = [],
  loading = false,
  error = null,
  defaultTab = 'likes',
  onViewProfile,
}: InteractionsSheetProps) => {
  const [tab, setTab] = useState<'likes' | 'reposts'>(defaultTab);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-center text-base font-bold text-foreground">
            Interacciones
          </DrawerTitle>
        </DrawerHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'likes' | 'reposts')}
          className="w-full"
        >
          <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="likes" className="gap-1.5 text-xs">
              <Heart className="h-3.5 w-3.5" />
              Me gusta ({likedBy.length})
            </TabsTrigger>
            <TabsTrigger value="reposts" className="gap-1.5 text-xs">
              <Repeat2 className="h-3.5 w-3.5" />
              Reposts ({repostedBy.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="likes" className="mt-2 max-h-[60vh] overflow-y-auto pb-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            ) : error ? (
              <p className="px-4 py-10 text-center text-sm text-destructive">{error}</p>
            ) : likedBy.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay me gusta
              </p>
            ) : (
              likedBy.map((user) => (
                <UserRow key={user.id} user={user} onViewProfile={onViewProfile} />
              ))
            )}
          </TabsContent>

          <TabsContent value="reposts" className="mt-2 max-h-[60vh] overflow-y-auto pb-6">
            {repostedBy.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay reposts
              </p>
            ) : (
              repostedBy.map((user) => (
                <UserRow key={user.id} user={user} onViewProfile={onViewProfile} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

export default InteractionsSheet;
