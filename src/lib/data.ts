import type {
  CartItem,
  CategoryId,
  Extra,
  Ingredient,
  Neighborhood,
  Order,
  Product,
  SharedState,
  SizeId,
} from "./types";

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: "tradicionais", label: "Batatões Tradicionais", short: "Tradicionais" },
  { id: "especiais", label: "Batatões Especiais", short: "Especiais" },
  { id: "porcoes", label: "Porções & Extras", short: "Porções" },
  { id: "bebidas", label: "Bebidas", short: "Bebidas" },
];

export const SIZES: { id: SizeId; label: string; weight: string }[] = [
  { id: "media", label: "Média", weight: "500g" },
  { id: "gigante", label: "Batatão Gigante", weight: "800g" },
];

export const EXTRAS: Extra[] = [
  { id: "bacon", name: "Bacon Crocante", price: 6, ingredient: "bacon", amount: 0.08 },
  { id: "cheddar", name: "Cheddar Cremoso", price: 5, ingredient: "cheddar", amount: 0.08 },
  { id: "catupiry", name: "Catupiry Original", price: 5, ingredient: "catupiry", amount: 0.08 },
  { id: "palha", name: "Batata Palha Extra", price: 3, ingredient: "palha", amount: 0.25 },
  { id: "mussarela", name: "Queijo Mussarela", price: 5, ingredient: "mussarela", amount: 0.08 },
];

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: "centro", name: "Centro", hint: "Três Cachoeiras", fee: 5, eta: "30–40 min" },
  { id: "proximos", name: "Bairros próximos", hint: "Até 3 km do centro", fee: 7, eta: "35–50 min" },
  { id: "interior", name: "Interior / Outros", hint: "Localidades do interior", fee: 10, eta: "45–60 min" },
  { id: "retirada", name: "Retirada no local", hint: "Busque quentinho!", fee: 0, eta: "20–25 min", pickup: true },
];

const T = {
  gold: "from-amber-500/30 via-orange-600/20 to-transparent",
  red: "from-rose-600/30 via-red-700/20 to-transparent",
  cream: "from-yellow-200/25 via-amber-500/15 to-transparent",
  bev: "from-sky-500/20 via-rose-500/15 to-transparent",
};

