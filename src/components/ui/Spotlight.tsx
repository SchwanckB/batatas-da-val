"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/format";

/** Card com a luz quente acompanhando o cursor (as regras ficam em globals.css). */
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
      className={cn("spotlight", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
