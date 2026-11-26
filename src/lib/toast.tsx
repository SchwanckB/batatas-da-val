"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { uid } from "./format";

export interface Toast {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: "neutro" | "erro";
}

interface ToastValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = uid();
      setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.tone === "erro" ? 4200 : 2600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return v;
}
