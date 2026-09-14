# Auditoria completa ZapAI — 09/09/2026

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Índice

- [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md)
- [01_CURRENT_ARCHITECTURE.md](01_CURRENT_ARCHITECTURE.md)
- [02_ROUTES_AND_ENDPOINTS.md](02_ROUTES_AND_ENDPOINTS.md)
- [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md)
- [04_DATABASE_AND_SUPABASE.md](04_DATABASE_AND_SUPABASE.md)
- [05_WHATSAPP_META.md](05_WHATSAPP_META.md)
- [06_AI_AUDIT.md](06_AI_AUDIT.md)
- [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md)
- [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md)
- [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md)
- [10_COSTS_AND_SCALING.md](10_COSTS_AND_SCALING.md)
- [11_LGPD_AND_PRIVACY.md](11_LGPD_AND_PRIVACY.md)
- [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md)
- [13_PRODUCTION_CHECKLIST.md](13_PRODUCTION_CHECKLIST.md)
- [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md)
- [Achados estruturados](audit-findings.json)
- [Execução local](LOCAL_RUN.md)
- [Golden Conversations](golden-conversations.json)

## Catálogo completo de achados

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

## WA-001 — POST do webhook não valida assinatura

- **ID:** WA-001
- **Severidade:** P0
- **Categoria:** whatsapp
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1358`

**Estado atual / Problema:** Corpo JSON é aceito sem HMAC/App Secret; GET verify_token não protege POST.

**Impacto:** Forjar mensagens, alimentar contexto da IA e consumir envio/IA.

**Como reproduzir:** runtime-audit: POST sem assinatura retornou 200 e criou registro no PostgreSQL local.

**Correção recomendada:** Verificar assinatura do corpo bruto antes de persistir; comparação constante; rejeitar assinatura ausente/inválida.

**Esforço:** S

**Verificação pós-correção:** Corpo alterado/assinatura ausente recebem 401/403 sem efeito. Validar contrato atual Meta em homologação.

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

## DB-001 — Migrations não recriam o banco

- **ID:** DB-001
- **Severidade:** P1
- **Categoria:** database
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `scripts/migration-multitenant.sql:52`

**Estado atual / Problema:** Script altera tabelas ausentes e ativa RLS em patients embora app use users_whatsapp. knowledge_base e match_knowledge não têm definição versionada.

**Impacto:** Recuperação/staging e prova de isolamento não são reproduzíveis.

**Como reproduzir:** Pristine PostgreSQL: erro 42P01 em users_whatsapp; demais scripts dependem de tenants.

**Correção recomendada:** Exportar schema autorizado, reconciliar migrations baseline sem apagar dados e testar banco limpo.

**Esforço:** M

**Verificação pós-correção:** Todas migrations passam em banco vazio e upgrade de snapshot anonimizado.

## DB-002 — RLS/grants de tabelas sensíveis incompletos nos scripts

- **ID:** DB-002
- **Severidade:** P1
- **Categoria:** database
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `scripts/migration-multitenant.sql:83`

**Estado atual / Problema:** Não há ENABLE RLS para tenants/users/users_whatsapp nem grants/revokes completos nos scripts. Backend usa service_role.

**Impacto:** Defesa do Data API desconhecida; falha no backend não é barrada por service_role. Não prova exposição remota.

**Como reproduzir:** Inspeção SQL e catálogo do banco reconstruído; sem acesso ao catálogo remoto.

**Correção recomendada:** Inventariar catálogo real; bloquear anon/authenticated sem necessidade e policies/grants de privilégio mínimo.

**Esforço:** M

**Verificação pós-correção:** Testar SELECT/INSERT/UPDATE/DELETE como anon, authenticated, service_role e tenants.

## DB-003 — Identidade WhatsApp sem unicidade e FKs compostas

- **ID:** DB-003
- **Severidade:** P1
- **Categoria:** database
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `scripts/migration-multitenant.sql:25`

**Estado atual / Problema:** phone_number_id não é unique; tenant_id é opcional em contatos/mensagens; ausência de FK composta comprovando tenant do contato.

**Impacto:** Mapeamento ambíguo de webhook, órfãos e referência cruzada possível.

**Como reproduzir:** Ler DDL e query single por phone_number_id em index.js:1391.

**Correção recomendada:** Unique phone_number_id onde presente; unique tenant+telefone; validar dados e impor FK composta/NOT NULL progressivamente.

**Esforço:** M

**Verificação pós-correção:** Duplicações rejeitadas e message tenant diferente do contato recusada.

## WA-002 — ACK precede persistência e fila é memória do processo

- **ID:** WA-002
- **Severidade:** P1
- **Categoria:** reliability
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1365`

**Estado atual / Problema:** ACK é imediato; processamento, debounce e locks ficam em Maps/Sets/setTimeout. Não há consumidor durável/recovery.

**Impacto:** Crash pode perder evento reconhecido; múltiplas instâncias processam mesma conversa em paralelo.

**Como reproduzir:** Inspeção de handler; matrizes conceituais de crash no relatório WhatsApp.

**Correção recomendada:** Inbox durável antes do ACK; worker com lease, retry, DLQ e ordenação por tenant/contato.

**Esforço:** L

**Verificação pós-correção:** Matar worker após ACK não perde evento; dois workers não concorrem na mesma conversa.

## WA-003 — Idempotência incompleta para falhas e envio parcial

- **ID:** WA-003
- **Severidade:** P1
- **Categoria:** reliability
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:172`

**Estado atual / Problema:** ID ausente segue; falta de tabela desativa persistência; failed é reaberto sem CAS; envio ocorre antes de salvar e não guarda wamid de saída.

**Impacto:** Resposta duplicada, bloqueio eterno de processing ou perda de rastreabilidade.

**Como reproduzir:** Duplicata simples passou no local; crash/retry após envio não é coberto por teste existente.

**Correção recomendada:** ID obrigatório, fail closed, lease/CAS, outbox e reconciliação do envio; não prometer exactly-once externo.

**Esforço:** M

**Verificação pós-correção:** Crash entre send/save, falha parcial e duas instâncias não duplicam resposta lógica.

## WA-004 — Apenas primeiro evento e status de entrega descartados

- **ID:** WA-004
- **Severidade:** P1
- **Categoria:** whatsapp
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1368`

**Estado atual / Problema:** Só entry[0]/changes[0]/messages[0] processados. Status/read são ignorados.

**Impacto:** Mensagens em lote perdidas e métricas de entrega incorretas.

**Como reproduzir:** Payload com duas messages: apenas primeira é referenciada pelo handler.

**Correção recomendada:** Iterar todos os eventos; persistir status com monotonicidade e idempotência.

**Esforço:** M

**Verificação pós-correção:** Dois eventos geram dois registros; status fora de ordem não retrocede lido para enviado.

## WA-005 — Janela, opt-out e handoff não são enforcement do backend

- **ID:** WA-005
- **Severidade:** P1
- **Categoria:** whatsapp
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1443`

**Estado atual / Problema:** Pausa é verificada uma vez antes do debounce; send manual não pausa IA; nenhum estado de opt-out/janela é conferido no envio.

**Impacto:** IA pode responder durante intervenção humana e envio fora da política pode falhar.

**Como reproduzir:** Pausar após buffer não muda patient capturado; avaliar branch de envio humano.

**Correção recomendada:** Estado de conversa autoritativo; reler antes de cada envio; opt-out e janela de atendimento; templates para casos autorizados.

**Esforço:** M

**Verificação pós-correção:** Pausa durante geração bloqueia envio; pedido humano/opt-out persiste; janela vencida exige template permitido.

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

## SEC-004 — Logs registram payload completo e dados de memória

- **ID:** SEC-004
- **Severidade:** P1
- **Categoria:** privacy
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1362`

**Estado atual / Problema:** Corpo do webhook é serializado, e erros de parse podem registrar memória extraída; telefone aparece em logs.

**Impacto:** Conteúdo pessoal/sensível fica acessível a operadores e provedores de logs.

**Como reproduzir:** Inspeção e saída de testes com fixtures; sem extração de logs remotos.

**Correção recomendada:** Logs estruturados por IDs pseudonimizados; redaction; política de retenção e acesso.

**Esforço:** S

**Verificação pós-correção:** Canários de telefone, mensagem e token não aparecem em logs de sucesso/erro.

## AI-001 — Prompt global contém fatos de negócio de outro contexto

- **ID:** AI-001
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:827`

**Estado atual / Problema:** Trechos fixos citam empresas, logística e profissionais em todo tenant.

**Impacto:** Respostas incorretas e confusão entre negócios mesmo sem acesso ao banco de outro tenant.

**Como reproduzir:** Prompt de consultarGeminiDinamicamente inclui exemplos fixos após regras finais.

**Correção recomendada:** Remover fatos de negócio da política global; isolá-los nos dados do tenant e validar golden conversations por nicho.

**Esforço:** S

**Verificação pós-correção:** Tenant fictício de restaurante nunca oferece serviços logísticos por instrução global.

## AI-002 — SDK legado e fallback vivo usa o mesmo modelo

- **ID:** AI-002
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:844`

**Estado atual / Problema:** Principal e fallback são gemini-3.5-flash-lite; sandbox usa configuração diferente. @google/generative-ai é legado.

**Impacto:** Indisponibilidade do modelo não é mitigada; correções do SDK deixam de chegar.

**Como reproduzir:** Comparar index.js modelos e admin.js CONFIG; documentação Google libraries.

**Correção recomendada:** Migrar SDK com teste de paridade; modelo fallback distinto validado; humano como degradação; não adicionar três providers agora.

**Esforço:** M

**Verificação pós-correção:** Falha de modelo aciona alternativa permitida e falha total pausa/encaminha sem loop.

## AI-003 — Contexto, memória e ingestão sem orçamento global de tokens

- **ID:** AI-003
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:577`

**Estado atual / Problema:** Histórico tem limite de linhas, não de tokens; memória cresce, RAG vivo sem limite de caracteres; embeddings/memória sem timeout uniforme.

**Impacto:** Latência e custo imprevisíveis; documentos grandes podem consumir memória/processamento.

**Como reproduzir:** Histórico 20; prompt salvo até 50 mil chars; ingestão retorna texto externo sem teto global.

**Correção recomendada:** Budget por chamada/contexto; memória por schema/TTL; limites de chunks/bytes e abort real.

**Esforço:** M

**Verificação pós-correção:** Entrada longa respeita orçamento e timeouts cancelam requests; custo medido.

## AI-004 — Sanitização não equivale a defesa de prompt injection

- **ID:** AI-004
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/utils/hallucination.js:3`

