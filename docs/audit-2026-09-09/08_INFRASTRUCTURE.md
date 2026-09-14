# Infraestrutura e observabilidade

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## OPS-001 — Health só mede processo; sem alertas, tracing ou uso IA

- **ID:** OPS-001
- **Severidade:** P1
- **Categoria:** observability
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:950`

**Estado atual / Problema:** Retorna ok sem banco; logs livres; usageMetadata não é registrado.

**Impacto:** Falha silenciosa de DB, fila ou provider pode passar despercebida.

**Como reproduzir:** /health 200 mesmo sem PostgREST durante preparação local.

**Correção recomendada:** Liveness/readiness separados; heartbeat worker; Sentry e logs estruturados; alertas de custo/idade da fila.

**Esforço:** M

**Verificação pós-correção:** Desligar DB altera readiness; alerta chega; health não chama LLM.

## OPS-002 — Deploy documentado diverge da implementação

- **ID:** OPS-002
- **Severidade:** P1
- **Categoria:** infrastructure
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `DEPLOY.md:91`

**Estado atual / Problema:** Guia ainda pede QR e deploy por cliente, e diz Hobby comercial suficiente. Não há CI, engine Node ou env example versionados.

**Impacto:** Operação irreproduzível e risco de configuração incorreta.

**Como reproduzir:** DEPLOY.md versus SDK Meta por HTTP; inventory sem .github/env example.

**Correção recomendada:** Runbook real Express/Meta; CI mínimo, env por ambiente, rollback expand/contract e backup ensaiado.

**Esforço:** M

**Verificação pós-correção:** Pessoa nova sobe staging usando docs; CI barra regressão e rollback ensaiado.

## Estado de deploy

Frontend Vercel confirmado por URL/headers. Código de API é processo Express persistente, não função da Vercel. DEPLOY cita Railway e ecosystem PM2; nenhum render.yaml/Dockerfile/.github configurado encontrado. Domínio customizado, região, variáveis do host e commit de deploy remoto privado NÃO FOI POSSÍVEL VERIFICAR. O frontend usa VITE_API_URL se definida; sem ela em produção, /api cai no rewrite HTML. Dev usa proxy localhost:3001.

## Staging

Não há manifests de dev/staging/production nem Supabase CLI config. TEST_MODE substitui clientes de index.js mas auth/admin criam SDK real; não é isolamento total automático. Ambiente desta auditoria usa preloader explícito com bloqueio de fetch externo/axios e banco local. Isso é ferramenta de auditoria, não melhoria implantada. Staging deve ter projeto/DB e tokens separados; previews sem chaves de Meta/IA de produção.

## Observabilidade mínima proposta

Sentry para exceções front/back (PII e replay desativados); JSON logs com request_id, tenant pseudônimo, conversation/message ID, estágio, provider/model, status, duração, tentativa, tokens e custo. Não logar corpo/prompt por padrão. Tabela usage diária para quotas; traces amostrados só quando necessário. Monitor HTTP externo e readiness DB; worker heartbeat e oldest_pending_age.

Alertar: worker sem heartbeat, atraso da fila acima de SLO, erro Meta/LLM sustentado, custo próximo do orçamento, banco indisponível e falta de webhooks apenas se houver tráfego esperado. Monitoramento não foi instalado nem conectado externamente.

Produto: signup_completed, ai_configured, whatsapp_connected, first_message_received, first_ai_response, onboarding_completed, subscription_started/cancelled (quando cobrança existir). Eventos derivados do backend; PostHog opcional com poucos eventos e pseudonimização. Analytics atual é tela de indicadores do DB, não tracking de produto.

## CI/CD e rollback propostos

PR: npm ci nos dois projetos, syntax check Node, lint frontend, testes autocontidos, audit com triagem, build, DB limpa, E2E essenciais. Typecheck somente se projeto adotar TS/JSDoc/checkJs. Main protegido; staging obrigatório; migration expand/contract com backup; deploy; smoke/readiness. Rollback de código para versão anterior mantendo schema compatível; se mudança de dados incompatível, recovery planejado, nunca down destrutivo automático.

Não usar cron em setInterval para trabalho crítico. No MVP, consumidor PostgreSQL com lease e varredura de recovery; tarefa de retenção agendada e auditável. Feature flags simples em tenant para beta, com autorização backend; ferramenta externa só se rollout justificar.

## Backup

Configuração real não verificada. Documentar DB + eventual storage + configuração/chaves; recuperar em projeto isolado e medir RPO/RTO. Proteger backup com acesso mínimo. Não confundir migrations com backup de dados. Não prometer recuperação instantânea de tabela às 15h.
