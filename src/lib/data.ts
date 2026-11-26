import type {
  CartItem,
  Coupon,
  Extra,
  Ingredient,
  Neighborhood,
  Order,
  Product,
  Section,
  SharedState,
  SizeId,
  StoreSettings,
  TintKey,
} from "./types";

export const STATE_VERSION = 3;

export const SEED_SETTINGS: StoreSettings = {
  name: "Batatas da Val",
  slogan: "Crocante por fora, cremosa por dentro",
  city: "Três Cachoeiras - RS",
  address: "Três Cachoeiras - RS",
  phone: "(51) 9687-0865",
  whatsapp: "555196870865",
  instagram: "@batatasval",
  pixKey: "51968700865",
  pixName: "Batatas da Val",
  pixCity: "TRES CACHOEIRAS",
  hours: {
    0: { open: true, from: "19:30", to: "23:30" },
    1: { open: false, from: "19:30", to: "23:30" },
    2: { open: false, from: "19:30", to: "23:30" },
    3: { open: true, from: "19:30", to: "23:30" },
    4: { open: true, from: "19:30", to: "23:30" },
    5: { open: true, from: "19:30", to: "00:30" },
    6: { open: true, from: "19:30", to: "00:30" },
  },
  paused: false,
  pausedMessage: "Estamos com muitos pedidos neste momento. Em instantes voltamos a atender.",
  minOrder: 0,
  prepMinutes: 25,
  notices: [
    {
      id: "demanda",
      text: "Sexta e sábado costumam ter mais pedidos. O preparo pode levar um pouco mais.",
      tone: "aviso",
      active: false,
    },
  ],
};

export const SEED_SECTIONS: Section[] = [
  { id: "tradicionais", name: "Batatões Tradicionais", icon: "flame", active: true, order: 0 },
  { id: "especiais", name: "Batatões Especiais", icon: "crown", active: true, order: 1 },
  { id: "torres", name: "Torres de Batata", icon: "layers", active: false, order: 2 },
  { id: "xis", name: "Xis", icon: "sandwich", active: false, order: 3 },
  { id: "hamburgueres", name: "Hambúrgueres", icon: "beef", active: false, order: 4 },
  { id: "porcoes", name: "Porções & Extras", icon: "utensils", active: true, order: 5 },
  { id: "bebidas", name: "Bebidas", icon: "soda", active: true, order: 6 },
];

export const SIZES: { id: SizeId; label: string; short: string; weight: string }[] = [
  { id: "media", label: "Média", short: "Média", weight: "500 g" },
  { id: "gigante", label: "Batatão Gigante", short: "Gigante", weight: "800 g" },
];

export const SEED_EXTRAS: Extra[] = [
  { id: "bacon", name: "Bacon Crocante", price: 6, ingredient: "bacon", amount: 0.08, active: true },
  { id: "cheddar", name: "Cheddar Cremoso", price: 5, ingredient: "cheddar", amount: 0.08, active: true },
  { id: "catupiry", name: "Catupiry Original", price: 5, ingredient: "catupiry", amount: 0.08, active: true },
  { id: "palha", name: "Batata Palha Extra", price: 3, ingredient: "palha", amount: 0.25, active: true },
  { id: "mussarela", name: "Queijo Mussarela", price: 5, ingredient: "mussarela", amount: 0.08, active: true },
];

export const SEED_NEIGHBORHOODS: Neighborhood[] = [
  { id: "centro", name: "Centro", hint: "Três Cachoeiras", fee: 5, etaMin: 30, etaMax: 40, active: true, order: 0 },
  { id: "proximos", name: "Bairros próximos", hint: "Até 3 km do centro", fee: 7, etaMin: 35, etaMax: 50, active: true, order: 1 },
  { id: "interior", name: "Interior", hint: "Localidades do interior e arredores", fee: 10, etaMin: 45, etaMax: 60, active: true, order: 2 },
  { id: "retirada", name: "Retirada no local", hint: "Retire no balcão da loja", fee: 0, etaMin: 20, etaMax: 25, pickup: true, active: true, order: 3 },
];

export const SEED_COUPONS: Coupon[] = [
  { id: "primeira", code: "PRIMEIRA10", kind: "percent", value: 10, minOrder: 30, maxUses: 0, uses: 0, expiresAt: null, active: false },
];

