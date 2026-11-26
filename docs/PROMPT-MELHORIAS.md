# O que já foi feito e o que ainda dá para fazer

> As fases 1 a 5 do roteiro antigo (Supabase) foram executadas — com Redis da Vercel no lugar do
> Supabase, a pedido. O que sobrou está em "Próximos passos". Para pedir uma melhoria ao Claude
> Code, cole um bloco por vez e revise antes de seguir.

---

## Já entregue

| Tema | Onde ver |
| --- | --- |
| Dados no servidor (Redis), um estado por loja, com trava e revisão | `src/lib/server/` |
| Preço, frete, cupom e horário recalculados no servidor | `src/lib/pricing.ts` |
| Login próprio com papéis (dono, cozinha, caixa) e histórico | `src/lib/server/auth.ts`, módulo Equipe |
| Configurações da loja: horários, pausa, avisos, Pix, pedido mínimo | módulo Loja |
| Bairros, fretes, tempos e adicionais editáveis | módulo Entrega |
| Cupons de desconto | módulo Cupons |
| Bipe + notificação de pedido novo, comanda 80 mm, cancelamento | módulo Pedidos |
| Turno de caixa com conferência e CSV | módulo Caixa |
| Relatórios com gráficos e CSV | módulo Relatórios |
| Meus pedidos, pedir de novo, Pix com QR, avaliação, `/pedido/[token]` | cliente |
| PWA, SEO local com JSON-LD, sitemap, robots | `src/app/` |
| Redesign tirando a "cara de IA" | `globals.css` + `src/components/` |

---

## Próximos passos

### 1. Fotos de verdade
```
Hoje os produtos usam ilustração vetorial (DishArt). Isso resolve, mas três batatões
diferentes ficam parecidos demais na tela. Quero trocar por fotos.

1. Suba as fotos pelo painel (Cardápio → produto → Enviar foto) e confira como a lista
   do cardápio e o carrossel ficam com imagem real.
2. Se as fotos forem pesadas, troque o data URL por um bucket externo (Vercel Blob) e
   guarde só a URL no estado. Mantenha a compressão de `src/lib/image.ts`.
3. Ajuste o enquadramento: a vitrine é quadrada na lista e 16:9 no destaque.
```

### 2. Testes automatizados que ficam no repositório
```
Crie testes end-to-end com Playwright em tests/, rodando contra o build de produção com
BDV_ALLOW_FILE_STORAGE=1:
- pedido completo do cliente até a confirmação;
- login do painel, avanço de status e baixa de estoque;
- loja fechada bloqueia o checkout;
- cupom inválido é recusado pelo servidor.
Adicione o script "test:e2e" no package.json e documente como rodar.
```

### 3. Avisar o cliente sem ele estar com o site aberto
```
Hoje o acompanhamento só atualiza com a página aberta. Avalie:
- Web Push no PWA (precisa de chave VAPID e de um worker para a assinatura), ou
- uma mensagem automática no WhatsApp quando o pedido sai para entrega.
Compare esforço e custo antes de implementar e me mostre a recomendação.
```

### 4. Impressão automática
```
A comanda hoje abre o diálogo de impressão do navegador. Se a loja tiver impressora térmica
de rede, implemente impressão direta (ESC/POS via ponte local) com opção de ligar/desligar
no módulo Loja.
```

### 5. Medir e cuidar
```
1. Vercel Analytics e Speed Insights.
2. Revisão de acessibilidade com leitor de tela no fluxo de pedido.
3. Checklist de lançamento: domínio próprio, política de privacidade (LGPD) e um backup
   periódico do estado do Redis (exportar o JSON para o Blob uma vez por dia).
```

---

## Prompts rápidos úteis

```
Revise a tela X no celular (390px) e no desktop e liste melhorias de hierarquia, espaçamento
e contraste seguindo o design system do CLAUDE.md. Depois aplique.
```

```
Adicione o produto "<nome>" na seção "<seção>" por R$ <valor> direto no seed de src/lib/data.ts
(ou me diga como cadastrar pelo painel, se for mais rápido).
```

```
Encontre e corrija qualquer cor, raio ou tamanho de fonte fora dos tokens do design system.
```

```
Rode npx tsc --noEmit, npm run lint e npm run build e me diga o estado do projeto.
```