**Estado atual / Problema:** Heurística ignora alucinação quando existe qualquer RAG; regras do tenant, memória e documentos são concatenadas. Não há eval real de injeção.

**Impacto:** Instruções hostis podem alterar respostas e dados de memória; qualidade não demonstrada.

**Como reproduzir:** Mocks determinísticos testam formato; não foram feitas chamadas pagas para medir resistência do modelo.

**Correção recomendada:** Separar política/dados, citar suporte internamente, validar memória por schema e executar evals adversariais.

**Esforço:** M

**Verificação pós-correção:** Zero vazamento nos canários críticos; handoff em desconhecido; métricas por versão.

## UX-001 — Canais exibem conexão e métricas fictícias

- **ID:** UX-001
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Channels.jsx:166`

**Estado atual / Problema:** Telefone, conexão, atividade e métricas são fixos; verificar status apenas anima.

**Impacto:** Cliente acredita que número está pronto sem onboarding Meta real.

**Como reproduzir:** Ler Channels e comparar cliente recém-criado sem Meta com tela conectada.

**Correção recomendada:** Conectar a status verificado do backend; ocultar simulados; checklist guiado de conexão.

**Esforço:** M

**Verificação pós-correção:** Conta nova mostra desconectada e explica ação; só confirma após checagem real.

## UX-002 — Configurações, billing, equipe e 2FA são maquetes

- **ID:** UX-002
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Settings.jsx:49`

**Estado atual / Problema:** Botões sem persistência; plano/uso/cartão/equipe/API key estáticos.

**Impacto:** Promessas comerciais sem implementação; falsa percepção de segurança.

**Como reproduzir:** Settings contém plano Pro fixo e toggle 2FA com callback vazio.

**Correção recomendada:** Remover ou marcar indisponível; priorizar conta real, cobrança contratual e limites server-side.

**Esforço:** M

**Verificação pós-correção:** Nenhuma ação mostra sucesso sem efeito; plano vem do servidor.

## UX-003 — Sliders de personalidade não são salvos nem usados pela IA

- **ID:** UX-003
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/AiSetup.jsx:87`

**Estado atual / Problema:** Valores só alteram preview local e voltam a defaults no reload; fullForm não contém sliders.

**Impacto:** Configuração principal aparenta funcionar mas não altera comportamento.

**Como reproduzir:** Alterar slider/recarregar; inspecionar fullForm e payload de save.

**Correção recomendada:** Persistir parâmetros estruturados e compilar prompt; carregá-los no mount.

**Esforço:** M

**Verificação pós-correção:** Valor e comportamento sobrevivem reload; teste por API e UI.

## UX-004 — Inbox de conversa cortado no celular

- **ID:** UX-004
- **Severidade:** P1
- **Categoria:** ux
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Chat.jsx:82`

**Estado atual / Problema:** Lista fixa ocupa 320px em viewport 360px e área de conversa fica comprimida/cortada.

**Impacto:** PME não consegue operar atendimento pelo celular.

**Como reproduzir:** Revisão visual evidence/local-painel-chat-360.png; overflow false não detecta clipping.

**Correção recomendada:** Layout de duas telas lista/conversa no mobile, com voltar e composer visível.

**Esforço:** M

**Verificação pós-correção:** Selecionar contato, ler e enviar a 360/390px sem corte e com teclado virtual.

## UX-005 — Métrica de resolução confunde IA ativa com sucesso

- **ID:** UX-005
- **Severidade:** P2
- **Categoria:** analytics
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Analytics.jsx:117`

**Estado atual / Problema:** Calcula aiAtivo/total como resolução; segmentos misturam dimensões sobrepostas; filtro período não refaz dados.

**Impacto:** Cliente recebe indicadores que não medem resultado.

**Como reproduzir:** Inspeção Analytics linhas 120-145.

**Correção recomendada:** Eventos de encerramento/handoff; intervalos reais no servidor e métricas com definição.

**Esforço:** S

**Verificação pós-correção:** Fixture com IA ativa mas não resolvida não conta como resolução.

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

## PRIV-001 — Exclusão, retenção e garantias de uso de dados não comprovadas

- **ID:** PRIV-001
- **Severidade:** P1
- **Categoria:** privacy
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Privacy.jsx:57`

**Estado atual / Problema:** Política afirma ausência de treino de terceiros, mas tier/contrato não está verificado; nenhuma rotina de retenção/exportação/exclusão completa.

**Impacto:** Promessas não demonstradas e retenção excessiva de conversas/memória.

**Como reproduzir:** Privacy e Settings; não há APIs de exclusão/exportação. Google distingue uso de dados free/paid.

**Correção recomendada:** Confirmar contratos/subprocessadores, inventário e bases legais; implementar exercício de direitos com revisão jurídica.

**Esforço:** M

**Verificação pós-correção:** Conta de teste excluída com rastreio e restauração de backup respeita tombstone.

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

## SEO-001 — Robots e sitemap retornam shell SPA

- **ID:** SEO-001
- **Severidade:** P2
- **Categoria:** seo
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/vercel.json:4`

**Estado atual / Problema:** Arquivos ausentes caem no fallback; canonical é global.

**Impacto:** SEO e rastreamento com respostas enganosas.

**Como reproduzir:** Navegação produção /robots.txt e /sitemap.xml termina na Home; status 200/304.

**Correção recomendada:** Publicar robots/sitemap válidos e metadata por rota; 404 real onde cabível.

**Esforço:** S

**Verificação pós-correção:** Content-Type e conteúdo corretos; rotas privadas excluídas; canonical coerente.

## PERF-001 — Listagens e agregações sem paginação

- **ID:** PERF-001
- **Severidade:** P2
- **Categoria:** performance
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:490`

**Estado atual / Problema:** Contatos, mensagens e knowledge retornam conjuntos inteiros; stats agrega em JS.

**Impacto:** Histórico crescente aumenta latência/RAM e pode ser truncado pelo limite Data API.

**Como reproduzir:** Handlers patients/messages/knowledge; nenhum range/limit nessas listagens.

**Correção recomendada:** Paginação por cursor, projeções e agregação SQL; índices tenant+created_at/patient.

**Esforço:** M

**Verificação pós-correção:** 10k registros paginam com ordenação estável e contagem correta.

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

## QA-001 — Testes passam com mocks permissivos e lint tem regras desligadas

