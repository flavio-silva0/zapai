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
