"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, TriangleAlert, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Press } from "@/components/ui/Press";

/** Entrada do painel: usuário e senha guardados no Redis, sessão em cookie assinado. */
export function LoginForm({
  secretOk,
  storageOk,
  canLogin,
}: {
  secretOk: boolean;
  storageOk: boolean;
  canLogin: boolean;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const blocked = !secretOk || !storageOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      window.location.href = "/admin";
    } catch {
      setError("Sem conexão com o servidor. Tente de novo.");
      setLoading(false);
    }
  };

  const field =
    "flex items-center gap-3 rounded-control border border-line bg-ink px-4 py-3.5 transition-colors focus-within:border-amber-400/60";

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="panel-strong w-full max-w-100 rounded-panel p-7 sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={76} />
          <h1 className="letreiro mt-5 text-3xl text-white">Painel da Val</h1>
          <p className="mt-1 text-small text-zinc-400">Pedidos, cardápio, caixa e estoque.</p>
        </div>

        {!secretOk && (
          <div className="mt-6 flex gap-2.5 rounded-control border border-amber-400/30 bg-amber-400/10 p-3.5 text-small text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Falta a variável <b>AUTH_SECRET</b> no ambiente. Sem ela o painel fica fechado por segurança.
            </span>
          </div>
        )}
        {secretOk && !storageOk && (
          <div className="mt-6 flex gap-2.5 rounded-control border border-amber-400/30 bg-amber-400/10 p-3.5 text-small text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Falta configurar o Redis: defina <b>REDIS_URL</b> (ou KV_REST_API_URL + KV_REST_API_TOKEN) na Vercel.
            </span>
          </div>
        )}
        {!blocked && !canLogin && (
          <div className="mt-6 flex gap-2.5 rounded-control border border-amber-400/30 bg-amber-400/10 p-3.5 text-small text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Nenhum acesso cadastrado ainda. Defina <b>ADMIN_PASSWORD</b> (e, se quiser, ADMIN_LOGIN) para criar o
              primeiro dono no primeiro login.
            </span>
          </div>
        )}

        <form onSubmit={submit} className="mt-7 space-y-3">
          <label className={field}>
            <User className="h-4.5 w-4.5 shrink-0 text-zinc-500" aria-hidden />
            <span className="sr-only">Usuário</span>
            <input
              required
              autoComplete="username"
              placeholder="Usuário"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </label>
          <label className={field}>
            <Lock className="h-4.5 w-4.5 shrink-0 text-zinc-500" aria-hidden />
            <span className="sr-only">Senha</span>
            <input
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="text-zinc-500 hover:text-white"
            >
              {show ? <EyeOff className="h-4.5 w-4.5" aria-hidden /> : <Eye className="h-4.5 w-4.5" aria-hidden />}
            </button>
          </label>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                role="alert"
                className="overflow-hidden px-1 text-small font-medium text-brasa"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Press type="submit" variant="cta" className="mt-2 h-12 w-full text-base" disabled={loading || blocked}>
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="h-5 w-5 rounded-full border-2 border-on-brand/25 border-t-on-brand"
              />
            ) : (
              "Entrar"
            )}
          </Press>
        </form>
      </motion.div>
    </main>
  );
}