- **ID:** QA-001
- **Severidade:** P2
- **Categoria:** tests
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/eslint.config.js:29`

**Estado atual / Problema:** Mock SQL não impõe constraints, projeções ou RLS. npm test sem JWT falha; suite original não possui E2E/DB nem typecheck; provas locais foram adicionadas nesta auditoria.

**Impacto:** Passagem verde não certifica segurança nem fluxo comercial.

**Como reproduzir:** Executar npm test sem/env; comparar mock com DDL; evidence de validação.

**Correção recomendada:** Config de testes autocontida; banco real de CI; E2E por tenant e evals; reativar regras gradualmente.

**Esforço:** M

**Verificação pós-correção:** Pipeline novo detecta regressões SEC-001/TEN-001 e configurações ilusórias.

## Relatórios consolidados

# ZAPAI PRODUCTION READINESS AUDIT

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Veredicto: NO-GO

**35/100.** O produto tem UI e fluxo de atendimento reais, mas não deve receber clientes pagantes antes de fechar vazamento de eventos, transferência de contato, assinatura de webhook e controle de custo. A nota é julgamento técnico de prontidão, não certificação nem probabilidade de incidente. 37 achados: {"P0":5,"P1":25,"P2":7,"P3":0}.

## Cinco maiores riscos

1. SEC-001: dados de qualquer tenant no SSE anônimo.
2. TEN-001: fallback troca proprietário do contato e reaproveita memória privada.
3. WA-001: webhook forjado pode disparar atendimento.
4. COST-001: nenhuma reserva de orçamento ou quota da plataforma.
5. WA-002/DB-001: evento reconhecido antes de persistir; banco não reproduzível.

Outro P0: TEN-002, histórico de sandbox compartilhado em navegador usado por contas diferentes. Reproduzido no navegador com duas contas e canário fictício (focused-e2e.json); limitado ao mesmo perfil de navegador.

## Nota por área

| Área | Nota /100 |
|---|---:|
| Funcionalidade | 52 |
| Segurança | 18 |
| Autenticação | 35 |
| Banco/Dados | 30 |
| Multi-tenancy | 15 |
| WhatsApp | 32 |
| IA | 43 |
| UX/UI | 57 |
| Performance | 55 |
| Testes | 38 |
| Observabilidade | 18 |
| Infraestrutura | 42 |
| LGPD/Privacidade | 25 |
| Custos | 28 |
| Prontidão comercial | 30 |

Média simples das áreas = 34.5. Score global arredondado para 35 pela média das áreas; P0 prevalece sobre a nota.

## O que funciona e deve ser mantido

React/Vite com lazy loading; Express simples; bcrypt com custo 12; JWT exige segredo; filtros por tenant em REST comum; guard de superadmin; limite de histórico; sanitização de saída; retry com backoff; idempotência por message ID com unique; edição do prompt persistida. Lint/build passaram e suite existente passou com JWT fictício.

## Decisão da stack

- Supabase: **MANTER** Postgres/Data API; problema é implementação, não necessidade de trocar banco. Auth Supabase ainda não é usado.
- Vercel: **MANTER** frontend SPA, em plano compatível com uso comercial; não portar timers/SSE para serverless sem redesenho.
- Render: **NÃO USAR como serviço adicional agora** se Railway já hospeda Express; o host real do backend não foi confirmado. Se falta host persistente, escolher Render ou Railway, um só.
- IA: manter Gemini inicialmente, SDK atual e pipeline comum; fallback humano seguro e quota antes de provider adicional.
- Fila: inbox/outbox PostgreSQL com worker e lease; Redis opcional após medição.

## Próximas ações

48h: fechar P0 e provar isolamento. Semana 1: baseline migrations, RBAC/revogação, fila durável e alertas. Semana 2: corrigir telas simuladas/mobile e medir IA. Primeiro mês: piloto assistido com quotas, restauração ensaiada e suporte.

## Quando cobrar

Somente após os P0 terem testes negativos passando, configuração Meta homologada, recuperação de acesso, orçamento rígido, backup restaurável, estado de conexão verdadeiro e acordo de serviço/privacidade compatível com o entregue. Piloto supervisionado pode usar cobrança manual; não anunciar checkout/2FA/equipe não implementados.

## Ambiente local

Front: http://127.0.0.1:5173 — API: http://127.0.0.1:3001/health — PostgreSQL: 127.0.0.1:55432. Login **demo@zapai.local**, senha de demonstração **ZapAI-local-2026!**. Banco com fixtures, Meta/Gemini simulados, schema-base reconstruído. Ver LOCAL_RUN.md. Não é réplica de dados/policies de produção.

## Limitações materiais

Sem credenciais de cloud, catálogo remoto, logs de produção, SMTP/DNS, backups, plano contratado, configurações Meta/app review nem chamadas reais de IA. Portanto RLS/grants remotos, performance paga, qualidade de modelo e operação real permanecem NÃO FOI POSSÍVEL VERIFICAR. Veja 15_FULL_AUDIT.md para índice e cobertura.


---

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


---

# Rotas e endpoints

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Páginas

Declaração: frontend/src/App.jsx:86. Guard client-side não substitui backend.

| Rota | Arquivo | Autenticação | Autorização | Estado | Responsiva | Observação |
|---|---|---|---|---|---|---|
| / | frontend/src/pages/LandingHome.jsx:1 | Pública | pública | implementado com ressalvas | ver 07 + screenshots |  |
| /sobre | frontend/src/pages/LandingSobre.jsx:1 | Pública | pública | implementado com ressalvas | ver 07 + screenshots |  |
| /planos | frontend/src/pages/LandingPlanos.jsx:1 | Pública | pública | implementado com ressalvas | ver 07 + screenshots |  |
| /privacidade | frontend/src/pages/Privacy.jsx:1 | Pública | pública | implementado com ressalvas | ver 07 + screenshots |  |
| /login | frontend/src/pages/Login.jsx:1 | Pública | pública | implementado com ressalvas | ver 07 + screenshots |  |
| /cadastro | frontend/src/pages/Register.jsx:1 | Pública | pública | implementado com ressalvas | ver 07 + screenshots |  |
| /admin | frontend/src/pages/Admin.jsx:1 | super_admin | AdminRoute | implementado com ressalvas | ver 07 + screenshots |  |
| /painel | frontend/src/pages/Home.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots |  |
| /painel/chat | frontend/src/pages/Chat.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | PROBLEMA: 360px cortado |  |
| /painel/kanban | frontend/src/pages/FullKanban.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots |  |
| /painel/test | frontend/src/pages/TestZapAi.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots | histórico global localStorage |
| /painel/perfil | frontend/src/pages/Profile.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots |  |
| /painel/ia | frontend/src/pages/AiSetup.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots | sliders não persistem |
| /painel/treinamento | frontend/src/pages/KnowledgeBase.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots |  |
| /painel/canais | frontend/src/pages/Channels.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | INCOMPLETO / simulado | ver 07 + screenshots |  |
| /painel/analytics | frontend/src/pages/Analytics.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | implementado com ressalvas | ver 07 + screenshots | resolução incorreta |
| /painel/configuracoes | frontend/src/pages/Settings.jsx:1 | JWT | ProtectedRoute; papel comum não restringe tela | INCOMPLETO / simulado | ver 07 + screenshots |  |

Catch-all redireciona à Home (sem página 404). Suspense/PageLoader cobre lazy loading; não há ErrorBoundary global específico. /painel/kanban e /painel/test existem mesmo fora do menu principal. Recuperação, confirmação, onboarding dedicado, cobrança standalone, usuários standalone, logout server route: NÃO IMPLEMENTADOS. Logout é ação local de contexto. Não há rotas API Next/Edge/OAuth/callback/cron encontradas.

## Todos os endpoints Express encontrados (26)

| Endpoint | Método | Arquivo | Auth | Autorização | Validação | Rate limit | Idempotência | Serviço externo | Risco |
|---|---|---|---|---|---|---|---|---|---|
| /health | GET | src/index.js:950 | Público | nenhuma | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/config | GET | src/index.js:963 | Público | nenhuma | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/stats | GET | src/index.js:972 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/events | GET | src/index.js:1009 | Público | nenhuma | manual parcial | NÃO | NÃO | DB ou nenhum | P0 |
| /api/patients | GET | src/index.js:1022 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/patients/:id/messages | GET | src/index.js:1031 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/patients/:id/status | PUT | src/index.js:1040 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/patients/:id/ai-status | PUT | src/index.js:1051 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/patients/:id/send | POST | src/index.js:1269 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Meta/Gemini/DB | P0 custo |
| /webhook/whatsapp | GET | src/index.js:1344 | Público | nenhuma | estrutura parcial; sem assinatura | NÃO | ID + unique; parcial | Meta/Gemini/DB | P0 |
| /webhook/whatsapp | POST | src/index.js:1358 | Público | nenhuma | estrutura parcial; sem assinatura | NÃO | ID + unique; parcial | Meta/Gemini/DB | P0 |
| /api/auth/register | POST | src/routes/auth.js:44 | Público | nenhuma | manual; tipos incompletos | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/auth/login | POST | src/routes/auth.js:131 | Público | nenhuma | manual; tipos incompletos | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/auth/me | GET | src/routes/auth.js:180 | JWT | tenant da sessão (ver exceções) | manual; tipos incompletos | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/auth/profile | PUT | src/routes/auth.js:203 | JWT | tenant da sessão (ver exceções) | manual; tipos incompletos | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/admin/seed | POST | src/routes/admin.js:604 | Público | nenhuma | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/admin/magic-setup | POST | src/routes/admin.js:644 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/magic-setup/save | PUT | src/routes/admin.js:673 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/sandbox/chat | POST | src/routes/admin.js:692 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/knowledge | GET | src/routes/admin.js:721 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/knowledge | POST | src/routes/admin.js:735 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/knowledge/:id | PUT | src/routes/admin.js:762 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/knowledge/:id | DELETE | src/routes/admin.js:787 | JWT | tenant da sessão (ver exceções) | manual parcial | NÃO | NÃO | Gemini; Jina/Mammoth por tipo | P0 custo |
| /api/admin/tenants | GET | src/routes/admin.js:806 | JWT + super_admin | global autorizado | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/admin/tenants/:id | GET | src/routes/admin.js:838 | JWT + super_admin | global autorizado | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |
| /api/admin/tenants/:id | PUT | src/routes/admin.js:858 | JWT + super_admin | global autorizado | manual parcial | NÃO | NÃO | DB ou nenhum | P1/P2 |

OPTIONS é atendido pelo middleware cors em todas as rotas (src/index.js:917). Não há PATCH handler declarado; anúncio de PATCH no CORS não cria endpoint. HEAD pode usar semântica automática dos GETs Express. Seed é público mas só cria credenciais definidas no ambiente e bloqueia se admin já existe; não equivale a cadastro arbitrário de superadmin. Melhor removê-lo da superfície HTTP após bootstrap e exigir CLI.

## Supabase/RPC

A aplicação usa recursos PostgREST /rest/v1/{tenants,users,users_whatsapp,messages,knowledge_base,whatsapp_message_processing} e /rest/v1/rpc/match_knowledge. Isso é interface externa usada pelo backend; configuração pública real/grants NÃO FOI POSSÍVEL VERIFICAR. Função set_updated_at é trigger, não rota de negócio. DDL de match_knowledge ausente: security definer, search_path e EXECUTE grants desconhecidos. Não há storage buckets/Edge Functions versionados.

## Provas negativas locais

Anônimo recebe 401 nos REST protegidos. Owner recebe 403 no admin. A não consegue mudar escopo por tenantId/X-Tenant-Id; mensagens de B devolvem []; envio B 404. Atualização de contato B devolve 500, não vaza dados no teste, mas status deve ser 403/404. Viewer muda contato (200). SSE anônimo vaza evento. Evidências: runtime-audit.json. Nenhuma dessas provas autoriza concluir RLS remota segura.


---

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


---

# Banco, Supabase e isolamento

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## DB-001 — Migrations não recriam o banco

- **ID:** DB-001
- **Severidade:** P1
- **Categoria:** database
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `scripts/migration-multitenant.sql:52`

**Estado atual / Problema:** Script altera tabelas ausentes e ativa RLS em patients embora app use users_whatsapp. knowledge_base e match_knowledge não têm definição versionada.

**Impacto:** Recuperação/staging e prova de isolamento não são reproduzíveis.

**Como reproduzir:** Pristine PostgreSQL: erro 42P01 em users_whatsapp; demais scripts dependem de tenants.

**Correção recomendada:** Exportar schema autorizado, reconciliar migrations baseline sem apagar dados e testar banco limpo.

**Esforço:** M

**Verificação pós-correção:** Todas migrations passam em banco vazio e upgrade de snapshot anonimizado.

## DB-002 — RLS/grants de tabelas sensíveis incompletos nos scripts

- **ID:** DB-002
- **Severidade:** P1
- **Categoria:** database
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `scripts/migration-multitenant.sql:83`

**Estado atual / Problema:** Não há ENABLE RLS para tenants/users/users_whatsapp nem grants/revokes completos nos scripts. Backend usa service_role.

**Impacto:** Defesa do Data API desconhecida; falha no backend não é barrada por service_role. Não prova exposição remota.

**Como reproduzir:** Inspeção SQL e catálogo do banco reconstruído; sem acesso ao catálogo remoto.

**Correção recomendada:** Inventariar catálogo real; bloquear anon/authenticated sem necessidade e policies/grants de privilégio mínimo.

**Esforço:** M

**Verificação pós-correção:** Testar SELECT/INSERT/UPDATE/DELETE como anon, authenticated, service_role e tenants.

## DB-003 — Identidade WhatsApp sem unicidade e FKs compostas

- **ID:** DB-003
- **Severidade:** P1
- **Categoria:** database
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `scripts/migration-multitenant.sql:25`

**Estado atual / Problema:** phone_number_id não é unique; tenant_id é opcional em contatos/mensagens; ausência de FK composta comprovando tenant do contato.

**Impacto:** Mapeamento ambíguo de webhook, órfãos e referência cruzada possível.

**Como reproduzir:** Ler DDL e query single por phone_number_id em index.js:1391.

**Correção recomendada:** Unique phone_number_id onde presente; unique tenant+telefone; validar dados e impor FK composta/NOT NULL progressivamente.

**Esforço:** M

**Verificação pós-correção:** Duplicações rejeitadas e message tenant diferente do contato recusada.

## PERF-001 — Listagens e agregações sem paginação

- **ID:** PERF-001
- **Severidade:** P2
- **Categoria:** performance
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:490`

