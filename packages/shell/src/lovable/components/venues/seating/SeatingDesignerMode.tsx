import { useState } from "react";
import { Button } from "@lovable/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@lovable/components/ui/tabs";
import { Plus, Trash2, Eye, Users, Edit2, GlassWater, Bath, DoorOpen, Mic2 } from "lucide-react";
import {
  Floor,
  SeatingCategory,
  SeatingElement,
  CATEGORY_COLORS,
} from "./types";
import SeatingCategoryDialog from "./SeatingCategoryDialog";
import SeatingElementDialog from "./SeatingElementDialog";

// Demo data for published event simulation
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
    position: { x: 95, y: 100 },
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
    position: { x: 20, y: 220 },
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
    position: { x: 200, y: 220 },
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
    position: { x: 20, y: 340 },
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
    size: { width: 200, height: 70 },
  },
  {
    id: "bar",
    type: "bar",
    name: "Bar",
    shape: "rectangular",
    color: "#06B6D4",
    description: "Bar con bebidas y snacks",
    position: { x: 200, y: 340 },
    size: { width: 80, height: 60 },
  },
  {
    id: "banos",
    type: "bathroom",
    name: "Baños",
    shape: "rectangular",
    color: "#64748B",
    description: "Servicios sanitarios",
    position: { x: 290, y: 340 },
    size: { width: 60, height: 60 },
  },
  {
    id: "puerta",
    type: "door",
    name: "Entrada",
    shape: "rectangular",
    color: "#059669",
    description: "Puerta de acceso principal",
    position: { x: 145, y: 380 },
    size: { width: 50, height: 30 },
  },
];

interface SeatingDesignerModeProps {
  demoMode?: boolean;
}

