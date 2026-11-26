"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/format";

/** Card de vidro com brilho radial que acompanha o cursor (borda + superfície). */
export function Spotlight({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || e.pointerType !== "mouse") return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("spotlight glass rounded-3xl", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
