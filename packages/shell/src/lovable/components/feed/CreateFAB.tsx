import { Sparkles, MapPin, FileText, Briefcase } from 'lucide-react';

interface CreateFABProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePost?: () => void;
  onCreateEvent?: () => void;
  onCreateService?: () => void;
  onPublishSite?: () => void;
}

const CreateFAB = ({ open, onOpenChange, onCreatePost, onCreateEvent, onCreateService, onPublishSite }: CreateFABProps) => {
  const options = [
    { label: 'Crear evento', icon: Sparkles, action: () => { onOpenChange(false); onCreateEvent?.(); } },
    { label: 'Ofrecer servicio', icon: Briefcase, action: () => { onOpenChange(false); onCreateService?.(); } },
    { label: 'Publicar Lugar', icon: MapPin, action: () => { onOpenChange(false); onPublishSite?.(); } },
    { label: 'Agregar publicación', icon: FileText, action: () => { onOpenChange(false); onCreatePost?.(); } },
  ];

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed bottom-28 right-4 z-50 flex flex-col items-end gap-3">
        {options.map((option, i) => (
          <button
            key={option.label}
            className="flex animate-fade-in-up items-center gap-3 rounded-full border border-border/60 bg-card/95 py-2.5 pl-5 pr-3 shadow-xl backdrop-blur-md transition-transform hover:scale-105"
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={option.action}
          >
            <span className="text-sm font-semibold text-card-foreground">
              {option.label}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-primary/20">
              <option.icon className="h-5 w-5" />
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

export default CreateFAB;
