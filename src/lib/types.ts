/** Id de uma seção do cardápio (criada/gerenciada no painel). */
export type CategoryId = string;

export type SectionIcon =
  | "flame" | "crown" | "utensils" | "soda" | "sandwich" | "beef" | "layers"
  | "pizza" | "drumstick" | "salad" | "dessert" | "star";

export interface Section {
  id: string;
  name: string;
  icon: SectionIcon;
  /** Só aparece para os clientes quando marcada no painel. */
  active: boolean;
  order: number;
}

export type TintKey = "gold" | "red" | "cream" | "bev" | "green";
export type SizeId = "media" | "gigante";
/** Insumos são cadastráveis no painel, então o id é livre. */
export type IngredientId = string;

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
  /** Ilustração vetorial do produto (usada quando não há foto). */
  art: DishArtSpec;
  /** Foto opcional (data URL ou URL pública). */
  image?: string;
  /** Cor de fundo da vitrine. */
  tint: TintKey;
  /** Disponível para venda (false = "Esgotado"). */
  available: boolean;
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
  active: boolean;
}

export interface CartItem {
  uid: string;
  productId: string;
  name: string;
  size?: SizeId;
  extras: string[];
  notes: string;
  qty: number;
  unitPrice: number;
}

export type OrderStatus = "novo" | "preparo" | "entrega" | "concluido" | "cancelado";
export type PaymentMethod = "pix" | "cartao" | "dinheiro";

export interface Neighborhood {
  id: string;
  name: string;
  hint: string;
  fee: number;
  /** Minutos estimados de entrega (mín/máx). */
  etaMin: number;
  etaMax: number;
  pickup?: boolean;
  active: boolean;
  order: number;
}

export interface OrderRating {
  stars: number;
  comment: string;
  at: number;
}

export interface Order {
  id: number;
  /** Chave pública para acompanhar o pedido por link (nunca o id sequencial). */
  token: string;
  createdAt: number;
  updatedAt: number;
  customer: { name: string; phone: string; address: string };
  neighborhoodId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  payment: PaymentMethod;
  changeFor?: number;
  status: OrderStatus;
  stockDeducted: boolean;
  cancelReason?: string;
  rating?: OrderRating;
  /** Momento em que cada status foi atingido. */
  history: { status: OrderStatus; at: number }[];
}

export interface Ingredient {
  id: IngredientId;
  name: string;
  unit: "kg" | "pct" | "un" | "l";
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
  by?: string;
}

/** Turno de caixa: abertura com fundo de troco e fechamento com conferência. */
export interface CashShift {
  id: string;
  openedAt: number;
  openedBy: string;
  openingFloat: number;
  closedAt?: number;
  closedBy?: string;
  /** Valor contado na gaveta no fechamento. */
  counted?: number;
  note?: string;
}

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayHours {
  open: boolean;
  /** "19:30" */
  from: string;
  /** "23:30" — depois da meia-noite use "00:30". */
  to: string;
}

/** Faixa de aviso na tela inicial do cliente, escrita no painel. */
export interface Notice {
  id: string;
  text: string;
  tone: "info" | "aviso" | "promo";
  active: boolean;
}

export interface StoreSettings {
  name: string;
  slogan: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  /** Chave Pix (telefone, e-mail, CPF/CNPJ ou aleatória). */
  pixKey: string;
  /** Nome do recebedor no Pix (até 25 caracteres). */
  pixName: string;
  pixCity: string;
  hours: Record<Weekday, DayHours>;
  /** Pedidos pausados manualmente (loja cheia, falta de insumo…). */
  paused: boolean;
  pausedMessage: string;
  minOrder: number;
  prepMinutes: number;
  /** Avisos exibidos no topo do cardápio (alta demanda, feriado, promoção…). */
  notices: Notice[];
}

export type CouponKind = "fixo" | "percent";

export interface Coupon {
  id: string;
  code: string;
  kind: CouponKind;
  /** Reais (fixo) ou porcentagem (percent). */
  value: number;
  minOrder: number;
  maxUses: number;
  uses: number;
  /** Timestamp de validade (null = sem prazo). */
  expiresAt: number | null;
  active: boolean;
}

export type Role = "dono" | "cozinha" | "caixa";

export interface User {
  id: string;
  name: string;
  login: string;
  role: Role;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  summary: string;
}

export interface SharedState {
  version: number;
  nextOrderId: number;
  orders: Order[];
  stock: Ingredient[];
  cash: CashEntry[];
  shifts: CashShift[];
  sections: Section[];
  products: Product[];
  extras: Extra[];
  neighborhoods: Neighborhood[];
  coupons: Coupon[];
  settings: StoreSettings;
  users: User[];
  audit: AuditEntry[];
}

/** Estado visível ao cliente: cardápio, entrega e configurações públicas. */
export interface PublicState {
  rev: number;
  sections: Section[];
  products: Product[];
  extras: Extra[];
  neighborhoods: Neighborhood[];
  settings: Omit<StoreSettings, "pixKey" | "pixName" | "pixCity">;
}

export interface ClientState {
  cart: CartItem[];
  neighborhoodId: string | null;
  /** Tokens dos pedidos feitos neste aparelho (mais recente primeiro). */
  orderTokens: string[];
  customer: { name: string; phone: string; address: string };
  couponCode: string;
}

export type Topping = "carne" | "frango" | "bacon" | "ervas" | "palha" | "queijo";

export type DishArtSpec =
  | { kind: "batatao"; sauce: string; sauce2?: string; toppings: Topping[] }
  | { kind: "porcao"; sauce?: string; toppings: Topping[] }
  | { kind: "pote" }
  | { kind: "lanche"; style: "xis" | "burger"; cheese?: boolean; bacon?: boolean; egg?: boolean }
  | { kind: "torre"; sauce?: string; toppings: Topping[] }
  | { kind: "lata"; color: string; label: string }
  | { kind: "garrafa"; color: string; liquid: string; label: string };
