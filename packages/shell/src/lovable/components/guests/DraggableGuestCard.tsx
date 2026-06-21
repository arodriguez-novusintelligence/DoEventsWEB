import { useState, type SyntheticEvent } from "react";
import { Heart, Trash2, Edit, MoreVertical, Mail, FolderInput, Check, Users as UsersIcon } from "lucide-react";
import { Guest, GuestGroup } from "@lovable/types/guest";
import { Button } from "@lovable/components/ui/button";
import { Badge } from "@lovable/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@lovable/components/ui/avatar";
import { Checkbox } from "@lovable/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@lovable/components/ui/dropdown-menu";

interface Props {
  guest: Guest;
  onToggleFavorite: (id: string) => void;
  onDelete: (g: Guest) => void;
  onEdit: (g: Guest) => void;
  hideActions?: boolean;
  onSelectionToggle?: (id: string) => void;
  isSelected?: boolean;
  onDragStart?: (g: Guest) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  invitedCount?: number;
  groups?: GuestGroup[];
  onMoveToGroup?: (guestId: string, groupId: string | undefined) => void;
}

const stopDrag = (e: SyntheticEvent) => {
  e.stopPropagation();
};

export function DraggableGuestCard({
  guest, onToggleFavorite, onDelete, onEdit, hideActions = false,
  onSelectionToggle, isSelected = false, onDragStart, onDragEnd, isDragging = false,
  invitedCount = 0, groups = [], onMoveToGroup,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const initials = `${guest.name.charAt(0)}${guest.lastName.charAt(0)}`.toUpperCase();
  return (
    <div
      className={`bg-card rounded-xl px-3 py-2 shadow-sm border ring-2 ring-border/40 transition-all duration-200 hover:shadow-md
        ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20'}
        ${isDragging ? 'opacity-50 scale-95 rotate-1' : ''}
        ${dragOver ? 'scale-[1.02] shadow-lg' : ''}
        cursor-move select-none`}
      draggable={!hideActions}
      onDragStart={(e) => { e.dataTransfer.setData("application/json", JSON.stringify(guest)); e.dataTransfer.effectAllowed = "move"; onDragStart?.(guest); }}
      onDragEnd={() => onDragEnd?.()}
      onDragEnter={() => setDragOver(true)}
      onDragLeave={() => setDragOver(false)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {onSelectionToggle && (
          <div onPointerDown={stopDrag} onClick={stopDrag}>
            <Checkbox checked={isSelected} onCheckedChange={() => onSelectionToggle(guest.id)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
          </div>
        )}
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={guest.avatar} alt={`${guest.name} ${guest.lastName}`} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-semibold text-card-foreground text-sm leading-tight truncate">{guest.name} {guest.lastName}</h3>
            {guest.isFavorite && <Heart className="h-3 w-3 fill-favorite text-favorite shrink-0" />}
            {invitedCount > 0 && (
              <Badge variant="soft" className="text-[10px] h-4 px-1.5 inline-flex items-center gap-0.5 shrink-0">
                <Mail className="h-2.5 w-2.5" /> {invitedCount}
              </Badge>
            )}
          </div>
          {guest.username && <p className="text-[11px] text-muted-foreground leading-tight truncate">@{guest.username.replace(/^@/, '')}</p>}
        </div>
        {!hideActions && (
          <div className="flex items-center shrink-0" onPointerDown={stopDrag} onClick={stopDrag}>
            <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(guest.id)} className="h-8 w-8 hover:bg-accent/80">
              <Heart className={`h-4 w-4 ${guest.isFavorite ? 'fill-favorite text-favorite' : 'text-icon-primary'}`} />
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/80"><MoreVertical className="h-4 w-4 text-icon-primary" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 z-[200]">
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleFavorite(guest.id); }} className="cursor-pointer">
                  <Heart className={`h-4 w-4 mr-2 ${guest.isFavorite ? 'fill-favorite text-favorite' : ''}`} />
                  {guest.isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
                </DropdownMenuItem>
                {onMoveToGroup && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <FolderInput className="h-4 w-4 mr-2" /> Mover a grupo
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-52 z-[200]">
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Selecciona un grupo</DropdownMenuLabel>
                      {groups.map((gr) => (
                        <DropdownMenuItem key={gr.id} onSelect={(e) => { e.preventDefault(); onMoveToGroup(guest.id, gr.id); }} className="cursor-pointer" disabled={guest.groupId === gr.id}>
                          <span className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: gr.color }} />
                          <span className="flex-1 truncate">{gr.name}</span>
                          {guest.groupId === gr.id && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onMoveToGroup(guest.id, undefined); }} className="cursor-pointer" disabled={!guest.groupId}>
                        <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="flex-1">Sin grupo</span>
                        {!guest.groupId && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onEdit(guest); }} className="cursor-pointer"><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); void onDelete(guest); }} className="cursor-pointer text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" />Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
