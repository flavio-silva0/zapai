# Segurança, autenticação e multi-tenancy

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## SEC-001 — Stream SSE público transmite dados globais

- **ID:** SEC-001
- **Severidade:** P0
- **Categoria:** security
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:900`

**Estado atual / Problema:** SSE não exige JWT e emitirEvento percorre todas as conexões, sem tenant.

**Impacto:** Leitura anônima de mensagens e dados de contatos entre empresas.

**Como reproduzir:** runtime-audit.cjs: conexão anônima recebeu evento contendo tenant e contato de A.

**Correção recomendada:** Autenticar stream, associar conexão ao tenant e filtrar todos os eventos no servidor.

**Esforço:** M

**Verificação pós-correção:** Anon 401; A não recebe eventos de B; revogar sessão encerra stream.

## TEN-001 — Fallback transfere contato e memória de outra empresa

- **ID:** TEN-001
- **Severidade:** P0
- **Categoria:** multi-tenancy
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:511`

**Estado atual / Problema:** Após falha no insert, busca telefone globalmente e muda tenant_id. Retorna ai_memory do tenant anterior.

**Impacto:** Vazamento de memória privada e corrupção de propriedade do contato.

**Como reproduzir:** Trigger temporário causou falha de insert só para telefone fictício. Registro de A passou a B com private_marker de A; evidence/runtime-audit.json.

**Correção recomendada:** Remover recuperação global, falhar fechado e usar unique(tenant_id,telefone) com upsert restrito.

**Esforço:** S

**Verificação pós-correção:** Mesmo telefone em A/B gera IDs independentes; qualquer falha mantém dono; testar concorrência.

## TEN-002 — Histórico de sandbox compartilhado entre contas no navegador

- **ID:** TEN-002
- **Severidade:** P0
- **Categoria:** multi-tenancy
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/TestZapAi.jsx:12`

**Estado atual / Problema:** Chave global não inclui tenant; logout remove apenas sofia_token. Histórico anterior vai no request da próxima conta.

**Impacto:** Pessoa B no mesmo perfil de navegador lê e pode reenviar ao provider conversas de A.

**Como reproduzir:** focused-e2e.json: login A, histórico-canário fictício, logout e login B no mesmo navegador; B visualizou o histórico de A.

**Correção recomendada:** Usar estado de sessão/tenant e limpar no logout; não tratar localStorage como cofre.

**Esforço:** S

**Verificação pós-correção:** A faz sandbox/logout; B não vê nem transmite o histórico de A.

## AUTH-001 — JWT de sete dias não é revogado nem revalida usuário

- **ID:** AUTH-001
- **Severidade:** P1
- **Categoria:** auth
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/middleware/authMiddleware.js:64`

**Estado atual / Problema:** Assinatura é validada, mas role/tenant/is_active não são consultados a cada sessão; logout só remove token local.

**Impacto:** Usuário desativado ou rebaixado pode continuar usando JWT até expirar.

**Como reproduzir:** Emitir sessão local, desativar conta e testar /me; middleware usa claims antigas.

**Correção recomendada:** Sessões revogáveis e access token curto; revalidar estado/role; MFA obrigatório para superadmin.

**Esforço:** M

**Verificação pós-correção:** Token revogado/desativado é recusado; alteração de papel produz efeito imediato.

## AUTH-002 — RBAC de owner, agent e viewer não é aplicado

- **ID:** AUTH-002
- **Severidade:** P1
- **Categoria:** auth
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1040`

**Estado atual / Problema:** requireAuth protege escrita, mas não distingue viewer; configuração e perfil têm problema equivalente.

**Impacto:** Visualizador pode alterar operação e IA.

**Como reproduzir:** JWT fixture com role viewer conseguiu PUT de status com HTTP 200.

**Correção recomendada:** Matriz explícita de permissões no servidor por ação.

**Esforço:** S

**Verificação pós-correção:** Viewer 403 em toda escrita; agent não altera billing/credenciais/IA.

## AUTH-003 — Cadastro sem schema, confirmação ou contenção de abuso

- **ID:** AUTH-003
- **Severidade:** P1
- **Categoria:** auth
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/routes/auth.js:54`

