import { z } from "zod";
import { couponError, discountFor, findCoupon } from "@/lib/coupon";
import { assertStorage, clientIp, fail, handleError, json } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate";
import { loadState } from "@/lib/server/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ code: z.string().min(1).max(20), subtotal: z.number().min(0).max(100000) });

/** Confere um cupom antes de finalizar (o valor final é recalculado no envio). */
export async function POST(req: Request) {
  try {
    assertStorage();
    // Evita ficar adivinhando códigos.
    if (!(await rateLimit(`cupom:${clientIp(req)}`, 20, 120)))
      return fail("Muitas tentativas de cupom. Espere um pouco.", 429);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Digite o código do cupom.");

    const state = await loadState();
    const coupon = findCoupon(state.coupons, parsed.data.code);
    const error = couponError(coupon, parsed.data.subtotal);
    if (error) return fail(error, 422);

    return json({
      code: coupon!.code,
      kind: coupon!.kind,
      value: coupon!.value,
      discount: discountFor(coupon!, parsed.data.subtotal),
    });
  } catch (e) {
    return handleError(e);
  }
}
