import { useState } from "react";
import { Plus, Edit, Trash2, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Badge } from "@lovable/components/ui/badge";
import { Label } from "@lovable/components/ui/label";
import { Card, CardContent } from "@lovable/components/ui/card";
import { GuestGroup, CreateGroupRequest, UpdateGroupRequest } from "@lovable/types/guest";
import { useToast } from "@lovable/hooks/use-toast";

interface Props {
  groups: GuestGroup[];
  onCreateGroup: (g: CreateGroupRequest) => void;
  onUpdateGroup: (g: UpdateGroupRequest) => void;
  onDeleteGroup: (id: string) => void;
  getGroupGuestCount: (id: string) => number;
  trigger?: React.ReactNode;
}

const groupColors = [
  { name: "Azul", value: "hsl(217, 91%, 60%)", bg: "bg-blue-100", text: "text-blue-700" },
  { name: "Verde", value: "hsl(142, 71%, 45%)", bg: "bg-green-100", text: "text-green-700" },
  { name: "Naranja", value: "hsl(25, 95%, 53%)", bg: "bg-orange-100", text: "text-orange-700" },
  { name: "Púrpura", value: "hsl(262, 83%, 58%)", bg: "bg-purple-100", text: "text-purple-700" },
  { name: "Rosa", value: "hsl(330, 81%, 60%)", bg: "bg-pink-100", text: "text-pink-700" },
  { name: "Índigo", value: "hsl(239, 84%, 67%)", bg: "bg-indigo-100", text: "text-indigo-700" },
  { name: "Teal", value: "hsl(178, 60%, 48%)", bg: "bg-teal-100", text: "text-teal-700" },
  { name: "Rojo", value: "hsl(0, 84%, 60%)", bg: "bg-red-100", text: "text-red-700" },
];

export function GroupManagementModal({ groups, onCreateGroup, onUpdateGroup, onDeleteGroup, getGroupGuestCount, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(groupColors[0].value);
  const { toast } = useToast();

  const create = () => {
    if (!name.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    onCreateGroup({ name: name.trim(), color });
    setName(""); setColor(groupColors[0].value); setShowForm(false);
    toast({ title: "Grupo creado", description: `"${name}" creado correctamente` });
  };
  const update = () => {
    if (!editing || !name.trim()) return;
    onUpdateGroup({ id: editing.id, name: name.trim(), color });
    setEditing(null); setName(""); setColor(groupColors[0].value); setShowForm(false);
    toast({ title: "Grupo actualizado" });
  };
  const del = (g: GuestGroup) => {
    const count = getGroupGuestCount(g.id);
    if (count > 0) { toast({ title: "No se puede eliminar", description: `Tiene ${count} invitados. Muévelos primero.`, variant: "destructive" }); return; }
    onDeleteGroup(g.id);
    toast({ title: "Grupo eliminado", description: `"${g.name}" eliminado` });
  };
  const startEdit = (g: GuestGroup) => { setEditing(g); setName(g.name); setColor(g.color); setShowForm(true); };
  const cancel = () => { setEditing(null); setName(""); setColor(groupColors[0].value); setShowForm(false); };
  const colorInfo = (v: string) => groupColors.find(c => c.value === v) || groupColors[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || (<Button variant="outline" size="sm" className="gap-2"><Users className="h-4 w-4" />Gestionar Grupos</Button>)}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Gestión de Grupos</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {showForm && (
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{editing ? "Editar Grupo" : "Nuevo Grupo"}</h3>
                  <Button variant="ghost" size="icon" onClick={cancel} className="h-6 w-6"><X className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-3">
                  <div><Label>Nombre del grupo</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="ej. Familiares" className="mt-1" /></div>
                  <div>
                    <Label>Color</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {groupColors.map(c => (
                        <button key={c.value} type="button" onClick={() => setColor(c.value)} className={`p-2 rounded-lg border-2 transition-all ${color === c.value ? "border-primary shadow-md" : "border-border hover:border-primary/50"}`}>
                          <div className={`w-full h-8 rounded ${c.bg} flex items-center justify-center`}><div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} /></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={editing ? update : create} className="flex-1" size="sm">{editing ? "Actualizar" : "Crear Grupo"}</Button>
                    <Button variant="outline" onClick={cancel} size="sm">Cancelar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Grupos ({groups.length})</h3>
              {!showForm && (<Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" />Nuevo</Button>)}
            </div>
            {!groups.length ? (
              <div className="text-center py-8 text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay grupos creados</p></div>
            ) : (
              <div className="space-y-2">
                {groups.map(g => {
                  const info = colorInfo(g.color);
                  const count = getGroupGuestCount(g.id);
                  return (
                    <Card key={g.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                            <div><h4 className="font-medium text-sm">{g.name}</h4><p className="text-xs text-muted-foreground">{count} invitado{count !== 1 ? 's' : ''}</p></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="soft" className={`text-xs ${info.bg} ${info.text}`}>{count}</Badge>
                            <Button variant="ghost" size="icon" onClick={() => startEdit(g)} className="h-6 w-6"><Edit className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => del(g)} className="h-6 w-6 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
