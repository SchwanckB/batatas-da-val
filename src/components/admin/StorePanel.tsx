"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, Megaphone, Pause, Play, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Press, spring } from "@/components/ui/Press";
import { Switch } from "@/components/ui/Switch";
import { cn, uid } from "@/lib/format";
import { DAY_NAMES, WEEK_ORDER, hoursSummary, openStatus } from "@/lib/hours";
import { useAdmin, useAdminActions } from "@/lib/adminStore";
import { useToast } from "@/lib/toast";
import type { Notice, StoreSettings, Weekday } from "@/lib/types";
import { Card, Field, Hint, MoneyField, NumberField, inputCls } from "./kit";

const TONES: { id: Notice["tone"]; label: string }[] = [
  { id: "aviso", label: "Atenção" },
  { id: "info", label: "Informação" },
  { id: "promo", label: "Promoção" },
];

/** Configurações da loja: horário, pausa, avisos da home, contato e Pix. */
export function StorePanel() {
  const { state } = useAdmin();
  const { saveSettings } = useAdminActions();
  const { toast } = useToast();
  const [draft, setDraft] = useState<StoreSettings>(state.settings);
  const [saving, setSaving] = useState(false);

  // Se outro aparelho mudar as configurações, recarrega o formulário.
  useEffect(() => setDraft(state.settings), [state.settings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.settings);
  const set = (patch: Partial<StoreSettings>) => setDraft((d) => ({ ...d, ...patch }));
  const setDay = (w: Weekday, patch: Partial<StoreSettings["hours"][Weekday]>) =>
    setDraft((d) => ({ ...d, hours: { ...d.hours, [w]: { ...d.hours[w], ...patch } } }));

  const save = async () => {
    setSaving(true);
    const err = await saveSettings({
      ...draft,
      notices: draft.notices.filter((n) => n.text.trim().length > 1),
    });
    setSaving(false);
    toast(
      err
        ? { title: "Não salvou", subtitle: err, tone: "erro" }
        : { title: "Configurações salvas", subtitle: "Já valem para os clientes", icon: <Check className="h-4.5 w-4.5 text-[#7fd79a]" /> },
    );
  };

  const status = openStatus(draft);

  return (
    <div className="space-y-4 pb-20">
      {/* Pausa de pedidos */}
      <Card className={cn(draft.paused && "border-amber-400/50")}>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-control",
              draft.paused ? "bg-amber-400/15 text-amber-300" : "bg-aberto/15 text-[#7fd79a]",
            )}
          >
            {draft.paused ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white">
              {draft.paused ? "Pedidos pausados" : "Aceitando pedidos no horário"}
            </p>
            <p className="text-small text-zinc-400">
              {draft.paused
                ? "O cardápio continua visível, mas ninguém consegue finalizar."
                : `Agora: ${status.label.toLowerCase()}.`}
            </p>
          </div>
          <Switch
            label="Pausar pedidos"
            checked={draft.paused}
            onChange={(v) => set({ paused: v })}
          />
        </div>
        <AnimatePresence initial={false}>
          {draft.paused && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Field label="Recado para quem tentar pedir" className="mt-4">
                <input
                  className={inputCls}
                  maxLength={200}
                  value={draft.pausedMessage}
                  onChange={(e) => set({ pausedMessage: e.target.value })}
                  placeholder="Estamos com a cozinha lotada. Já voltamos!"
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Avisos na tela inicial */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-white">
              <Megaphone className="h-4 w-4 text-amber-400" aria-hidden /> Avisos na tela inicial
            </h3>
            <p className="mt-0.5 text-small text-zinc-400">
              Aparecem em faixa no topo do cardápio, logo abaixo da apresentação.
            </p>
          </div>
          <Press
            variant="panel"
            className="h-9 shrink-0 px-3 text-xs"
            disabled={draft.notices.length >= 6}
            onClick={() =>
              set({
                notices: [...draft.notices, { id: `n-${uid()}`, text: "", tone: "aviso", active: true }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Novo aviso
          </Press>
        </div>

        <div className="mt-4 space-y-2.5">
          <AnimatePresence initial={false}>
            {draft.notices.map((n) => (
              <motion.div
                key={n.id}
                layout
                transition={spring}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="rounded-control border border-line p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          set({ notices: draft.notices.map((x) => (x.id === n.id ? { ...x, tone: t.id } : x)) })
                        }
                        className={cn(
                          "rounded-sm px-2 py-1 text-2xs font-semibold transition-colors",
                          n.tone === t.id ? "bg-amber-400 text-on-brand" : "bg-white/[0.06] text-zinc-400",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Switch
                      size="sm"
                      label="Mostrar este aviso"
                      checked={n.active}
                      onChange={(v) =>
                        set({ notices: draft.notices.map((x) => (x.id === n.id ? { ...x, active: v } : x)) })
                      }
                    />
                    <button
                      onClick={() => set({ notices: draft.notices.filter((x) => x.id !== n.id) })}
                      aria-label="Remover aviso"
                      className="grid h-8 w-8 place-items-center rounded-full text-zinc-500 hover:bg-white/10 hover:text-brasa"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={n.text}
                  onChange={(e) =>
                    set({ notices: draft.notices.map((x) => (x.id === n.id ? { ...x, text: e.target.value } : x)) })
                  }
                  placeholder="Ex.: Alta demanda hoje, os pedidos podem levar mais 15 minutos."
                  className={cn(inputCls, "mt-2.5 resize-none")}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {draft.notices.length === 0 && (
            <Hint Icon={Info}>
              Sem avisos no momento. Use para alta demanda, feriado, falta de um item ou promoção do dia.
            </Hint>
          )}
        </div>
      </Card>

      {/* Horários */}
      <Card>
        <h3 className="font-bold text-white">Horário de atendimento</h3>
        <p className="mt-0.5 text-small text-zinc-400">
          Fuso de São Paulo. Para fechar depois da meia-noite use, por exemplo, 19:30 às 00:30.
        </p>
        <div className="mt-4 space-y-1.5">
          {WEEK_ORDER.map((w) => {
            const d = draft.hours[w];
            return (
              <div
                key={w}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-control border px-3 py-2.5",
                  d.open ? "border-line" : "border-line/60 opacity-70",
                )}
              >
                <Switch label={`Abrir ${DAY_NAMES[w]}`} size="sm" checked={d.open} onChange={(v) => setDay(w, { open: v })} />
                <span className="w-20 shrink-0 text-sm font-semibold text-zinc-100">{DAY_NAMES[w]}</span>
                {d.open ? (
                  <span className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={d.from}
                      onChange={(e) => setDay(w, { from: e.target.value })}
                      aria-label={`Abre ${DAY_NAMES[w]}`}
                      className="rounded-control border border-line bg-ink px-2.5 py-1.5 tnum text-white focus:border-amber-400/60 focus:outline-none"
                    />
                    <span className="text-zinc-500">às</span>
                    <input
                      type="time"
                      value={d.to}
                      onChange={(e) => setDay(w, { to: e.target.value })}
                      aria-label={`Fecha ${DAY_NAMES[w]}`}
                      className="rounded-control border border-line bg-ink px-2.5 py-1.5 tnum text-white focus:border-amber-400/60 focus:outline-none"
                    />
                  </span>
                ) : (
                  <span className="text-small text-zinc-500">fechado</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-small tnum text-zinc-400">No site vai aparecer: {hoursSummary(draft)}</p>
      </Card>

      {/* Pedido e preparo */}
      <Card>
        <h3 className="font-bold text-white">Pedido e preparo</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MoneyField
            label="Pedido mínimo"
            hint="Sem contar a entrega. Deixe 0 para não exigir mínimo."
            value={draft.minOrder}
            onChange={(v) => set({ minOrder: v })}
          />
          <NumberField
            label="Tempo médio de preparo"
            suffix="min"
            hint="Somado ao tempo de deslocamento do bairro."
            value={draft.prepMinutes}
            onChange={(v) => set({ prepMinutes: v })}
            max={600}
          />
        </div>
      </Card>

      {/* Contato */}
      <Card>
        <h3 className="font-bold text-white">Identificação e contato</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome da loja">
            <input className={inputCls} maxLength={60} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Frase de apresentação">
            <input
              className={inputCls}
              maxLength={120}
              value={draft.slogan}
              onChange={(e) => set({ slogan: e.target.value })}
            />
          </Field>
          <Field label="Cidade">
            <input className={inputCls} maxLength={80} value={draft.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label="Endereço" hint="Aparece no rodapé e na busca do Google.">
            <input
              className={inputCls}
              maxLength={160}
              value={draft.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </Field>
          <Field label="Telefone">
            <input className={inputCls} maxLength={30} value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="WhatsApp" hint="Só números, com 55 e DDD. Ex.: 555196870865">
            <input
              className={cn(inputCls, "tnum")}
              maxLength={20}
              value={draft.whatsapp}
              onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
          <Field label="Instagram">
            <input
              className={inputCls}
              maxLength={40}
              value={draft.instagram}
              onChange={(e) => set({ instagram: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* Pix */}
      <Card>
        <h3 className="font-bold text-white">Pix</h3>
        <p className="mt-0.5 text-small text-zinc-400">
          Usado para gerar o QR Code e o “copia e cola” com o valor do pedido já preenchido.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Chave Pix" hint="Telefone, e-mail, CPF/CNPJ ou chave aleatória.">
            <input
              className={inputCls}
              maxLength={80}
              value={draft.pixKey}
              onChange={(e) => set({ pixKey: e.target.value })}
            />
          </Field>
          <Field label="Nome do recebedor" hint="Até 25 caracteres, como no banco.">
            <input
              className={inputCls}
              maxLength={40}
              value={draft.pixName}
              onChange={(e) => set({ pixName: e.target.value })}
            />
          </Field>
          <Field label="Cidade do recebedor">
            <input
              className={inputCls}
              maxLength={40}
              value={draft.pixCity}
              onChange={(e) => set({ pixCity: e.target.value })}
            />
          </Field>
        </div>
        {!draft.pixKey && (
          <div className="mt-3">
            <Hint Icon={TriangleAlert} tone="alerta">
              Sem chave Pix o cliente não recebe o QR Code depois de fechar o pedido.
            </Hint>
          </div>
        )}
      </Card>

      {/* Barra de salvar */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={spring}
            className="panel-strong fixed inset-x-3 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+4.5rem)] z-40 flex items-center gap-3 rounded-panel p-3 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-100"
          >
            <p className="min-w-0 flex-1 text-small text-zinc-300">Você mexeu nas configurações.</p>
            <Press variant="ghost" className="h-10 px-3 text-sm" onClick={() => setDraft(state.settings)}>
              Desfazer
            </Press>
            <Press variant="cta" className="h-10 px-4 text-sm" onClick={save} disabled={saving}>
              <Check className="h-4 w-4" aria-hidden /> Salvar
            </Press>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