export const PRODUCTS: Product[] = [
  // Tradicionais
  {
    id: "strogonoff",
    name: "Batatão de Strogonoff de Carne",
    description:
      "Batata frita sequinha coberta com strogonoff de carne cremoso, requeijão derretido e chuva de batata palha.",
    category: "tradicionais",
    price: 32,
    priceGigante: 44,
    badges: ["Mais Pedido"],
    tags: ["carne", "strogonoff", "requeijão", "batata palha"],
    emoji: "🥩",
    art: { kind: "batatao", sauce: "#C98A54", sauce2: "#F3E3C3", toppings: ["carne", "palha", "ervas"] },
    tint: T.gold,
    allowsExtras: true,
    featured: true,
    recipe: { batata: 0.3, strogonoff: 0.2, catupiry: 0.05, palha: 0.15, embalagem: 1 },
    recipeGigante: { batata: 0.5, strogonoff: 0.3, catupiry: 0.08, palha: 0.25, embalagem: 1 },
  },
  {
    id: "frango-catupiry",
    name: "Batatão de Frango com Catupiry",
    description:
      "Frango desfiado temperadinho, Catupiry original e mussarela gratinada sobre batatas crocantes.",
    category: "tradicionais",
    price: 30,
    priceGigante: 42,
    badges: ["Mais Pedido"],
    tags: ["frango", "catupiry", "mussarela"],
    emoji: "🍗",
    art: { kind: "batatao", sauce: "#F4E6C8", sauce2: "#F7D774", toppings: ["frango", "ervas"] },
    tint: T.cream,
    allowsExtras: true,
    featured: true,
    recipe: { batata: 0.3, frango: 0.2, catupiry: 0.08, mussarela: 0.05, embalagem: 1 },
    recipeGigante: { batata: 0.5, frango: 0.3, catupiry: 0.12, mussarela: 0.08, embalagem: 1 },
  },
  {
    id: "cheddar-bacon",
    name: "Batatão Cheddar & Bacon",
    description:
      "O clássico que não erra: cheddar cremoso escorrendo e bacon em cubos bem crocante.",
    category: "tradicionais",
    price: 31,
    priceGigante: 43,
    badges: [],
    tags: ["cheddar", "bacon"],
    emoji: "🥓",
    art: { kind: "batatao", sauce: "#F59E0B", toppings: ["bacon", "ervas"] },
    tint: T.red,
    allowsExtras: true,
    recipe: { batata: 0.3, cheddar: 0.1, bacon: 0.08, embalagem: 1 },
    recipeGigante: { batata: 0.5, cheddar: 0.15, bacon: 0.12, embalagem: 1 },
  },
  // Especiais
  {
    id: "da-val",
    name: "Batatão da Val",
    description:
      "O especial da casa: strogonoff de carne + frango desfiado, cheddar, Catupiry, bacon crocante e batata palha. Crocante por fora, cremoso por dentro!",
    category: "especiais",
    price: 39,
    priceGigante: 54,
    badges: ["Especial da Casa", "Serve 2 pessoas"],
    tags: ["strogonoff", "frango", "cheddar", "catupiry", "bacon", "batata palha", "carne"],
    emoji: "👑",
    art: { kind: "batatao", sauce: "#F4E6C8", sauce2: "#F59E0B", toppings: ["carne", "frango", "bacon", "palha", "ervas"] },
    tint: T.gold,
    allowsExtras: true,
    featured: true,
    recipe: { batata: 0.35, strogonoff: 0.12, frango: 0.12, cheddar: 0.06, catupiry: 0.06, bacon: 0.06, palha: 0.15, embalagem: 1 },
    recipeGigante: { batata: 0.55, strogonoff: 0.2, frango: 0.2, cheddar: 0.1, catupiry: 0.1, bacon: 0.1, palha: 0.25, embalagem: 1 },
  },
  {
    id: "quatro-queijos",
    name: "Batatão Quatro Queijos",
    description:
      "Mussarela, Catupiry, cheddar cremoso e requeijão gratinados. Um abraço quente em forma de batata.",
    category: "especiais",
    price: 36,
    priceGigante: 49,
    badges: ["Novo"],
    tags: ["queijo", "mussarela", "catupiry", "cheddar", "requeijão"],
    emoji: "🧀",
    art: { kind: "batatao", sauce: "#FBE7A1", sauce2: "#F59E0B", toppings: ["queijo", "ervas"] },
    tint: T.cream,
    allowsExtras: true,
    featured: true,
    recipe: { batata: 0.3, mussarela: 0.08, catupiry: 0.08, cheddar: 0.08, embalagem: 1 },
    recipeGigante: { batata: 0.5, mussarela: 0.12, catupiry: 0.12, cheddar: 0.12, embalagem: 1 },
  },
  {
    id: "frango-bacon",
    name: "Batatão Frango Cremoso com Bacon",
    description:
      "Frango desfiado no creme de Catupiry, bacon crocante, cheddar e finalização com batata palha.",
    category: "especiais",
    price: 37,
    priceGigante: 50,
    badges: ["Novo"],
    tags: ["frango", "bacon", "catupiry", "cheddar", "batata palha"],
    emoji: "🔥",
    art: { kind: "batatao", sauce: "#F4E6C8", sauce2: "#F59E0B", toppings: ["frango", "bacon", "palha"] },
    tint: T.red,
    allowsExtras: true,
    recipe: { batata: 0.3, frango: 0.18, catupiry: 0.06, bacon: 0.06, cheddar: 0.05, palha: 0.1, embalagem: 1 },
    recipeGigante: { batata: 0.5, frango: 0.28, catupiry: 0.1, bacon: 0.1, cheddar: 0.08, palha: 0.2, embalagem: 1 },
  },
  // Porções
  {
    id: "porcao-frita",
    name: "Porção de Batata Frita (500g)",
    description: "Batata frita dourada, sequinha e salgada no ponto. Acompanha maionese da casa.",
    category: "porcoes",
    price: 22,
    badges: ["Serve 2 pessoas"],
    tags: ["batata frita", "porção", "maionese"],
    emoji: "🍟",
    art: { kind: "porcao", toppings: [] },
    tint: T.gold,
    allowsExtras: true,
    recipe: { batata: 0.5, embalagem: 1 },
  },
  {
    id: "porcao-cheddar-bacon",
    name: "Fritas com Cheddar & Bacon",
    description: "Porção de 500g de fritas com cheddar cremoso e bacon crocante por cima.",
    category: "porcoes",
    price: 29,
    badges: ["Serve 2 pessoas", "Mais Pedido"],
    tags: ["cheddar", "bacon", "porção"],
    emoji: "🧆",
    art: { kind: "porcao", sauce: "#F59E0B", toppings: ["bacon"] },
    tint: T.red,
    allowsExtras: true,
    recipe: { batata: 0.5, cheddar: 0.1, bacon: 0.08, embalagem: 1 },
  },
  {
    id: "molho-casa",
    name: "Pote de Maionese da Casa",
    description: "Maionese temperada artesanal da Val (100ml). Viciante!",
    category: "porcoes",
    price: 4,
    badges: [],
    tags: ["maionese", "molho", "extra"],
    emoji: "🥫",
    art: { kind: "pote" },
    tint: T.cream,
    allowsExtras: false,
    recipe: {},
  },
  // Bebidas
  {
    id: "coca-lata",
    name: "Coca-Cola Lata 350ml",
    description: "Bem gelada, do jeito que a batata pede.",
    category: "bebidas",
    price: 6.5,
    badges: [],
    tags: ["refrigerante", "coca"],
    emoji: "🥤",
    art: { kind: "lata", color: "#DC2626", label: "COLA" },
    tint: T.bev,
    allowsExtras: false,
    recipe: {},
  },
  {
    id: "coca-2l",
    name: "Coca-Cola 2 Litros",
    description: "Para dividir com a galera.",
    category: "bebidas",
    price: 15,
    badges: ["Serve 2 pessoas"],
    tags: ["refrigerante", "coca"],
    emoji: "🍾",
    art: { kind: "garrafa", color: "#DC2626", liquid: "#2B0F08", label: "COLA" },
    tint: T.bev,
    allowsExtras: false,
    recipe: {},
  },
  {
    id: "guarana-2l",
    name: "Guaraná Antarctica 2 Litros",
    description: "O sabor original do Brasil, geladíssimo.",
    category: "bebidas",
    price: 13,
    badges: [],
    tags: ["refrigerante", "guaraná"],
    emoji: "🧃",
    art: { kind: "garrafa", color: "#15803D", liquid: "#7A2E0E", label: "GUARANÁ" },
    tint: T.bev,
    allowsExtras: false,
    recipe: {},
  },
  {
    id: "agua",
    name: "Água Mineral 500ml",
    description: "Com ou sem gás.",
    category: "bebidas",
    price: 4,
    badges: [],
    tags: ["água"],
    emoji: "💧",
    art: { kind: "garrafa", color: "#0EA5E9", liquid: "#BAE6FD", label: "ÁGUA" },
    tint: T.bev,
    allowsExtras: false,
    recipe: {},
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const extraById = (id: string) => EXTRAS.find((e) => e.id === id);
export const neighborhoodById = (id: string | null) => NEIGHBORHOODS.find((n) => n.id === id);

export const unitPriceFor = (p: Product, size: SizeId | undefined, extras: string[]) =>
  (size === "gigante" && p.priceGigante ? p.priceGigante : p.price) +
  extras.reduce((s, id) => s + (extraById(id)?.price ?? 0), 0);

export const INITIAL_STOCK: Ingredient[] = [
  { id: "batata", name: "Batata Inglesa", unit: "kg", qty: 38, min: 10, max: 50, step: 1 },
  { id: "strogonoff", name: "Strogonoff de Carne", unit: "kg", qty: 7.5, min: 2, max: 10, step: 0.5 },
  { id: "frango", name: "Frango Desfiado", unit: "kg", qty: 6.5, min: 2, max: 10, step: 0.5 },
  { id: "catupiry", name: "Requeijão / Catupiry", unit: "kg", qty: 4.5, min: 1.5, max: 6, step: 0.5 },
  { id: "cheddar", name: "Cheddar Cremoso", unit: "kg", qty: 2.4, min: 1.5, max: 6, step: 0.5 },
  { id: "bacon", name: "Bacon em Cubos", unit: "kg", qty: 0.7, min: 1, max: 5, step: 0.5 },
  { id: "mussarela", name: "Queijo Mussarela", unit: "kg", qty: 4.5, min: 1.5, max: 6, step: 0.5 },
  { id: "palha", name: "Batata Palha", unit: "pct", qty: 5, min: 4, max: 20, step: 1 },
  { id: "embalagem", name: "Embalagens Térmicas", unit: "un", qty: 160, min: 40, max: 200, step: 10 },
];

export type StockLevel = "ok" | "atencao" | "critico";
export const stockLevel = (i: Ingredient): StockLevel =>
  i.qty < i.min ? "critico" : i.qty < i.min * 2 ? "atencao" : "ok";

function item(productId: string, qty: number, size?: SizeId, extras: string[] = [], notes = ""): CartItem {
  const p = productById(productId)!;
  return {
    uid: `${productId}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    name: p.name,
    emoji: p.emoji,
    size: p.priceGigante ? size ?? "media" : undefined,
    extras,
    notes,
    qty,
    unitPrice: unitPriceFor(p, size, extras),
  };
}

function order(
  id: number,
  minutesAgo: number,
  customer: Order["customer"],
  neighborhoodId: string,
  items: CartItem[],
  payment: Order["payment"],
  status: Order["status"],
  changeFor?: number,
): Order {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const deliveryFee = neighborhoodById(neighborhoodId)?.fee ?? 0;
  const t = Date.now() - minutesAgo * 60000;
  return {
    id,
    createdAt: t,
    updatedAt: t,
    customer,
    neighborhoodId,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    payment,
    changeFor,
    status,
    stockDeducted: status !== "novo",
  };
}

export const STATE_VERSION = 1;

export function createSeed(): SharedState {
  return {
    version: STATE_VERSION,
    nextOrderId: 1046,
    openingFloat: 100,
    stock: INITIAL_STOCK.map((i) => ({ ...i })),
    cash: [],
    orders: [
      order(
        1042,
        52,
        { name: "Juliana Mainardi", phone: "(51) 99812-4410", address: "Rua Osvaldo Bastos, 215 — casa amarela" },
        "centro",
        [item("da-val", 1, "gigante", ["bacon"]), item("coca-2l", 1)],
        "pix",
        "concluido",
      ),
      order(
        1043,
        21,
        { name: "Rafael Boeira", phone: "(51) 99654-1201", address: "Estrada Geral, km 4 — portão verde" },
        "interior",
        [item("strogonoff", 2, "media", [], "Sem batata palha em um deles"), item("guarana-2l", 1)],
        "dinheiro",
        "preparo",
        100,
      ),
      order(
        1044,
        7,
        { name: "Camila Scheffer", phone: "(51) 99723-0087", address: "Av. Getúlio Vargas, 1180 — ap 203" },
        "proximos",
        [item("frango-catupiry", 1, "gigante", ["cheddar", "palha"], "Caprichar no molho, por favor!"), item("coca-lata", 2)],
        "cartao",
        "novo",
      ),
      order(
        1045,
        2,
        { name: "Marcos Tedesco", phone: "(51) 99540-3366", address: "" },
        "retirada",
        [item("quatro-queijos", 1, "media", [], "Sem cebola"), item("porcao-cheddar-bacon", 1)],
        "pix",
        "novo",
      ),
    ],
  };
}

/** Insumos consumidos por um pedido (receita × quantidade + adicionais). */
export function orderConsumption(o: Order) {
  const use: Partial<Record<Ingredient["id"], number>> = {};
  const add = (id: Ingredient["id"], v: number) => (use[id] = (use[id] ?? 0) + v);
  for (const it of o.items) {
    const p = productById(it.productId);
    if (!p) continue;
    const recipe = it.size === "gigante" && p.recipeGigante ? p.recipeGigante : p.recipe;
    for (const [k, v] of Object.entries(recipe)) add(k as Ingredient["id"], (v ?? 0) * it.qty);
    for (const ex of it.extras) {
      const e = extraById(ex);
      if (e) add(e.ingredient, e.amount * it.qty);
    }
  }
  return use;
}
