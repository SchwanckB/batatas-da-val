import { openStatus } from "@/lib/hours";
import { quoteOrder } from "@/lib/pricing";
import { assertStorage, clientIp, fail, handleError, json } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate";
import { newOrderSchema } from "@/lib/server/schemas";
import { getRev, loadState, mutate } from "@/lib/server/state";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const newToken = () => crypto.randomUUID().replace(/-/g, "").slice(0, 18);

/** Envia um pedido. Preço, frete e desconto são recalculados aqui. */
export async function POST(req: Request) {
  try {
    assertStorage();
    const ip = clientIp(req);
    if (!(await rateLimit(`order:${ip}`, 8, 900)))
      return fail("Você enviou muitos pedidos seguidos. Fale com a gente pelo WhatsApp.", 429);

    const parsed = newOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return fail(issue?.message === "Required" ? "Preencha todos os campos." : (issue?.message ?? "Dados inválidos."));
    }
    const body = parsed.data;

    const { rev, result } = await mutate<{ order?: Order; error?: string }>((state) => {
      const status = openStatus(state.settings);
      if (!status.open)
        return {
          state,
          result: {
            error:
              status.reason === "pausado"
                ? state.settings.pausedMessage || "Estamos com os pedidos pausados agora."
                : `Estamos fechados. ${status.label}.`,
          },
        };

      const quoted = quoteOrder(state, {
        items: body.items,
        neighborhoodId: body.neighborhoodId,
        couponCode: body.couponCode,
      });
      if (!quoted.ok) return { state, result: { error: quoted.error } };
      const q = quoted.quote;

      if (body.payment === "dinheiro" && body.changeFor && body.changeFor < q.total)
        return { state, result: { error: "O valor do troco precisa ser maior que o total." } };

      const now = Date.now();
      const order: Order = {
        id: state.nextOrderId,
        token: newToken(),
        createdAt: now,
        updatedAt: now,
        customer: {
          name: body.customer.name.trim(),
          phone: body.customer.phone.trim(),
          address: body.customer.address.trim(),
        },
        neighborhoodId: body.neighborhoodId,
        items: q.items,
        subtotal: q.subtotal,
        deliveryFee: q.deliveryFee,
        discount: q.discount,
        couponCode: q.coupon?.code,
        total: q.total,
        payment: body.payment,
        changeFor: body.payment === "dinheiro" ? body.changeFor : undefined,
        status: "novo",
        stockDeducted: false,
        history: [{ status: "novo", at: now }],
      };

      return {
        state: {
          ...state,
          nextOrderId: state.nextOrderId + 1,
          orders: [...state.orders, order],
          coupons: q.coupon
            ? state.coupons.map((c) => (c.id === q.coupon!.id ? { ...c, uses: c.uses + 1 } : c))
            : state.coupons,
        },
        result: { order },
      };
    });

    if (result.error) return fail(result.error, 409);
    return json({ rev, order: result.order }, 201);
  } catch (e) {
    return handleError(e);
  }
}

/** "Meus pedidos": busca pelos tokens guardados no aparelho do cliente. */
export async function GET(req: Request) {
  try {
    assertStorage();
    const tokens = (new URL(req.url).searchParams.get("tokens") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 30);
    if (!tokens.length) return json({ rev: await getRev(), orders: [] });

    const state = await loadState();
    const set = new Set(tokens);
    const orders = state.orders
      .filter((o) => set.has(o.token))
      .sort((a, b) => b.createdAt - a.createdAt);
    return json({ rev: await getRev(), orders });
  } catch (e) {
    return handleError(e);
  }
}
