# CLAUDE.md — Batatas da Val (delivery)

Contexto para o Claude Code. Leia antes de qualquer mudança. Handoff completo em `docs/HANDOFF.md`;
roteiro de evolução em `docs/PROMPT-MELHORIAS.md`.

## Produto
Cardápio digital + painel de gestão de uma hamburgueria/batataria de delivery em Três Cachoeiras - RS.
- `/` — cliente: cardápio, personalização, carrinho, checkout, acompanhamento do pedido.
- `/admin` — dono/equipe (login Supabase): Pedidos (Kanban), Cardápio (seções + produtos), Caixa, Estoque.
- Público brasileiro, maioria no celular. **Toda a interface em português do Brasil.**

## Comandos
```bash
npm run dev          # desenvolvimento (http://localhost:3000)
npm run build        # build de produção — rode antes de dizer que terminou
npm run lint         # ESLint
npx tsc --noEmit     # checagem de tipos
```
Variáveis: `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`).

## Stack
Next.js 15 (App Router) · React 19 · TypeScript estrito · Tailwind CSS v4 (config em CSS, sem tailwind.config) ·
Framer Motion · Lucide React · Supabase (`@supabase/ssr`). Deploy na Vercel.

## Arquitetura
| Pasta / arquivo | Papel |
| --- | --- |
| `src/lib/types.ts` | Tipos de domínio (Product, Section, Order, Ingredient…) |
| `src/lib/data.ts` | Dados iniciais (seed), bairros/frete, adicionais, regras puras (preço, consumo de estoque) |
| `src/lib/store.tsx` | **Estado global** (Context). Hoje persiste em localStorage + BroadcastChannel. Ponto único a migrar para Supabase |
| `src/lib/supabase/*` | Clients browser/server + env |
| `src/middleware.ts` | Protege `/admin/*` (sem sessão → `/admin/login`) |
| `src/app/admin/page.tsx` | Segunda checagem de sessão no servidor |
| `src/components/client/*` | Telas do cliente |
| `src/components/admin/*` | Módulos do painel |
| `src/components/ui/*` | Design system (Press, Sheet, Spotlight, Switch, Skeleton, Logo, ToastStack…) |
| `src/components/client/DishArt.tsx` | Ilustrações SVG dos produtos (usadas quando não há foto) |

## Design system — obrigatório seguir
- Tokens em `src/app/globals.css` (`@theme`): `text-on-brand`, `bg-surface`, `rounded-control` (14px),
  `rounded-card` (22px), `rounded-panel` (28px), `text-2xs` (11px), `text-small` (13px).
  **Não use** hex soltos, `rounded-[Npx]` ou `text-[Npx]` novos — crie token se precisar.
- Cor da marca: **amarelo/dourado** (`amber-300 → amber-500`) para botões e destaques, texto `text-on-brand`.
  Vermelho/rose **só** para erros, alertas e estados críticos.
- Superfícies: classes `.glass` e `.glass-strong`. Cards com `<Spotlight>`.
- Botões: `<Press variant="cta|gold|glass|ghost">` (mola: stiffness 400, damping 25).
- Modais/gavetas: `<Sheet>` (bottom-sheet no celular). Interruptores: `<Switch>`.
- Carregamento: skeletons fiéis ao layout (`<Skeleton>` / `*Skeleton`) — nunca tela em branco.
- **Sem emojis** na interface; use ícones Lucide ou `DishArt`.
- Texto secundário mínimo `text-zinc-400` (contraste). Alvos de toque ≥ 40px.
- Mobile-first; testar em 390px e 1440px.

## Regras de trabalho
- Mudanças pequenas e verificáveis; rode `tsc`, `lint` e `build` ao final.
- Não quebre o fluxo: cliente faz pedido → aparece no admin → avançar status → cliente vê ao vivo → estoque baixa.
- Segredos nunca no código. Chaves só via variáveis de ambiente (Vercel / `.env.local`).
- Toda tabela no Supabase com **RLS ligado**; leitura pública só do cardápio ativo; escrita só autenticado.
- Ao criar migração SQL, salve em `supabase/migrations/` com data no nome.