**Estado atual / Problema:** Contatos, mensagens e knowledge retornam conjuntos inteiros; stats agrega em JS.

**Impacto:** Histórico crescente aumenta latência/RAM e pode ser truncado pelo limite Data API.

**Como reproduzir:** Handlers patients/messages/knowledge; nenhum range/limit nessas listagens.

**Correção recomendada:** Paginação por cursor, projeções e agregação SQL; índices tenant+created_at/patient.

**Esforço:** M

**Verificação pós-correção:** 10k registros paginam com ordenação estável e contagem correta.

## Tabelas conhecidas e dados

| Tabela | Conteúdo sensível / chaves | DDL versionado | RLS no script | SELECT / INSERT / UPDATE / DELETE | Isolamento |
|---|---|---|---|---|---|
| tenants | identidade, prompt, telefone, token Meta, plan/status/trial; UUID PK | sim | não habilita | grants/policies ausentes | backend; service_role |
| users | email, nome, password_hash, role/is_active; FK tenant nullable | sim | não habilita | grants/policies ausentes | backend por userId; null admin |
| users_whatsapp | telefone, nome, ai_memory, status; UUID presumido pelo uso | só ALTER tenant | script ativa patients, não esta | desconhecido remoto | filtro backend e fallback P0 |
| messages | texto/origem, patient_id, tenant_id | só ALTER tenant | habilita | service_role full; grants restantes ausentes | filtros; sem FK composta versionada |
| patients | tabela legada no RLS | não | habilita, se existir | service_role full | não usada como tabela principal |
| knowledge_base | documentos/texto/embedding/tenant | não | desconhecido | desconhecido | filtro REST + RPC não versionada |
| whatsapp_message_processing | message ID unique, telefone, status/last_error | sim | habilita | service_role full | ID global; tenant nullable |
| users_whatsapp_sandbox | contatos/memória | sim | habilita | service_role full | tenant FK nullable |
| messages_sandbox | mensagens | sim | habilita | service_role full | tenant e patient independentes |
| whatsapp_message_processing_sandbox | eventos | sim | habilita | service_role full | não roteada pelo runtime |

