export type CategoryId = "tradicionais" | "especiais" | "porcoes" | "bebidas";
export type SizeId = "media" | "gigante";
export type IngredientId =
  | "batata"
  | "strogonoff"
  | "frango"
  | "catupiry"
  | "cheddar"
  | "bacon"
  | "mussarela"
  | "palha"
  | "embalagem";

export type Recipe = Partial<Record<IngredientId, number>>;

export interface Product {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  /** Preço base (Média 500g, ou preço único quando não há tamanhos). */
  price: number;
  /** Preço do Batatão Gigante (800g). Se ausente, produto sem tamanhos. */
  priceGigante?: number;
  badges: Badge[];
  tags: string[];
  emoji: string;
  /** Ilustração vetorial do produto. */
  art: DishArtSpec;
  /** Gradiente do card (classes Tailwind). */
  tint: string;
  allowsExtras: boolean;
  recipe: Recipe;
  /** Receita para tamanho gigante (quando houver). */
  recipeGigante?: Recipe;
  featured?: boolean;
}

export type Badge = "Mais Pedido" | "Novo" | "Serve 2 pessoas" | "Especial da Casa";

export interface Extra {
  id: string;
  name: string;
  price: number;
  ingredient: IngredientId;
  amount: number;
}

export interface CartItem {
  uid: string;
  productId: string;
  name: string;
  emoji: string;
  size?: SizeId;
  extras: string[];
  notes: string;
  qty: number;
  unitPrice: number;
}

export type OrderStatus = "novo" | "preparo" | "entrega" | "concluido";
export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export interface Neighborhood {
  id: string;
  name: string;
  hint: string;
  fee: number;
  eta: string;
  pickup?: boolean;
}

export interface Order {
  id: number;
  createdAt: number;
  updatedAt: number;
  customer: { name: string; phone: string; address: string };
  neighborhoodId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: PaymentMethod;
  changeFor?: number;
  status: OrderStatus;
  stockDeducted: boolean;
}

export interface Ingredient {
  id: IngredientId;
  name: string;
  unit: "kg" | "pct" | "un";
  qty: number;
  min: number;
  max: number;
  step: number;
}

export interface CashEntry {
  id: string;
  type: "reforco" | "sangria";
  description: string;
  amount: number;
  at: number;
}

export interface SharedState {
  version: number;
  nextOrderId: number;
  orders: Order[];
  stock: Ingredient[];
  cash: CashEntry[];
  openingFloat: number;
}

export interface ClientState {
  cart: CartItem[];
  neighborhoodId: string | null;
  trackedOrderId: number | null;
  customer: { name: string; phone: string; address: string };
}

export type Topping = "carne" | "frango" | "bacon" | "ervas" | "palha" | "queijo";

export type DishArtSpec =
  | { kind: "batatao"; sauce: string; sauce2?: string; toppings: Topping[] }
  | { kind: "porcao"; sauce?: string; toppings: Topping[] }
  | { kind: "pote" }
  | { kind: "lata"; color: string; label: string }
  | { kind: "garrafa"; color: string; liquid: string; label: string };
