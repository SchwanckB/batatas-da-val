# CLAUDE.md — Batatas da Val (delivery)

Contexto para o Claude Code. Leia antes de qualquer mudança. Estado atual em `docs/HANDOFF.md`;
o que ainda falta em `docs/PROMPT-MELHORIAS.md`.

## Produto
Cardápio digital + painel de gestão de uma batataria de delivery em Três Cachoeiras - RS.
- `/` — cliente: cardápio, personalização, sacola, checkout, acompanhamento ao vivo.
- `/pedido/[token]` — página pública de acompanhamento (link que o cliente guarda).
- `/admin` — dono e equipe (login próprio): Pedidos, Cardápio, Caixa, Estoque, Entrega, Cupons,
  Relatórios, Loja e Equipe.
- Público brasileiro, maioria no celular. **Toda a interface em português do Brasil.**

## Comandos
```bash
npm run dev          # desenvolvimento (http://localhost:3000)
npm run build        # build de produção — rode antes de dizer que terminou
npm run lint         # ESLint
npx tsc --noEmit     # checagem de tipos
```

## Variáveis de ambiente
Ver `.env.example`. As que importam:

| Variável | Para quê |
| --- | --- |
| `REDIS_URL` | Banco (Vercel → Storage → Redis). A Vercel injeta sozinha ao conectar. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Alternativa via REST (Upstash pela Marketplace). |
| `AUTH_SECRET` | Assina o cookie de sessão do painel. **Sem ela o `/admin` fica fechado.** |
| `ADMIN_LOGIN` / `ADMIN_PASSWORD` | Só no primeiro login, para criar o dono. Depois use o módulo Equipe. |
| `NEXT_PUBLIC_SITE_URL` | Metadados, Open Graph e sitemap. |
| `BDV_ALLOW_FILE_STORAGE=1` | Só para testar o build local sem Redis. Nunca em produção. |

Sem Redis, o `npm run dev` guarda tudo em `.data/kv.json` (ignorado pelo git).

## Stack
Next.js 16 (App Router) · React 19 · TypeScript estrito · Tailwind CSS v4 (config em CSS, sem
tailwind.config) · Framer Motion · Lucide React · **Redis da Vercel** (pacote `redis`, ou REST) ·
zod na validação · qrcode no Pix. Deploy na Vercel.

## Arquitetura

### Dados — o servidor é a fonte da verdade
O estado inteiro da loja é **um documento JSON no Redis** (`bdv:state:v3`), com um contador de
revisão (`bdv:rev`) e uma trava (`bdv:lock`) para evitar corrida entre o pedido do cliente e o
clique do painel. Nada de preço, frete ou desconto vem do navegador.

| Pasta / arquivo | Papel |
| --- | --- |
| `src/lib/types.ts` | Tipos de domínio (Product, Order, StoreSettings, Coupon, User…) |
| `src/lib/data.ts` | Seed, buscas puras (`findProduct`, `findExtra`…) e regras de preço/consumo |
| `src/lib/actions.ts` | **Reducer puro** `applyAction` + permissões por papel. Roda igual no cliente (otimista) e no servidor (verdade) |
| `src/lib/pricing.ts` | `quoteOrder`: recalcula itens, frete, cupom e total. Única fonte de valores |
| `src/lib/hours.ts` | Aberto/fechado no fuso `America/Sao_Paulo`, inclusive virada de meia-noite |
| `src/lib/coupon.ts`, `src/lib/pix.ts` | Regras de cupom e BR Code do Pix |
| `src/lib/server/redis.ts` | Adaptador Redis: TCP, REST ou arquivo local |
| `src/lib/server/state.ts` | `loadState` / `mutate` (com trava) / `publicState` / `adminState` |
| `src/lib/server/auth.ts`, `src/lib/auth/session.ts` | Senha com PBKDF2 e cookie assinado (HMAC) |
| `src/lib/server/schemas.ts` | zod para tudo que entra pela API |
| `src/lib/menuStore.tsx` | Estado do cliente: cardápio, sacola, cupom, meus pedidos |
| `src/lib/adminStore.tsx` | Estado do painel: otimista + polling por revisão |
| `src/app/api/*` | Rotas: menu, pedidos, cupom, ações do painel, login |
| `src/middleware.ts` | Protege `/admin/*` conferindo o cookie assinado |
| `src/components/client/*` | Telas do cliente |
| `src/components/admin/*` | Módulos do painel (+ `kit.tsx` com as peças repetidas) |
| `src/components/ui/*` | Base (Press, Sheet, Switch, Skeleton, Logo, ToastStack, Backdrop) |
| `src/components/client/DishArt.tsx` | Ilustrações SVG dos produtos (quando não há foto) |

