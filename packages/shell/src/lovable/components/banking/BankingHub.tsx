import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, Landmark, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import {
  createBankAccount,
  fetchBankAccountsByUser,
  RootState,
  setDefaultBankAccount,
} from '@doevents/shared';
import { toast } from '@lovable/components/ui/sonner';
import { Button } from '@lovable/components/ui/button';
import BankingForm, { type SavedPaymentMethod } from './BankingForm';
import PaymentMethodsDashboard from './PaymentMethodsDashboard';
import { mapBankAccounts, savedMethodToCreateInput } from '../../../lovable-bridge/bankingAdapter';

interface BankingHubProps {
  onBack: () => void;
}

const BankingHub = ({ onBack }: BankingHubProps) => {
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingMethod, setEditingMethod] = useState<SavedPaymentMethod | undefined>(undefined);
  const [initialMethodType, setInitialMethodType] = useState<'local' | 'international' | 'paypal' | undefined>(undefined);
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    if (!userId) {
      setMethods([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const accounts = await fetchBankAccountsByUser(userId);
      setMethods(mapBankAccounts(accounts));
    } catch {
      setMethods([]);
      setLoadError('No se pudieron cargar tus métodos de cobro');
      toast.error('No se pudieron cargar tus métodos de cobro');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  const handleAddMethod = (initialType?: 'local' | 'international' | 'paypal') => {
    setEditingMethod(undefined);
    setInitialMethodType(initialType);
    setView('form');
  };
  const handleEditMethod = (id: string) => {
    const m = methods.find((x) => x.id === id);
    if (m) {
      setEditingMethod(m);
      setInitialMethodType(undefined);
      setView('form');
    }
  };

  const handleFormComplete = async (newMethod?: SavedPaymentMethod) => {
    if (newMethod && userId) {
      if (newMethod.type === 'paypal') {
        toast.error('PayPal requiere integración backend pendiente');
      } else {
        const input = savedMethodToCreateInput(newMethod, userId);
        if (input) {
          try {
            await createBankAccount(input);
            toast.success('Método de cobro registrado');
            await loadMethods();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'No se pudo guardar el método');
          }
        }
      }
    }
    setEditingMethod(undefined);
    setInitialMethodType(undefined);
    setView('dashboard');
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultBankAccount(id);
      setMethods((p) => p.map((m) => ({
        ...m,
        status: m.id === id ? 'default' : m.status === 'default' ? 'active' : m.status,
      })));
      toast.success('Método predeterminado actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    }
  };

  const handleDelete = (id: string) => {
    toast('Eliminar cuenta bancaria requiere endpoint backend', {
      description: 'Contacta soporte si necesitas retirar un método.',
    });
    void id;
  };

  const handleBack = view === 'form' ? () => setView('dashboard') : onBack;

  const bannerTitle = view === 'form'
    ? (editingMethod ? 'Editar datos bancarios' : 'Agregar datos bancarios')
    : 'Datos bancarios';
  const bannerSubtitle = view === 'form'
    ? 'Configura tu método de cobro'
    : loading
      ? 'Cargando…'
      : `${methods.length} método${methods.length === 1 ? '' : 's'} registrado${methods.length === 1 ? '' : 's'}`;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-32">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground transition hover:bg-primary-foreground/10"
        >
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <Landmark className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-tight text-primary-foreground">{bannerTitle}</h1>
            <p className="text-[11px] text-primary-foreground/80">{bannerSubtitle}</p>
          </div>
        </div>
      </div>

      {view === 'dashboard' && !loading && !loadError && (
        <div className="mx-auto max-w-lg px-4 pt-4">
          <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 ring-2 ring-primary/20">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Eliminar cuenta y PayPal</p>
              <p className="mt-1">Requieren endpoints backend pendientes. Los cobros vía cuenta bancaria siguen operativos.</p>
            </div>
          </div>
        </div>
      )}

      {view === 'form' ? (
        <BankingForm onComplete={handleFormComplete} editingMethod={editingMethod} />
      ) : loading ? (
        <div className="mx-4 mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-24 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Cargando métodos de cobro…</p>
        </div>
      ) : loadError ? (
        <div className="mx-4 mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-24 px-6 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground">{loadError}</p>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => void loadMethods()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      ) : (
        <PaymentMethodsDashboard
          methods={methods}
          onAddMethod={handleAddMethod}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
          onEdit={handleEditMethod}
          onCheckFiscalStatus={() => {
            toast.info('Revisa tu correo o contacta soporte para el estado fiscal de tu cuenta.');
          }}
        />
      )}
    </div>
  );
};

export default BankingHub;
