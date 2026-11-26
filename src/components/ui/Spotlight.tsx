"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/format";

/**
 * Card com realce de hover quente e discreto. O brilho que seguia o cursor
 * saiu: ele dava aquele ar de template de IA.
 */
export function Spotlight({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("spotlight", className)} {...rest}>
      {children}
    </div>
  );
}
