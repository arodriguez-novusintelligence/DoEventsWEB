import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Switch } from "@lovable/components/ui/switch";
import { Label } from "@lovable/components/ui/label";
import { useState } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInternational?: boolean;
  onSetDefault?: (isDefault: boolean) => void;
}

export default function SuccessModal({ isOpen, onClose, isInternational = false, onSetDefault }: SuccessModalProps) {
  const [isDefault, setIsDefault] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-center">
            {isInternational ? "Estamos configurando tus cobros" : "¡Muy Bien!"}
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {isInternational 
              ? "Ahora todos tus datos están guardados en tu cuenta."
              : "Ahora validaremos la información de tu cuenta para garantizar que las futuras transacciones se realicen de forma exitosa."
            }
          </DialogDescription>
        </DialogHeader>

        {isInternational ? (
          <div className="flex items-center justify-between p-4 mt-4">
            <Label htmlFor="default-method" className="text-sm text-left leading-relaxed">
              Establecer como tu{" "}
              <span className="font-semibold underline underline-offset-2">
                método de cobro predeterminado
              </span>
            </Label>
            <Switch
              id="default-method"
              checked={isDefault}
              onCheckedChange={(checked) => {
                setIsDefault(checked);
                onSetDefault?.(checked);
              }}
            />
          </div>
        ) : (
          <div className="bg-muted/50 rounded-2xl p-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Este proceso nos tomará un máximo de <span className="font-semibold text-foreground">24 horas</span>.
            </p>
          </div>
        )}

        <Button 
          onClick={onClose} 
          className="w-full h-12 mt-4 font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isInternational ? "Listo" : "Finalizar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
