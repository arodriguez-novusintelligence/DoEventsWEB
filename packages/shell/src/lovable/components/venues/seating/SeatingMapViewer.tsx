import { GlassWater, Bath, DoorOpen, Mic2, Users } from "lucide-react";
import { SeatingCategory, SeatingElement } from "./types";

// Demo data for published event
const DEMO_CATEGORIES: SeatingCategory[] = [
  {
    id: "vip",
    name: "VIP",
    distributionType: "standard",
    shape: "rectangular",
    color: "#EF4444",
    rows: 3,
    seatsPerRow: 10,
    price: 350000,
    currency: "COP",
    description: "Zona VIP con acceso exclusivo al escenario",
    position: { x: 95, y: 90 },
  },
  {
    id: "general",
    name: "General",
    distributionType: "standard",
    shape: "rectangular",
    color: "#3B82F6",
    rows: 8,
    seatsPerRow: 15,
    price: 120000,
    currency: "COP",
    description: "Zona general con buena visibilidad",
    position: { x: 20, y: 180 },
  },
  {
    id: "gradas",
    name: "Gradas",
    distributionType: "bleachers",
    shape: "curved",
    color: "#22C55E",
    rows: 10,
    seatsPerRow: 20,
    price: 80000,
    currency: "COP",
    description: "Graderías con vista panorámica",
    position: { x: 200, y: 180 },
  },
  {
    id: "terraza",
    name: "Terraza",
    distributionType: "tables",
    shape: "rectangular",
    color: "#F97316",
    rows: 4,
    seatsPerRow: 8,
    price: 200000,
    currency: "COP",
    description: "Zona terraza con mesas y servicio a la mesa",
    position: { x: 20, y: 290 },
  },
];

const DEMO_ELEMENTS: SeatingElement[] = [
  {
    id: "escenario",
    type: "stage",
    name: "Escenario",
    shape: "rectangular",
    color: "#8B5CF6",
    description: "Escenario principal",
    position: { x: 70, y: 10 },
    size: { width: 200, height: 60 },
  },
  {
    id: "bar",
    type: "bar",
    name: "Bar",
    shape: "rectangular",
    color: "#06B6D4",
    description: "Bar con bebidas y snacks",
    position: { x: 200, y: 290 },
    size: { width: 70, height: 50 },
  },
  {
    id: "banos",
    type: "bathroom",
    name: "Baños",
    shape: "rectangular",
    color: "#64748B",
    description: "Servicios sanitarios",
    position: { x: 280, y: 290 },
    size: { width: 60, height: 50 },
  },
  {
    id: "puerta",
    type: "door",
    name: "Entrada",
    shape: "rectangular",
    color: "#059669",
    description: "Puerta de acceso principal",
    position: { x: 140, y: 355 },
    size: { width: 60, height: 30 },
  },
];

interface SeatingMapViewerProps {
  selectedCategory?: string | null;
  onCategoryClick?: (categoryName: string) => void;
}

const SeatingMapViewer = ({
  selectedCategory,
  onCategoryClick,
}: SeatingMapViewerProps) => {
  const getElementIcon = (type: SeatingElement["type"]) => {
    switch (type) {
      case "bar":
        return <GlassWater className="w-4 h-4" />;
      case "bathroom":
        return <Bath className="w-4 h-4" />;
      case "door":
        return <DoorOpen className="w-4 h-4" />;
      case "stage":
        return <Mic2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* Canvas area - view only */}
      <div className="border rounded-xl bg-secondary/10 min-h-[400px] relative overflow-hidden">
        {/* Elements (non-interactive) */}
        {DEMO_ELEMENTS.map((element) => (
          <div
            key={element.id}
            className={`absolute border-2 flex flex-col items-center justify-center ${
              element.shape === "circular" ? "rounded-full" : "rounded-lg"
            }`}
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height,
              backgroundColor: `${element.color}20`,
              borderColor: element.color,
            }}
          >
            <div style={{ color: element.color }}>{getElementIcon(element.type)}</div>
            <span
              className="text-xs font-medium mt-1"
              style={{ color: element.color }}
            >
              {element.name}
            </span>
          </div>
        ))}

        {/* Categories (clickable) */}
        {DEMO_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick?.(category.name)}
            className={`absolute border-2 rounded-lg p-2 cursor-pointer transition-all hover:shadow-lg bg-background ${
              selectedCategory === category.name
                ? "ring-2 ring-primary ring-offset-2 scale-105"
                : "hover:scale-102"
            }`}
            style={{
              left: category.position.x,
              top: category.position.y,
              borderColor: category.color,
              minWidth: 140,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3 h-3" style={{ color: category.color }} />
              <span className="font-semibold text-sm">{category.name}</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              {category.rows * category.seatsPerRow} asientos
            </p>
            <p
              className="text-sm font-bold text-left"
              style={{ color: category.color }}
            >
              {formatPrice(category.price)}
            </p>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
        {DEMO_ELEMENTS.map((element) => (
          <div key={element.id} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: element.color }}
            />
            <span>{element.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatingMapViewer;
