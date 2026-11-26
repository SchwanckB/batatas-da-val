"use client";

import { motion } from "framer-motion";
import { Download, Receipt, ShoppingBag, Star, TrendingUp, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Press } from "@/components/ui/Press";
import { findNeighborhood } from "@/lib/data";
import { cn, dateFmt, downloadCSV, money } from "@/lib/format";
import { useAdmin } from "@/lib/adminStore";
import type { Order, PaymentMethod } from "@/lib/types";
import { paymentLabel } from "@/lib/whatsapp";
import { Card, Empty, Stat } from "./kit";

type Period = "hoje" | "7" | "30" | "tudo";

const PERIODS: { id: Period; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "tudo", label: "Tudo" },
];

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function inPeriod(o: Order, period: Period) {
  if (period === "tudo") return true;
  const now = Date.now();
  if (period === "hoje") return o.createdAt >= startOfDay(now);
  const days = Number(period);
  return o.createdAt >= startOfDay(now) - (days - 1) * 86400000;
}

/** Relatórios do turno e do período: vendas, campeões, pico e pagamento. */
export function ReportsPanel() {
  const { state } = useAdmin();
  const [period, setPeriod] = useState<Period>("7");

  const data = useMemo(() => {
    const all = state.orders.filter((o) => inPeriod(o, period));
    const sold = all.filter((o) => o.status === "concluido");
    const canceled = all.filter((o) => o.status === "cancelado");
    const revenue = sold.reduce((s, o) => s + o.total, 0);

    // Por dia
    const byDay = new Map<number, { total: number; count: number }>();
    for (const o of sold) {
      const k = startOfDay(o.createdAt);
      const cur = byDay.get(k) ?? { total: 0, count: 0 };
      byDay.set(k, { total: cur.total + o.total, count: cur.count + 1 });
    }
    const days = [...byDay.entries()].sort((a, b) => a[0] - b[0]).slice(-14);

    // Por hora
    const byHour = new Array(24).fill(0) as number[];
    for (const o of sold) byHour[new Date(o.createdAt).getHours()] += 1;

    // Produtos
    const byProduct = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of sold)
      for (const i of o.items) {
        const cur = byProduct.get(i.productId) ?? { name: i.name, qty: 0, total: 0 };
        byProduct.set(i.productId, {
          name: i.name,
          qty: cur.qty + i.qty,
          total: cur.total + i.unitPrice * i.qty,
        });
      }
    const products = [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);

    // Pagamento e bairro
    const byPayment = (["pix", "cartao", "dinheiro"] as PaymentMethod[]).map((id) => ({
      id,
      label: paymentLabel(id),
      total: sold.filter((o) => o.payment === id).reduce((s, o) => s + o.total, 0),
      count: sold.filter((o) => o.payment === id).length,
    }));

    const byNeighborhood = state.neighborhoods
      .map((n) => ({
        name: n.name,
        count: sold.filter((o) => o.neighborhoodId === n.id).length,
        total: sold.filter((o) => o.neighborhoodId === n.id).reduce((s, o) => s + o.total, 0),
      }))
      .filter((n) => n.count > 0)
      .sort((a, b) => b.count - a.count);

    const rated = sold.filter((o) => o.rating);
    const avgStars = rated.length ? rated.reduce((s, o) => s + o.rating!.stars, 0) / rated.length : 0;

    return {
      all,
      sold,
      canceled,
      revenue,
      ticket: sold.length ? revenue / sold.length : 0,
      days,
      byHour,
      products,
      byPayment,
      byNeighborhood,
      rated,
      avgStars,
    };
  }, [state.orders, state.neighborhoods, period]);

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["Pedido", "Data", "Cliente", "Telefone", "Area", "Status", "Pagamento", "Subtotal", "Entrega", "Desconto", "Cupom", "Total", "Estrelas"],
      ...data.all.map((o) => [
        o.id,
        new Date(o.createdAt).toLocaleString("pt-BR"),
        o.customer.name,
        o.customer.phone,
        findNeighborhood(state.neighborhoods, o.neighborhoodId)?.name ?? "",
        o.status,
        paymentLabel(o.payment),
        o.subtotal.toFixed(2).replace(".", ","),
        o.deliveryFee.toFixed(2).replace(".", ","),
        o.discount.toFixed(2).replace(".", ","),
        o.couponCode ?? "",
        o.total.toFixed(2).replace(".", ","),
        o.rating?.stars ?? "",
      ]),
    ];
    downloadCSV(`pedidos-${period}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const maxDay = Math.max(1, ...data.days.map(([, v]) => v.total));
  const maxHour = Math.max(1, ...data.byHour);
  const peakHour = data.byHour.indexOf(maxHour);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="panel inline-flex rounded-full p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                period === p.id ? "bg-gold text-on-brand" : "text-zinc-400 hover:text-white",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Press variant="panel" className="ml-auto h-10 px-4 text-sm" onClick={exportCSV} disabled={!data.all.length}>
          <Download className="h-4 w-4" aria-hidden /> Baixar CSV
        </Press>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat Icon={TrendingUp} label="Faturamento" value={money(data.revenue)} hint={`${data.sold.length} pedidos pagos`} accent="text-amber-300" />
        <Stat Icon={Receipt} label="Ticket médio" value={money(data.ticket)} hint="Por pedido concluído" />
        <Stat Icon={ShoppingBag} label="Pedidos no período" value={String(data.all.length)} hint={`Pico às ${peakHour}h`} />
        <Stat
          Icon={data.rated.length ? Star : XCircle}
          label={data.rated.length ? "Nota média" : "Cancelados"}
          value={data.rated.length ? `${data.avgStars.toFixed(1)} de 5` : String(data.canceled.length)}
          hint={data.rated.length ? `${data.rated.length} avaliações` : "No período"}
          accent={data.rated.length ? "text-white" : "text-[#ffb3aa]"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Vendas por dia */}
        <Card>
          <h3 className="font-bold text-white">Vendas por dia</h3>
          {data.days.length ? (
            <ul className="mt-4 space-y-2">
              {data.days.map(([day, v], i) => (
                <li key={day} className="flex items-center gap-3">
                  <span className="w-11 shrink-0 text-2xs tnum text-zinc-500">{dateFmt(day)}</span>
                  <span className="h-5 min-w-0 flex-1 overflow-hidden rounded-sm bg-white/[0.06]">
                    <motion.span
                      className="block h-full rounded-sm bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${(v.total / maxDay) * 100}%` }}
                      transition={{ type: "spring", stiffness: 110, damping: 20, delay: i * 0.03 }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-small font-semibold tnum text-zinc-200">
                    {money(v.total)}
                  </span>
                  <span className="w-6 shrink-0 text-right text-2xs tnum text-zinc-500">{v.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <Empty>Nenhuma venda concluída neste período.</Empty>
            </div>
          )}
        </Card>

        {/* Horários de pico */}
        <Card>
          <h3 className="font-bold text-white">Horários de pico</h3>
          <p className="mt-0.5 text-small text-zinc-400">Pedidos concluídos por hora de entrada.</p>
          <div className="mt-4 flex h-40 items-end gap-0.5" role="img" aria-label={`Pico de pedidos às ${peakHour} horas`}>
            {data.byHour.map((n, h) => (
              <span key={h} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <motion.span
                  className={cn("w-full rounded-t-sm", n === maxHour && n > 0 ? "bg-gold" : "bg-amber-400/35")}
                  initial={{ height: 0 }}
                  animate={{ height: `${(n / maxHour) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20, delay: h * 0.01 }}
                  title={`${h}h: ${n} ${n === 1 ? "pedido" : "pedidos"}`}
                />
                {h % 3 === 0 && <span className="text-[9px] tnum text-zinc-600">{h}</span>}
              </span>
            ))}
          </div>
        </Card>

        {/* Mais vendidos */}
        <Card>
          <h3 className="font-bold text-white">Mais vendidos</h3>
          {data.products.length ? (
            <ol className="mt-4 space-y-2">
              {data.products.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="letreiro w-5 shrink-0 text-sm text-zinc-600">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-small text-zinc-200">{p.name}</span>
                  <span className="shrink-0 text-small font-semibold tnum text-white">{p.qty}x</span>
                  <span className="w-20 shrink-0 text-right text-small tnum text-amber-300">{money(p.total)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4">
              <Empty>Nenhum produto vendido no período.</Empty>
            </div>
          )}
        </Card>

        {/* Pagamento e bairros */}
        <Card>
          <h3 className="font-bold text-white">Formas de pagamento</h3>
          <ul className="mt-4 space-y-2">
            {data.byPayment.map((p) => {
              const pct = data.revenue ? (p.total / data.revenue) * 100 : 0;
              return (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between text-small">
                    <span className="text-zinc-300">{p.label}</span>
                    <span className="font-semibold tnum text-white">
                      {money(p.total)} <span className="text-2xs font-normal text-zinc-500">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <span className="mt-1 block h-2 overflow-hidden rounded-sm bg-white/[0.06]">
                    <motion.span
                      className="block h-full rounded-sm bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-6 font-bold text-white">Por área de entrega</h3>
          {data.byNeighborhood.length ? (
            <ul className="mt-3 space-y-1.5">
              {data.byNeighborhood.map((n) => (
                <li key={n.name} className="flex items-center justify-between text-small">
                  <span className="truncate text-zinc-300">{n.name}</span>
                  <span className="shrink-0 tnum text-zinc-400">
                    {n.count} {n.count === 1 ? "pedido" : "pedidos"}, {money(n.total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-small text-zinc-500">Nenhuma entrega concluída no período.</p>
          )}
        </Card>
      </div>

      {data.rated.length > 0 && (
        <Card>
          <h3 className="font-bold text-white">Avaliações dos clientes</h3>
          <ul className="mt-3 space-y-2">
            {data.rated
              .slice()
              .sort((a, b) => (b.rating!.at ?? 0) - (a.rating!.at ?? 0))
              .slice(0, 10)
              .map((o) => (
                <li key={o.id} className="flex items-start gap-3 rounded-control border border-line p-3">
                  <span className="flex shrink-0 items-center gap-1 text-sm font-bold tnum text-amber-300">
                    <Star className="h-4 w-4 fill-gold text-gold" aria-hidden /> {o.rating!.stars}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-small text-zinc-200">
                      {o.rating!.comment || "Sem comentário"}
                    </span>
                    <span className="block text-2xs tnum text-zinc-500">
                      #{o.id}, {o.customer.name}
                    </span>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
