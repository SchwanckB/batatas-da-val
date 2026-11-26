import { z } from "zod";

/** Validação de tudo que chega pela API (painel e cliente). */

const text = (max: number) => z.string().max(max);
const price = z.number().min(0).max(100000);
const qty = z.number().min(0).max(100000);

const badge = z.enum(["Mais Pedido", "Novo", "Serve 2 pessoas", "Especial da Casa"]);
const tint = z.enum(["gold", "red", "cream", "bev", "green"]);
const sizeId = z.enum(["media", "gigante"]);
const topping = z.enum(["carne", "frango", "bacon", "ervas", "palha", "queijo"]);
const sectionIcon = z.enum([
  "flame", "crown", "utensils", "soda", "sandwich", "beef", "layers",
  "pizza", "drumstick", "salad", "dessert", "star",
]);
const role = z.enum(["dono", "cozinha", "caixa"]);

const color = z.string().max(30);

const artSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("batatao"), sauce: color, sauce2: color.optional(), toppings: z.array(topping).max(8) }),
  z.object({ kind: z.literal("porcao"), sauce: color.optional(), toppings: z.array(topping).max(8) }),
  z.object({ kind: z.literal("pote") }),
  z.object({
    kind: z.literal("lanche"),
    style: z.enum(["xis", "burger"]),
    cheese: z.boolean().optional(),
    bacon: z.boolean().optional(),
    egg: z.boolean().optional(),
  }),
  z.object({ kind: z.literal("torre"), sauce: color.optional(), toppings: z.array(topping).max(8) }),
  z.object({ kind: z.literal("lata"), color, label: text(16) }),
  z.object({ kind: z.literal("garrafa"), color, liquid: color, label: text(16) }),
]);

const id = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9-]+$/i, "Id inválido");

const recipe = z.record(id, z.number().min(0).max(100));

export const productSchema = z.object({
  id,
  name: text(80).min(2),
  description: text(400),
  category: id,
  price,
  priceGigante: price.optional(),
  badges: z.array(badge).max(4),
  tags: z.array(text(30)).max(20),
  art: artSchema,
  // Foto: URL pública ou data URL comprimida pelo painel.
  image: z.string().max(3_500_000).optional(),
  tint,
  available: z.boolean(),
  allowsExtras: z.boolean(),
  recipe,
  recipeGigante: recipe.optional(),
  featured: z.boolean().optional(),
});

export const sectionSchema = z.object({
  id,
  name: text(50).min(2),
  icon: sectionIcon,
  active: z.boolean(),
  order: z.number().int().min(0).max(999),
});

export const extraSchema = z.object({
  id,
  name: text(50).min(2),
  price,
  ingredient: z.string().max(60),
  amount: z.number().min(0).max(100),
  active: z.boolean(),
});

export const neighborhoodSchema = z.object({
  id,
  name: text(50).min(2),
  hint: text(80),
  fee: price,
  etaMin: z.number().int().min(0).max(600),
  etaMax: z.number().int().min(0).max(600),
  pickup: z.boolean().optional(),
  active: z.boolean(),
  order: z.number().int().min(0).max(999),
});

export const couponSchema = z.object({
  id,
  code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9]+$/, "Use só letras e números"),
  kind: z.enum(["fixo", "percent"]),
  value: z.number().min(0).max(100000),
  minOrder: price,
  maxUses: z.number().int().min(0).max(100000),
  uses: z.number().int().min(0).max(100000),
  expiresAt: z.number().int().nullable(),
  active: z.boolean(),
});

export const ingredientSchema = z.object({
  id,
  name: text(60).min(2),
  unit: z.enum(["kg", "pct", "un", "l"]),
  qty,
  min: qty,
  max: qty,
  step: z.number().min(0.01).max(1000),
});

const dayHours = z.object({
  open: z.boolean(),
  from: z.string().regex(/^\d{2}:\d{2}$/),
  to: z.string().regex(/^\d{2}:\d{2}$/),
});

const noticeSchema = z.object({
  id: text(40).min(1),
  text: text(200).min(2),
  tone: z.enum(["info", "aviso", "promo"]),
  active: z.boolean(),
});

export const settingsSchema = z.object({
  name: text(60).min(2),
  slogan: text(120),
  city: text(80),
  address: text(160),
  phone: text(30),
  whatsapp: text(20),
  instagram: text(40),
  pixKey: text(80),
  pixName: text(40),
  pixCity: text(40),
  hours: z.object({
    0: dayHours, 1: dayHours, 2: dayHours, 3: dayHours, 4: dayHours, 5: dayHours, 6: dayHours,
  }),
  paused: z.boolean(),
  pausedMessage: text(200),
  minOrder: price,
  prepMinutes: z.number().int().min(0).max(600),
  notices: z.array(noticeSchema).max(6),
});

/** Ações do painel. */
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("order:advance"), id: z.number().int() }),
  z.object({ type: z.literal("order:cancel"), id: z.number().int(), reason: text(160) }),
  z.object({
    type: z.literal("cash:entry"),
    id: text(40),
    kind: z.enum(["reforco", "sangria"]),
    description: text(80),
    amount: price,
  }),
  z.object({ type: z.literal("cash:delete"), id: text(40) }),
  z.object({ type: z.literal("shift:open"), id: text(40), openingFloat: price }),
  z.object({ type: z.literal("shift:close"), counted: price, note: text(160) }),
  z.object({ type: z.literal("stock:adjust"), id: text(60), delta: z.number().min(-10000).max(10000) }),
  z.object({ type: z.literal("stock:save"), ingredient: ingredientSchema }),
  z.object({ type: z.literal("stock:delete"), id: text(60) }),
  z.object({ type: z.literal("product:save"), product: productSchema }),
  z.object({ type: z.literal("product:delete"), id: text(60) }),
  z.object({ type: z.literal("section:save"), section: sectionSchema }),
  z.object({ type: z.literal("section:delete"), id: text(60) }),
  z.object({ type: z.literal("section:move"), id: text(60), dir: z.union([z.literal(-1), z.literal(1)]) }),
  z.object({ type: z.literal("extra:save"), extra: extraSchema }),
  z.object({ type: z.literal("extra:delete"), id: text(60) }),
  z.object({ type: z.literal("nb:save"), neighborhood: neighborhoodSchema }),
  z.object({ type: z.literal("nb:delete"), id: text(60) }),
  z.object({ type: z.literal("coupon:save"), coupon: couponSchema }),
  z.object({ type: z.literal("coupon:delete"), id: text(60) }),
  z.object({ type: z.literal("settings:save"), settings: settingsSchema }),
  z.object({ type: z.literal("user:delete"), id: text(40) }),
  z.object({ type: z.literal("demo:reset") }),
]);

/** Pedido enviado pelo cliente (sem preços). */
export const newOrderSchema = z.object({
  customer: z.object({
    name: text(60).min(2),
    phone: text(24).min(10),
    address: text(200),
  }),
  neighborhoodId: text(60),
  items: z
    .array(
      z.object({
        productId: text(60),
        size: sizeId.optional(),
        extras: z.array(text(60)).max(10),
        notes: text(180),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(40),
  payment: z.enum(["pix", "cartao", "dinheiro"]),
  changeFor: z.number().min(0).max(100000).optional(),
  couponCode: text(20).optional(),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: text(300),
});

export const userSchema = z.object({
  id: text(40).optional(),
  name: text(40).min(2),
  login: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-zA-Z0-9._@-]+$/, "Use letras, números, ponto, hífen ou @"),
  role,
  password: z.string().min(6).max(200).optional(),
});
