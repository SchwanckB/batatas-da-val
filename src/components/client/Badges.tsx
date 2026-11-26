import { Crown, Flame, Sparkles, Users } from "lucide-react";
import type { Badge } from "@/lib/types";
import { cn } from "@/lib/format";

/** Selos do produto. Chapados, como etiqueta colada no cardápio. */
const map: Record<Badge, { dark: string; paper: string; Icon: typeof Flame }> = {
  "Mais Pedido": { dark: "bg-brasa/15 text-[#ff8f82]", paper: "bg-brasa/12 text-brasa", Icon: Flame },
  Novo: { dark: "bg-aberto/15 text-[#7fd79a]", paper: "bg-aberto/15 text-[#1d7039]", Icon: Sparkles },
  "Serve 2 pessoas": { dark: "bg-white/[0.07] text-zinc-300", paper: "bg-paper-ink/[0.07] text-zinc-600", Icon: Users },
  "Especial da Casa": { dark: "bg-amber-400/15 text-amber-300", paper: "bg-amber-500/15 text-amber-700", Icon: Crown },
};

export function BadgeChip({ badge, onPaper, className }: { badge: Badge; onPaper?: boolean; className?: string }) {
  const { dark, paper, Icon } = map[badge];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-2xs font-semibold",
        onPaper ? paper : dark,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} aria-hidden />
      {badge}
    </span>
  );
}
