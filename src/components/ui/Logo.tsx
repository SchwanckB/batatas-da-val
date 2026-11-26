"use client";

import { useState } from "react";
import { cn } from "@/lib/format";

/** Logo da marca em /logo.png com fallback elegante caso o arquivo não exista. */
export function Logo({ size = 44, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-1 ring-amber-400/40 shadow-[0_0_24px_-4px_rgba(245,158,11,0.55)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_30%_25%,#FBBF24,#B45309_70%,#3b1d06)]">
          <span className="font-extrabold leading-none tracking-tight text-on-brand" style={{ fontSize: size * 0.34 }}>
            BV
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo.png" alt="Batatas da Val" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
