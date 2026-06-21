import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Loader2, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import {
  createBankAccount,
  fetchBankAccountsByUser,
  RootState,
  setDefaultBankAccount,
} from '@doevents/shared';
import { toast } from '@lovable/components/ui/sonner';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
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
    toast('Eliminar cuenta bancaria requiere endpoint backend', { description: 'Contacta soporte si necesitas retirar un método.' });
    void id;
  };

  return (
    <div className="min-h-screen bg-secondary pb-24">
      {view === 'dashboard' && (
        <ProfileSectionBanner
          title="Métodos de cobro"
          subtitle={loading ? 'Cargando…' : `${methods.length} método${methods.length === 1 ? '' : 's'} registrado${methods.length === 1 ? '' : 's'}`}
          icon={Wallet}
          onBack={onBack}
        />
      )}
      {view === 'dashboard' && !loading && !loadError && (
        <div className="mx-auto max-w-4xl px-4 pt-2">
          <div className="flex gap-3 rounded-xl border border-border/60 border-warning/30 bg-warning/5 p-4 shadow-sm ring-1 ring-primary/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 ring-2 ring-primary/20">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="text-xs font-extrabold text-muted-foreground leading-relaxed">
              <p className="font-extrabold text-foreground">BACKEND_REQUIRED</p>
              <p className="mt-1 font-extrabold">Eliminar cuenta bancaria y PayPal payout requieren endpoints backend pendientes. Los cobros vía cuenta bancaria siguen operativos.</p>
            </div>
          </div>
        </div>
      )}
      {view === 'form' && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-border/60 font-extrabold shadow-sm"
            onClick={() => setView('dashboard')}
          >
            ← Volver al listado
          </Button>
        </div>
      )}
      {view === 'form' ? (
        <BankingForm onComplete={handleFormComplete} editingMethod={editingMethod} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-24 shadow-sm mx-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <p className="text-sm font-extrabold text-foreground">Cargando métodos de cobro…</p>
        </div>
      ) : loadError ? (
        <div className="mx-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card py-24 px-6 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm font-extrabold text-foreground">{loadError}</p>
          <Button type="button" variant="outline" className="rounded-full font-extrabold shadow-sm" onClick={() => void loadMethods()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl px-4 ring-1 ring-primary/10">
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
        </div>
      )}
      {view === 'dashboard' && !loading && !loadError && methods.some((m) => m.type === 'paypal') && (
        <div className="mx-auto max-w-4xl px-4 pb-6">
          <div className="flex gap-3 rounded-xl border border-border/60 border-warning/30 bg-warning/5 p-4 shadow-sm ring-1 ring-primary/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 ring-2 ring-primary/20">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="text-xs font-extrabold text-muted-foreground leading-relaxed">
              <p className="font-extrabold text-foreground">PayPal payout</p>
              <p className="mt-1 font-extrabold">Requiere integración backend pendiente. Los cobros vía cuenta bancaria siguen operativos.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankingHub;
