# Decisão final da stack

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Decisões objetivas

**Supabase MANTER. Vercel MANTER frontend. Render NÃO USAR como adição redundante.** O runtime real exige um host persistente; se Railway já atende, ficar nele. Se ainda não há host, Render é opção válida; escolher um, não ambos.

| Camada | Atual | Manter/Trocar | Recomendada | Problema/Motivo | Quando reconsiderar |
|---|---|---|---|---|---|
| Frontend | React/Vite/Tailwind | manter | React/Vite | sem rewrite; corrigir comportamentos | se SEO dinâmico justificar SSR |
| Backend/API | Express monolítico | manter | Express + serviços extraídos gradualmente | corrigir segurança sem redesenho total | complexidade mensurada |
| Hosting frontend | Vercel SPA | manter | Vercel comercial | CDN e deploy adequados | custo/limites medidos |
| Hosting backend | guia Railway/PM2; real não confirmado | confirmar/manter | um host persistente Railway OU Render | SSE e consumidor precisam duração | SLA/região/custo |
| Banco | Supabase PostgreSQL | manter | Supabase com baseline/grants | evitar migração sem ganho | custo/conexões/limites medidos |
| Auth | bcrypt/JWT próprio | trocar gradualmente | Supabase Auth + autorização do backend | reset/MFA/sessão gerenciados; mapear users/tenant | antes de ampliar cadastro público |
| Storage | não implementado | não adicionar agora | Supabase Storage privado se reter arquivo original | sem bucket só para parecer completo | necessidade de download/reprocessamento |
| Queue | Maps/timers | trocar | inbox/outbox PostgreSQL | durabilidade sem Redis adicional | throughput/latência da fila |
| Worker | mesmo processo | adicionar separação lógica | consumidor com lease; processo separado quando possível | recovery e serialização | antes de múltiplas instâncias |
| Cache | Maps; dedup GET | manter seletivo | cache bounded; Redis não obrigatório | não usar cache como fonte de verdade | carga justificar |
| IA | Google SDK legado/Gemini | atualizar | SDK @google/genai + mesma família avaliada | compatibilidade/manutenção | eval e SLA |
| Fallback IA | mesmo modelo live | corrigir | modelo distinto + handoff seguro | falha previsível; provider2 depois | indisponibilidade medida |
| Embeddings/vector DB | Gemini embedding-2 + RPC ausente | manter após comprovar | pgvector no Supabase com dimensão compatível | não precisa vector DB novo | qualidade/performance de recuperação |
| WhatsApp | Meta Cloud API HTTP | manter | Meta oficial com assinatura/templates/estado | não migrar para automação não oficial | ciclo de versão/API |
| Pagamentos | não implementado | adicionar quando necessário | cobrança manual no piloto; Stripe se checkout | entitlement e quota primeiro | antes de self-service pago |
| E-mail | não implementado | adicionar | SMTP transacional para auth | reset/confirm essenciais | volume/região; comparar Resend/Postmark/SES |
| Analytics | stats e página própria | corrigir | definições reais; poucos eventos PostHog opcional | não medir resolução por IA ligada | necessidade de funil |
| Error tracking | console | adicionar | Sentry com redaction | centralizar exceções | volume/teto |
| Logs | console/PM2 | corrigir | JSON no host + retenção curta | correlação sem conteúdo pessoal | busca/alerta justificar agregador |
| Uptime | health superficial | adicionar | monitor externo + readiness/worker heartbeat | detectar falha real | SLO mais exigente |
| CI/CD | não versionado | adicionar | GitHub Actions + branch protection | gates reprodutíveis | tempo de pipeline |
| Tests | Node asserts e mocks | ampliar | Postgres real/E2E/golden conversations | regressão de segurança | novas integrações |
| Secrets | env/server e token DB text | corrigir | env segregado + token cifrado + secret manager do host | menor exposição | compliance/rotação |
| Feature flags | não implementadas | depois | flags simples por tenant no DB | beta sem ferramenta adicional | rollout complexo |
| Cron | só limpeza Map | adicionar dirigido | retenção/recovery controlados | funções operacionais necessárias | volume |
| Rate limit | não existe | adicionar agora | IP/usuário/tenant e budget atômico | evitar abuso/custo | distribuição exige estado compartilhado |

### Alternativas avaliadas

Neon/Postgres gerenciado mantêm modelo relacional, mas exigem recompor Data API/auth/ops: sem benefício provado. Firebase implicaria remodelagem e queries diferentes; não resolve SSE inseguro. PlanetScale/outro SQL sem requisito específico não justifica migração. Supabase oferece opções não usadas, mas não é obrigação adotá-las todas.

Render/Railway ajustam-se ao processo atual; Cloud Run/Fly permitem containers mas aumentam decisões operacionais (CPU após resposta, escala, conexões/SSE). Vercel é adequada ao frontend; portar timers para funções sem inbox durável piora risco. Custos/limites de cada conta ainda não medidos.

Filas: Supabase Queues/pgmq pode reutilizar Postgres; inbox/outbox própria exige leases e testes. QStash/Cloud Tasks entregam HTTP e exigem idempotência/assinatura; Inngest/Trigger.dev oferecem workflows mas adicionam fornecedor; BullMQ/Redis adiciona datastore. Escolha inicial: persistência PostgreSQL e consumidor simples, revisada após carga. [Supabase Queues](https://supabase.com/docs/guides/queues), [Render workers](https://render.com/docs/background-workers).

### Arquitetura recomendada (futura, não aplicada)

~~~mermaid
flowchart TD
 U[Browser] --> V[Vercel - React SPA]
 V --> E[Express - um host persistente]
 V --> A[Auth gerenciado com MFA admin]
 E --> D[Supabase Postgres - grants e schema versionado]
 M[Meta Webhook] --> H[Verificar HMAC e validar evento]
 H --> Q[Inbox durável no PostgreSQL]
 Q --> W[Worker com lease e orçamento]
 W --> G[Gemini - pipeline comum]
 W --> O[Outbox e estado de envio]
 O --> M
 W --> D
 E --> S[SSE autenticado por tenant]
 W --> L[Logs redigidos - métricas - Sentry]
~~~

Agora: P0, auth, migrations, durabilidade e observabilidade mínima. Depois: segundo provider, Redis, storage original, analytics avançado e autoscaling conforme dados. Kubernetes, microserviços e rewrite Next não são necessários para 1–100 clientes.
