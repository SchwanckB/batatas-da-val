import { Flame, Sparkles, Users, Crown } from "lucide-react";
import type { Badge } from "@/lib/types";
import { cn } from "@/lib/format";

const map: Record<Badge, { cls: string; Icon: typeof Flame }> = {
  "Mais Pedido": { cls: "bg-rose-500/15 text-rose-300 ring-rose-400/30", Icon: Flame },
  Novo: { cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30", Icon: Sparkles },
  "Serve 2 pessoas": { cls: "bg-sky-500/15 text-sky-300 ring-sky-400/30", Icon: Users },
  "Especial da Casa": { cls: "bg-amber-400/15 text-amber-300 ring-amber-400/40", Icon: Crown },
};

export function BadgeChip({ badge, className }: { badge: Badge; className?: string }) {
  const { cls, Icon } = map[badge];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset backdrop-blur-md",
        cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {badge}
    </span>
  );
}
