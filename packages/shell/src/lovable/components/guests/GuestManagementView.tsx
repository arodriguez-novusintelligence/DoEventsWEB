import { useEffect, useState } from "react";
import { Search, Users, Heart, Calendar, Plus, CheckSquare, Square, Trash2, Tag, BarChart3, ChevronLeft, FolderInput, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@lovable/components/ui/dropdown-menu";
import { guestErrorMessage } from "@lovable/utils/guestErrorMessage";
import { DraggableGuestCard } from "./DraggableGuestCard";
import { GroupDropZone } from "./GroupDropZone";
import { AddGuestModal } from "./AddGuestModal";
import { EditGuestModal } from "./EditGuestModal";
import { EventInvitationModal } from "./EventInvitationModal";
import { GroupManagementModal } from "./GroupManagementModal";
import GuestStatisticsView from "./GuestStatisticsView";
import type { ApiGuestsController } from "../../../lovable-bridge/useApiGuests";
import { Input } from "@lovable/components/ui/input";
import { Button } from "@lovable/components/ui/button";
import { Badge } from "@lovable/components/ui/badge";
import { Guest, UpdateGuestRequest } from "@lovable/types/guest";
import { useToast } from "@lovable/hooks/use-toast";

interface Props {
  onBack: () => void;
  guestsController: ApiGuestsController;
  userId?: string;
  initialEventId?: string;
  autoOpenInvitation?: boolean;
}

const GuestManagementView = ({ onBack, guestsController, userId, initialEventId, autoOpenInvitation }: Props) => {
  const {
    allGuests, guests, favoriteGuests, favoritesWithoutGroup, regularGuests, guestsByGroup, ungroupedGuests, groups,
    selectedGroupId, searchTerm, setSearchTerm, setSelectedGroupId,
    addGuest, updateGuest, deleteGuest, toggleFavorite,
    addGroup, updateGroup, deleteGroup, moveGuestToGroup, getGroupGuestCount,
    searchUserByUsername, registerUserAsGuest, purgeJunkGuests, reload,
    loading: guestsLoading,
  } = guestsController;

  const [view, setView] = useState<"list" | "stats">("list");
  const [showFavorites, setShowFavorites] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(Boolean(autoOpenInvitation));
  const [presetEventId, setPresetEventId] = useState<string | undefined>(
    autoOpenInvitation ? initialEventId : undefined,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragged, setDragged] = useState<Guest | null>(null);
  // Invitaciones enviadas en esta sesión (sin persistencia local ficticia)
  const [invitedCounts, setInvitedCounts] = useState<Record<string, number>>({});
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [junkPurged, setJunkPurged] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (junkPurged || guestsLoading || !userId) return;
    void purgeJunkGuests().then((removed) => {
      if (removed > 0) {
        toast({ title: `${removed} contacto(s) de prueba eliminados` });
      }
      setJunkPurged(true);
    });
  }, [junkPurged, guestsLoading, userId, purgeJunkGuests, toast]);

  useEffect(() => {
    if (autoOpenInvitation) {
      setInvitationOpen(true);
      if (initialEventId) setPresetEventId(initialEventId);
    }
  }, [autoOpenInvitation, initialEventId]);

  const handleInvitationsSent = (ids: string[], _eventId: string) => {
    setInvitedCounts(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = (next[id] || 0) + 1; });
      return next;
    });
    void reload();
  };

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">Inicia sesión para gestionar tus invitados</p>
        <p className="mt-1 text-xs text-muted-foreground">Necesitas una cuenta activa para acceder a esta sección</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </div>
    );
  }

  if (view === "stats") return <GuestStatisticsView onBack={() => setView("list")} />;

  const displayed = showFavorites ? favoriteGuests : guests;
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleEdit = (g: Guest) => { setEditing(g); setEditOpen(true); };
  const handleUpdate = async (data: UpdateGuestRequest) => {
    try {
      await updateGuest(data);
      toast({ title: "Invitado actualizado" });
    } catch (err) {
      toast({
        title: "No se pudo actualizar",
        description: guestErrorMessage(err),
        variant: "destructive",
      });
    }
  };
  const handleDelete = async (g: Guest) => {
    try {
      await deleteGuest(g.favoriteId || g.id);
      toast({
        title: "Invitado eliminado",
        description: `${g.name} ${g.lastName}`.trim() || "Contacto eliminado",
      });
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: guestErrorMessage(err),
        variant: "destructive",
      });
    }
  };
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => deleteGuest(id)));
      setSelected(new Set());
      toast({ title: "Invitados eliminados" });
    } catch (err) {
      toast({
        title: "Error al eliminar",
        description: guestErrorMessage(err),
        variant: "destructive",
      });
    }
  };
  const toggleSel = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const allSelected = displayed.length > 0 && selected.size === displayed.length;

  const handleDrop = (g: Guest, target?: string) => {
    if (g.groupId === target) return;
    moveGuestToGroup(g.id, target);
    const name = target ? groups.find(x => x.id === target)?.name || "Grupo" : "Sin grupo";
    toast({ title: "Invitado movido", description: `${g.name} → ${name}` });
  };

  const showGroupedLayout = !selectedGroupId && !showFavorites;
  const hasListContent = displayed.length > 0 || (showGroupedLayout && groups.length > 0);

  const invitationModal = (
    <EventInvitationModal
      open={invitationOpen}
      onOpenChange={setInvitationOpen}
      guests={allGuests}
      userId={userId}
      initialEventId={presetEventId}
      initialGuestIds={selected.size > 0 ? Array.from(selected) : undefined}
      onToggleFavorite={toggleFavorite}
      onMoveToGroup={moveGuestToGroup}
      groups={groups}
      onAddGuest={addGuest}
      onRegisterFoundUser={registerUserAsGuest}
      onSearchUser={searchUserByUsername}
      onUpdateGuest={updateGuest}
      onDeleteGuest={deleteGuest}
      onInvitationsSent={handleInvitationsSent}
      onReloadGuests={(opts) => reload(opts)}
    />
  );

  if (guestsLoading && !invitationOpen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-8 py-10 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Cargando invitados…</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen pb-6 bg-secondary animate-fade-in overflow-x-hidden">
      <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10 rounded-b-3xl">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 -ml-2 text-primary-foreground hover:bg-primary-foreground/10">
              <ChevronLeft className="h-4 w-4" /> Atrás
            </Button>
            <div className="flex items-center gap-1">
              <Button onClick={() => setView("stats")} size="sm" variant="ghost" className="h-8 px-2 text-primary-foreground hover:bg-primary-foreground/10 gap-1">
                <BarChart3 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-primary-foreground hover:bg-primary-foreground/10 gap-1">
                    {selected.size > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    <span className="text-xs">{selected.size > 0 ? selected.size : ''}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setSelected(new Set(displayed.map(g => g.id)))}>
                    <CheckSquare className="h-4 w-4 mr-2" /> Seleccionar todos ({displayed.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelected(new Set(favoriteGuests.map(g => g.id)))}>
                    <Heart className="h-4 w-4 mr-2 text-favorite" /> Sólo favoritos ({favoriteGuests.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelected(new Set(Object.keys(invitedCounts).filter(id => invitedCounts[id] > 0)))}>
                    <Calendar className="h-4 w-4 mr-2 text-primary" /> Sólo invitados a eventos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelected(new Set())}>
                    <Square className="h-4 w-4 mr-2" /> Limpiar selección
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 ring-2 ring-primary-foreground/20 backdrop-blur">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-primary-foreground leading-tight truncate">Gestión de invitados</h1>
              <p className="text-[11px] text-primary-foreground/80">{guests.length} Total · {favoriteGuests.length} Favoritos</p>
            </div>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, @usuario o email" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10 rounded-2xl bg-card border-0 shadow-md focus-visible:ring-2 focus-visible:ring-primary/30" />
          </div>
        </div>
      </div>

      <main className="px-4 -mt-6 mx-auto max-w-2xl space-y-3 animate-slide-up overflow-x-hidden">
        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex items-center gap-2 pb-1">
            {(() => {
              const isAll = !showFavorites && !selectedGroupId;
              const isFav = showFavorites;
              const isOthers = selectedGroupId === 'ungrouped';
              const chip = (active: boolean) => `shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-9 text-xs font-semibold transition border ${active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card text-foreground border-border hover:bg-accent/40'}`;
              const count = (active: boolean) => `inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`;
              return (
                <>
                  <button type="button" onClick={() => { setShowFavorites(false); setSelectedGroupId(null); }} className={chip(isAll)}>
                    <Users className="h-3.5 w-3.5" /> Todos <span className={count(isAll)}>{guests.length}</span>
                  </button>
                  <button type="button" onClick={() => { setShowFavorites(true); setSelectedGroupId(null); }} className={chip(isFav)}>
                    <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} /> Favoritos <span className={count(isFav)}>{favoriteGuests.length}</span>
                  </button>
                  <button type="button" onClick={() => { setShowFavorites(false); setSelectedGroupId('ungrouped'); }} className={chip(isOthers)}>
                    <Users className="h-3.5 w-3.5" /> Otros <span className={count(isOthers)}>{regularGuests.length}</span>
                  </button>
                  <GroupManagementModal groups={groups} onCreateGroup={addGroup} onUpdateGroup={updateGroup} onDeleteGroup={deleteGroup} getGroupGuestCount={getGroupGuestCount} trigger={
                    <button type="button" className={chip(false)}>
                      <Tag className="h-3.5 w-3.5" /> Grupos <span className={count(false)}>{groups.length}</span>
                    </button>
                  } />
                </>
              );
            })()}
          </div>
        </div>

        {/* Group chips */}
        {groups.length > 0 && (
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 pb-1">
              <button onClick={() => setSelectedGroupId(null)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${!selectedGroupId ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
                Todos los grupos
              </button>
              {groups.map(g => (
                <button key={g.id} onClick={() => setSelectedGroupId(g.id)} className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedGroupId === g.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                  {g.name} <span className="opacity-70">({getGroupGuestCount(g.id)})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-10 rounded-2xl border-border bg-card" onClick={() => setAddGuestOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Contacto
          </Button>
          <Button
            onClick={() => { setPresetEventId(undefined); setInvitationOpen(true); }}
            size="sm"
            className="h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Calendar className="h-4 w-4 mr-1" /> Invitar
          </Button>
        </div>

        {/* Bulk actions bar */}
        {selected.size > 0 && (
          <div className="flex flex-col gap-2.5 rounded-2xl bg-primary/5 border border-primary/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-primary shrink-0">{selected.size} seleccionado(s)</span>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => { selected.forEach(toggleFavorite); setSelected(new Set()); toast({ title: "Favoritos actualizados" }); }} className="h-8 text-[11px] flex-1 sm:flex-none border-favorite/30 text-favorite hover:bg-favorite/10">
                <Heart className="h-3 w-3 mr-1" /> Favorito
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-[11px] flex-1 sm:flex-none border-primary/30 text-primary hover:bg-primary/10">
                    <FolderInput className="h-3 w-3 mr-1" /> Mover
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Mover a grupo</DropdownMenuLabel>
                  {groups.map((gr) => (
                    <DropdownMenuItem key={gr.id} onSelect={(e) => { e.preventDefault(); selected.forEach((id) => moveGuestToGroup(id, gr.id)); const count = selected.size; setSelected(new Set()); toast({ title: `${count} invitado(s) movidos`, description: `→ ${gr.name}` }); }} className="cursor-pointer">
                      <span className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: gr.color }} />
                      {gr.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); selected.forEach((id) => moveGuestToGroup(id, undefined)); const count = selected.size; setSelected(new Set()); toast({ title: `${count} invitado(s) sin grupo` }); }} className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" /> Sin grupo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => void handleBulkDelete()} className="h-8 text-[11px] flex-1 sm:flex-none border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {hasListContent ? (
          <div className="space-y-6">
            {selectedGroupId ? (
              <GroupDropZone
                group={selectedGroupId === 'ungrouped' ? undefined : selectedGroup}
                guests={displayed}
                isUngrouped={selectedGroupId === 'ungrouped'}
                alwaysShow
                onToggleFavorite={toggleFavorite}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onSelectionToggle={toggleSel}
                selectedGuests={selected}
                onDropGuest={handleDrop}
                draggedGuest={dragged}
                onDragStart={setDragged}
                onDragEnd={() => setDragged(null)}
                invitedCounts={invitedCounts}
                allGroups={groups}
                onMoveToGroup={(id, gid) => { const g = guests.find((x) => x.id === id); if (g) handleDrop(g, gid); }}
              />
            ) : (
              <>
                {showGroupedLayout && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-favorite fill-current" />
                      <h2 className="text-base font-semibold text-card-foreground">Favoritos</h2>
                      <Badge variant="favorite" className="text-xs">{favoritesWithoutGroup.length}</Badge>
                    </div>
                    {favoritesWithoutGroup.length > 0 ? (
                      <div className="space-y-3">
                        {favoritesWithoutGroup.map(g => (
                          <DraggableGuestCard key={g.id} guest={g} onToggleFavorite={toggleFavorite} onDelete={handleDelete} onEdit={handleEdit} onSelectionToggle={toggleSel} isSelected={selected.has(g.id)} onDragStart={setDragged} onDragEnd={() => setDragged(null)} isDragging={dragged?.id === g.id} invitedCount={invitedCounts[g.id] || 0} groups={groups} onMoveToGroup={(id, gid) => { const gg = guests.find((x) => x.id === id); if (gg) handleDrop(gg, gid); }} />
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-border bg-card/50 py-4 text-center text-xs text-muted-foreground">Sin invitados favoritos</p>
                    )}
                  </section>
                )}
                {showGroupedLayout && groups.map(group => (
                  <GroupDropZone key={group.id} group={group} guests={guestsByGroup[group.id] || []} alwaysShow onToggleFavorite={toggleFavorite} onDelete={handleDelete} onEdit={handleEdit} onSelectionToggle={toggleSel} selectedGuests={selected} onDropGuest={handleDrop} draggedGuest={dragged} onDragStart={setDragged} onDragEnd={() => setDragged(null)} invitedCounts={invitedCounts} allGroups={groups} onMoveToGroup={(id, gid) => { const gg = guests.find((x) => x.id === id); if (gg) handleDrop(gg, gid); }} />
                ))}
                {showGroupedLayout && (
                  <GroupDropZone guests={ungroupedGuests} isUngrouped alwaysShow onToggleFavorite={toggleFavorite} onDelete={handleDelete} onEdit={handleEdit} onSelectionToggle={toggleSel} selectedGuests={selected} onDropGuest={handleDrop} draggedGuest={dragged} onDragStart={setDragged} onDragEnd={() => setDragged(null)} invitedCounts={invitedCounts} allGroups={groups} onMoveToGroup={(id, gid) => { const gg = guests.find((x) => x.id === id); if (gg) handleDrop(gg, gid); }} />
                )}
                {showFavorites && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-favorite fill-current" />
                      <h2 className="text-base font-semibold text-card-foreground">Favoritos</h2>
                      <Badge variant="favorite" className="text-xs">{displayed.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {displayed.map(g => (
                        <DraggableGuestCard key={g.id} guest={g} onToggleFavorite={toggleFavorite} onDelete={handleDelete} onEdit={handleEdit} onSelectionToggle={toggleSel} isSelected={selected.has(g.id)} onDragStart={setDragged} onDragEnd={() => setDragged(null)} isDragging={dragged?.id === g.id} invitedCount={invitedCounts[g.id] || 0} groups={groups} onMoveToGroup={(id, gid) => { const gg = guests.find((x) => x.id === id); if (gg) handleDrop(gg, gid); }} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl bg-card shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20"><Users className="h-7 w-7 text-primary" /></div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              {searchTerm ? "Sin resultados" : selectedGroupId ? "Sin invitados en este grupo" : "Aún no hay invitados"}
            </h3>
            <p className="text-muted-foreground mb-6 text-sm px-6">
              {searchTerm ? "Prueba con otros términos" : "Agrega tu primer invitado para empezar"}
            </p>
            {!searchTerm && (
              <AddGuestModal
                open={addGuestOpen}
                onOpenChange={setAddGuestOpen}
                hideTrigger
                onAddGuest={addGuest}
                onRegisterFoundUser={registerUserAsGuest}
                onSearchUser={searchUserByUsername}
                groups={groups}
                existingGuests={allGuests}
                userId={userId}
                onGuestAdded={() => void reload()}
                trigger={<Button className="rounded-xl">Agregar invitado</Button>}
              />
            )}
          </div>
        )}
      </main>

      <AddGuestModal
        open={addGuestOpen}
        onOpenChange={setAddGuestOpen}
        hideTrigger
        onAddGuest={addGuest}
        onRegisterFoundUser={registerUserAsGuest}
        onSearchUser={searchUserByUsername}
        groups={groups}
        existingGuests={allGuests}
        userId={userId}
        onGuestAdded={() => void reload()}
      />

      <EditGuestModal guest={editing} open={editOpen} onOpenChange={setEditOpen} onUpdateGuest={handleUpdate} groups={groups} />
    </div>
    {invitationModal}
    </>
  );
};

export default GuestManagementView;