const SeatingDesignerMode = ({ demoMode = false }: SeatingDesignerModeProps) => {
  const [floors, setFloors] = useState<Floor[]>([
    {
      id: "1",
      name: "Primer piso",
      categories: demoMode ? DEMO_CATEGORIES : [],
      elements: demoMode ? DEMO_ELEMENTS : [],
    },
  ]);
  const [activeFloor, setActiveFloor] = useState("1");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [elementDialogOpen, setElementDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SeatingCategory | null>(null);
  const [editingElement, setEditingElement] = useState<SeatingElement | null>(null);

  const currentFloor = floors.find((f) => f.id === activeFloor);

  const addFloor = () => {
    const newFloor: Floor = {
      id: Date.now().toString(),
      name: `Piso ${floors.length + 1}`,
      categories: [],
      elements: [],
    };
    setFloors([...floors, newFloor]);
    setActiveFloor(newFloor.id);
  };

  const removeFloor = (id: string) => {
    if (floors.length > 1) {
      const newFloors = floors.filter((f) => f.id !== id);
      setFloors(newFloors);
      if (activeFloor === id) {
        setActiveFloor(newFloors[0].id);
      }
    }
  };

  const handleSaveCategory = (category: SeatingCategory, targetFloorId: string) => {
    setFloors((prev) => prev.map((floor) => {
      if (floor.id === targetFloorId) {
        const existingIndex = floor.categories.findIndex((c) => c.id === category.id);
        if (existingIndex >= 0) {
          const next = [...floor.categories];
          next[existingIndex] = category;
          return { ...floor, categories: next };
        }
        return { ...floor, categories: [...floor.categories, category] };
      }
      if (floor.categories.some((c) => c.id === category.id)) {
        return { ...floor, categories: floor.categories.filter((c) => c.id !== category.id) };
      }
      return floor;
    }));
    setActiveFloor(targetFloorId);
    setEditingCategory(null);
  };

  const handleSaveElement = (element: SeatingElement) => {
    setFloors(
      floors.map((floor) => {
        if (floor.id === activeFloor) {
          const existingIndex = floor.elements.findIndex((e) => e.id === element.id);
          if (existingIndex >= 0) {
            const newElements = [...floor.elements];
            newElements[existingIndex] = element;
            return { ...floor, elements: newElements };
          }
          return { ...floor, elements: [...floor.elements, element] };
        }
        return floor;
      })
    );
    setEditingElement(null);
  };

  const removeCategory = (categoryId: string) => {
    setFloors(
      floors.map((floor) => {
        if (floor.id === activeFloor) {
          return {
            ...floor,
            categories: floor.categories.filter((c) => c.id !== categoryId),
          };
        }
        return floor;
      })
    );
  };

  const removeElement = (elementId: string) => {
    setFloors(
      floors.map((floor) => {
        if (floor.id === activeFloor) {
          return {
            ...floor,
            elements: floor.elements.filter((e) => e.id !== elementId),
          };
        }
        return floor;
      })
    );
  };

  const getElementIcon = (type: SeatingElement["type"]) => {
    switch (type) {
      case "bar":
        return <GlassWater className="w-5 h-5" />;
      case "bathroom":
        return <Bath className="w-5 h-5" />;
      case "door":
        return <DoorOpen className="w-5 h-5" />;
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
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Diseña el mapa de silletería de forma visual
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Previsualizar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingElement(null);
              setElementDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Elemento
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setCategoryDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Categoría
          </Button>
        </div>
      </div>

      {/* Floor tabs */}
      <div className="flex items-center justify-between border rounded-lg p-2 bg-background">
        <Tabs value={activeFloor} onValueChange={setActiveFloor}>
          <TabsList>
            {floors.map((floor) => (
              <TabsTrigger key={floor.id} value={floor.id} className="relative">
                {floor.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {floors.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeFloor(activeFloor)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={addFloor}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Piso
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="border rounded-xl bg-secondary/10 min-h-[400px] p-4 relative overflow-hidden">
        {/* Elements */}
        {currentFloor?.elements.map((element) => (
          <div
            key={element.id}
            className={`absolute border-2 flex flex-col items-center justify-center cursor-move transition-shadow hover:shadow-lg group ${
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
            <div style={{ color: element.color }}>
              {getElementIcon(element.type)}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: element.color }}
            >
              {element.name}
            </span>
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setEditingElement(element);
                  setElementDialogOpen(true);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeElement(element.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* Categories */}
        {currentFloor?.categories.map((category) => (
          <div
            key={category.id}
            className="absolute border-2 rounded-lg p-3 cursor-move transition-shadow hover:shadow-lg group bg-background"
            style={{
              left: category.position.x,
              top: category.position.y,
              borderColor: category.color,
              minWidth: 150,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: category.color }} />
                <span className="font-semibold">{category.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  setEditingCategory(category);
                  setCategoryDialogOpen(true);
                }}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Asientos</p>
            <p className="text-sm font-medium">
              {category.rows}x{category.seatsPerRow} sillas
            </p>
            <p className="text-sm text-muted-foreground">
              {category.rows * category.seatsPerRow} asientos
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => removeCategory(category.id)}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        ))}

        {/* Empty state */}
        {currentFloor?.elements.length === 0 && currentFloor?.categories.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Comienza agregando elementos y categorías</p>
              <p className="text-sm">Usa los botones de arriba para diseñar tu espacio</p>
            </div>
          </div>
        )}
      </div>

      {/* Categories list */}
      {currentFloor && currentFloor.categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentFloor.categories.map((category) => (
            <div
              key={category.id}
              className="border rounded-lg p-4 bg-background"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-semibold">{category.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tipo: {category.distributionType === "standard" ? "Asientos Estándar" : category.distributionType}
              </p>
              <p className="text-sm text-muted-foreground">
                Configuración: {category.rows} filas x {category.seatsPerRow} sillas
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm">
                  Total: {category.rows * category.seatsPerRow} sillas
                </p>
                <p className="font-semibold">{formatPrice(category.price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <SeatingCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSave={handleSaveCategory}
        editCategory={editingCategory}
        floors={floors.map((f) => ({ id: f.id, name: f.name }))}
        currentFloorId={activeFloor}
      />
      <SeatingElementDialog
        open={elementDialogOpen}
        onOpenChange={setElementDialogOpen}
        onSave={handleSaveElement}
        editElement={editingElement}
      />
    </div>
  );
};

export default SeatingDesignerMode;
