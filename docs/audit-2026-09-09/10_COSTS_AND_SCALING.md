# Custos de IA e infraestrutura

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## COST-001 — IA sem orçamento, quota ou enforcement de plano

- **ID:** COST-001
- **Severidade:** P0
- **Categoria:** costs
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/routes/admin.js:644`

**Estado atual / Problema:** Endpoints de IA, ingestão e webhook não verificam saldo, status, trial ou limite de uso. Cadastro é aberto.

**Impacto:** Uso automatizado pode consumir o limite do provedor sem limite financeiro imposto pelo SaaS.

**Como reproduzir:** Inspeção dos handlers + cadastro inválido aceito. Não se executou carga paga para provar gasto.

**Correção recomendada:** Reservar orçamento atomicamente por tenant antes de chamada; limites por IP/usuário/tenant; teto global e kill switch.

**Esforço:** M

**Verificação pós-correção:** Tenant sem orçamento retorna 429/402 antes do provider; concorrência não excede teto.

## Premissas explícitas, não telemetria

USD, preço standard sem cache/batch, sem impostos/câmbio. Por entrada respondida: chamada principal 4.000 input +500 output; memória 2.000 input +150 output; embedding de consulta 200 tokens; fator 1,10 sobre geração/memória como reserva hipotética de retries/repair. 10 entradas respondidas por conversa. Embeddings: $0,20/M texto. Tools: zero no runtime atual; não inclui busca Google paga. Ingestão inicial, mídia multimodal e prompts excepcionalmente longos são adicionais. Tokenizadores variam; manter mesmos tokens é comparação aritmética, não equivalência garantida de texto.

Fórmula por mensagem: ((4000*Pin+500*Pout)+(2000*Pin+150*Pout))/1e6*1,10 +200*0,20/1e6.

| Modelo/categoria | Input $/M | Output $/M | Mensagem $ | Conversa $ | 100 conversas $ | 1.000 $ | 10.000 $ |
|---|---:|---:|---:|---:|---:|---:|---:|
| Gemini 3.5 Flash-Lite | 0.30 | 2.50 | 0.003808 | 0.0381 | 3.81 | 38.08 | 380.75 |
| GPT-5.6 Luna | 0.20 | 1.20 | 0.002218 | 0.0222 | 2.22 | 22.18 | 221.80 |
| Claude Haiku 4.5 | 1.00 | 5.00 | 0.010215 | 0.1022 | 10.21 | 102.15 | 1021.50 |
| Claude Sonnet 5 | 2.00 | 10.00 | 0.020390 | 0.2039 | 20.39 | 203.90 | 2039.00 |

Preços consultados em 09/09/2026: [Google](https://ai.google.dev/gemini-api/docs/pricing), [OpenAI Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing). Não usar plano de chat como preço de API. Sonnet 5 está $2/$10 segundo docs atuais (a elevação programada foi cancelada); não copiar preço antigo. Cálculos derivados são cenário, não orçamento contratado.

Contexto acumulado de 20 turnos pode ultrapassar 4 mil tokens, memória também; repair em até duas iterações e timeout sem cancelamento podem custar muito mais que 10%. Em incidente com retries completos usar multiplicador de chamadas real. Ingestão de 1M tokens de texto custa $0,20 só em embedding, mais OCR e overlap; não confundir com custo total do documento.

### Comparação qualitativa

Gemini: integração multimodal existente e baixa mudança; risco SDK legado/fallback. Luna: candidato econômico para texto/extração; sem suporte nativo de áudio no modelo consultado, exige pipeline adicional; qualidade PT-BR não medida. Haiku: candidato de atendimento/tool use; maior custo no cenário, avaliar precisão/latência. Sonnet: escalonamento de casos difíceis, não default por prestígio. Tool calling/structured outputs só importam se ações forem implementadas e autorizadas pelo backend. Rate limits e acesso variam por conta; latências reais NÃO MEDIDAS. Escolha por eval, SLA, região/dados, qualidade e custo.

## Cenários mensais

Hipótese de consumo: 100 conversas/tenant/mês. IA Gemini com premissas acima. Infra base verificada: Supabase Pro a partir de $25 e Vercel Pro $20 (1 assento), sujeito a consumo/compute. Worker/backend, analytics, Sentry, storage extra e e-mail: **PREÇO NÃO VERIFICADO** para a configuração necessária. Não foram colocados como zero no total.

| Clientes | Conversas/mês | IA estimada $ | Base Supabase+Vercel $ | Subtotal conhecido $ | Outros |
|---:|---:|---:|---:|---:|---|
| 10 | 1000 | 38.08 | 45,00 (piso) | 83.08 | host/worker + extras + Meta conforme uso |
| 100 | 10000 | 380.75 | 45,00 (piso) | 425.75 | host/worker + extras + Meta conforme uso |
| 1000 | 100000 | 3807.50 | 45,00 (piso) | 3852.50 | host/worker + extras + Meta conforme uso |

Subtotal não é custo final nem garantia de que compute mínimo atende 1000 clientes. [Supabase pricing](https://supabase.com/pricing), [Vercel pricing](https://vercel.com/pricing). Hobby Vercel é pessoal/não comercial; DEPLOY.md diverge. [Render pricing](https://render.com/pricing) consultado mas valores de compute não foram extraídos; não adotar automaticamente $7 antigo.

Meta: mensagens de serviço na janela de 24h são sem cobrança Meta segundo página oficial; marketing/utility/authentication/templates exigem quantidade, categoria e país. Se cenário for só serviço dentro da janela, componente Meta dessas mensagens é $0; templates: **PREÇO NÃO VERIFICADO**, calcular Ncategoria*tarifa. [Fonte](https://whatsappbusiness.com/products/platform-pricing/).

Margem comercial não pode ser concluída de R$197 fictícios na UI. Medir custo p95/tenant, limite de mensagens/tokens, operação humana, impostos, inadimplência e suporte; cobrar excedente apenas conforme contrato e backend. Teto diário/mensal e kill switch antes do piloto.
