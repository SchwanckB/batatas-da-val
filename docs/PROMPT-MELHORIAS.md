# Prompt de melhorias — cole no Claude Code (VS Code)

> Como usar: abra a pasta do projeto no VS Code, abra o painel do **Claude Code** e cole **um bloco por vez**
> (comece pelo "Prompt inicial" e depois uma fase de cada vez). Revise e teste antes de seguir para a próxima.

---

## Prompt inicial (cole primeiro)

```
Leia CLAUDE.md e docs/HANDOFF.md. Este é o sistema de delivery da Batatas da Val
(Next.js 15 + Tailwind v4 + Framer Motion + Supabase, deploy na Vercel).

Objetivo: transformar o protótipo em um SaaS de delivery profissional, mantendo o
design system atual (Liquid Glass, botões dourados, sem emojis, tudo em pt-BR).

Antes de codar:
1. Rode npm install, npx tsc --noEmit, npm run lint e npm run build e me diga o estado.
2. Resuma a arquitetura em 10 linhas para eu confirmar que você entendeu.
3. NÃO comece nenhuma fase sem eu pedir. Vamos fase por fase do docs/PROMPT-MELHORIAS.md.

Regras para todas as fases:
- Planeje antes (lista de arquivos e passos), espere meu OK, depois implemente.
- Siga os tokens e componentes do design system (Press, Sheet, Switch, Spotlight, Skeleton).
- Mobile-first. Teste em 390px e 1440px.
- Ao terminar: tsc + lint + build sem erros e um resumo do que testar manualmente.
- Faça um commit por fase com mensagem clara em português.
```

---

## Fase 1 — Dados reais no Supabase (base de tudo)

```
Fase 1: migrar o estado de localStorage para o Supabase.

1. Crie supabase/migrations/<data>_inicial.sql com tabelas:
   sections, products, extras, neighborhoods (bairro, taxa, tempo), ingredients (estoque),
   orders, order_items, order_status_history, cash_entries, store_settings
   (nome, telefone, whatsapp, instagram, cidade, horários por dia, loja_pausada, pedido_minimo).
   Use uuid, created_at/updated_at, valores em centavos (integer).
2. RLS em todas: leitura pública apenas de sections ativas, products disponíveis,
   extras, neighborhoods e store_settings. Cliente anônimo pode INSERIR orders/order_items
   (via função RPC create_order que recalcula preços no servidor — nunca confiar no preço do navegador).
   Todo o resto só para usuários autenticados (admin).
3. Seed com os dados de src/lib/data.ts.
4. Reescreva src/lib/store.tsx mantendo a MESMA interface pública (useStore), trocando a
   persistência por Supabase. Use Supabase Realtime em orders para o painel e para o
   acompanhamento do cliente atualizarem ao vivo. Carrinho continua no localStorage.
5. Baixa de estoque e mudança de status via RPC (transação) para não haver corrida.
6. Fotos de produto no Supabase Storage (bucket "produtos", público para leitura).
7. Página /pedido/[id] para o cliente acompanhar pelo link (use um token público do pedido, não o id sequencial).
Me mostre o SQL antes de aplicar.
```

## Fase 2 — Operação da loja

```
Fase 2: operação.
1. Configurações da loja no admin (novo módulo "Loja"): dados de contato, horários por dia da
   semana, botão "Pausar pedidos", pedido mínimo, tempo médio de preparo.
2. Badge Aberto/Fechado calculado pelo horário real (fuso America/Sao_Paulo). Fora do horário:
   cardápio visível, checkout bloqueado com mensagem "Abrimos qua a dom a partir das 19:30".
3. Bairros e taxas editáveis no admin. Adicionais editáveis (nome, preço, ingrediente do estoque).
4. Cupons de desconto (valor fixo ou %, validade, uso máximo, pedido mínimo) aplicados no checkout
   e validados no servidor.
5. Alerta sonoro + notificação do navegador quando chega pedido novo no admin.
6. Imprimir comanda (layout 80mm térmica) a partir do card do pedido.
7. Cancelar pedido com motivo; estorna estoque se já tinha baixado.
```

## Fase 3 — Experiência do cliente

```
Fase 3: cliente.
1. Identificação leve pelo telefone (salvar nome/endereço no aparelho; opcional OTP por SMS depois).
2. "Meus pedidos" com histórico e botão "Pedir de novo".
3. Pix com QR Code e "copia e cola" gerados a partir da chave da loja (BR Code estático com valor).
4. PWA: manifest, ícones a partir de public/logo.png, instalar na tela inicial, offline do cardápio.
5. SEO local: metadata, Open Graph com a logo, JSON-LD Restaurant (endereço, horário, telefone), sitemap.
6. Avaliação do pedido (1–5 estrelas + comentário) após "Entregue", visível no admin.
```

## Fase 4 — Gestão e relatórios

```
Fase 4: gestão.
1. Relatórios no admin: vendas por dia/semana/mês, produtos mais vendidos, ticket médio,
   horários de pico, formas de pagamento, bairros. Gráficos leves e acessíveis.
2. Abertura e fechamento de caixa por turno (fundo de troco, conferência, diferença).
3. Usuários e papéis: dono (tudo), cozinha (só pedidos), caixa (pedidos + caixa). Convite por e-mail.
4. Histórico de alterações (quem mudou preço/estoque e quando).
5. Exportar relatórios em CSV.
```

## Fase 5 — Qualidade e lançamento

```
Fase 5: qualidade.
1. Testes E2E com Playwright: pedido completo, login admin, criar produto, ocultar seção.
2. Vercel Analytics + Speed Insights. Monitorar erros.
3. Revisão de acessibilidade (contraste, foco, leitores de tela, alvos de toque).
4. Revisão de segurança: RLS, rate limit no create_order, validação de entrada com zod.
5. Checklist de lançamento: domínio próprio, e-mails do Supabase em pt-BR, política de privacidade (LGPD).
```

---

## Prompts rápidos úteis

```
Revise visualmente a tela X no celular (390px) e no desktop e liste melhorias de hierarquia,
espaçamento e contraste seguindo o design system do CLAUDE.md. Depois aplique.
```

```
Adicione o produto "<nome>" na seção "<seção>" com preço R$ <valor> pelo seed do Supabase.
```

```
Encontre e corrija qualquer cor, raio ou tamanho de fonte fora dos tokens do design system.
```
