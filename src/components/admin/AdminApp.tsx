"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  BellOff,
  BookOpen,
  Boxes,
  ChartNoAxesColumn,
  ClipboardList,
  Ellipsis,
  LogOut,
  Store,
  Ticket,
  Truck,
  Users,
  Wallet,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import { stockLevel } from "@/lib/data";
import { cn, money } from "@/lib/format";
import { openStatus } from "@/lib/hours";
import { useMinDelay } from "@/lib/hooks";
import { AdminProvider, openShift, useAdmin, type AdminSession } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Role } from "@/lib/types";
import { BoardSkeleton, OrdersBoard } from "./OrdersBoard";
import { CashPanel, CashSkeleton } from "./CashPanel";
import { CouponsPanel } from "./CouponsPanel";
import { DeliveryPanel } from "./DeliveryPanel";
import { MenuPanel, MenuSkeleton } from "./MenuPanel";
import { ReportsPanel } from "./ReportsPanel";
import { StockPanel, StockSkeleton } from "./StockPanel";
import { StorePanel } from "./StorePanel";
import { TeamPanel } from "./TeamPanel";

type ModuleId =
  | "pedidos"
  | "cardapio"
  | "entrega"
  | "cupons"
  | "caixa"
  | "estoque"
  | "relatorios"
  | "loja"
  | "equipe";

interface ModuleDef {
  id: ModuleId;
  label: string;
  title: string;
  sub: string;
  Icon: LucideIcon;
  /** Papéis que podem abrir o módulo. */
  roles: Role[];
  /** Fica na barra de baixo do celular. */
  primary?: boolean;
}

const MODULES: ModuleDef[] = [
  { id: "pedidos", label: "Pedidos", title: "Pedidos", sub: "Cozinha e entrega, ao vivo", Icon: ClipboardList, roles: ["dono", "cozinha", "caixa"], primary: true },
  { id: "cardapio", label: "Cardápio", title: "Cardápio", sub: "Seções, produtos e preços", Icon: BookOpen, roles: ["dono"], primary: true },
  { id: "caixa", label: "Caixa", title: "Caixa", sub: "Turno, formas de pagamento e gaveta", Icon: Wallet, roles: ["dono", "caixa"], primary: true },
  { id: "estoque", label: "Estoque", title: "Estoque", sub: "Insumos e reposição", Icon: Boxes, roles: ["dono", "cozinha", "caixa"], primary: true },
  { id: "entrega", label: "Entrega", title: "Entrega e adicionais", sub: "Áreas, fretes, prazos e adicionais", Icon: Truck, roles: ["dono"] },
  { id: "cupons", label: "Cupons", title: "Cupons de desconto", sub: "Códigos, validade e limites", Icon: Ticket, roles: ["dono"] },
  { id: "relatorios", label: "Relatórios", title: "Relatórios", sub: "Vendas, produtos e horários de pico", Icon: ChartNoAxesColumn, roles: ["dono"] },
  { id: "loja", label: "Loja", title: "Configurações da loja", sub: "Horários, avisos, Pix e pausa", Icon: Store, roles: ["dono"] },
  { id: "equipe", label: "Equipe", title: "Equipe e histórico", sub: "Acessos, papéis e alterações", Icon: Users, roles: ["dono"] },
];

export function AdminApp({ session }: { session: AdminSession }) {
  return (
    <AdminProvider session={session}>
      <AdminShell />
    </AdminProvider>
  );
}

/** Bipe curto gerado na hora — sem depender de arquivo de áudio. */
function beep() {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    [880, 1180].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.18);
    });
    setTimeout(() => void ctx.close(), 900);
  } catch {
    /* navegador sem áudio: o toast ainda avisa */
  }
}

