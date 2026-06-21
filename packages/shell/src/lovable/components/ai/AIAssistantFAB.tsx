import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIAssistantFABProps {
  onClick: () => void;
}

/** Botón flotante global para abrir el Asistente IA (PRO). */
export const AIAssistantFAB: React.FC<AIAssistantFABProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Asistente IA"
    className="de-ai-fab fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--primary-deep,220_70%_45%))] text-primary-foreground shadow-xl ring-2 ring-primary/20 transition-transform active:scale-95 animate-in fade-in zoom-in duration-300 hover:shadow-2xl hover:shadow-primary/30"
  >
    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-extrabold text-primary-foreground shadow-sm">
      PRO
    </span>
    <Sparkles className="h-6 w-6" strokeWidth={2.5} />
  </button>
);

export default AIAssistantFAB;
