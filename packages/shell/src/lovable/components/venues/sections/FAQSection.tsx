import { Input } from '@lovable/components/ui/input';
import { Textarea } from '@lovable/components/ui/textarea';
import { Label } from '@lovable/components/ui/label';
import { Button } from '@lovable/components/ui/button';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { newWizardId } from '@doevents/shared';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';

const FAQSection = () => {
  const { form, update } = usePlaceForm();

  const addFAQ = () => {
    update({
      faqs: [...form.faqs, { id: newWizardId(), question: '', answer: '' }],
    });
  };

  const removeFAQ = (id: string) => {
    update({ faqs: form.faqs.filter((faq) => faq.id !== id) });
  };

  const updateFAQ = (id: string, field: 'question' | 'answer', value: string) => {
    update({
      faqs: form.faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)),
    });
  };

  return (
    <div className="form-section">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <HelpCircle className="h-5 w-5 text-primary" />
        </span>
        <Label className="form-label mb-0 font-extrabold">Preguntas frecuentes</Label>
      </div>
      <p className="form-sublabel text-sm text-muted-foreground">
        Opcional: agrega preguntas que los clientes suelen hacer sobre tu lugar.
      </p>

      {form.faqs.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-primary/25 bg-secondary/20 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <HelpCircle className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-3 text-sm font-extrabold text-foreground">Sin preguntas frecuentes aún</p>
          <Button type="button" variant="outline" className="mt-4 w-full border-dashed" onClick={addFAQ}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar pregunta
          </Button>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {form.faqs.map((faq, index) => (
            <div key={faq.id} className="p-4 rounded-xl border border-border/60 bg-secondary/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pregunta {index + 1}</Label>
                    <Input
                      placeholder="Ej: ¿Cuál es el horario de check-in?"
                      value={faq.question}
                      onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Respuesta</Label>
                    <Textarea
                      placeholder="Escribe la respuesta aquí..."
                      value={faq.answer}
                      onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeFAQ(faq.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full border-dashed" onClick={addFAQ}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar otra pregunta
          </Button>
        </div>
      )}
    </div>
  );
};

export default FAQSection;
