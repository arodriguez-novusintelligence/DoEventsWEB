import { Clock, AlertCircle, Building2, Smartphone, Plus, Wallet } from "lucide-react";
import { Button } from "@lovable/components/ui/button";
import { Badge } from "@lovable/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@lovable/components/ui/dropdown-menu";
import { SavedPaymentMethod } from "./BankingForm";

interface PaymentMethodsDashboardProps {
  onAddMethod: () => void;
  methods: SavedPaymentMethod[];
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onCheckFiscalStatus?: () => void;
}

const getMethodIcon = (type: SavedPaymentMethod["type"]) => {
  switch (type) {
    case "bancolombia":
      return <Building2 className="w-6 h-6 text-bancolombia" />;
    case "nequi":
      return <Smartphone className="w-6 h-6 text-nequi" />;
    case "otros":
      return <Building2 className="w-6 h-6 text-primary" />;
    case "international":
      return <Building2 className="w-6 h-6 text-muted-foreground" />;
    case "paypal":
      return <Wallet className="w-6 h-6 text-paypal" />;
  }
};

const getMethodName = (type: SavedPaymentMethod["type"], name?: string) => {
  switch (type) {
    case "bancolombia":
      return "Bancolombia";
    case "nequi":
      return "Nequi";
    case "otros":
      return name || "Otro banco";
    case "international":
      return "Cuenta bancaria";
    case "paypal":
      return "PayPal";
  }
};

const maskDetails = (details: string) => {
  if (details.length <= 4) return details;
  const visible = details.slice(-4);
  return `•••• ${visible}`;
};

export default function PaymentMethodsDashboard({
  onAddMethod,
  methods,
  onSetDefault,
  onDelete,
  onEdit,
  onCheckFiscalStatus,
}: PaymentMethodsDashboardProps) {
  const hasPendingMethods = methods.some(m => m.status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Processing Banner */}
        {hasPendingMethods && (
          <div className="flex gap-4 p-5 rounded-xl border border-border bg-card">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">
                Estamos procesando tu información
              </h3>
              <p className="text-sm text-muted-foreground">
                Verificar tu método de cobro y tus datos fiscales puede llevar un máximo de 2 días laborables, tras los cuales ya podrás recibir tus cobros en la cuenta que hayas añadido.
              </p>
              <button
                type="button"
                className="text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
                onClick={onCheckFiscalStatus}
              >
                Comprueba el estado de tus datos fiscales
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Cómo recibes los cobros
            </h2>
            <p className="text-muted-foreground">
              Agrega tu método de cobro, para que puedas recibir el pago de tus boletos vendidos. Puede ser una cuenta en Colombia, una cuenta internacional en dólares o PayPal, es tu elección.
            </p>
          </div>

          {/* Verification Alert */}
          {hasPendingMethods && (
            <div className="flex gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                Tardaremos un máximo de 2 días laborables en completar la verificación. Cuando cambiemos el estado para indicar que está lista, te enviaremos el dinero a través de este método de cobro.
              </p>
            </div>
          )}

          {/* Methods List */}
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {methods.length === 0 && (
              <div className="py-12 text-center px-4">
                <Wallet className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-foreground">Sin métodos de cobro</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  Agrega una cuenta en Colombia, internacional o PayPal para recibir tus cobros.
                </p>
              </div>
            )}
            {methods.map((method) => (
              <div key={method.id} className="flex items-center justify-between py-5 px-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                    {getMethodIcon(method.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {getMethodName(method.type, method.name)}
                      </span>
                      {method.status === "default" && (
                        <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wide">
                          Predeterminado
                        </Badge>
                      )}
                      {method.status === "pending" && (
                        <Badge variant="outline" className="text-xs font-medium border-warning/50 text-warning">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning mr-1.5" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.name}, {maskDetails(method.details)} ({method.currency})
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-50 bg-popover border border-border shadow-md">
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => onEdit(method.id)}>Editar información</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onSelect={() => onSetDefault(method.id)}>Establecer como predeterminado</DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive opacity-60"
                      disabled
                      onSelect={(e) => e.preventDefault()}
                    >
                      Eliminar (requiere backend)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {/* Add Method Button */}
          <Button
            onClick={onAddMethod}
            className="h-12 px-6 bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir método de cobro
          </Button>
        </div>
      </div>
    </div>
  );
}
