import { useState, useEffect } from "react";
import { Heart, Loader2, UserRound } from "lucide-react";
import { Guest, UpdateGuestRequest, GuestGroup } from "@lovable/types/guest";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lovable/components/ui/select";
import { useToast } from "@lovable/hooks/use-toast";
import { guestCategorySelectValue, normalizeGuestCategory } from "../../../lovable-bridge/guestsAdapter";
import { PhoneCountryFields, splitGuestPhone } from "./PhoneCountryFields";

interface Props {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateGuest: (g: UpdateGuestRequest) => void | Promise<void>;
  groups: GuestGroup[];
  nested?: boolean;
}

export function EditGuestModal({ guest, open, onOpenChange, onUpdateGuest, groups, nested = false }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [categoryValue, setCategoryValue] = useState("none");
  const [form, setForm] = useState<UpdateGuestRequest>({
    id: "",
    name: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    phoneIndicative: "+57",
    phoneNumber: "",
    isFavorite: false,
    groupId: undefined,
  });

  useEffect(() => {
    if (!guest) return;
    const split = splitGuestPhone(guest.phone, guest.phoneIndicative, guest.phoneNumber);
    setForm({
      id: guest.id,
      name: guest.name,
      lastName: guest.lastName,
      username: guest.username || "",
      email: guest.email || "",
      phone: guest.phone || "",
      phoneIndicative: split.phoneIndicative,
      phoneNumber: split.phoneNumber,
      isFavorite: guest.isFavorite,
      groupId: guest.groupId,
    });
    setCategoryValue(guestCategorySelectValue(guest));
  }, [guest]);

  const applyCategory = (value: string) => {
    setCategoryValue(value);
    if (value === "favorite") {
      setForm((prev) => ({ ...prev, isFavorite: true, groupId: undefined }));
      return;
    }
    if (value === "none") {
      setForm((prev) => ({ ...prev, isFavorite: false, groupId: undefined }));
      return;
    }
    setForm((prev) => ({ ...prev, isFavorite: false, groupId: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lastName.trim()) {
      toast({ title: "Campos requeridos", description: "Nombre y apellido obligatorios.", variant: "destructive" });
      return;
    }
    const category = normalizeGuestCategory({
      isFavorite: form.isFavorite,
      groupId: form.groupId,
    });
    setSaving(true);
    try {
      await onUpdateGuest({
        ...form,
        isFavorite: category.isFavorite,
        groupId: category.groupId,
      });
      onOpenChange(false);
    } catch {
      // El padre muestra el error vía toast
    } finally {
      setSaving(false);
    }
  };

  if (!guest) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent stacked={nested} className="sm:max-w-md rounded-2xl shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-primary flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
              <UserRound className="h-5 w-5" />
            </span>
            Editar invitado
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input className="rounded-xl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Apellido *</Label><Input className="rounded-xl" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Usuario</Label><Input className="rounded-xl" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="@usuario" /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" className="rounded-xl" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <PhoneCountryFields
            indicative={form.phoneIndicative || "+57"}
            number={form.phoneNumber || ""}
            onIndicativeChange={(value) => setForm({ ...form, phoneIndicative: value })}
            onNumberChange={(value) => setForm({ ...form, phoneNumber: value })}
          />
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoryValue} onValueChange={applyCategory}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sin grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="favorite">
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 fill-favorite text-favorite" />
                    Favoritos
                  </div>
                </SelectItem>
                <SelectItem value="none">Sin grupo</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                      {g.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="flex-1 rounded-full">Cancelar</Button>
            <Button type="submit" disabled={saving} className="flex-1 rounded-full">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando…</> : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
