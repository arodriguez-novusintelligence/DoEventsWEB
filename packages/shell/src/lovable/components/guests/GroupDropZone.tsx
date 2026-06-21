import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { GuestGroup, Guest } from "@lovable/types/guest";
import { Badge } from "@lovable/components/ui/badge";
import { DraggableGuestCard } from "./DraggableGuestCard";

interface Props {
  group?: GuestGroup;
  guests: Guest[];
  isUngrouped?: boolean;
  onToggleFavorite: (id: string) => void;
  onDelete: (g: Guest) => void;
  onEdit: (g: Guest) => void;
  onSelectionToggle: (id: string) => void;
  selectedGuests: Set<string>;
  onDropGuest: (g: Guest, targetGroupId?: string) => void;
  draggedGuest: Guest | null;
  onDragStart: (g: Guest) => void;
  onDragEnd: () => void;
  invitedCounts?: Record<string, number>;
  alwaysShow?: boolean;
  allGroups?: GuestGroup[];
  onMoveToGroup?: (guestId: string, groupId: string | undefined) => void;
}

export function GroupDropZone({ group, guests, isUngrouped = false, onToggleFavorite, onDelete, onEdit, onSelectionToggle, selectedGuests, onDropGuest, draggedGuest, onDragStart, onDragEnd, invitedCounts = {}, alwaysShow = false, allGroups = [], onMoveToGroup }: Props) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [counter, setCounter] = useState(0);

  if (guests.length === 0 && !draggedGuest && !alwaysShow) return null;
  return (
    <section
      className={`transition-all duration-300 rounded-2xl border border-border/60 bg-card shadow-sm p-4
        ${isDropTarget ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' : ''}
        ${guests.length === 0 && draggedGuest ? 'border-dashed border-primary/25 bg-muted/20 min-h-24 flex flex-col items-center justify-center' : ''}`}
      onDragEnter={(e) => { e.preventDefault(); setCounter(c => c + 1); if (counter === 0) setIsDropTarget(true); }}
      onDragLeave={(e) => { e.preventDefault(); setCounter(c => c - 1); if (counter <= 1) setIsDropTarget(false); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e) => {
        e.preventDefault(); setIsDropTarget(false); setCounter(0);
        try {
          const data = JSON.parse(e.dataTransfer.getData("application/json"));
          if (data?.id) {
            if (data.groupId === group?.id || (isUngrouped && !data.groupId)) return;
            onDropGuest(data, group?.id);
          }
        } catch {}
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        {isUngrouped ? (<><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20"><Users className="h-4 w-4 text-primary" /></span><h2 className="text-base font-extrabold text-card-foreground">Sin grupo</h2></>)
          : group ? (<><div className="w-4 h-4 rounded-full ring-2 ring-border/40" style={{ backgroundColor: group.color }} /><h2 className="text-base font-extrabold text-card-foreground">{group.name}</h2></>)
          : null}
        <Badge variant="soft" className="text-xs">{guests.length}</Badge>
        {isDropTarget && (<Badge variant="default" className="text-xs animate-pulse">Soltar aquí</Badge>)}
      </div>
      {guests.length === 0 && !draggedGuest ? (
        alwaysShow ? (
          <div className="py-6 text-center rounded-xl bg-primary/5 shadow-sm">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Sin invitados en este grupo</p>
          </div>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Plus className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm">Soltar invitado aquí</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {guests.map(g => (
            <DraggableGuestCard key={g.id} guest={g} onToggleFavorite={onToggleFavorite} onDelete={onDelete} onEdit={onEdit} onSelectionToggle={onSelectionToggle} isSelected={selectedGuests.has(g.id)} onDragStart={onDragStart} onDragEnd={onDragEnd} isDragging={draggedGuest?.id === g.id} invitedCount={invitedCounts[g.id] || 0} groups={allGroups} onMoveToGroup={onMoveToGroup} />
          ))}
        </div>
      )}
    </section>
  );
}
