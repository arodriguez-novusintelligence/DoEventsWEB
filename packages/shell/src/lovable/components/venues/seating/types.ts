export interface SeatingZone {
  id: string;
  name: string;
  capacity: string;
  color: string;
}

export interface SeatingCategory {
  id: string;
  name: string;
  distributionType: "standard" | "tables" | "standing" | "bleachers";
  shape: "rectangular" | "circular" | "curved";
  color: string;
  rows: number;
  seatsPerRow: number;
  price: number;
  currency: string;
  description: string;
  position: { x: number; y: number };
}

export interface SeatingElement {
  id: string;
  type: "stage" | "bar" | "bathroom" | "door" | "other";
  name: string;
  shape: "rectangular" | "circular";
  color: string;
  description: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Floor {
  id: string;
  name: string;
  categories: SeatingCategory[];
  elements: SeatingElement[];
}

export const ZONE_COLORS = [
  "#8B5CF6", // purple
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export const CATEGORY_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#EC4899", // pink
];

export const ELEMENT_TYPES = [
  { value: "stage", label: "Escenario" },
  { value: "bar", label: "Bar" },
  { value: "bathroom", label: "Baños" },
  { value: "door", label: "Puerta" },
  { value: "other", label: "Otro" },
] as const;

export const DISTRIBUTION_TYPES = [
  { value: "standard", label: "Asientos Estándar" },
  { value: "tables", label: "Mesas" },
  { value: "standing", label: "Zona de pie" },
  { value: "bleachers", label: "Graderías" },
] as const;

export const SHAPE_TYPES = [
  { value: "rectangular", label: "Rectangular" },
  { value: "circular", label: "Circular" },
  { value: "curved", label: "Curva" },
] as const;
