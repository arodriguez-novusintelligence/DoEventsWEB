import { useState } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';
import { EventFaq, EventFormData } from '@lovable/data/eventFormData';

interface Props {
  formData: EventFormData;
  updateForm: (partial: Partial<EventFormData>) => void;
}

const newId = () => `faq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const StepFaqs = ({ formData, updateForm }: Props) => {
  const faqs = formData.faqs ?? [];
  const [draftQ, setDraftQ] = useState('');
  const [draftA, setDraftA] = useState('');

  const updateFaq = (id: string, patch: Partial<EventFaq>) =>
    updateForm({ faqs: faqs.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const removeFaq = (id: string) =>
    updateForm({ faqs: faqs.filter((f) => f.id !== id) });

  const canAdd = draftQ.trim() && draftA.trim();

  const commitDraft = () => {
    if (!canAdd) return;
    updateForm({
      faqs: [...faqs, { id: newId(), question: draftQ.trim(), answer: draftA.trim() }],
    });
    setDraftQ('');
    setDraftA('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <HelpCircle className="h-5 w-5" />
          </span>
          Preguntas frecuentes
        </h2>
        <p className="mt-1 text-sm text-foreground">
          Agrega preguntas frecuentes que los asistentes puedan tener sobre tu evento.{' '}
          <span className="text-muted-foreground">(Opcional)</span>
        </p>
      </div>

      {faqs.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/25 bg-card px-4 py-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Aún no hay preguntas</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Usa el formulario de abajo para agregar la primera FAQ de tu evento.
          </p>
        </div>
      )}

      {/* Draft card */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <label className="text-xs font-semibold text-foreground">Pregunta</label>
        <input
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
          placeholder="Ingresa una pregunta"
          className="mt-1 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <label className="mt-3 block text-xs font-semibold text-foreground">Respuesta</label>
        <input
          value={draftA}
          onChange={(e) => setDraftA(e.target.value)}
          placeholder="Ingresa una respuesta"
          className="mt-1 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={!canAdd}
            onClick={commitDraft}
            className="flex items-center gap-1 text-sm font-semibold text-primary disabled:opacity-40"
          >
            Agregar pregunta <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {faqs.map((faq) => (
        <div key={faq.id} className="rounded-2xl bg-card p-4 shadow-sm">
          <label className="text-xs font-semibold text-foreground">Pregunta</label>
          <input
            value={faq.question}
            onChange={(e) => updateFaq(faq.id, { question: e.target.value })}
            className="mt-1 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <label className="mt-3 block text-xs font-semibold text-foreground">Respuesta</label>
          <input
            value={faq.answer}
            onChange={(e) => updateFaq(faq.id, { answer: e.target.value })}
            className="mt-1 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeFaq(faq.id)}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-destructive"
          >
            <X className="h-4 w-4" /> Eliminar pregunta
          </button>
        </div>
      ))}
    </div>
  );
};

export default StepFaqs;
