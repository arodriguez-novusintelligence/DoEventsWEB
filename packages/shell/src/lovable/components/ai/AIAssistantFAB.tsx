import React from 'react';

interface AIAssistantFABProps {
  onClick: () => void;
}

/** Botón flotante global para abrir el Asistente IA (PRO). */
export const AIAssistantFAB: React.FC<AIAssistantFABProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Asistente IA"
    className="de-ai-fab fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--primary-deep,220_70%_45%))] text-primary-foreground shadow-lg ring-2 ring-primary/20 transition-transform active:scale-95"
  >
    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-extrabold text-amber-950">
      PRO
    </span>
    <span className="text-xl" aria-hidden>✨</span>
  </button>
);

export default AIAssistantFAB;
