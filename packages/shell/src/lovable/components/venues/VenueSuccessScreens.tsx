import { Save, Megaphone, Share2 } from "lucide-react";
import { Button } from "@lovable/components/ui/button";
import { toast } from "@lovable/components/ui/sonner";

interface BaseProps {
  onCreateAnother: () => void;
  onGoToWall: () => void;
  onFinish: () => void;
}

export const VenueDraftSavedScreen = ({ onCreateAnother, onGoToWall }: BaseProps) => (
  <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
    <div className="w-full max-w-md bg-card rounded-3xl shadow-sm p-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Save className="h-10 w-10 text-primary" strokeWidth={2} />
        </div>
      </div>
      <h1 className="text-2xl font-extrabold text-foreground leading-tight">
        ¡Tu lugar para eventos se ha guardado con éxito!
      </h1>
      <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
        Solo cuando publiques el lugar, este se mostrará en el <strong className="text-foreground">wall</strong>.
      </p>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        Para publicar tu sitio, accede a <strong className="text-foreground">"Mi perfil"</strong> y luego selecciona <strong className="text-foreground">"Mis lugares de eventos"</strong>.
      </p>
      <div className="mt-8 space-y-3">
        <Button variant="outline" className="w-full rounded-full h-12 border-primary text-primary" onClick={onCreateAnother}>
          Crear otro lugar
        </Button>
        <Button className="w-full rounded-full h-12" onClick={onGoToWall}>
          Ir al wall
        </Button>
      </div>
    </div>
  </div>
);

interface PublishedProps extends BaseProps {
  venueLink: string;
  onRegisterBank: () => void;
}

export const VenuePublishedScreen = ({ venueLink, onRegisterBank, onFinish }: PublishedProps) => {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mi lugar para eventos", url: venueLink });
      } else {
        await navigator.clipboard.writeText(venueLink);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-3xl shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <Megaphone className="h-14 w-14 text-emerald-500" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground leading-tight">
            ¡Felicitaciones tu lugar para eventos se ha publicado!
          </h1>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
            ¡Ahora puedes dar a conocer tu lugar para eventos en tus redes sociales!
          </p>

          <div className="mt-6 rounded-2xl bg-secondary/60 border border-border p-4 text-left">
            <p className="text-sm font-semibold text-foreground">Enlace del lugar :</p>
            <p className="mt-1 text-sm text-muted-foreground break-all">{venueLink}</p>
            <button
              type="button"
              onClick={handleShare}
              className="mt-3 ml-auto flex items-center gap-1.5 text-primary font-semibold text-sm"
            >
              Compartir link
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-4 max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={onRegisterBank}
          className="block w-full text-center text-primary font-semibold underline underline-offset-4"
        >
          Registrar mis datos bancarios
        </button>
        <Button className="w-full rounded-full h-12" onClick={onFinish}>
          Finalizar
        </Button>
      </div>
    </div>
  );
};