/** Fundos da vitrine de cada produto. */
export const TINTS: Record<TintKey, { label: string; cls: string; swatch: string }> = {
  gold: { label: "Dourado", cls: "from-amber-400/35 to-amber-800/15", swatch: "#F2A200" },
  red: { label: "Brasa", cls: "from-red-500/40 to-red-900/20", swatch: "#D5321F" },
  cream: { label: "Creme", cls: "from-amber-100/35 to-amber-400/10", swatch: "#F6E0A8" },
  bev: { label: "Gelado", cls: "from-sky-400/35 to-sky-800/15", swatch: "#38BDF8" },
  green: { label: "Fresco", cls: "from-lime-400/35 to-emerald-800/15", swatch: "#84CC16" },
};

export const SEED_PRODUCTS: Product[] = [
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
    art: { kind: "batatao", sauce: "#C98A54", sauce2: "#F3E3C3", toppings: ["carne", "palha", "ervas"] },
    tint: "gold",
    available: true,
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
    art: { kind: "batatao", sauce: "#F4E6C8", sauce2: "#F7D774", toppings: ["frango", "ervas"] },
    tint: "cream",
    available: true,
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
    art: { kind: "batatao", sauce: "#F59E0B", toppings: ["bacon", "ervas"] },
    tint: "red",
    available: true,
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
    art: { kind: "batatao", sauce: "#F4E6C8", sauce2: "#F59E0B", toppings: ["carne", "frango", "bacon", "palha", "ervas"] },
    tint: "gold",
    available: true,
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
    art: { kind: "batatao", sauce: "#FBE7A1", sauce2: "#F59E0B", toppings: ["queijo", "ervas"] },
    tint: "cream",
    available: true,
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
    art: { kind: "batatao", sauce: "#F4E6C8", sauce2: "#F59E0B", toppings: ["frango", "bacon", "palha"] },
    tint: "red",
    available: true,
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
    art: { kind: "porcao", toppings: [] },
    tint: "gold",
    available: true,
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
    art: { kind: "porcao", sauce: "#F59E0B", toppings: ["bacon"] },
    tint: "red",
    available: true,
    allowsExtras: true,
    recipe: { batata: 0.5, cheddar: 0.1, bacon: 0.08, embalagem: 1 },
  },
  {
    id: "molho-casa",
    name: "Pote de Maionese da Casa",
    description: "Maionese temperada artesanal da casa, pote de 100 ml.",
    category: "porcoes",
    price: 4,
    badges: [],
    tags: ["maionese", "molho", "extra"],
    art: { kind: "pote" },
    tint: "cream",
    available: true,
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
    art: { kind: "lata", color: "#DC2626", label: "COLA" },
    tint: "bev",
    available: true,
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
    art: { kind: "garrafa", color: "#DC2626", liquid: "#2B0F08", label: "COLA" },
    tint: "bev",
    available: true,
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
    art: { kind: "garrafa", color: "#15803D", liquid: "#7A2E0E", label: "GUARANÁ" },
    tint: "bev",
    available: true,
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
    art: { kind: "garrafa", color: "#0EA5E9", liquid: "#BAE6FD", label: "ÁGUA" },
    tint: "bev",
    available: true,
    allowsExtras: false,
    recipe: {},
  },
  // Torres (seção desativada por padrão)
  {
    id: "torre-classica",
    name: "Torre de Batata Cheddar & Bacon",
    description: "Uma torre de fritas crocantes em camadas, banhada em cheddar cremoso e bacon. Perfeita para dividir.",
    category: "torres",
    price: 49,
    badges: ["Novo", "Serve 2 pessoas"],
    tags: ["torre", "cheddar", "bacon"],
    art: { kind: "torre", sauce: "#F59E0B", toppings: ["bacon", "ervas"] },
    tint: "gold",
    available: true,
    allowsExtras: true,
    recipe: { batata: 0.9, cheddar: 0.18, bacon: 0.12, embalagem: 1 },
  },
  // Xis (seção desativada por padrão)
  {
    id: "xis-salada",
    name: "Xis Salada",
    description: "Pão de xis prensado, hambúrguer, queijo, presunto, ovo, alface, tomate, milho e ervilha.",
    category: "xis",
    price: 28,
    badges: [],
    tags: ["xis", "lanche", "salada"],
    art: { kind: "lanche", style: "xis", cheese: true, egg: true },
    tint: "green",
    available: true,
    allowsExtras: true,
    recipe: { mussarela: 0.05, embalagem: 1 },
  },
  {
    id: "xis-bacon",
    name: "Xis Bacon",
    description: "O xis completo com muito bacon crocante, queijo derretido e maionese da casa.",
    category: "xis",
    price: 32,
    badges: ["Mais Pedido"],
    tags: ["xis", "lanche", "bacon"],
    art: { kind: "lanche", style: "xis", cheese: true, bacon: true },
    tint: "red",
    available: true,
    allowsExtras: true,
    recipe: { mussarela: 0.05, bacon: 0.08, embalagem: 1 },
  },
  // Hambúrgueres (seção desativada por padrão)
  {
    id: "burger-cheddar",
    name: "Cheddar Burger",
    description: "Pão brioche, blend 160g, cheddar cremoso e cebola caramelizada.",
    category: "hamburgueres",
    price: 29,
    badges: ["Novo"],
    tags: ["hambúrguer", "burger", "cheddar"],
    art: { kind: "lanche", style: "burger", cheese: true },
    tint: "gold",
    available: true,
    allowsExtras: true,
    recipe: { cheddar: 0.05, embalagem: 1 },
  },
];

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

