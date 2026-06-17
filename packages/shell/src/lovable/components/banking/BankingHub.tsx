import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import BankingForm, { type SavedPaymentMethod } from './BankingForm';
import PaymentMethodsDashboard from './PaymentMethodsDashboard';

interface BankingHubProps {
  onBack: () => void;
}

const BankingHub = ({ onBack }: BankingHubProps) => {
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingMethod, setEditingMethod] = useState<SavedPaymentMethod | undefined>(undefined);
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([
    { id: '1', type: 'nequi', name: 'Nequi', details: '3001234567', currency: 'COP', status: 'default' },
    { id: '2', type: 'international', name: 'Luis Motta', details: 'IBAN 1324', currency: 'USD', status: 'pending' },
  ]);

  const handleAddMethod = () => { setEditingMethod(undefined); setView('form'); };
  const handleEditMethod = (id: string) => {
    const m = methods.find((x) => x.id === id);
    if (m) { setEditingMethod(m); setView('form'); }
  };
  const handleFormComplete = (newMethod?: SavedPaymentMethod) => {
    if (newMethod) {
      if (editingMethod) {
        setMethods((p) => p.map((m) => (m.id === editingMethod.id ? { ...newMethod, id: editingMethod.id } : m)));
      } else {
        setMethods((p) => [...p, newMethod]);
      }
    }
    setEditingMethod(undefined);
    setView('dashboard');
  };
  const handleSetDefault = (id: string) => {
    setMethods((p) => p.map((m) => ({
      ...m,
      status: m.id === id ? 'default' : m.status === 'default' ? 'active' : m.status,
    })));
  };
  const handleDelete = (id: string) => setMethods((p) => p.filter((m) => m.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-4">
        <button onClick={view === 'form' ? () => setView('dashboard') : onBack}
          className="flex items-center text-primary text-sm">
          <ChevronLeft className="h-5 w-5" /> Atras
        </button>
      </div>
      {view === 'form' ? (
        <BankingForm onComplete={handleFormComplete} editingMethod={editingMethod} />
      ) : (
        <PaymentMethodsDashboard
          methods={methods}
          onAddMethod={handleAddMethod}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
          onEdit={handleEditMethod}
        />
      )}
    </div>
  );
};

export default BankingHub;