RLS habilitado não concede grants nem protege contra BYPASSRLS. service_role é usado em todos os clientes SDK server-side. Não há Supabase Auth JWT no navegador. Não se deve transplantar auth.uid() sem migrar identidade. [Referência oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Grants, funções e views

Inventário remoto de pg_policies, pg_class.relrowsecurity, information_schema.role_table_grants, pg_proc.prosecdef/proconfig e views é pendente de acesso autorizado. set_updated_at é PL/pgSQL invoker; não declara search_path. match_knowledge tem p_tenant_id passado pelo backend, mas só o corpo real provaria filtro e permissões. Nenhuma view/bucket/storage policy versionada encontrada. Não há migrations de extensão vector/índice vetorial.

### Índices / constraints

Índices simples tenant em users/messages/users_whatsapp; email unique torna índice extra de email possivelmente redundante. Falta índice composto (tenant_id,patient_id,created_at) para histórico e (tenant_id,created_at,id) para paginação. Não criar antes de EXPLAIN em massa representativa. WhatsApp phone mapping e contato exigem unique adequado. Tenants ON DELETE CASCADE em users; contatos/messages legado sem cascade completo torna exclusão não trivial. Ausência não é prova de ausência no banco remoto.

### Reprodutibilidade e restore

Pristine PostgreSQL 18.4 executou os três scripts e falhou; evidence/migration-probe.json. Para navegação foi criado OUTRO database com schema mínimo reconstruído, patients placeholder, knowledge_base embedding text e RPC não vetorial. Não é migration candidata à produção. Tabelas sandbox não são selecionadas por is_sandbox no runtime; marcação não garante separação.

Backups/PITR, região, SSL enforcement, conexões, pooling, planos e restore de produção: NÃO FOI POSSÍVEL VERIFICAR. Pergunta 'apagou às 15h, quanto demora?' não tem resposta demonstrável. Meta de piloto proposta: RPO ≤24h, RTO ≤4h; medir em restauração isolada antes de assumir compromisso. Exigências mais estritas requerem PITR e orçamento. Não apagar tabela para testar em produção.

### Crescimento

Hipótese: 100 conversas/tenant/mês, 10 entradas+10 saídas = 2.000 linhas messages/tenant/mês. 10/100/1.000/10.000 tenants geram 20 mil/200 mil/2 milhões/20 milhões de linhas por mês. A 2KB médios por linha: 40MB/400MB/4GB/40GB antes de índices, WAL, backups e embeddings. Valores são capacidade hipotética, não uso observado. Paginar/agregar antes de trocar de banco.


---

# WhatsApp e confiabilidade

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## WA-001 — POST do webhook não valida assinatura

- **ID:** WA-001
- **Severidade:** P0
- **Categoria:** whatsapp
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1358`

**Estado atual / Problema:** Corpo JSON é aceito sem HMAC/App Secret; GET verify_token não protege POST.

**Impacto:** Forjar mensagens, alimentar contexto da IA e consumir envio/IA.

**Como reproduzir:** runtime-audit: POST sem assinatura retornou 200 e criou registro no PostgreSQL local.

**Correção recomendada:** Verificar assinatura do corpo bruto antes de persistir; comparação constante; rejeitar assinatura ausente/inválida.

**Esforço:** S

**Verificação pós-correção:** Corpo alterado/assinatura ausente recebem 401/403 sem efeito. Validar contrato atual Meta em homologação.

## WA-002 — ACK precede persistência e fila é memória do processo

- **ID:** WA-002
- **Severidade:** P1
- **Categoria:** reliability
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1365`

**Estado atual / Problema:** ACK é imediato; processamento, debounce e locks ficam em Maps/Sets/setTimeout. Não há consumidor durável/recovery.

**Impacto:** Crash pode perder evento reconhecido; múltiplas instâncias processam mesma conversa em paralelo.

**Como reproduzir:** Inspeção de handler; matrizes conceituais de crash no relatório WhatsApp.

**Correção recomendada:** Inbox durável antes do ACK; worker com lease, retry, DLQ e ordenação por tenant/contato.

**Esforço:** L

**Verificação pós-correção:** Matar worker após ACK não perde evento; dois workers não concorrem na mesma conversa.

## WA-003 — Idempotência incompleta para falhas e envio parcial

- **ID:** WA-003
- **Severidade:** P1
- **Categoria:** reliability
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:172`

**Estado atual / Problema:** ID ausente segue; falta de tabela desativa persistência; failed é reaberto sem CAS; envio ocorre antes de salvar e não guarda wamid de saída.

**Impacto:** Resposta duplicada, bloqueio eterno de processing ou perda de rastreabilidade.

**Como reproduzir:** Duplicata simples passou no local; crash/retry após envio não é coberto por teste existente.

**Correção recomendada:** ID obrigatório, fail closed, lease/CAS, outbox e reconciliação do envio; não prometer exactly-once externo.

**Esforço:** M

**Verificação pós-correção:** Crash entre send/save, falha parcial e duas instâncias não duplicam resposta lógica.

## WA-004 — Apenas primeiro evento e status de entrega descartados

- **ID:** WA-004
- **Severidade:** P1
- **Categoria:** whatsapp
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1368`

**Estado atual / Problema:** Só entry[0]/changes[0]/messages[0] processados. Status/read são ignorados.

**Impacto:** Mensagens em lote perdidas e métricas de entrega incorretas.

**Como reproduzir:** Payload com duas messages: apenas primeira é referenciada pelo handler.

**Correção recomendada:** Iterar todos os eventos; persistir status com monotonicidade e idempotência.

**Esforço:** M

**Verificação pós-correção:** Dois eventos geram dois registros; status fora de ordem não retrocede lido para enviado.

## WA-005 — Janela, opt-out e handoff não são enforcement do backend

- **ID:** WA-005
- **Severidade:** P1
- **Categoria:** whatsapp
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1443`

**Estado atual / Problema:** Pausa é verificada uma vez antes do debounce; send manual não pausa IA; nenhum estado de opt-out/janela é conferido no envio.

**Impacto:** IA pode responder durante intervenção humana e envio fora da política pode falhar.

**Como reproduzir:** Pausar após buffer não muda patient capturado; avaliar branch de envio humano.

**Correção recomendada:** Estado de conversa autoritativo; reler antes de cada envio; opt-out e janela de atendimento; templates para casos autorizados.

**Esforço:** M

**Verificação pós-correção:** Pausa durante geração bloqueia envio; pedido humano/opt-out persiste; janela vencida exige template permitido.

## Fluxo observado

Meta → Express POST → JSON/log → ACK 200 → primeiro evento → tenant por phone_number_id → claim memória/DB → download mídia → contato/mensagem → debounce em memória → RAG/Gemini → HTTP Meta → salvar bot → SSE global. Não há Embedded Signup/OAuth ou callbacks, WABA modelada nem fluxo de reconexão do cliente. Admin digita phone_number_id e token manualmente.

## Regras e documentação

A página oficial confirma janela de serviço de 24h renovada a cada mensagem do usuário, com mensagens de serviço sem cobrança nessa janela. Templates e categorias têm regras/preços próprios. [WhatsApp pricing](https://whatsappbusiness.com/products/platform-pricing/). Tarifas brasileiras por categoria não foram verificadas; não estimar preço por 'conversa' universal.

As páginas developers.facebook.com de validação/payload retornaram erro à ferramenta. Portanto a conferência documental completa da assinatura e do ciclo de vida da Graph v20.0 permanece pendente. O fato no código é inequívoco: nenhuma validação criptográfica POST existe. Recomenda-se implementação HMAC-SHA256 do corpo bruto com App Secret, a ser homologada com contrato oficial atual. Não afirmar Graph v20.0 inválida só pela idade.

## Mídia

Áudio/imagem são baixados via Graph, convertidos em Base64 e enviados inline. GET metadata tem timeout 25s, download 30–120s calculado por tamanho, sem maxContentLength. Não há teto total de payload por conversa, MIME sniffing, quarentena ou armazenamento/bucket. Documentos recebidos pelo WhatsApp têm fallback não suportado; PDF/DOCX existem na ingestão administrativa, não no mesmo caminho. URLs de mídia vêm de Graph, não diretamente de req.body; não declarar SSRF direto sem prova.

## Matriz de falhas

| Falha | Hoje | Necessário |
|---|---|---|
| Duplicata simples | ID em cache/unique bloqueia; teste local passou | preservar |
| Crash depois do ACK | evento pode não ter sido persistido | inbox antes do ACK |
| Crash em processing | status bloqueia retries sem lease/recovery | lease expirável + recovery |
| Duas mensagens simultâneas | serialização só no processo | lock durável por conversa |
| Envio aceito + timeout HTTP | retry pode enviar de novo | outbox, wamid, reconciliação; registrar ambiguidade |
| Banco indisponível | já respondeu 200; erro assíncrono | 503 antes do ACK se não persistiu |
| Meta 429/500 | até 3 tentativas com backoff | fila durável, limites, alertas |
| Token expirado | log e falha; sem reconnect | estado desconectado + ação do cliente |
| Mensagem sem ID | aceita | rejeitar/quarentenar |
| Template/janela vencida | envia texto sem checar | regra server-side |
| Humano assume durante IA | captura anterior pode seguir enviando | revisar estado antes do envio |

Nem todos os cenários foram executados; crash/múltiplas instâncias/Meta real foram análise de código, não teste destrutivo. Preferir consumidor simples sobre PostgreSQL a introduzir simultaneamente Redis, QStash e Temporal.


---

# IA, prompts e evals

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## AI-001 — Prompt global contém fatos de negócio de outro contexto

- **ID:** AI-001
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:827`

**Estado atual / Problema:** Trechos fixos citam empresas, logística e profissionais em todo tenant.

**Impacto:** Respostas incorretas e confusão entre negócios mesmo sem acesso ao banco de outro tenant.

**Como reproduzir:** Prompt de consultarGeminiDinamicamente inclui exemplos fixos após regras finais.

**Correção recomendada:** Remover fatos de negócio da política global; isolá-los nos dados do tenant e validar golden conversations por nicho.

**Esforço:** S

**Verificação pós-correção:** Tenant fictício de restaurante nunca oferece serviços logísticos por instrução global.

## AI-002 — SDK legado e fallback vivo usa o mesmo modelo

- **ID:** AI-002
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:844`

**Estado atual / Problema:** Principal e fallback são gemini-3.5-flash-lite; sandbox usa configuração diferente. @google/generative-ai é legado.

**Impacto:** Indisponibilidade do modelo não é mitigada; correções do SDK deixam de chegar.

**Como reproduzir:** Comparar index.js modelos e admin.js CONFIG; documentação Google libraries.

**Correção recomendada:** Migrar SDK com teste de paridade; modelo fallback distinto validado; humano como degradação; não adicionar três providers agora.

**Esforço:** M

**Verificação pós-correção:** Falha de modelo aciona alternativa permitida e falha total pausa/encaminha sem loop.

## AI-003 — Contexto, memória e ingestão sem orçamento global de tokens

- **ID:** AI-003
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:577`

**Estado atual / Problema:** Histórico tem limite de linhas, não de tokens; memória cresce, RAG vivo sem limite de caracteres; embeddings/memória sem timeout uniforme.

**Impacto:** Latência e custo imprevisíveis; documentos grandes podem consumir memória/processamento.

**Como reproduzir:** Histórico 20; prompt salvo até 50 mil chars; ingestão retorna texto externo sem teto global.

**Correção recomendada:** Budget por chamada/contexto; memória por schema/TTL; limites de chunks/bytes e abort real.

**Esforço:** M

**Verificação pós-correção:** Entrada longa respeita orçamento e timeouts cancelam requests; custo medido.

## AI-004 — Sanitização não equivale a defesa de prompt injection

- **ID:** AI-004
- **Severidade:** P1
- **Categoria:** ai
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/utils/hallucination.js:3`

**Estado atual / Problema:** Heurística ignora alucinação quando existe qualquer RAG; regras do tenant, memória e documentos são concatenadas. Não há eval real de injeção.

**Impacto:** Instruções hostis podem alterar respostas e dados de memória; qualidade não demonstrada.

**Como reproduzir:** Mocks determinísticos testam formato; não foram feitas chamadas pagas para medir resistência do modelo.

**Correção recomendada:** Separar política/dados, citar suporte internamente, validar memória por schema e executar evals adversariais.

**Esforço:** M

**Verificação pós-correção:** Zero vazamento nos canários críticos; handoff em desconhecido; métricas por versão.

## Implementação

Provider único Google. Atendimento: gemini-3.5-flash-lite principal/fallback; maxOutputTokens 500, temperatura .20, topP .80, topK 40; history limite 20; timeout 25s, 3 tentativas + fallback. Repair até 2 iterações pode multiplicar chamadas. RAG embedding-2 corta vetor em 768 sem solicitar dimensão explicitamente; top7 threshold .42; contexto completo dos chunks. Memória extrai JSON após resposta, sem schema nem timeout/maxOutputTokens explícitos.

Admin/sandbox: modelo por GEMINI_MODEL/default 3.5-flash-lite, fallback 2.5-flash, top5 threshold .48, contexto 5500 chars, history 12 x 2500 chars, saída 220 tokens. Magic: 4500 tokens. Chunks 1800 chars/overlap180, concorrência3 e batch50. Ingestão não tem total de chunks. SDK legado [Google libraries](https://ai.google.dev/gemini-api/docs/libraries); migrar com testes de contrato.

### Prompts encontrados

- auth.js PROMPT_DEFAULTS: templates resumidos por nicho usados no cadastro.
- admin.js buildMagicSetupPrompt: gera system prompt a partir de dados delimitados; contém orientação explícita para tratar dados como conteúdo.
- admin.js buildRagSystemPrompt: tenant + conhecimento + regras de formato.
- index.js consultarGeminiDinamicamente: tenant + memória + RAG + regras globais + exemplos fixos inadequados.
- index.js atualizarMemoriaLongoPrazo: JSON livre de fatos extraídos.
- index.js finalizeAssistantResponse: prompt de repair.
- admin.js extractTextFromRequestBody: OCR/PDF.
- prompts/*.txt: templates/materiais de nicho sem carregamento no fluxo vivo encontrado.

Não há tool/function calling, agenda executável ou integração CRM: modelo só gera texto; envio é backend. Portanto 'LLM sugere, backend autoriza' deve ser o contrato de futuras tools, não descrever recurso existente. JSON.parse de memória não é schema de autorização. Proposta: plataforma imutável → instruções tenant → fatos com proveniência → histórico limitado → última mensagem. Memória é dado não confiável, nunca instrução.

### Avaliação de qualidade

Respostas de mocks não avaliam Gemini. Nenhuma medição de precisão/latência/custo de provider foi feita. Heurística de alucinação é específica demais e desligada com RAG; sanitizador bloqueia rascunhos/JSON/stack, não factualidade. Golden Conversations e critérios estão em 12_TEST_STRATEGY.md e golden-conversations.json.

Recomendação MVP: um provider bem instrumentado, limites rígidos, fallback de modelo validado e handoff real. Introduzir segundo provider apenas se SLA/erro medido justificar. Comparar categorias econômico e superior com mesmos casos, tokens medidos por tokenizer, p50/p95, qualidade/handoff e custo; não escolher só preço.

### Segurança adversarial

Casos obrigatórios: ignore instruções; revele system; dados de outra empresa; exporte tudo; execute URL; proibição administrativa; injeção em documento e memória. Injeção não cria acesso ao banco que não existe, mas pode fazer o modelo expor contexto já injetado e enviar texto indesejado. Vazamentos TEN-001/TEN-002 tornam o contexto especialmente importante. Respostas simuladas de auditoria não contam como passagem nesses casos.


---

# UX, produto, acessibilidade e performance

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## UX-001 — Canais exibem conexão e métricas fictícias

- **ID:** UX-001
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Channels.jsx:166`

**Estado atual / Problema:** Telefone, conexão, atividade e métricas são fixos; verificar status apenas anima.

**Impacto:** Cliente acredita que número está pronto sem onboarding Meta real.

**Como reproduzir:** Ler Channels e comparar cliente recém-criado sem Meta com tela conectada.

**Correção recomendada:** Conectar a status verificado do backend; ocultar simulados; checklist guiado de conexão.

**Esforço:** M

**Verificação pós-correção:** Conta nova mostra desconectada e explica ação; só confirma após checagem real.

## UX-002 — Configurações, billing, equipe e 2FA são maquetes

- **ID:** UX-002
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Settings.jsx:49`

**Estado atual / Problema:** Botões sem persistência; plano/uso/cartão/equipe/API key estáticos.

**Impacto:** Promessas comerciais sem implementação; falsa percepção de segurança.

**Como reproduzir:** Settings contém plano Pro fixo e toggle 2FA com callback vazio.

**Correção recomendada:** Remover ou marcar indisponível; priorizar conta real, cobrança contratual e limites server-side.

**Esforço:** M

**Verificação pós-correção:** Nenhuma ação mostra sucesso sem efeito; plano vem do servidor.

## UX-003 — Sliders de personalidade não são salvos nem usados pela IA

- **ID:** UX-003
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/AiSetup.jsx:87`

**Estado atual / Problema:** Valores só alteram preview local e voltam a defaults no reload; fullForm não contém sliders.

**Impacto:** Configuração principal aparenta funcionar mas não altera comportamento.

**Como reproduzir:** Alterar slider/recarregar; inspecionar fullForm e payload de save.

**Correção recomendada:** Persistir parâmetros estruturados e compilar prompt; carregá-los no mount.

**Esforço:** M

**Verificação pós-correção:** Valor e comportamento sobrevivem reload; teste por API e UI.

## UX-004 — Inbox de conversa cortado no celular

- **ID:** UX-004
- **Severidade:** P1
- **Categoria:** ux
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Chat.jsx:82`

**Estado atual / Problema:** Lista fixa ocupa 320px em viewport 360px e área de conversa fica comprimida/cortada.

**Impacto:** PME não consegue operar atendimento pelo celular.

**Como reproduzir:** Revisão visual evidence/local-painel-chat-360.png; overflow false não detecta clipping.

**Correção recomendada:** Layout de duas telas lista/conversa no mobile, com voltar e composer visível.

**Esforço:** M

**Verificação pós-correção:** Selecionar contato, ler e enviar a 360/390px sem corte e com teclado virtual.

## UX-005 — Métrica de resolução confunde IA ativa com sucesso

- **ID:** UX-005
- **Severidade:** P2
- **Categoria:** analytics
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Analytics.jsx:117`

**Estado atual / Problema:** Calcula aiAtivo/total como resolução; segmentos misturam dimensões sobrepostas; filtro período não refaz dados.

**Impacto:** Cliente recebe indicadores que não medem resultado.

**Como reproduzir:** Inspeção Analytics linhas 120-145.

**Correção recomendada:** Eventos de encerramento/handoff; intervalos reais no servidor e métricas com definição.

**Esforço:** S

**Verificação pós-correção:** Fixture com IA ativa mas não resolvida não conta como resolução.

## SEO-001 — Robots e sitemap retornam shell SPA

- **ID:** SEO-001
- **Severidade:** P2
- **Categoria:** seo
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/vercel.json:4`

**Estado atual / Problema:** Arquivos ausentes caem no fallback; canonical é global.

**Impacto:** SEO e rastreamento com respostas enganosas.

**Como reproduzir:** Navegação produção /robots.txt e /sitemap.xml termina na Home; status 200/304.

**Correção recomendada:** Publicar robots/sitemap válidos e metadata por rota; 404 real onde cabível.

**Esforço:** S

**Verificação pós-correção:** Content-Type e conteúdo corretos; rotas privadas excluídas; canonical coerente.

## Revisão visual e navegação

Produção: Home/Sobre/Planos/Privacidade/Login/Cadastro e redirect /painel em 390/1440px; sem erros JS e sem requests 4xx/5xx nas navegações coletadas. Não foram clicados links que enviam WhatsApp nem formulários em produção. Local: todas as 17 páginas e fallback capturados em 360/390/768/1024/1440px, conforme evidence/local-browser.json. Capturas de páginas com scroll interno representam viewport inicial; screenshot fullPage não torna conteúdo interno visível. Capturas públicas sem rolar podem ocultar conteúdo com animação de entrada: não classificado como 'página vazia'.

Inspeção humana das imagens encontrou clipping no Chat, apesar de scrollWidth não acusar overflow. Settings mobile comprime descrições em uma coluna estreita devido a inputs de 200px. Sliders sem rótulo acessível; inputs de cabeçalho e controles de configurações sem label adequado. Login/cadastro têm labels e autocomplete. Falta revisão com leitor de tela, contraste instrumental completo e teclado virtual real: NÃO FOI POSSÍVEL VERIFICAR WCAG integral.

### Onboarding e proposta

Landing tem linguagem simples e CTAs claros, com exemplos de agendamento que vão além das ações executáveis atuais. Não há agenda real; dizer 'Agendei' só é correto se integração confirmar. Cadastro em etapas → painel → IA → base → conexão assistida pelo admin → teste → primeiro evento: ao menos 6 marcos, sem wizard guiado ou estado de conclusão. Tempo até valor não foi medido; depende de habilitação Meta externa. Exibir checklist e confirmação real, concentrando primeiro sucesso no teste em 3 etapas do produto.

### /painel/ia

A primeira aba transmite simplicidade mas sliders não fazem parte do prompt salvo. 'BDR/SDR', 'tenant' e 'prompt' são termos técnicos em partes da UI. Preferir 'Objetivo do atendimento', exemplos de regras e handoff. Salvar parâmetros junto da compilação; não exigir edição de texto técnico para comportamento comum.

### Performance

Build passou: entrada principal 241.66kB (gzip72.75), CSS62.84kB (gzip11.99), router chunk42.26kB. Rotas secundárias lazy. Assets públicos incluem logo.png ~6.8MB e favicon ~460KB; não assumir que todos são carregados. Converter/comprimir apenas usados, dimensionar favicon e verificar rede. App é SPA sem hydration SSR; recomendações Next/Server Components não se aplicam. Nenhum Lighthouse/Core Web Vitals de campo medido. Requisições GET são deduplicadas em voo; Layout+Home consultam stats e SSE dispara refetch global.

### SEO

Title/description/OG/Twitter/canonical/favicon existem em index.html. Alguns títulos mudam em useEffect, mas canonical/OG são globais; og:image relativo. Não há structured data/robots/sitemap real. Panel usa shell index/follow. Ver diferenças produção/local em evidence, sem alegar igualdade do commit do deploy por semelhança visual.


---

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


---

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


---

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


---

# Privacidade e retenção

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## SEC-004 — Logs registram payload completo e dados de memória

- **ID:** SEC-004
- **Severidade:** P1
- **Categoria:** privacy
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `src/index.js:1362`

**Estado atual / Problema:** Corpo do webhook é serializado, e erros de parse podem registrar memória extraída; telefone aparece em logs.

**Impacto:** Conteúdo pessoal/sensível fica acessível a operadores e provedores de logs.

**Como reproduzir:** Inspeção e saída de testes com fixtures; sem extração de logs remotos.

**Correção recomendada:** Logs estruturados por IDs pseudonimizados; redaction; política de retenção e acesso.

**Esforço:** S

**Verificação pós-correção:** Canários de telefone, mensagem e token não aparecem em logs de sucesso/erro.

## PRIV-001 — Exclusão, retenção e garantias de uso de dados não comprovadas

- **ID:** PRIV-001
- **Severidade:** P1
- **Categoria:** privacy
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Privacy.jsx:57`

**Estado atual / Problema:** Política afirma ausência de treino de terceiros, mas tier/contrato não está verificado; nenhuma rotina de retenção/exportação/exclusão completa.

**Impacto:** Promessas não demonstradas e retenção excessiva de conversas/memória.

**Como reproduzir:** Privacy e Settings; não há APIs de exclusão/exportação. Google distingue uso de dados free/paid.

**Correção recomendada:** Confirmar contratos/subprocessadores, inventário e bases legais; implementar exercício de direitos com revisão jurídica.

**Esforço:** M

**Verificação pós-correção:** Conta de teste excluída com rastreio e restauração de backup respeita tombstone.

## Inventário prático

Dados: nome/email/hash de senha do usuário; nomes/telefones/mensagens de contatos; documentos; memória inferida de preferências/intenção/orçamento; tokens de integração. Mensagens em clínicas podem conter dados sensíveis: não inferir base legal universal. Operação pode envolver papéis distintos de controlador/operador; contrato precisa definir responsabilidades. [LGPD oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm). Esta é revisão técnica, não parecer jurídico.

Subprocessadores no código: Supabase, Google, Meta, host; Jina recebe URLs/conteúdo obtido; ViaCEP recebe CEP no navegador. Storage externo não implementado. Região, DPA, uso free/paid, retenção dos fornecedores e transferência internacional NÃO FOI POSSÍVEL VERIFICAR. Não repetir garantia 'nenhum treinamento' sem confirmar contrato/tier. [Google pricing e uso de dados](https://ai.google.dev/gemini-api/docs/pricing).

## Retenção proposta para discussão contratual

| Classe | Proposta operacional inicial | Ação |
|---|---|---|
| Mensagens | 90 dias configuráveis conforme finalidade | apagar/anonimizar; opt-in de retenção maior justificado |
| Memória | 90 dias de inatividade + revisão de finalidade | remover fatos sensíveis desnecessários e proveniência expirada |
| Webhook bruto | evitar guardar corpo; debug restrito ≤7 dias | descartar corpo; manter ID/status dedup pelo horizonte de retry aprovado |
| Logs aplicação/IA | 14–30 dias sem texto/prompt | agregar métricas por tenant |
| Analytics | agregados 12 meses, eventos pessoais mínimos | pseudonimizar e limitar acesso |
| Conta excluída | prazo contratual de execução definido | tombstone impede restauração silenciosa; expirar backups |
| Dados fiscais | prazo legal específico por jurisdição/atividade | separar de conversas; validar jurídico |

Esses prazos são propostas, não obrigação legal estabelecida nem configuração atual. Política atual é genérica e não implementa purge.

## Fluxo de direitos e exclusão recomendado

Autenticar pedido → suspender automação e cobranças futuras conforme contrato → revogar sessões/tokens de canal → exportar se solicitado → excluir mensagens/conteúdo/memória e arquivos → anonimizar logs/agregados → guardar evidência mínima do atendimento → aplicar tombstone ao restaurar backup. Retenção obrigatória deve ser separada e documentada. Exclusão não é 'DELETE tenant cascade' indiscriminado.

Ainda faltam termos de serviço claros, contrato/DPA, canal de contato operacional verificado, base/finalidade por classe, fluxo de exportação, consentimento/opt-out quando aplicável, plano de incidente e inventário de acesso. MFA admin e redução de payload logs são prioridades técnicas. E-mail contato@zapai.com.br está na política; existência/SPF/DKIM/DMARC/caixa e SLA não verificados.


---

# Testes e evidências

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Execução desta auditoria

| Checagem | Resultado | Limite |
|---|---|---|
| npm test inicial | FALHOU sem JWT_SECRET | unitários passaram, integração não inicializou |
| npm test com segredo fictício e sem Gemini real | PASSOU | 4 scripts existentes; mocks, não Supabase/LLM real |
| npm ci --prefix frontend --ignore-scripts | PASSOU | preservou lock; browser já disponível |
| npm run lint --prefix frontend | PASSOU | regras hooks/unused/empty desligadas |
| npm run build --prefix frontend | PASSOU | Vite8.0.7; warning Browserslist desatualizado |
| typecheck | NÃO EXISTE | projeto JS/JSX; não inventado |
| backend build/lint | NÃO EXISTEM | sintaxe Node checada separadamente |
| npm audit | 1 moderate backend; 12 frontend | triagem, não exploit confirmado |
| migrations banco vazio | FALHOU | tabelas-base/RPC ausentes |
| runtime-audit.cjs | executado com HTTP/Postgres real local | fixtures, Meta/Gemini mocks, schema reconstruído |
| browser-audit.cjs | screenshots + console/network/labels | detalhes em JSON; não WCAG completo |
| scan Git | 343 blobs, zero matches | regex limitado; sem scan da cloud |

Suite existente: ai-safety.test.js e hallucination.spec.js são unitários; webhook.integration.test.js e integration.spec.js invocam Express com stream fake e Supabase mock. Cobrem sanitização, repair, fallback e duplicata simples. Não cobrem RLS/grants, autenticação completa, concorrência distribuída, billing nem qualidade real de IA.

## Matriz E2E

1. Cadastro→confirmação→login→onboarding→painel: cadastro/login local verificados; confirmação/onboarding dedicado inexistem.
2. IA→salva→reload: edição, salvamento e reload pela UI passaram; prompt original restaurado. Slider alterado para 12 voltou a 65 após reload (focused-e2e.json).
3. Conecta WhatsApp→evento→conversa→IA: evento local/DB/backend exercitado, Meta e geração simulados; conexão real/app review pendentes.
4. A→recurso B: list/read/send protegidos; SSE e fallback falham; viewer escreve; teste precisa virar gate.
5. Logout→rota protegida→login: login/logout reais pela UI e redirecionamento anônimo passaram; troca A→B revelou histórico de sandbox de A. Revogação server não existe.

## Evals e Golden Conversations

Dataset em golden-conversations.json: 18 casos iniciais. Expandir para ao menos 5 nichos, português realista, multi-turn e ground truth factual; não usar dados reais sem base/minimização. Fazer split de regressão e conjunto cego; versionar prompt/modelo/RAG.

Métricas propostas: factualidade suportada, taxa de alucinação, precisão de handoff, obediência de política, resolução definida, latência p50/p95, tokens/custo por sucesso. Tool correctness não aplicável hoje. Metas piloto propostas: zero vazamento/canário e ações não autorizadas; handoff explícito 100%; taxa factual ≥95% em conjunto revisado; latência e custo com teto acordado, não números inventados como medição. LLM-as-judge pode auxiliar, com revisão humana e custos próprios contabilizados. Nenhum resultado de mock deve pontuar esses indicadores.

## Falhas/concorrrência a transformar em testes

Banco cai antes/depois de ACK; worker morre; duas instâncias; dois eventos mesmo ID; duas mensagens mesmo contato; status fora de ordem; Meta aceita mas timeout; provider429/500; token expirado; pausa humana durante inferência; ingestão parcial; reset de senha reutilizado; sessão revogada; consulta knowledge B.

As reproduções de vulnerabilidades esperam registrar comportamento atual, portanto exit0 de runtime-audit não significa 'seguro'. Cada caso inclui expected e actual; usar asserts negativos após correção. Não enviar fixtures para produção.


---

# Checklist de lançamento

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Bloqueadores

- [ ] SEC-001: Autenticar stream, associar conexão ao tenant e filtrar todos os eventos no servidor.
- [ ] WA-001: Verificar assinatura do corpo bruto antes de persistir; comparação constante; rejeitar assinatura ausente/inválida.
- [ ] TEN-001: Remover recuperação global, falhar fechado e usar unique(tenant_id,telefone) com upsert restrito.
- [ ] COST-001: Reservar orçamento atomicamente por tenant antes de chamada; limites por IP/usuário/tenant; teto global e kill switch.
- [ ] TEN-002: Usar estado de sessão/tenant e limpar no logout; não tratar localStorage como cofre.
- [ ] Reexecutar provas negativas com dois tenants em ambiente representativo e catálogos/policies reais.

## Antes do primeiro cliente

- [ ] Baseline migration reproduz banco, constraints e RPC.
- [ ] Inbox durável antes do ACK e recovery de processing.
- [ ] RBAC, revogação e MFA admin.
- [ ] Reset/confirm e SMTP com SPF/DKIM/DMARC verificados.
- [ ] Meta assinatura, app review/permissões, phone mapping único, tokens/reconnect, janela/templates e opt-out homologados.
- [ ] Handoff interrompe envio em andamento.
- [ ] Quota/trial/plan bloqueiam backend e orçamento é atômico.
- [ ] UI deixa claro o implementado; elimina conexão/billing/2FA fictícios.
- [ ] Restore isolado ensaiado; alertas de readiness/custo/worker recebidos.
- [ ] Política/termos/contratos/subprocessadores e suporte coerentes.

## Antes dos primeiros 10 clientes

- [ ] E2E de conta/IA/conversa/logoff e regressões de tenant no CI.
- [ ] Golden conversations revisadas por nicho e métrica real de resolução.
- [ ] Inbox mobile utilizável; feedback de erro sem silenciosamente deslogar em falha transitória.
- [ ] Painel interno de custo/erro por tenant; limites operacionais documentados.
- [ ] Runbook de indisponibilidade Meta/IA/banco e comunicação ao cliente.

## Antes dos primeiros 100 clientes

- [ ] Paginação/agregações/indexes testados com volume.
- [ ] Carga concorrente e multiworker com leases/serialização.
- [ ] Revisão de orçamento/compute e pooling.
- [ ] Retenção/exclusão/exportação e restore respeitando tombstones.
- [ ] Billing automatizado só com assinatura/idempotência/entitlements.
- [ ] Revisão de acessos e incidente simulados.

### Gate comercial

Não basta corrigir visual e obter build verde. P0 resolvido + isolamento demonstrado + operação recuperável + quota financeira + conexão/handoff reais são condições para piloto pago supervisionado. Para self-service, onboarding, recuperação e cobrança completa precisam estar concluídos.


---

# Roadmap, quick wins e o que não mudar

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## Próximas 48 horas — apenas bloqueadores

Fechar SSE, assinatura, transferência, sandbox cruzado e orçamento. Se não couber no prazo, manter lançamento suspenso. Não é promessa de terminar todos os P0 em 48h. Cada correção deve ter teste que falha no código atual.

## Semana 1 — segurança e estabilidade

Schema baseline/grants, RBAC/revogação/MFA, inbox/outbox, recovery, observabilidade mínima, dependências com triagem e pipeline.

## Semana 2 — UX, monitoramento e IA

Conexão real, sliders persistidos, inbox mobile, reset/confirm, qualidade de prompt e handoff, métricas de custo/erro, golden conversations.

## Primeiro mês

Piloto limitado com suporte, orçamento por tenant, restore ensaiado e processo de privacidade; paginação e medição de latência/conversão. Cobrança manual é aceitável se plano e quotas forem reais.

## Três meses

Billing self-service, maior automação onboarding, SLOs baseados em dados, multiworker se necessário, auditoria periódica de permissões, provider2 somente por SLA.

## Top 20 por impacto/esforço (julgamento relativo)

| Rank | Melhoria | Impacto | Esforço | Prioridade |
|---:|---|---|---|---|
| 1 | SEC-001 Stream SSE público transmite dados globais | Leitura anônima de mensagens e dados de contatos entre empresas. | M | P0 |
| 2 | WA-001 POST do webhook não valida assinatura | Forjar mensagens, alimentar contexto da IA e consumir envio/IA. | S | P0 |
| 3 | TEN-001 Fallback transfere contato e memória de outra empresa | Vazamento de memória privada e corrupção de propriedade do contato. | S | P0 |
| 4 | TEN-002 Histórico de sandbox compartilhado entre contas no navegador | Pessoa B no mesmo perfil de navegador lê e pode reenviar ao provider conversas de A. | S | P0 |
| 5 | COST-001 IA sem orçamento, quota ou enforcement de plano | Uso automatizado pode consumir o limite do provedor sem limite financeiro imposto pelo SaaS. | M | P0 |
| 6 | AUTH-002 RBAC de owner, agent e viewer não é aplicado | Visualizador pode alterar operação e IA. | S | P1 |
| 7 | SEC-004 Logs registram payload completo e dados de memória | Conteúdo pessoal/sensível fica acessível a operadores e provedores de logs. | S | P1 |
| 8 | UX-001 Canais exibem conexão e métricas fictícias | Cliente acredita que número está pronto sem onboarding Meta real. | M | P1 |
| 9 | UX-003 Sliders de personalidade não são salvos nem usados pela IA | Configuração principal aparenta funcionar mas não altera comportamento. | M | P1 |
| 10 | AI-001 Prompt global contém fatos de negócio de outro contexto | Respostas incorretas e confusão entre negócios mesmo sem acesso ao banco de outro tenant. | S | P1 |
| 11 | SEC-003 CORS aceita qualquer origem com credentials | Amplia superfície de browser; sozinho não rouba JWT do localStorage de outro origin. | XS | P2 |
| 12 | DB-001 Migrations não recriam o banco | Recuperação/staging e prova de isolamento não são reproduzíveis. | M | P1 |
| 13 | WA-002 ACK precede persistência e fila é memória do processo | Crash pode perder evento reconhecido; múltiplas instâncias processam mesma conversa em paralelo. | L | P1 |
| 14 | WA-003 Idempotência incompleta para falhas e envio parcial | Resposta duplicada, bloqueio eterno de processing ou perda de rastreabilidade. | M | P1 |
| 15 | AUTH-001 JWT de sete dias não é revogado nem revalida usuário | Usuário desativado ou rebaixado pode continuar usando JWT até expirar. | M | P1 |
| 16 | AUTH-004 Recuperação e alteração segura de senha não implementadas | Cliente perde acesso e suporte depende de intervenção manual. | M | P1 |
| 17 | UX-004 Inbox de conversa cortado no celular | PME não consegue operar atendimento pelo celular. | M | P1 |
| 18 | OPS-001 Health só mede processo; sem alertas, tracing ou uso IA | Falha silenciosa de DB, fila ou provider pode passar despercebida. | M | P1 |
| 19 | SEC-005 Dependências com advisories conhecidos | Risco de desenvolvimento/build e dependências de runtime; não implica 8 exploits em produção SPA. | S | P1 |
| 20 | PRIV-001 Exclusão, retenção e garantias de uso de dados não comprovadas | Promessas não demonstradas e retenção excessiva de conversas/memória. | M | P1 |

## Quick wins

XS: negar CORS desconhecido; retirar flags falsas e seed HTTP de exposição operacional. S: autenticar/filtrar SSE conforme transporte, corrigir lookup global, remover exemplos fixos de negócio, redigir logs, mascarar tokens de admin, atualizar dependências direcionadas. Não estimar meia hora/um dia sem medir dependências e testes.

## Coisas boas que não devem ser refeitas

React/Vite, Tailwind/design base, lazy routes, helper de API, bcrypt, JWT_SECRET obrigatório, allowlist admin, filtros REST por tenant, unique de webhook, limites de histórico e sanitização de saída. Manter Meta oficial/Supabase. Refatoração monólito só para reduzir risco/cobrir testes; não trocar framework por novidade.

## Dívida técnica

| Item | Risco / impacto futuro | Resolver agora? |
|---|---|---|
| index.js e admin.js duplicam IA/política | divergência de resposta e segurança | pipeline mínimo comum sim; extração completa incremental |
| pacientes/users_whatsapp naming legado | migration errada e confusão operacional | sim, reconciliar sem rename destrutivo |
| maquetes em tela comercial | suporte e expectativa incorretos | sim |
| SQL sem baseline/RPC | restore/CI inviável | sim |
| JSX sem types | contratos frágeis | schema API agora; TS gradual depois |
| assets legados pesados | armazenamento/cache desnecessários | compressão dos usados; limpeza depois |
| lint permissivo | efeito stale/erro escondido | reativar progressivo |
| observabilidade console | diagnóstico lento/custo sem teto | sim |
| Redis/segundo provider não existem | não é dívida por si só | depois de evidência |

Nenhuma mudança arquitetural desta recomendação foi aplicada na auditoria. As únicas adições são documentos, provas e ferramentas locais.


## Rastreabilidade das 88 seções solicitadas

Esta matriz indica onde cada tópico foi tratado; não transforma itens não verificáveis em testes aprovados.

| Seção da missão | Relatório | Cobertura / limite |
|---|---|---|
| 1. DESCOBERTA COMPLETA DO PROJETO | [01_CURRENT_ARCHITECTURE.md](01_CURRENT_ARCHITECTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 2. CRIAR UM MAPA REAL DA ARQUITETURA | [01_CURRENT_ARCHITECTURE.md](01_CURRENT_ARCHITECTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 3. INVENTÁRIO COMPLETO DE ROTAS | [02_ROUTES_AND_ENDPOINTS.md](02_ROUTES_AND_ENDPOINTS.md) | Evidências, classificação e limitações no relatório indicado |
| 4. INVENTÁRIO COMPLETO DE ENDPOINTS | [02_ROUTES_AND_ENDPOINTS.md](02_ROUTES_AND_ENDPOINTS.md) | Evidências, classificação e limitações no relatório indicado |
| 5. LOGIN, CADASTRO E AUTENTICAÇÃO | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 6. SUPABASE — AUDITORIA EXTREMAMENTE PROFUNDA | [04_DATABASE_AND_SUPABASE.md](04_DATABASE_AND_SUPABASE.md) | Código/local avaliados; catálogo, backups e configuração cloud não verificados |
| 7. MULTI-TENANCY | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 8. WHATSAPP / META CLOUD API | [05_WHATSAPP_META.md](05_WHATSAPP_META.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 9. IA — AUDITORIA COMPLETA | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 10. PROMPTS | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 11. PROMPT INJECTION | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 12. TOOLS E FUNCTION CALLING | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 13. CONTEXTO E MEMÓRIA | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 14. CUSTOS DE IA | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 15. FALLBACK DE IA | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 16. AVALIAÇÃO DA IA | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 17. HANDOFF HUMANO | [05_WHATSAPP_META.md](05_WHATSAPP_META.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 18. SEGURANÇA — OWASP | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 19. SECRETS | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 20. RATE LIMITING | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 21. HEADERS DE SEGURANÇA | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 22. DEPENDÊNCIAS | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 23. QUALIDADE DO CÓDIGO | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 24. UX/UI — VARREDURA VISUAL COMPLETA | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 25. LANDING PAGE | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 26. LOGIN E CADASTRO — UX | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 27. ONBOARDING | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 28. PAINEL | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 29. /PAINEL/IA | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 30. ACESSIBILIDADE | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Navegação e amostra visual; sem certificação WCAG ou carga representativa |
| 31. RESPONSIVIDADE | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Navegação e amostra visual; sem certificação WCAG ou carga representativa |
| 32. PERFORMANCE FRONTEND | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Navegação e amostra visual; sem certificação WCAG ou carga representativa |
| 33. BANCO E PERFORMANCE | [04_DATABASE_AND_SUPABASE.md](04_DATABASE_AND_SUPABASE.md) | Evidências, classificação e limitações no relatório indicado |
| 34. FILAS E PROCESSAMENTO ASSÍNCRONO | [05_WHATSAPP_META.md](05_WHATSAPP_META.md) | Evidências, classificação e limitações no relatório indicado |
| 35. OBSERVABILIDADE | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 36. LOGS | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 37. MÉTRICAS | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 38. ANALYTICS | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 39. LGPD | [11_LGPD_AND_PRIVACY.md](11_LGPD_AND_PRIVACY.md) | Evidências, classificação e limitações no relatório indicado |
| 40. RETENÇÃO | [11_LGPD_AND_PRIVACY.md](11_LGPD_AND_PRIVACY.md) | Evidências, classificação e limitações no relatório indicado |
| 41. EXCLUSÃO DE CONTA | [11_LGPD_AND_PRIVACY.md](11_LGPD_AND_PRIVACY.md) | Evidências, classificação e limitações no relatório indicado |
| 42. BACKUPS | [04_DATABASE_AND_SUPABASE.md](04_DATABASE_AND_SUPABASE.md) | Código/local avaliados; catálogo, backups e configuração cloud não verificados |
| 43. STAGING E PRODUÇÃO | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Código/local avaliados; catálogo, backups e configuração cloud não verificados |
| 44. CI/CD | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 45. DEPLOY E ROLLBACK | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Código/local avaliados; catálogo, backups e configuração cloud não verificados |
| 46. STACK — PARTE MUITO IMPORTANTE | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 47. DEVO CONTINUAR COM VERCEL? | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 48. PRECISO DE RENDER? | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 49. DEFINIR STACK FINAL RECOMENDADA | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 50. NÃO FAÇA OVERENGINEERING | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 51. CUSTO DA INFRAESTRUTURA | [10_COSTS_AND_SCALING.md](10_COSTS_AND_SCALING.md) | Evidências, classificação e limitações no relatório indicado |
| 52. BILLING | [10_COSTS_AND_SCALING.md](10_COSTS_AND_SCALING.md) | Evidências, classificação e limitações no relatório indicado |
| 53. LIMITES DE PLANO | [10_COSTS_AND_SCALING.md](10_COSTS_AND_SCALING.md) | Evidências, classificação e limitações no relatório indicado |
| 54. TESTES | [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md) | Evidências, classificação e limitações no relatório indicado |
| 55. TESTES E2E ESSENCIAIS | [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md) | Evidências, classificação e limitações no relatório indicado |
| 56. TESTES DE CONCORRÊNCIA | [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md) | Revisão dos caminhos e matriz proposta; chaos/multiworker não executados |
| 57. TESTES DE FALHA | [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md) | Revisão dos caminhos e matriz proposta; chaos/multiworker não executados |
| 58. HEALTH CHECKS | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 59. ADMIN | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 60. SEO DA LANDING PAGE | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 61. EMAILS TRANSACIONAIS | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 62. OBSERVABILIDADE DE IA | [06_AI_AUDIT.md](06_AI_AUDIT.md) | Código e simulação local; integração/qualidade/custo real não medidos |
| 63. FEATURE FLAGS | [08_INFRASTRUCTURE.md](08_INFRASTRUCTURE.md) | Evidências, classificação e limitações no relatório indicado |
| 64. VERIFICAÇÃO DO SITE EM PRODUÇÃO | [07_UX_UI_AUDIT.md](07_UX_UI_AUDIT.md) | Navegação e amostra visual; sem certificação WCAG ou carga representativa |
| 65. CLASSIFICAÇÃO DE PROBLEMAS | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 66. FORMATO OBRIGATÓRIO DE CADA ACHADO | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 67. NÃO CONFUNDIR NÃO ENCONTRADO COM SEGURO | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 68. SCORE DE PRONTIDÃO | [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md) | Evidências, classificação e limitações no relatório indicado |
| 69. GO / NO-GO | [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md) | Evidências, classificação e limitações no relatório indicado |
| 70. CHECKLIST PRÉ-LANÇAMENTO | [13_PRODUCTION_CHECKLIST.md](13_PRODUCTION_CHECKLIST.md) | Evidências, classificação e limitações no relatório indicado |
| 71. ROADMAP | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 72. TOP 20 MELHORIAS | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 73. QUICK WINS | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 74. O QUE NÃO MUDAR | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 75. DÍVIDA TÉCNICA | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 76. ARQUITETURA RECOMENDADA | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 77. DECISÃO FINAL DA STACK | [09_STACK_RECOMMENDATION.md](09_STACK_RECOMMENDATION.md) | Evidências, classificação e limitações no relatório indicado |
| 78. ARQUIVOS DE RELATÓRIO | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 79. COMANDOS DE VALIDAÇÃO | [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md) | Evidências, classificação e limitações no relatório indicado |
| 80. NÃO ALTERAR SECRETS | [03_SECURITY_AUDIT.md](03_SECURITY_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 81. NÃO DEPENDER APENAS DE ANÁLISE ESTÁTICA | [12_TEST_STRATEGY.md](12_TEST_STRATEGY.md) | Evidências, classificação e limitações no relatório indicado |
| 82. DOCUMENTAÇÃO ATUAL | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 83. DIFERENCIE | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 84. FOCO NO MVP COMERCIAL | [14_IMPLEMENTATION_ROADMAP.md](14_IMPLEMENTATION_ROADMAP.md) | Evidências, classificação e limitações no relatório indicado |
| 85. PERGUNTA CENTRAL | [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md) | Evidências, classificação e limitações no relatório indicado |
| 86. ORDEM DE EXECUÇÃO | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 87. IMPORTANTE PARA O GPT ASTRA MÉDIO | [15_FULL_AUDIT.md](15_FULL_AUDIT.md) | Evidências, classificação e limitações no relatório indicado |
| 88. RESULTADO FINAL ESPERADO | [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md) | Evidências, classificação e limitações no relatório indicado |
