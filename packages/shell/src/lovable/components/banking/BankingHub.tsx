import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronLeft, Loader2, Wallet, AlertCircle } from 'lucide-react';
import {
  createBankAccount,
  fetchBankAccountsByUser,
  RootState,
  setDefaultBankAccount,
} from '@doevents/shared';
import { toast } from '@lovable/components/ui/sonner';
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

  const handleAddMethod = () => { setEditingMethod(undefined); setView('form'); };
  const handleEditMethod = (id: string) => {
    const m = methods.find((x) => x.id === id);
    if (m) { setEditingMethod(m); setView('form'); }
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
    setMethods((p) => p.filter((m) => m.id !== id));
    toast('Eliminar cuenta bancaria requiere endpoint backend', { description: 'Contacta soporte si necesitas retirar un método.' });
  };

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-4">
        <button
          type="button"
          onClick={view === 'form' ? () => setView('dashboard') : onBack}
          className="flex items-center text-primary text-sm font-medium"
        >
          <ChevronLeft className="h-5 w-5" /> Atrás
        </button>
        {view === 'dashboard' && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground">Métodos de cobro</h1>
              <p className="text-xs text-muted-foreground">Administra cuentas bancarias y retiros</p>
            </div>
          </div>
        )}
      </div>
      {view === 'form' ? (
        <BankingForm onComplete={handleFormComplete} editingMethod={editingMethod} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando métodos de cobro…</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadMethods()}
            className="rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary"
          >
            Reintentar
          </button>
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
