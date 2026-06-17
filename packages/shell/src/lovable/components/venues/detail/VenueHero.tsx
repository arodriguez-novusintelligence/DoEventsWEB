import { ChevronLeft } from "lucide-react";
import { Button } from "@lovable/components/ui/button";
import { useNavigate } from "react-router-dom";

interface VenueHeroProps {
  coverImage?: string;
  name: string;
}

const VenueHero = ({ coverImage, name }: VenueHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative h-56 sm:h-72">
      {coverImage ? (
        <img
          src={coverImage}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default VenueHero;