function AdminShell() {
  const { hydrated, offline, state, session, logout } = useAdmin();
  const { toast } = useToast();
  const [mod, setMod] = useState<ModuleId>("pedidos");
  const [moreOpen, setMoreOpen] = useState(false);
  const [alerts, setAlerts] = useState(true);
  const booted = useMinDelay(320);
  const modReady = useMinDelay(260, mod);
  const ready = hydrated && booted;

  const allowed = useMemo(() => MODULES.filter((m) => m.roles.includes(session.role)), [session.role]);
  const current = allowed.find((m) => m.id === mod) ?? allowed[0];

  useEffect(() => {
    if (current && current.id !== mod) setMod(current.id);
  }, [current, mod]);

  const badges: Record<ModuleId, number> = {
    pedidos: state.orders.filter((o) => o.status === "novo").length,
    cardapio: state.products.filter((p) => !p.available).length,
    entrega: 0,
    cupons: 0,
    caixa: openShift(state) ? 0 : 1,
    estoque: state.stock.filter((i) => stockLevel(i) === "critico").length,
    relatorios: 0,
    loja: state.settings.paused ? 1 : 0,
    equipe: 0,
  };

  const revenue = state.orders.filter((o) => o.status === "concluido").reduce((s, o) => s + o.total, 0);
  const status = openStatus(state.settings);

  // Pedido novo: toast + bipe + notificação do navegador
  const known = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    const ids = new Set(state.orders.map((o) => o.id));
    if (known.current) {
      for (const o of state.orders) {
        if (known.current.has(o.id) || o.status !== "novo") continue;
        toast({
          title: `Pedido novo #${o.id}`,
          subtitle: `${o.customer.name}, ${money(o.total)}`,
          icon: <BellRing className="h-4.5 w-4.5 text-amber-300" />,
        });
        if (alerts) {
          beep();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(`Pedido novo #${o.id}`, {
              body: `${o.customer.name} — ${money(o.total)}`,
              tag: `pedido-${o.id}`,
              icon: "/logo.png",
            });
          }
        }
      }
    }
    known.current = ids;
  }, [state.orders, hydrated, toast, alerts]);

  const toggleAlerts = async () => {
    if (!alerts) {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      beep();
    }
    setAlerts((a) => !a);
  };

  const body = () => {
    if (!ready || !modReady) {
      return mod === "pedidos" ? (
        <BoardSkeleton />
      ) : mod === "cardapio" ? (
        <MenuSkeleton />
      ) : mod === "caixa" ? (
        <CashSkeleton />
      ) : mod === "estoque" ? (
        <StockSkeleton />
      ) : (
        <div className="panel h-80 rounded-card" />
      );
    }
    switch (mod) {
      case "pedidos":
        return <OrdersBoard />;
      case "cardapio":
        return <MenuPanel />;
      case "entrega":
        return <DeliveryPanel />;
      case "cupons":
        return <CouponsPanel />;
      case "caixa":
        return <CashPanel />;
      case "estoque":
        return <StockPanel />;
      case "relatorios":
        return <ReportsPanel />;
      case "loja":
        return <StorePanel />;
      case "equipe":
        return <TeamPanel />;
    }
  };

  const primary = allowed.filter((m) => m.primary);
  const secondary = allowed.filter((m) => !m.primary);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Navegação lateral (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-65 shrink-0 border-r border-line p-4 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-1">
            <Logo size={42} />
            <div className="min-w-0 leading-tight">
              <p className="font-bold truncate text-lg text-white">{state.settings.name}</p>
              <p className="text-2xs text-zinc-500">Painel</p>
            </div>
          </div>

          <nav className="mt-7 space-y-0.5">
            {primary.map((m) => (
              <NavButton key={m.id} m={m} active={mod === m.id} badge={badges[m.id]} onClick={() => setMod(m.id)} />
            ))}
            {secondary.length > 0 && (
              <>
                <p className="px-3.5 pb-1 pt-5 text-2xs text-zinc-600">Configuração</p>
                {secondary.map((m) => (
                  <NavButton key={m.id} m={m} active={mod === m.id} badge={badges[m.id]} onClick={() => setMod(m.id)} />
                ))}
              </>
            )}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="rounded-card border border-line p-3">
              <p className="text-2xs text-zinc-500">Faturamento do turno</p>
              <p className="mt-0.5 text-lg font-bold tnum text-amber-300">{money(revenue)}</p>
              <p className="mt-1 text-2xs tnum text-zinc-500">{status.label}</p>
            </div>
            <div className="flex items-center gap-2 border-t border-line pt-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-400/15 text-xs font-bold text-amber-300">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-xs font-semibold text-white">{session.name}</span>
                <span className="block truncate text-2xs capitalize text-zinc-500">{session.role}</span>
              </span>
              <button
                onClick={logout}
                aria-label="Sair do painel"
                title="Sair"
                className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-brasa"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-32 pt-[max(env(safe-area-inset-top),1rem)] lg:px-6 lg:pb-10 lg:pt-6">
        <header className="mb-5 flex items-center gap-3">
          <Logo size={38} className="lg:hidden" />
          <AnimatePresence mode="wait">
            <motion.div
              key={mod}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="min-w-0"
            >
              <h1 className="font-bold truncate text-xl text-white sm:text-3xl">{current?.title}</h1>
              <p className="truncate text-xs text-zinc-500 sm:text-small">{current?.sub}</p>
            </motion.div>
          </AnimatePresence>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {offline && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brasa/15 px-3 py-1.5 text-2xs font-semibold text-[#ffb3aa]">
                <WifiOff className="h-3.5 w-3.5" aria-hidden /> Sem conexão
              </span>
            )}
            <button
              onClick={toggleAlerts}
              title={alerts ? "Desligar bipe e notificação" : "Ligar bipe e notificação"}
              aria-label={alerts ? "Desligar avisos de pedido novo" : "Ligar avisos de pedido novo"}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full border transition-colors",
                alerts ? "border-amber-400/40 text-amber-300" : "border-line text-zinc-500",
              )}
            >
              {alerts ? <BellRing className="h-4 w-4" aria-hidden /> : <BellOff className="h-4 w-4" aria-hidden />}
            </button>
            <button
              onClick={logout}
              aria-label="Sair do painel"
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-zinc-400 hover:text-brasa lg:hidden"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mod}-${ready && modReady}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {body()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navegação inferior (celular) */}
      <nav className="panel-strong fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-50 grid grid-cols-5 gap-1 rounded-panel p-1.5 lg:hidden">
        {primary.map((m) => (
          <NavButton key={m.id} m={m} active={mod === m.id} badge={badges[m.id]} onClick={() => setMod(m.id)} compact />
        ))}
        {secondary.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-control py-2 text-2xs font-semibold transition-colors",
              secondary.some((m) => m.id === mod) ? "bg-amber-400/15 text-white" : "text-zinc-400",
            )}
          >
            <Ellipsis className="h-5 w-5" aria-hidden />
            <span>Mais</span>
          </button>
        )}
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} label="Outros módulos">
        <div className="p-5 pt-4">
          <h2 className="font-bold pr-10 text-xl text-white">Configuração</h2>
          <div className="mt-4 grid gap-2">
            {secondary.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMod(m.id);
                  setMoreOpen(false);
                }}
                className="flex items-center gap-3 rounded-control border border-line p-3 text-left transition-colors hover:border-amber-400/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-400/10 text-amber-300">
                  <m.Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">{m.title}</span>
                  <span className="block truncate text-2xs text-zinc-500">{m.sub}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-small text-zinc-500">Seu perfil vê apenas o que precisa para o turno.</p>
        </div>
      </Sheet>
    </div>
  );
}

function NavButton({
  m,
  active,
  badge,
  onClick,
  compact,
}: {
  m: ModuleDef;
  active: boolean;
  badge: number;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex w-full items-center rounded-control text-sm font-semibold transition-colors",
        compact ? "flex-col gap-0.5 py-2 text-2xs" : "gap-3 px-3.5 py-2.5",
        active ? "bg-amber-400/15 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
      )}
    >
      {active && !compact && <span className="absolute inset-y-1.5 left-0 w-0.75 rounded-r bg-gold" aria-hidden />}
      <m.Icon className={cn("h-5 w-5", active && "text-amber-300")} aria-hidden />
      <span className={compact ? "" : "truncate"}>{m.label}</span>
      {badge > 0 && (
        <motion.span
          key={badge}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 14 }}
          className={cn(
            "grid h-5 min-w-5 place-items-center rounded-full bg-brasa px-1 text-2xs font-bold tnum text-white",
            compact ? "absolute right-[22%] top-1" : "relative ml-auto",
          )}
        >
          {badge}
        </motion.span>
      )}
    </button>
  );
}
