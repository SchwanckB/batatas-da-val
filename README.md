# Batatas da Val • Delivery

Cardápio digital e painel de gestão da batataria, com cara de cardápio de esquina e dados no
servidor — o pedido feito no celular do cliente cai no painel da cozinha na hora.

- **Clientes** → `/` — cardápio, personalização, sacola, checkout, Pix com QR Code e
  acompanhamento ao vivo
- **Acompanhar pedido** → `/pedido/[token]` — link público, sem cadastro
- **Painel** → `/admin` — login próprio. Pedidos, Cardápio, Caixa, Estoque, Entrega, Cupons,
  Relatórios, Loja e Equipe

> Continuando no VS Code com o Claude? Leia `docs/HANDOFF.md` e `CLAUDE.md`.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide ·
**Redis da Vercel** · zod · qrcode.

---

## 1. Rodar no seu computador

Requisitos: Node.js 20+ (recomendado 22).

```bash
npm install
cp .env.example .env.local
npm run dev
```

No `.env.local` preencha pelo menos:

```bash
AUTH_SECRET=cole-aqui-um-valor-longo-e-aleatorio
ADMIN_PASSWORD=sua-senha-do-primeiro-acesso
```

Para gerar o `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Abra `http://localhost:3000` (clientes) e `http://localhost:3000/admin` (painel). Sem Redis
configurado, o modo de desenvolvimento guarda os dados em `.data/kv.json` na própria pasta.

Primeiro acesso: usuário `dono` (ou o que estiver em `ADMIN_LOGIN`) com a senha de
`ADMIN_PASSWORD`. Em desenvolvimento, sem essas variáveis, vale `dono` / `batatas`.

## 2. Publicar na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com → **Add New → Project** → importe o repositório (Next.js é detectado sozinho).
3. **Storage → Redis** → crie o banco e conecte ao projeto. A Vercel cria a `REDIS_URL` sozinha.
   (Também funciona com Upstash pela Marketplace, que cria `KV_REST_API_URL` e `KV_REST_API_TOKEN`.)
4. Em **Settings → Environment Variables**, adicione:
   - `AUTH_SECRET` — o valor gerado acima
   - `ADMIN_PASSWORD` — senha do primeiro acesso
   - `NEXT_PUBLIC_SITE_URL` — o endereço final do site
5. **Redeploy**. Entre em `/admin/login`, faça o primeiro acesso e cadastre o resto da equipe
   no módulo **Equipe**.

Se faltar `AUTH_SECRET` ou o Redis, a tela de login diz exatamente o que está faltando em vez de
falhar em silêncio.

## 3. O dia a dia da loja

| Quero… | Onde |
| --- | --- |
| Ver e avançar pedidos, imprimir comanda, cancelar | Pedidos |
| Mudar preço, esgotar um item, criar seção | Cardápio |
| Mudar frete, tempo de entrega, adicionais | Entrega |
| Criar cupom de desconto | Cupons |
| Pausar pedidos ou avisar "hoje vai demorar" | Loja |
| Mudar horário de funcionamento | Loja |
| Abrir e fechar o caixa do turno | Caixa |
| Repor insumo | Estoque |
| Ver quanto vendeu e o que mais sai | Relatórios |
| Dar acesso para alguém da equipe | Equipe |

Os avisos escritos em **Loja → Avisos na tela inicial** aparecem em faixa no topo do cardápio,
e o selo Aberto/Fechado segue o horário cadastrado (fuso de São Paulo, incluindo quando a loja
fecha depois da meia-noite).

## 4. Comandos

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run lint         # ESLint
npx tsc --noEmit     # checagem de tipos
```

Para testar o build de produção na própria máquina, sem Redis:

```bash
BDV_ALLOW_FILE_STORAGE=1 AUTH_SECRET=teste ADMIN_PASSWORD=batatas npm start
```

## 5. Como os dados ficam guardados

Todo o estado da loja (cardápio, pedidos, caixa, estoque, configurações) é um documento JSON no
Redis, com contador de revisão e trava para não haver corrida entre o pedido do cliente e o
clique do painel. Preço, frete, cupom e horário são sempre recalculados no servidor: o navegador
nunca decide quanto custa.
