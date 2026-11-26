"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Press } from "@/components/ui/Press";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : /fetch|network/i.test(error.message)
            ? "Não foi possível conectar ao servidor. Tente novamente."
            : error.message,
      );
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  const field =
    "flex items-center gap-3 rounded-control bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/10 transition focus-within:ring-2 focus-within:ring-amber-400/40";

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass-strong w-full max-w-[400px] rounded-panel p-7 sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={84} />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">Painel Administrativo</h1>
          <p className="mt-1 text-small text-zinc-400">Entre para gerenciar pedidos, caixa e estoque.</p>
        </div>

        {!configured && (
          <div className="mt-6 flex gap-2.5 rounded-control bg-amber-400/10 p-3.5 text-small text-amber-200 ring-1 ring-amber-400/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Supabase não configurado. Defina <b>NEXT_PUBLIC_SUPABASE_URL</b> e <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> nas variáveis de ambiente.
            </span>
          </div>
        )}

        <form onSubmit={submit} className="mt-7 space-y-3">
          <label className={field}>
            <Mail className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </label>
          <label className={field}>
            <Lock className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
            <input
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="text-zinc-400 hover:text-white">
              {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </label>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="overflow-hidden px-1 text-small font-medium text-rose-400">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Press type="submit" variant="cta" className="mt-2 h-12 w-full text-base" disabled={loading || !configured}>
            {loading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Entrar"
            )}
          </Press>
        </form>
      </motion.div>
    </main>
  );
}
