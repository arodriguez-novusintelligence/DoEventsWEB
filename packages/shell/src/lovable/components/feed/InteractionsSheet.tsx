import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@lovable/components/ui/drawer';
import { Avatar, AvatarFallback } from '@lovable/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lovable/components/ui/tabs';
import { Heart, Repeat2 } from 'lucide-react';
import type { User } from '@lovable/data/mockData';

interface InteractionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  likedBy: User[];
  repostedBy: User[];
  defaultTab?: 'likes' | 'reposts';
  onViewProfile?: (user: User) => void;
}

const UserRow = ({ user, onViewProfile }: { user: User; onViewProfile?: (user: User) => void }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <button onClick={() => onViewProfile?.(user)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
          {user.initials}
        </AvatarFallback>
      </Avatar>
      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
    </button>
    <button className="rounded-full border border-primary px-4 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
      Seguir
    </button>
  </div>
);

const InteractionsSheet = ({
  open,
  onOpenChange,
  likedBy,
  repostedBy,
  defaultTab = 'likes',
  onViewProfile,
}: InteractionsSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-center text-base font-bold text-foreground">
            Interacciones
          </DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
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

          <TabsContent value="likes" className="mt-2 max-h-[60vh] overflow-y-auto">
            {likedBy.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay me gusta
              </p>
            ) : (
              likedBy.map((user) => <UserRow key={user.id} user={user} onViewProfile={onViewProfile} />)
            )}
          </TabsContent>

          <TabsContent value="reposts" className="mt-2 max-h-[60vh] overflow-y-auto">
            {repostedBy.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aún no hay reposts
              </p>
            ) : (
              repostedBy.map((user) => <UserRow key={user.id} user={user} onViewProfile={onViewProfile} />)
            )}
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};

export default InteractionsSheet;
