# Arquitetura atual

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Componentes reais

| Camada | Implementação | Evidência |
|---|---|---|
| Frontend | React 19; Vite 8; React Router 7; JSX; Tailwind 3; Lucide; Framer Motion | frontend/package.json:1 |
| Backend | Node/Express 4 CommonJS; index monolítico de 1704 linhas | src/index.js:1 |
| Runtime observado | Node 24.18.0; npm 11.16.0; dois package-lock | evidence/repository-inventory.json |
| Auth | users próprio, bcryptjs/JWT, localStorage; não Supabase Auth | src/routes/auth.js:12; src/middleware/authMiddleware.js:13 |
| Banco | Supabase JS via service_role; PostgREST/Postgres | src/index.js:97 |
| IA | GoogleGenerativeAI, Gemini, embeddings, RAG RPC e memória JSON | src/index.js:659 |
| Mensageria | Meta Cloud API HTTP v20.0; webhook e SSE | src/index.js:1095; src/index.js:1344 |
| Ingestão | Jina Reader, Mammoth DOCX, Gemini PDF/imagem; ViaCEP no browser | src/routes/admin.js:533; frontend/src/pages/AiSetup.jsx:141 |
| Deploy | Vercel rewrite frontend; PM2 e guia Railway para backend | frontend/vercel.json:1; ecosystem.config.js:17 |

Não há Next.js, TypeScript, Server Actions, Edge Functions, Supabase Auth/Storage/Realtime, Redis, fila durável, worker separado, billing provider, SMTP, Sentry, PostHog ou GitHub Actions implementados. Timer de limpeza de cache não é scheduler de negócio. SSE é customizado. Não há tsconfig ou script typecheck; backend não define build/lint. Versão Node não está fixada por engines/.nvmrc.

~~~mermaid
flowchart TD
  U[Pessoa no navegador] --> V[React SPA - Vercel / Vite local]
  V -->|Bearer JWT| E[Express REST]
  V -->|SSE sem auth - P0| E
  E --> A[bcrypt + JWT - users próprio]
  A --> S[Supabase Data API - service_role]
  E --> S
  S --> P[PostgreSQL - tenants users contacts messages knowledge]
  C[Contato WhatsApp] --> M[Meta Cloud API]
  M -->|webhook sem HMAC - P0| E
  E --> Q[Maps e timers - memória do processo]
  Q --> G[Gemini + embeddings + memória]
  G --> E
  E -->|HTTP v20.0| M
  E --> J[Jina Reader / OCR / DOCX]
~~~

Storage, fila durável, worker independente, pagamentos, analytics de produto e observabilidade central: **NÃO IMPLEMENTADO**. Não foram desenhados como componentes existentes.

## Fluxos

Cadastro cria tenant, depois owner, compensando falha com DELETE. Não há transação entre inserts. JWT carrega userId/tenantId/role/email. Configuração IA é salva no tenant; prompt não é arquivo por cliente em runtime. Arquivos em prompts/ são materiais/template legados: não há loader em produção para eles. Webhook encontra tenant por phone_number_id, contato por telefone, salva mensagem, agrupa em buffer, consulta RAG/modelo, envia à Meta e salva resposta. SSE transmite eventos globais.

## Inventário e dívida

120 arquivos rastreados e hashes em evidence/repository-inventory.json; 343 blobs históricos de texto inspecionados na busca heurística de secrets. Não se leu conteúdo de banco privado. Duplicação crítica: políticas, histórico e geração entre index.js e admin.js; sandbox e atendimento vivo divergem. src/routes/admin.js tem 903 linhas; AiSetup 581; KnowledgeBase 538. Separar serviços depois dos bloqueadores, preservando contratos. Não reescrever SPA em Next por preferência tecnológica.
