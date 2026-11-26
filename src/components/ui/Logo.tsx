"use client";

import { useState } from "react";
import { cn } from "@/lib/format";

/** Logo da marca em /logo.png com reserva caso o arquivo falhe. */
export function Logo({ size = 44, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full border border-amber-400/35", className)}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <div className="grid h-full w-full place-items-center bg-gold">
          <span className="letreiro leading-none text-on-brand" style={{ fontSize: size * 0.42 }}>
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
