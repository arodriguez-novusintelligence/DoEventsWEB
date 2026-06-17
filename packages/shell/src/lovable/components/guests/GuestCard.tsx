import { Heart, Trash2, Edit, MoreVertical } from "lucide-react";
import { Guest } from "@lovable/types/guest";
import { Button } from "@lovable/components/ui/button";
import { Badge } from "@lovable/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@lovable/components/ui/avatar";
import { Checkbox } from "@lovable/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@lovable/components/ui/dropdown-menu";

interface GuestCardProps {
  guest: Guest;
  onToggleFavorite: (guestId: string) => void;
  onDelete: (guest: Guest) => void;
  onEdit: (guest: Guest) => void;
  hideActions?: boolean;
  onSelectionToggle?: (guestId: string) => void;
  isSelected?: boolean;
}

export function GuestCard({ guest, onToggleFavorite, onDelete, onEdit, hideActions = false, onSelectionToggle, isSelected = false }: GuestCardProps) {
  const initials = `${guest.name.charAt(0)}${guest.lastName.charAt(0)}`.toUpperCase();
  return (
    <div className={`bg-card rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-md ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {onSelectionToggle && (
            <Checkbox checked={isSelected} onCheckedChange={() => onSelectionToggle(guest.id)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src={guest.avatar} alt={`${guest.name} ${guest.lastName}`} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground text-sm leading-tight">{guest.name} {guest.lastName}</h3>
            {guest.username && <p className="text-xs text-muted-foreground mt-0.5">@{guest.username}</p>}
            {guest.email && <p className="text-xs text-muted-foreground truncate mt-0.5">{guest.email}</p>}
          </div>
        </div>
        {!hideActions && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(guest.id)} className="h-8 w-8 hover:bg-accent/80">
              <Heart className={`h-4 w-4 ${guest.isFavorite ? 'fill-favorite text-favorite' : 'text-icon-primary'}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/80"><MoreVertical className="h-4 w-4 text-icon-primary" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(guest)} className="cursor-pointer"><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(guest)} className="cursor-pointer text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {guest.isFavorite && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Badge variant="favorite" className="text-xs">Invitado favorito</Badge>
        </div>
      )}
    </div>
  );
}
