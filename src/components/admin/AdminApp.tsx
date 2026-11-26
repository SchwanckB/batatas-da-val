"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, BookOpen, Boxes, ClipboardList, LogOut, RotateCcw, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { stockLevel } from "@/lib/data";
import { cn, money, STORE } from "@/lib/format";
import { useMinDelay, useStore } from "@/lib/store";
import { BoardSkeleton, OrdersBoard } from "./OrdersBoard";
import { CashPanel, CashSkeleton } from "./CashPanel";
import { StockPanel, StockSkeleton } from "./StockPanel";
import { MenuPanel, MenuSkeleton } from "./MenuPanel";

type Module = "pedidos" | "cardapio" | "caixa" | "estoque";

const MODULES: { id: Module; label: string; title: string; sub: string; Icon: typeof Wallet }[] = [
  { id: "pedidos", label: "Pedidos", title: "Pedidos em Aberto", sub: "Cozinha & Delivery em tempo real", Icon: ClipboardList },
  { id: "cardapio", label: "Cardápio", title: "Personalizar Cardápio", sub: "Seções visíveis e produtos", Icon: BookOpen },
  { id: "caixa", label: "Caixa", title: "Gestão de Caixa", sub: "Frente de caixa do turno", Icon: Wallet },
  { id: "estoque", label: "Estoque", title: "Controle de Estoque", sub: "Insumos e alertas de reposição", Icon: Boxes },
];

export function AdminApp({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const logout = async () => {
    setLeaving(true);
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };
  const { hydrated, shared, toast, resetDemo } = useStore();
  const [mod, setMod] = useState<Module>("pedidos");
  const booted = useMinDelay(380);
  const modReady = useMinDelay(300, mod);
  const ready = hydrated && booted;

  const badges: Record<Module, number> = {
    pedidos: shared.orders.filter((o) => o.status === "novo").length,
    cardapio: shared.products.filter((p) => !p.available).length,
    caixa: 0,
    estoque: shared.stock.filter((i) => stockLevel(i) === "critico").length,
  };
  const revenue = shared.orders.filter((o) => o.status === "concluido").reduce((s, o) => s + o.total, 0);

  // Alerta de novo pedido chegando do cliente
  const known = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const ids = new Set(shared.orders.map((o) => o.id));
    if (known.current) {
      for (const o of shared.orders) {
        if (!known.current.has(o.id)) toast({ title: `Novo pedido #${o.id}!`, subtitle: `${o.customer.name} • ${money(o.total)}`, icon: <BellRing className="h-4.5 w-4.5 text-rose-300" /> });
      }
    }
    known.current = ids;
  }, [shared.orders, hydrated, toast]);

  const current = MODULES.find((m) => m.id === mod)!;

  return (
    <div className="min-h-dvh lg:flex">
      {/* Navegação lateral (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 p-4 lg:block">
        <div className="glass-strong flex h-full flex-col rounded-panel p-4">
          <div className="flex items-center gap-3 px-1">
            <Logo size={44} />
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-white">
                Batatas <span className="text-amber-300">da Val</span>
              </p>
              <p className="text-2xs text-zinc-400">Painel Administrativo</p>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {MODULES.map((m) => (
              <NavButton key={m.id} m={m} active={mod === m.id} badge={badges[m.id]} onClick={() => setMod(m.id)} layoutId="nav-pill-desk" />
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
              <p className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">Turno de hoje</p>
              <p className="mt-1 text-lg font-extrabold text-amber-300">{money(revenue)}</p>
              <p className="text-2xs text-zinc-400">{STORE.hours}</p>
            </div>
            <button onClick={resetDemo} className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-2xs font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-300">
              <RotateCcw className="h-3 w-3" /> Restaurar dados da demonstração
            </button>
            <div className="flex items-center gap-2 border-t border-white/[0.06] pt-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-400/15 text-xs font-bold uppercase text-amber-300">
                {userEmail.slice(0, 1) || "A"}
              </span>
              <span className="min-w-0 flex-1 truncate text-2xs text-zinc-400" title={userEmail}>
                {userEmail}
              </span>
              <button onClick={logout} disabled={leaving} aria-label="Sair" title="Sair" className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-rose-300 disabled:opacity-40">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-32 pt-[max(env(safe-area-inset-top),16px)] lg:px-6 lg:pb-10 lg:pt-6">
        <header className="mb-5 flex items-center gap-3">
          <Logo size={40} className="lg:hidden" />
          <AnimatePresence mode="wait">
            <motion.div key={mod} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">{current.title}</h1>
              <p className="truncate text-xs text-zinc-400 sm:text-sm">{current.sub}</p>
            </motion.div>
          </AnimatePresence>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-2xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Ao vivo
          </span>
          <button onClick={logout} disabled={leaving} aria-label="Sair" className="glass grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-300 hover:text-rose-300 disabled:opacity-40 lg:hidden">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {!ready || !modReady ? (
            <motion.div key={`sk-${mod}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {mod === "pedidos" ? <BoardSkeleton /> : mod === "cardapio" ? <MenuSkeleton /> : mod === "caixa" ? <CashSkeleton /> : <StockSkeleton />}
            </motion.div>
          ) : (
            <motion.div key={mod} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              {mod === "pedidos" ? <OrdersBoard /> : mod === "cardapio" ? <MenuPanel /> : mod === "caixa" ? <CashPanel /> : <StockPanel />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navegação inferior (mobile) */}
      <nav className="glass-strong fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),12px)] z-50 grid grid-cols-4 gap-1 rounded-panel p-1.5 lg:hidden">
        {MODULES.map((m) => (
          <NavButton key={m.id} m={m} active={mod === m.id} badge={badges[m.id]} onClick={() => setMod(m.id)} layoutId="nav-pill-mob" compact />
        ))}
      </nav>
    </div>
  );
}

function NavButton({
  m,
  active,
  badge,
  onClick,
  layoutId,
  compact,
}: {
  m: (typeof MODULES)[number];
  active: boolean;
  badge: number;
  onClick: () => void;
  layoutId: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center rounded-2xl text-sm font-semibold transition-colors",
        compact ? "flex-col gap-0.5 py-2 text-2xs" : "gap-3 px-3.5 py-3",
        active ? "text-white" : "text-zinc-400 hover:text-zinc-200",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-300/20 to-amber-500/5 ring-1 ring-amber-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
        />
      )}
      <m.Icon className={cn("relative h-5 w-5", active && "text-amber-300")} />
      <span className="relative">{m.label}</span>
      {badge > 0 && (
        <motion.span
          key={badge}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 14 }}
          className={cn(
            "grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-2xs font-bold text-white",
            compact ? "absolute right-[22%] top-1" : "relative ml-auto",
          )}
        >
          {badge}
        </motion.span>
      )}
    </button>
  );
}

