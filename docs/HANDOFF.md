# Handoff — Batatas da Val

_Estado do projeto em 25/11/2026._

## 1. O que mudou nesta rodada

**Saiu o Supabase, entrou o Redis da Vercel.** O estado da loja agora vive no servidor, e não
mais no navegador: o pedido feito no celular do cliente cai no painel do notebook na hora.

**O visual foi refeito.** O dark glassmorphism com bolhas animadas, texto em gradiente e grade
de cards idênticos dava cara de template. No lugar: preto quente de chapa, faixa creme de papel
para o cardápio, letreiro condensado (Anton) e o cardápio em lista com linha pontilhada até o
preço — como um cardápio impresso. As animações continuam todas.

## 2. O que está pronto

### Cliente (`/`)
- **Cardápio completo numa página só**: todas as seções listadas, barra de categorias fixa que
  leva até cada uma e se marca sozinha ao rolar, preço por tamanho (Média e Gigante) em linhas
  próprias, bloco de adicionais e as observações da casa no rodapé do cardápio.
- Busca por nome ou ingrediente filtrando todas as seções de uma vez, e carrossel dos mais pedidos.
- Faixa de **avisos escritos no painel** ("alta demanda hoje…") no topo do cardápio.
- Selo **Aberto/Fechado calculado pelo horário real** (fuso de São Paulo, vira a meia-noite).
  Fora do horário o cardápio continua visível e o checkout fica bloqueado com a explicação.
- Modal do produto: tamanho Média/Gigante, adicionais, observação, quantidade.
- Sacola, frete por área de entrega, **cupom de desconto** validado no servidor, pedido mínimo.
- Checkout com Pix, cartão na entrega ou dinheiro com troco.
- Confirmação com acompanhamento ao vivo, **QR Code do Pix** com valor preenchido, resumo no
  WhatsApp e link permanente do pedido.
- **Meus pedidos**: histórico do aparelho, acompanhar de novo e "pedir de novo".
- **Avaliação** de 1 a 5 estrelas depois que o pedido é entregue.
- PWA: dá para instalar na tela inicial e o cardápio abre sem internet.
- SEO local: metadados, Open Graph, JSON-LD de Restaurant com horários, sitemap e robots.

### Painel (`/admin`, login próprio)
- **Pedidos**: Kanban Novos → Em preparo → Em entrega → Concluídos, com observações em destaque,
  baixa automática de estoque, **bipe e notificação** quando chega pedido novo,
  **impressão de comanda 80 mm** e **cancelamento com motivo** (devolve insumo e libera o cupom).
- **Cardápio**: seções (criar, renomear, ícone, reordenar, mostrar/ocultar) e produtos
  (foto ou ilustração, preços, selos, destaque, disponível/esgotado, ficha técnica).
- **Caixa**: abertura de turno com fundo de troco, faturamento, formas de pagamento, reforço e
  sangria, **fechamento com conferência e diferença**, exportação em CSV.
- **Estoque**: insumos com níveis, reposição rápida e cadastro de novos insumos.
- **Entrega**: áreas, **fretes e tempos editáveis**, retirada no local, e os **adicionais**
  (nome, preço e qual insumo baixa).
- **Cupons**: valor fixo ou porcentagem, validade, limite de usos, pedido mínimo.
- **Relatórios**: vendas por dia, horários de pico, mais vendidos, formas de pagamento, por
  área, avaliações, e CSV de tudo.
- **Loja**: horários por dia, pausar pedidos com recado, avisos da tela inicial, pedido mínimo,
  tempo de preparo, contato e chave Pix.
- **Equipe**: acessos com papel (dono, cozinha, caixa) e **histórico de alterações**.

## 3. Como rodar
```bash
npm install
cp .env.example .env.local    # preencha AUTH_SECRET e ADMIN_PASSWORD
npm run dev
```
Sem Redis configurado, o modo de desenvolvimento guarda tudo em `.data/kv.json`. Para testar o
build de produção na própria máquina: `BDV_ALLOW_FILE_STORAGE=1 npm start`.

Primeiro login: usuário `ADMIN_LOGIN` (padrão `dono`) com a senha de `ADMIN_PASSWORD`. Em
desenvolvimento, sem essas variáveis, vale `dono` / `batatas`. Depois do primeiro acesso,
gerencie as pessoas no módulo **Equipe** e troque a senha por lá.

## 4. Configurar na Vercel
1. Importe o repositório. Next.js é detectado sozinho.
2. **Storage → Redis** → criar e conectar ao projeto. Isso cria a `REDIS_URL`.
3. Em Settings → Environment Variables, adicione:
   - `AUTH_SECRET` — gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `ADMIN_PASSWORD` — senha do primeiro acesso
   - `NEXT_PUBLIC_SITE_URL` — o domínio final
4. Redeploy. Entre em `/admin/login` e crie o resto da equipe.

Se faltar `AUTH_SECRET` ou Redis, o painel avisa na tela de login em vez de falhar escondido.

## 5. Segurança
- Sessão em cookie `httpOnly` assinado com HMAC-SHA256; senha com PBKDF2 (120 mil iterações).
- Preço, frete, desconto e horário são recalculados no servidor a cada pedido.
- Limites por IP: 8 pedidos a cada 15 min, 10 tentativas de login a cada 5 min, 20 tentativas de
  cupom a cada 2 min.
- Toda entrada da API passa por zod.
- O cliente nunca recebe a chave Pix nem a lista de usuários (`publicState` filtra).
- O acompanhamento público usa um token aleatório, nunca o número do pedido.

## 6. Verificação feita
- `npx tsc --noEmit`, `npm run lint` e `npm run build` sem erro.
- Teste automatizado (Playwright) contra o **build de produção**: cliente adiciona item, fecha o
  pedido, o painel recebe, o dono entra com login próprio, avança o status e o cliente vê a
  mudança ao vivo. Telas conferidas em 390 px e 1440 px.
- Falta testar com um Redis de verdade na Vercel: o teste local usou o modo arquivo.

## 7. Pontos de extensão
- Nova ilustração: `DishArtSpec` em `types.ts` + componente em `DishArt.tsx` + preset em `ProductEditor.tsx`.
- Novo módulo do painel: `MODULES` em `AdminApp.tsx` (com os papéis que podem ver).
- Nova ação: `Action` em `actions.ts` → `applyAction` → schema em `server/schemas.ts`.
- Regras de preço e estoque: `quoteOrder` em `pricing.ts` e `orderConsumption` em `data.ts`.