**Estado atual / Problema:** Só existência e comprimento são verificados; e-mail inválido é aceito; não há confirmação, CAPTCHA adaptativo ou rate limit.

**Impacto:** Contas descartáveis, enumeração e abuso dos endpoints caros.

**Como reproduzir:** Cadastro local com invalid-email e senha 12345678 retornou 201. Existente retorna 409.

**Correção recomendada:** Schema de tipos/limites/email, confirmação, rate limit e respostas sem enumeração.

**Esforço:** M

**Verificação pós-correção:** Tipos errados retornam 400; senha fraca/email inválido recusados; conta não confirmada sem IA.

## AUTH-004 — Recuperação e alteração segura de senha não implementadas

- **ID:** AUTH-004
- **Severidade:** P1
- **Categoria:** auth
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Settings.jsx:276`

**Estado atual / Problema:** Botão sem handler; não há endpoint de recuperação, confirmação ou gestão de sessões.

**Impacto:** Cliente perde acesso e suporte depende de intervenção manual.

**Como reproduzir:** Inventário completo de 26 endpoints não contém reset/confirm/logout server-side.

**Correção recomendada:** Implementar via auth gerenciado ou fluxo seguro com token de uso único, expiração e revogação.

**Esforço:** M

**Verificação pós-correção:** Reset expira, não reutiliza, não enumera e invalida sessões conforme política.

## SEC-002 — Tokens Meta em texto e retornados ao browser admin

- **ID:** SEC-002
- **Severidade:** P1
- **Categoria:** security
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/routes/admin.js:812`

**Estado atual / Problema:** Token armazenado como text e incluído em list/detail/update do admin. Não é service_role no frontend.

**Impacto:** XSS ou sessão admin comprometida expõe credenciais de múltiplos clientes.

**Como reproduzir:** DDL tenants e projeções admin. Nenhum token real foi lido.

**Correção recomendada:** Criptografar por envelope, mascarar retorno, escrita sem leitura do token; auditar acessos.

**Esforço:** M

**Verificação pós-correção:** Respostas admin nunca contêm token; teste de revogação/reconexão em sandbox.

## SEC-003 — CORS aceita qualquer origem com credentials

- **ID:** SEC-003
- **Severidade:** P2
- **Categoria:** security
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:921`

**Estado atual / Problema:** Ramo final autoriza origem fora da allowlist.

**Impacto:** Amplia superfície de browser; sozinho não rouba JWT do localStorage de outro origin.

**Como reproduzir:** Origin https://untrusted.invalid foi refletido em Access-Control-Allow-Origin.

**Correção recomendada:** Deny-by-default; ambientes explícitos; não confiar em sufixo vercel.app.

**Esforço:** XS

**Verificação pós-correção:** Origem desconhecida sem permissão; origem legítima e webhook sem origin funcionam.

## SEC-005 — Dependências com advisories conhecidos

- **ID:** SEC-005
- **Severidade:** P1
- **Categoria:** dependencies
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/package.json:7`

**Estado atual / Problema:** npm audit: backend 1 moderado; frontend 12 pacotes, 8 high, 2 moderate, 2 low.

**Impacto:** Risco de desenvolvimento/build e dependências de runtime; não implica 8 exploits em produção SPA.

**Como reproduzir:** evidence/npm-audit-*.json; versões lock exatas.

**Correção recomendada:** Atualizações direcionadas dentro da compatibilidade e testes; priorizar router/qs e Vite exposto apenas loopback.

**Esforço:** S

**Verificação pós-correção:** Audit repetido e gates runtime/build; qualificar aplicabilidade de RSC/SSR ausentes.

## SEC-006 — Cabeçalhos de segurança e política de índice incompletos

