import { assertStorage, clientIp, fail, handleError, json } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate";
import { ratingSchema } from "@/lib/server/schemas";
import { mutate } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Avaliação do cliente, liberada depois que o pedido é entregue. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertStorage();
    const { token } = await params;
    if (!(await rateLimit(`rating:${clientIp(req)}`, 20, 3600)))
      return fail("Muitas avaliações seguidas. Tente mais tarde.", 429);

    const parsed = ratingSchema.safeParse(await req.json());
    if (!parsed.success) return fail("Escolha de 1 a 5 estrelas.");

    const { rev, result } = await mutate<string | null>((state) => {
      const order = state.orders.find((o) => o.token === token);
      if (!order) return { state, result: "Pedido não encontrado." };
      if (order.status !== "concluido") return { state, result: "A avaliação abre quando o pedido é entregue." };
      if (order.rating) return { state, result: "Este pedido já foi avaliado. Obrigado!" };

      return {
        state: {
          ...state,
          orders: state.orders.map((o) =>
            o.token === token
              ? { ...o, rating: { stars: parsed.data.stars, comment: parsed.data.comment.trim(), at: Date.now() } }
              : o,
          ),
        },
        result: null,
      };
    });

    if (result) return fail(result, 409);
    return json({ ok: true, rev });
  } catch (e) {
    return handleError(e);
  }
}
