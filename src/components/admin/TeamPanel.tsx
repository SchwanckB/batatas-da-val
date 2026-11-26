"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, History, Info, KeyRound, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Sheet } from "@/components/ui/Sheet";
import { ROLE_LABEL } from "@/lib/actions";
import { cn, dateTimeFmt } from "@/lib/format";
import { useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Role, User } from "@/lib/types";
import { Card, Field, Hint, inputCls } from "./kit";

interface Draft {
  id?: string;
  name: string;
  login: string;
  role: Role;
  password: string;
}

const emptyDraft: Draft = { name: "", login: "", role: "cozinha", password: "" };

/** Quem entra no painel, com qual papel, e o histórico de alterações. */
export function TeamPanel() {
  const { state, session, saveUser } = useAdmin();
  const { deleteUser } = useAdminActions();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const owners = state.users.filter((u) => u.role === "dono").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Hint Icon={Info}>
          Cozinha vê e avança pedidos. Caixa vê pedidos e o caixa. Dono vê tudo e mexe no cardápio.
        </Hint>
        <Press variant="cta" className="h-10 shrink-0 px-4 text-sm" onClick={() => setEditing(emptyDraft)}>
          <Plus className="h-4 w-4" aria-hidden /> Novo acesso
        </Press>
      </div>

      <ul className="grid gap-2.5 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {state.users.map((u: User) => (
            <motion.li
              key={u.id}
              layout
              transition={spring}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: 30 }}
              className="spotlight flex items-center gap-3 p-3.5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-amber-400/15 text-amber-300">
                <UserRound className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">
                  {u.name}
                  {u.login === session.login && <span className="ml-1.5 text-2xs text-zinc-500">(você)</span>}
                </p>
                <p className="truncate text-2xs text-zinc-500">{u.login}</p>
                <p className="mt-0.5 text-2xs font-semibold text-amber-300">{ROLE_LABEL[u.role]}</p>
              </div>
              <button
                onClick={() => setEditing({ id: u.id, name: u.name, login: u.login, role: u.role, password: "" })}
                aria-label={`Editar acesso de ${u.name}`}
                className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button
                disabled={u.role === "dono" && owners <= 1}
                title={u.role === "dono" && owners <= 1 ? "A loja precisa de pelo menos um dono" : "Remover acesso"}
                onClick={async () => {
                  const err = await deleteUser(u.id);
                  toast(
                    err
                      ? { title: "Não removeu", subtitle: err, tone: "erro" }
                      : { title: "Acesso removido", subtitle: u.name, icon: <Trash2 className="h-4.5 w-4.5 text-brasa" /> },
                  );
                }}
                aria-label={`Remover acesso de ${u.name}`}
                className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-brasa disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <Card>
        <h3 className="flex items-center gap-2 font-bold text-white">
          <History className="h-4 w-4 text-amber-400" aria-hidden /> Histórico de alterações
        </h3>
        <p className="mt-0.5 text-small text-zinc-400">
          Quem mudou preço, estoque, horário ou cancelou pedido — e quando.
        </p>
        {state.audit.length ? (
          <ul className="thin-scroll mt-3 max-h-96 space-y-1.5 overflow-y-auto pr-1">
            {state.audit.map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 border-b border-line py-2 text-small last:border-0">
                <span className="w-24 shrink-0 text-2xs tnum text-zinc-500">{dateTimeFmt(a.at)}</span>
                <span className="w-20 shrink-0 truncate text-2xs font-semibold text-amber-300">{a.actor}</span>
                <span className="min-w-0 flex-1 text-zinc-300">{a.summary}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-small text-zinc-500">Nada registrado ainda.</p>
        )}
      </Card>

      <UserEditor
        draft={editing}
        error={error}
        onClose={() => {
          setEditing(null);
          setError("");
        }}
        onSave={async (d) => {
          setError("");
          const err = await saveUser({
            id: d.id,
            name: d.name.trim(),
            login: d.login.trim().toLowerCase(),
            role: d.role,
            password: d.password ? d.password : undefined,
          });
          if (err) {
            setError(err);
            return;
          }
          setEditing(null);
          toast({ title: "Acesso salvo", subtitle: d.name, icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> });
        }}
      />
    </div>
  );
}

function UserEditor({
  draft,
  error,
  onClose,
  onSave,
}: {
  draft: Draft | null;
  error: string;
  onClose: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft | null>(draft);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setD(draft);
    setSaving(false);
  }, [draft]);

  const set = (p: Partial<Draft>) => setD((x) => (x ? { ...x, ...p } : x));
  const isNew = !d?.id;
  const valid =
    !!d &&
    d.name.trim().length > 1 &&
    /^[a-zA-Z0-9._@-]{3,}$/.test(d.login.trim()) &&
    (!isNew || d.password.length >= 6) &&
    (d.password === "" || d.password.length >= 6);

  return (
    <Sheet open={!!draft} onClose={onClose} label={isNew ? "Novo acesso" : "Editar acesso"}>
      {d && (
        <form
          className="space-y-4 p-5 pt-4 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            setSaving(true);
            onSave(d);
          }}
        >
          <h2 className="letreiro pr-10 text-2xl text-white">{isNew ? "Novo acesso" : "Editar acesso"}</h2>

          <Field label="Nome">
            <input
              autoFocus
              className={inputCls}
              maxLength={40}
              value={d.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Como a pessoa é chamada"
            />
          </Field>

          <Field label="Usuário" hint="Sem espaço. Pode ser um apelido ou e-mail.">
            <input
              className={inputCls}
              maxLength={60}
              value={d.login}
              onChange={(e) => set({ login: e.target.value.replace(/\s/g, "") })}
              placeholder="cozinha"
              autoComplete="off"
            />
          </Field>

          <Field label="Papel">
            <div className="grid gap-2">
              {(["dono", "caixa", "cozinha"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set({ role: r })}
                  className={cn(
                    "rounded-control border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
                    d.role === r ? "border-amber-400/60 bg-amber-400/10 text-white" : "border-line text-zinc-400",
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label={isNew ? "Senha" : "Nova senha"}
            hint={isNew ? "Pelo menos 6 caracteres." : "Deixe vazio para manter a senha atual."}
          >
            <span className={cn(inputCls, "flex items-center gap-2")}>
              <KeyRound className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
              <input
                type="password"
                className="min-w-0 flex-1 bg-transparent focus:outline-none"
                value={d.password}
                onChange={(e) => set({ password: e.target.value })}
                autoComplete="new-password"
                maxLength={200}
              />
            </span>
          </Field>

          {error && (
            <p role="alert" className="text-small font-medium text-brasa">
              {error}
            </p>
          )}

          <Press type="submit" variant="cta" className="h-11 w-full text-sm" disabled={!valid || saving}>
            <Check className="h-4 w-4" aria-hidden /> Salvar acesso
          </Press>
        </form>
      )}
    </Sheet>
  );
}
