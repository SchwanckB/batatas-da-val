import { CakeSlice, Beef, CupSoda, Crown, Drumstick, Flame, Layers, Pizza, Salad, Sandwich, Star, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { SectionIcon } from "@/lib/types";

export const SECTION_ICONS: Record<SectionIcon, { Icon: LucideIcon; label: string }> = {
  flame: { Icon: Flame, label: "Chama" },
  crown: { Icon: Crown, label: "Coroa" },
  layers: { Icon: Layers, label: "Torre" },
  sandwich: { Icon: Sandwich, label: "Lanche" },
  beef: { Icon: Beef, label: "Carne" },
  utensils: { Icon: UtensilsCrossed, label: "Talheres" },
  soda: { Icon: CupSoda, label: "Bebida" },
  pizza: { Icon: Pizza, label: "Pizza" },
  drumstick: { Icon: Drumstick, label: "Frango" },
  salad: { Icon: Salad, label: "Salada" },
  dessert: { Icon: CakeSlice, label: "Sobremesa" },
  star: { Icon: Star, label: "Destaque" },
};