/* ------------------------------------------------------------------ *
 * Buscas e regras puras (sem estado global — recebem as listas)
 * ------------------------------------------------------------------ */

export const findProduct = (products: Product[], id: string) => products.find((p) => p.id === id);
export const findExtra = (extras: Extra[], id: string) => extras.find((e) => e.id === id);
export const findNeighborhood = (list: Neighborhood[], id: string | null | undefined) =>
  list.find((n) => n.id === id);

export const etaLabel = (n: Pick<Neighborhood, "etaMin" | "etaMax">) => `${n.etaMin}–${n.etaMax} min`;

export const unitPriceFor = (p: Product, size: SizeId | undefined, extras: string[], list: Extra[]) =>
  (size === "gigante" && p.priceGigante ? p.priceGigante : p.price) +
  extras.reduce((s, id) => s + (findExtra(list, id)?.price ?? 0), 0);

export type StockLevel = "ok" | "atencao" | "critico";
export const stockLevel = (i: Ingredient): StockLevel =>
  i.qty < i.min ? "critico" : i.qty < i.min * 2 ? "atencao" : "ok";

/** Insumos consumidos por um pedido (receita × quantidade + adicionais). */
export function orderConsumption(o: Order, products: Product[], extras: Extra[]) {
  const use: Record<string, number> = {};
  const add = (id: string, v: number) => (use[id] = (use[id] ?? 0) + v);
  for (const it of o.items) {
    const p = findProduct(products, it.productId);
    if (!p) continue;
    const recipe = it.size === "gigante" && p.recipeGigante ? p.recipeGigante : p.recipe;
    for (const [k, v] of Object.entries(recipe)) add(k, (v ?? 0) * it.qty);
    for (const ex of it.extras) {
      const e = findExtra(extras, ex);
      if (e) add(e.ingredient, e.amount * it.qty);
    }
  }
  return use;
}

/* ------------------------------------------------------------------ *
 * Seed inicial
 * ------------------------------------------------------------------ */

function item(productId: string, qty: number, size?: SizeId, extras: string[] = [], notes = ""): CartItem {
  const p = findProduct(SEED_PRODUCTS, productId)!;
  return {
    uid: `${productId}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    name: p.name,
    size: p.priceGigante ? size ?? "media" : undefined,
    extras,
    notes,
    qty,
    unitPrice: unitPriceFor(p, size, extras, SEED_EXTRAS),
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
  const deliveryFee = findNeighborhood(SEED_NEIGHBORHOODS, neighborhoodId)?.fee ?? 0;
  const t = Date.now() - minutesAgo * 60000;
  return {
    id,
    token: `seed${id}`,
    createdAt: t,
    updatedAt: t,
    customer,
    neighborhoodId,
    items,
    subtotal,
    deliveryFee,
    discount: 0,
    total: subtotal + deliveryFee,
    payment,
    changeFor,
    status,
    stockDeducted: status !== "novo",
    history: [{ status: "novo", at: t }],
  };
}

export function createSeed(): SharedState {
  return {
    version: STATE_VERSION,
    nextOrderId: 1046,
    stock: INITIAL_STOCK.map((i) => ({ ...i })),
    cash: [],
    shifts: [{ id: "turno-inicial", openedAt: Date.now(), openedBy: "sistema", openingFloat: 100 }],
    sections: SEED_SECTIONS.map((x) => ({ ...x })),
    products: SEED_PRODUCTS.map((x) => ({ ...x })),
    extras: SEED_EXTRAS.map((x) => ({ ...x })),
    neighborhoods: SEED_NEIGHBORHOODS.map((x) => ({ ...x })),
    coupons: SEED_COUPONS.map((x) => ({ ...x })),
    settings: structuredClone(SEED_SETTINGS),
    users: [],
    audit: [],
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
