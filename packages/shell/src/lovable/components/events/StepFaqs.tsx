import { useState } from 'react';
import { Check, Pencil, Plus, X, HelpCircle } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');

  const removeFaq = (id: string) => {
    if (editingId === id) {
      setEditingId(null);
      setEditQ('');
      setEditA('');
    }
    updateForm({ faqs: faqs.filter((f) => f.id !== id) });
  };

  const canAdd = draftQ.trim() && draftA.trim();
  const canSaveEdit = Boolean(editQ.trim() && editA.trim());

  const commitDraft = () => {
    if (!canAdd) return;
    updateForm({
      faqs: [...faqs, { id: newId(), question: draftQ.trim(), answer: draftA.trim() }],
    });
    setDraftQ('');
    setDraftA('');
  };

  const startEdit = (faq: EventFaq) => {
    setEditingId(faq.id);
    setEditQ(faq.question);
    setEditA(faq.answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQ('');
    setEditA('');
  };

  const saveEdit = () => {
    if (!editingId || !canSaveEdit) return;
    updateForm({
      faqs: faqs.map((f) => (
        f.id === editingId
          ? { ...f, question: editQ.trim(), answer: editA.trim() }
          : f
      )),
    });
    cancelEdit();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-primary">
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
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
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

      {faqs.map((faq) => {
        const isEditing = editingId === faq.id;
        return (
          <div key={faq.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <label className="text-xs font-semibold text-foreground">Pregunta</label>
            {isEditing ? (
              <input
                value={editQ}
                onChange={(e) => setEditQ(e.target.value)}
                placeholder="Ingresa una pregunta"
                className="mt-1 w-full border-0 border-b border-primary bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                autoFocus
              />
            ) : (
              <p className="mt-1 border-b border-border py-2 text-sm text-foreground">{faq.question}</p>
            )}
            <label className="mt-3 block text-xs font-semibold text-foreground">Respuesta</label>
            {isEditing ? (
              <input
                value={editA}
                onChange={(e) => setEditA(e.target.value)}
                placeholder="Ingresa una respuesta"
                className="mt-1 w-full border-0 border-b border-primary bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            ) : (
              <p className="mt-1 border-b border-border py-2 text-sm text-foreground">{faq.answer}</p>
            )}

            {isEditing ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => removeFaq(faq.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
                >
                  <X className="h-4 w-4" /> Eliminar pregunta
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!canSaveEdit}
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" /> Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => removeFaq(faq.id)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-destructive"
                >
                  <X className="h-4 w-4" /> Eliminar pregunta
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(faq)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  <Pencil className="h-4 w-4" /> Editar pregunta
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepFaqs;
