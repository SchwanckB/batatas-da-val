# Handoff — Batatas da Val

_Estado do projeto em 26/11/2026._

## 1. O que está pronto

### Cliente (`/`)
- Cardápio com seções dinâmicas (só aparecem as **marcadas no painel** e que têm produtos).
- Busca por nome/ingrediente, carrossel "Mais Pedidos da Noite", produtos esgotados exibidos como **Esgotado**.
- Modal de personalização: tamanho Média/Gigante, 5 adicionais, observações, quantidade.
- Carrinho em gaveta, frete por bairro (Centro R$5, Próximos R$7, Interior R$10, Retirada grátis).
- Checkout: nome, telefone (máscara), endereço, Pix / Cartão na entrega / Dinheiro com troco.
- Confirmação com acompanhamento em tempo real e resumo pelo WhatsApp (51) 9687-0865.
- Animações: item voando ao carrinho, toasts estilo Dynamic Island, skeletons, spotlight nos cards.

### Admin (`/admin`, protegido por login Supabase)
- **Pedidos**: Kanban Novos → Em preparo → Em entrega → Concluídos; observações em destaque; baixa automática de estoque.
- **Cardápio**: seções (criar, renomear, ícone, reordenar, **mostrar/ocultar para clientes**, excluir se vazia) e
  produtos (criar/editar/excluir, foto ou ilustração, preço, tamanho Gigante, selos, destaque, disponível/esgotado,
  adicionais, ficha técnica para baixa de estoque).
- **Caixa**: faturamento, pedidos, ticket médio, saldo da gaveta, por forma de pagamento, reforço/sangria.
- **Estoque**: 9 insumos com níveis OK/Atenção/Crítico e reposição rápida.
- Seções já cadastradas e **ocultas**: Torres de Batata, Xis, Hambúrgueres (com produtos de exemplo).

## 2. Limitação principal (resolver primeiro)
Pedidos, cardápio, caixa e estoque estão em **localStorage** (`src/lib/store.tsx`). Isso sincroniza abas do
mesmo navegador, mas **não entre aparelhos**: um produto criado no notebook não aparece no celular do cliente,
e o pedido do cliente não chega ao painel. A Fase 1 do `PROMPT-MELHORIAS.md` migra tudo para o Supabase.

Fotos enviadas hoje viram data URL (comprimidas a 720px) no localStorage — migrar para Supabase Storage.

## 3. Como rodar
```bash
npm install
cp .env.example .env.local   # preencha as chaves do Supabase
npm run dev
```
Sem as chaves o site do cliente funciona, mas o `/admin` fica fechado (falha segura).

## 4. Configurar Supabase
1. Crie o projeto (via integração da Vercel ou em supabase.com).
2. Copie **Project URL** e **anon/publishable key** para `.env.local` e para as variáveis da Vercel.
3. Authentication → Users → **Add user** (marque Auto Confirm) com o e-mail/senha do dono.
4. Authentication → Sign In / Providers → Email → **desligue "Allow new users to sign up"**.

## 5. Deploy na Vercel
GitHub → vercel.com → Add New Project → importar → conectar Supabase → Deploy.
Nenhuma configuração extra (Next.js detectado automaticamente). Após mudar variáveis: **Redeploy**.

## 6. Mapa de arquivos importante
Ver tabela em `CLAUDE.md`. Pontos de extensão:
- Novo tipo de ilustração: `DishArtSpec` em `types.ts` + componente em `DishArt.tsx` + preset em `ProductEditor.tsx`.
- Novo módulo do admin: `MODULES` em `AdminApp.tsx`.
- Regras de preço/estoque: `unitPriceFor` e `orderConsumption` em `data.ts`.

## 7. Verificação realizada
- `tsc`, `eslint` e `next build` sem erros.
- Teste automatizado (Playwright): pedido do cliente → admin → status ao vivo → baixa de estoque correta;
  login com senha errada/correta, ativar seção "Xis", criar produto, aparecer no cliente, ocultar seção, sair.
- Login testado contra um servidor que **imita** o Supabase Auth — falta testar com o projeto real.
