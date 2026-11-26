"use client";

import { useEffect, useRef, useState } from "react";

/** Atraso mínimo para exibir skeletons de forma suave (evita "piscar"). */
export function useMinDelay(ms = 320, key?: unknown) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms, key]);
  return ready;
}

/** Relógio que atualiza periodicamente (tempo decorrido, aberto/fechado). */
export function useNow(interval = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

/**
 * Executa `fn` a cada `interval` enquanto a aba estiver visível, e uma vez
 * assim que ela voltar a aparecer. É o que mantém pedidos e cardápio ao vivo.
 */
export function usePolling(fn: () => void | Promise<void>, interval: number, enabled = true) {
  const ref = useRef(fn);
  ref.current = fn;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const run = () => {
      if (document.visibilityState === "visible") void ref.current();
    };
    const start = () => {
      stop();
      timer = setInterval(run, interval);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void ref.current();
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", run);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", run);
    };
  }, [interval, enabled]);
}

/** Lê e grava JSON no localStorage sem explodir em modo privado. */
export const storage = {
  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sem espaço ou modo privado: segue só em memória */
    }
  },
};