- **ID:** SEC-006
- **Severidade:** P2
- **Categoria:** security
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/vercel.json:2`

**Estado atual / Problema:** Só rewrite SPA; CSP/frame-ancestors/nosniff/Permissions-Policy não definidos ali; robots global index/follow.

**Impacto:** Menor contenção de XSS/clickjacking e indexação inadequada de shells.

**Como reproduzir:** Config + headers observados em evidence/production-browser.json. HSTS da plataforma não deve ser declarado ausente sem olhar resposta.

**Correção recomendada:** CSP testada inicialmente report-only; headers explícitos e noindex no painel/auth.

**Esforço:** S

**Verificação pós-correção:** Verificar headers efetivos e fluxos sem quebra.

## SEC-007 — Ingestão confia no MIME informado e não limita expansão

- **ID:** SEC-007
- **Severidade:** P2
- **Categoria:** security
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/routes/admin.js:547`

**Estado atual / Problema:** JSON 10MB não limita tamanho descompactado DOCX nem conteúdo de URL; MIME é declaração do cliente.

**Impacto:** DoS de CPU/memória e custo de OCR/embeddings; URL segue por Jina terceiro.

**Como reproduzir:** extractTextFromRequestBody; fetch Jina e mammoth; não se provou SSRF de rede interna local.

**Correção recomendada:** Assinatura/tamanho/MIME, quotas, timeout com abort, limite de texto e análise segura; allowlist de URL conforme produto.

**Esforço:** M

**Verificação pós-correção:** Arquivos incompatíveis/bombas rejeitados antes de processamento; URL privada bloqueada pela política.

## Threat model / OWASP

| Superfície | Resultado |
|---|---|
| Broken access control / BOLA | P0 SSE/fallback/sandbox compartilhado; RBAC incompleto |
| Authentication | bcrypt 12 e assinatura verificados; sem MFA/reset/revogação/limite |
| Injection SQL/command | queries via SDK; não foi encontrado SQL dinâmico/exec em src. RPC remoto desconhecido |
| XSS | texto de mensagens renderizado por React; sem dangerouslySetInnerHTML em src. Não certifica bibliotecas, uploads e conteúdo futuro |
| CSRF | API exige Bearer explícito, não cookie automático; CORS permissivo não é bypass de JWT |
| SSRF | URL vai para Jina, não fetch direto do host interno; privacidade/abuso e redirects exigem política. SSRF interno não reproduzido |
| Mass assignment | admin usa allowlist; perfil/estado permitem tipos/conteúdo sem schema completo |
| Upload | MIME confiado e DOCX processado sem controle de expansão |
| Errors | admin tem asyncHandler; auth/index async sem wrapper global em Express 4; rejeições de tipo/DB podem não virar JSON seguro |
| Crypto / secrets | JWT sem default é bom; Meta tokens text/retorno admin; sem service_role em código frontend encontrado |
| Observabilidade | payload completo/PII em logs e ausência de alertas |

## Sessão/cookies

Autenticação implementada em localStorage, não cookie. HttpOnly/Secure/SameSite portanto não se aplicam ao token atual. O risco relevante é exposição por XSS e persistência sem revogação. Não há refresh token, sessão SSR ou sincronização por evento storage entre abas. Recomendar auth gerenciado com sessão segura/curta e estratégia de revogação; revisar CSRF se adotar cookies.

## Secrets e histórico

343 blobs de texto do Git local foram examinados com regex para Google, JWT literal, tokens GitHub/Meta, chaves privadas e URLs com senha. Zero matches. Escopo é heurístico e não inclui refs remotas não baixadas, painel do host nem variáveis do deploy. .env real não estava presente no workspace. Não foram impressos, alterados ou rotacionados secrets reais. Default META_VERIFY_TOKEN é previsível, mas principal P0 é assinatura POST ausente. Variáveis públicas são VITE_API_URL, não NEXT_PUBLIC.

## Admin e isolamento sem tenant

requireSuperAdmin protege /tenants, porém MFA não existe. getReqTenantId retorna null para sessão sem tenant e handlers omitem filtro nessa situação: comportamento permitido ao superadmin mas não deve ser aceito para role comum. Não há prova de usuário comum normalmente conseguir esse JWT; testar invariantes e falhar fechado. Usuários da mesma empresa não têm RBAC suficiente.

## Recomendações de proteção

Rate limit em login/cadastro por IP+conta; IA por tenant+usuário+orçamento atômico; SSE limita conexões e duração; uploads limita bytes/chunks. Não registrar token/Authorization. Nenhum teste de brute force/carga foi executado em produção.