### Ao vivo
Sem WebSocket: o cliente e o painel perguntam a revisão atual (`?rev=N`) e só baixam o estado
quando ele muda. Painel a cada 5s, cliente a cada 20s (8s com pedido em andamento), sempre
pausando quando a aba está escondida.

## Design system — obrigatório seguir
A cara é de **cardápio de esquina impresso**, não de landing page. Tokens em
`src/app/globals.css` (`@theme`).

- **Cores**: preto quente `bg-ink` / `bg-surface`, faixa creme `.papel` para o cardápio,
  dourado da marca (`gold`, ou `amber-300/400/500`, que apontam para ele), `brasa` **só** para
  erro e alerta, `aberto` para o selo de atendimento. Nada de hex solto.
- **Tipografia**: `.letreiro` (Anton, caixa alta) **só nos momentos de marca** — nome da loja,
  título do herói, "Cardápio" e os nomes das seções. Título de tela, de gaveta e de card usa o
  corpo em negrito, em caixa normal. Instrument Sans no corpo; `.tnum` em todo número.
- **Superfícies**: `.panel` e `.panel-strong` — vidro quente (blur + degradê sutil sobre o preto
  da marca). Bolha flutuante no fundo e texto com gradiente **não existem**: eram o que dava
  cara de template de IA.
- **Botões**: `<Press variant="cta|gold|panel|outline|ghost|danger">`. O dourado (`.btn-gold`) tem
  degradê curto, borda inferior sólida e um brilho quente discreto — nada de néon.
- **Raios**: `rounded-control` (12px), `rounded-card` (18px), `rounded-panel` (24px).
  Não crie `rounded-[Npx]` nem `text-[Npx]` novos — crie token se precisar.
- **Cardápio**: lista com linha pontilhada (`.guia`) até o preço, não grade de cards iguais.
- **Animações**: mantenha. Mola `stiffness 400 / damping 25` (`spring` em `Press.tsx`), item
  voando até a sacola, toasts, skeletons fiéis ao layout.
- **Sem emojis** na interface; use ícones Lucide ou `DishArt`.
- **Texto**: toda frase visível começa com maiúscula, inclusive rótulo curto e valor de lista
  ("Sem taxa", "Turno atual", "Por pedido concluído"). Nada de tom de conversa jogada
  ("fale com a gente"): escreva como um comércio que se leva a sério.
- Evite rótulos em CAIXA ALTA espaçada e sequências `A · B · C`: use estrutura (linhas, filetes).
- Texto secundário mínimo `text-zinc-400`. Alvos de toque ≥ 44px. Testar em 390px e 1440px.

## Regras de trabalho
- Mudanças pequenas e verificáveis; rode `tsc`, `lint` e `build` ao final.
- Não quebre o fluxo: cliente pede → cai no painel → status avança → cliente vê ao vivo → estoque baixa.
- Toda ação nova do painel entra no reducer `applyAction` **e** no schema zod correspondente.
- Preço, frete e desconto só mudam em `quoteOrder`. Nunca confie no que o navegador manda.
- Segredos nunca no código. Só por variável de ambiente.
- O que o cliente enxerga passa por `publicState` — a chave Pix e os usuários ficam de fora.
