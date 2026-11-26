"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Skeleton } from "@/components/ui/Skeleton";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { SIZES, etaLabel } from "@/lib/data";
import { dateTimeFmt, money, waLink } from "@/lib/format";
import { usePolling } from "@/lib/hooks";
import type { Neighborhood, Order } from "@/lib/types";
import { paymentLabel } from "@/lib/whatsapp";
import { OrderTracker } from "./OrderTracker";
import { PixBox } from "./PixBox";
import { RatingBox } from "./RatingStars";

interface Payload {
  rev: number;
  order: Order;
  neighborhood: Neighborhood | null;
  store: { name: string; phone: string; whatsapp: string; prepMinutes: number };
}

/** Página pública de acompanhamento: o link que o cliente guarda ou recebe. */
export function OrderPage({ token }: { token: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [rev, setRev] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos/${token}?rev=${rev}`, { cache: "no-store" });
      const body = (await res.json()) as Payload | { rev: number; unchanged: true } | { error: string };
      if (!res.ok) {
        setError("error" in body ? body.error : "Pedido não encontrado.");
        return;
      }
      if ("unchanged" in body) {
        setRev(body.rev);
        return;
      }
      const payload = body as Payload;
      setRev(payload.rev);
      setData(payload);
      setError("");
    } catch {
      setError("Sem conexão para buscar o pedido.");
    }
  }, [token, rev]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const open = data && data.order.status !== "concluido" && data.order.status !== "cancelado";
  usePolling(load, open ? 8000 : 40000);

  const rate = async (stars: number, comment: string) => {
    try {
      const res = await fetch(`/api/pedidos/${token}/avaliar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) return body.error ?? "Não foi possível enviar a avaliação.";
      setRev(0);
      await load();
      return null;
    } catch {
      return "Sem conexão para enviar a avaliação.";
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-[max(env(safe-area-inset-top),1.5rem)] sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-control border border-line text-zinc-300 hover:border-amber-400/40"
          aria-label="Voltar ao cardápio"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <Logo size={40} />
        <div className="min-w-0">
          <p className="letreiro truncate text-xl text-white">{data?.store.name ?? "Batatas da Val"}</p>
          <p className="text-2xs text-zinc-400">Acompanhamento do pedido</p>
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-card border border-line bg-surface p-5 text-center">
          <p className="font-bold text-white">{error}</p>
          <p className="mt-1 text-small text-zinc-400">
            Confira o link ou fale com a loja — o pedido pode ter sido limpo do histórico.
          </p>
          <Link href="/" className="mt-4 inline-flex text-small font-semibold text-amber-300 hover:underline">
            Ver o cardápio
          </Link>
        </div>
      )}

      {!data && !error && (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
          <div>
            <h1 className="letreiro text-3xl text-white">Pedido #{data.order.id}</h1>
            <p className="mt-1 text-small tnum text-zinc-400">{dateTimeFmt(data.order.createdAt)}</p>
          </div>

          <div className="rounded-card border border-line bg-surface p-4 pt-5">
            <OrderTracker order={data.order} pickup={!!data.neighborhood?.pickup} />
          </div>

          <div className="rounded-card border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              {data.neighborhood?.pickup ? (
                <Store className="h-4 w-4 text-amber-400" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4 text-amber-400" aria-hidden />
              )}
              {data.neighborhood?.pickup
                ? "Retirada no local"
                : `Entrega em ${data.neighborhood?.name ?? "seu endereço"}`}
            </p>
            {!data.neighborhood?.pickup && data.order.customer.address && (
              <p className="mt-1 text-small text-zinc-400">{data.order.customer.address}</p>
            )}
            {data.neighborhood && (
              <p className="mt-1 text-small tnum text-zinc-500">Previsão de {etaLabel(data.neighborhood)}</p>
            )}
          </div>

          <ul className="space-y-1.5 rounded-card border border-line bg-surface p-4 text-sm">
            {data.order.items.map((i) => (
              <li key={i.uid} className="flex justify-between gap-3 text-zinc-300">
                <span className="min-w-0">
                  {i.qty}x {i.name}
                  {i.size && (
                    <span className="text-zinc-500"> ({SIZES.find((s) => s.id === i.size)?.label})</span>
                  )}
                  {i.notes && <span className="block text-2xs italic text-amber-300/90">“{i.notes}”</span>}
                </span>
                <span className="shrink-0 tnum text-zinc-400">{money(i.unitPrice * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-line pt-2 text-zinc-400">
              <span>Entrega</span>
              <span className="tnum">{data.order.deliveryFee ? money(data.order.deliveryFee) : "sem taxa"}</span>
            </li>
            {data.order.discount > 0 && (
              <li className="flex justify-between text-[#7fd79a]">
                <span>Desconto {data.order.couponCode}</span>
                <span className="tnum">−{money(data.order.discount)}</span>
              </li>
            )}
            <li className="flex justify-between text-base font-bold text-white">
              <span>Total</span>
              <span className="tnum text-amber-300">{money(data.order.total)}</span>
            </li>
            <li className="pt-1 text-2xs text-zinc-500">
              Pagamento: {paymentLabel(data.order.payment)}
              {data.order.payment === "dinheiro" && data.order.changeFor
                ? `, troco para ${money(data.order.changeFor)}`
                : ""}
            </li>
          </ul>

          {data.order.payment === "pix" && data.order.status !== "cancelado" && <PixBox token={token} />}

          {data.order.status === "concluido" && <RatingBox rating={data.order.rating} onSend={rate} />}

          <a
            href={waLink(data.store.whatsapp, `Oi! É sobre o pedido #${data.order.id}.`)}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-control border border-aberto/35 bg-aberto/10 text-sm font-semibold text-[#9fe0b3] hover:bg-aberto/15"
          >
            <WhatsAppIcon className="h-5 w-5" aria-hidden /> Falar sobre este pedido
          </a>
        </motion.div>
      )}
    </main>
  );
}
