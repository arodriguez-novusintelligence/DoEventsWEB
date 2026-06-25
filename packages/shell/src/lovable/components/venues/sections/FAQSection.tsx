import { useState } from "react";
import { Input } from "@lovable/components/ui/input";
import { Textarea } from "@lovable/components/ui/textarea";
import { Label } from "@lovable/components/ui/label";
import { Button } from "@lovable/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { newWizardId } from '@doevents/shared';
interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQSection = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([
    { id: "1", question: "", answer: "" },
  ]);

  const addFAQ = () => {
    setFaqs([
      ...faqs,
      { id: `faq-${Date.now()}`, question: "", answer: "" },
    ]);
  };

  const removeFAQ = (id: string) => {
    if (faqs.length > 1) {
      setFaqs(faqs.filter((faq) => faq.id !== id));
    }
  };

  const updateFAQ = (id: string, field: "question" | "answer", value: string) => {
    setFaqs(
      faqs.map((faq) =>
        faq.id === id ? { ...faq, [field]: value } : faq
      )
    );
  };

  return (
    <div className="form-section">
      <div className="form-group">
        <Label className="form-label">Preguntas frecuentes</Label>
        <p className="form-sublabel">
          Agrega preguntas y respuestas que los clientes suelen hacer sobre tu
          lugar
        </p>

        <div className="space-y-4 mt-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className="p-4 rounded-xl border border-border bg-secondary/20 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="pt-2 text-muted-foreground cursor-move">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="form-sublabel">
                      Pregunta {index + 1}
                    </Label>
                    <Input
                      placeholder="Ej: ¿Cuál es el horario de check-in?"
                      value={faq.question}
                      onChange={(e) =>
                        updateFAQ(faq.id, "question", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="form-sublabel">Respuesta</Label>
                    <Textarea
                      placeholder="Escribe la respuesta aquí..."
                      value={faq.answer}
                      onChange={(e) =>
                        updateFAQ(faq.id, "answer", e.target.value)
                      }
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeFAQ(faq.id)}
                  disabled={faqs.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={addFAQ}
          className="mt-4 w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar pregunta
        </Button>
      </div>
    </div>
  );
};

export default FAQSection;