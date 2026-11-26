# Batatas da Val • Delivery

Cardápio digital premium + painel administrativo protegido por login (Supabase), estética **Liquid Glass Gourmet**.

- **Clientes** → `/` — cardápio, personalização, carrinho, checkout e acompanhamento do pedido
- **Admin** → `/admin` — só pela URL, exige e-mail e senha. Kanban de pedidos, Caixa e Estoque.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide · Supabase Auth.

---

## 1. Rodar no seu computador

Requisitos: Node.js 20+ (recomendado 22).

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase (passo 3)
npm run dev
```

Abra `http://localhost:3000` (clientes) e `http://localhost:3000/admin` (painel).

## 2. Publicar na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com → **Add New → Project** → importe o repositório (framework detectado: Next.js, nenhuma configuração extra).
3. Conecte o Supabase (passo 3) **antes** do primeiro deploy, ou faça **Redeploy** depois de conectar.

Pelo terminal, alternativa:

```bash
npm i -g vercel
vercel link
vercel integration add supabase   # cria o projeto Supabase e já injeta as variáveis
vercel env pull .env.local        # traz as variáveis para rodar localmente
vercel --prod
```

## 3. Supabase (login do painel)

A integração Supabase da Vercel cria automaticamente `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Se usar um projeto Supabase já existente, cadastre essas
duas variáveis em **Vercel → Project → Settings → Environment Variables** (valores em
Supabase → Project Settings → API).

Criar o usuário do painel (no dashboard do Supabase):

1. **Authentication → Users → Add user → Create new user** — informe e-mail e senha e marque *Auto Confirm User*.
2. **Authentication → Sign In / Providers → Email**: desative **Allow new users to sign up**, para ninguém criar conta sozinho.

Como funciona a proteção:
- `src/middleware.ts` bloqueia qualquer rota `/admin` sem sessão e redireciona para `/admin/login`.
- `src/app/admin/page.tsx` confere o usuário de novo no servidor (segunda camada).
- Sem as variáveis do Supabase o painel fica **fechado** (falha segura).
- `/admin` não é indexado por buscadores e não há link para ele no site dos clientes.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Cardápio, preços, adicionais, bairros/frete, estoque inicial | `src/lib/data.ts` |
| Ilustrações dos produtos | `src/components/client/DishArt.tsx` |
| Tokens de design (cores, raios, tipografia) | `src/app/globals.css` |
| Dados da loja (telefone, horário, Instagram) | `src/lib/format.ts` (`STORE`) |
| Login / proteção do admin | `src/middleware.ts`, `src/lib/supabase/*`, `src/app/admin/*` |

## ⚠️ Importante antes de usar com clientes reais

Pedidos, caixa e estoque ainda ficam salvos **no navegador** (localStorage). Isso sincroniza
abas do mesmo navegador (ótimo para demonstração), mas **um pedido feito no celular do cliente
não chega ao painel em outro aparelho**. O próximo passo é gravar esses dados em tabelas do
Supabase (com Realtime para o painel atualizar ao vivo).
