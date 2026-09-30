# ZapAI — revisão e correções de 25/09/2026

Base: checkout `08d24ef`, remoto configurado `flavio-silva0/zapai`. Foram consultados o inventário dos 37 achados, roadmap, checklist, relatórios de banco, UX e custos em `audit-2026-09-09/audit-2026-09-09`. A auditoria original foi preservada. O código evoluiu desde o commit auditado em setembro; sua pontuação antiga não representa uma nova medição.

## Execução e limites da validação

- Frontend: http://127.0.0.1:5173/login; backend: http://127.0.0.1:3001.
- Banco da aplicação: **Supabase remoto real configurado no .env**, com leitura de saúde confirmada. Não foi instalado um servidor Supabase local nem copiado o banco de produção.
- PostgreSQL local isolado via PGlite foi utilizado exclusivamente nos testes das novas migrations, com registros artificiais. Isso não comprova que o schema remoto é compatível nem simula concorrência entre vários servidores.
- Não houve deploy, push, envio real de WhatsApp ou chamada paga de IA. As provas de mutação usam mocks ou banco de teste.
- O ambiente local não tem `META_APP_SECRET`, conexão SQL administrativa nem RPC `reserve_ai_call` (retorno PGRST202). Portanto o webhook retorna 503 sem configuração e a IA falha fechada até a migration ser aplicada. O painel e a conexão de leitura ao banco estão funcionando.

## Correções desta revisão

| Área | Mudança | Prova / limite |
|---|---|---|
| WA-001 | Segredo Meta ausente bloqueia POST; removido token GET padrão | Testes de assinatura existentes e regressão de ausência de segredo |
| SEC-001 / AUTH-001 | JWT em Authorization no SSE; usuário/empresa consultados no banco; JWT de 8h; troca de senha invalida tokens anteriores | Testes de desativação, senha, RBAC, empresa e SSE. Streams revalidam a cada 30s, não instantaneamente |
| AUTH-002 | Agentes não alteram IA/conhecimento nem dados empresariais; viewers continuam bloqueados para mutações | Testes de viewer; regras owner no backend |
| AUTH-003 | Tipos/tamanhos de campos, limite bcrypt de 72 bytes e 15 tentativas por IP em 15min | Testes HTTP de tipo inválido e 429; limite em memória, por processo |
| TEN-001 | Criar contato exige tenant, sem lookup global quando falta empresa | Fallback já estava restrito no checkout; teste de leitura A/B; constraints propostas abaixo |
| TEN-002 | Histórico do simulador separado por usuário e empresa; evita gravar histórico antigo na nova chave; cancela requisições ao trocar/resetar | Build/lint; fluxo autenticado visual ainda precisa de homologação |
| COST-001 | Reserva atômica antes de cada chamada de geração, embedding, memória e retry, incluindo WhatsApp e admin | PostgreSQL testa limites, trial vencido, empresa ausente e permissões; falta aplicar no Supabase |
| WA-004 | Percorre mensagens de todas as entries/changes, em vez de apenas a primeira | Regressão com duas mensagens no mesmo lote |
| WA-005 | Revalida pausa do contato imediatamente antes de cada envio automático | Reduz corrida durante geração/delay; não substitui serialização transacional ou regras de templates |
| SEC-003 / SEC-006 | CORS com origens exatas; cabeçalhos, no-store e limite de streams por usuário | Regressão de origem Vercel não autorizada e cabeçalho |
| SEC-005 | Lockfiles atualizados; override compatível de qs 6.16 | npm audit: zero vulnerabilidades conhecidas em backend e frontend na data da execução |
| QA-001 | Runner isola segredos/provedores; testes de segurança e SQL; workflow CI | npm test aprovado; workflow ainda não executado no GitHub |
| Operação | Seed HTTP desabilitado por padrão e proibido em produção; erros async Express capturados; erro de readiness sem detalhes internos | Regressões HTTP |
| DB-003 | Migration não destrutiva: unicidade de número, contato por empresa e FK composta mensagem/contato | PostgreSQL rejeita mensagem de outra empresa e contato sem tenant; não aplicada remotamente |

Os testes existentes de IA/webhook continuam aprovados. Build Vite aprovado após atualização. ESLint terminou com **0 erros e 320 avisos**; não foi declarado lint limpo. Muitos avisos preexistentes precisam de revisão da configuração JSX e dos hooks.

## Ativação no Supabase e publicação

1. Guardar backup e testar em staging com schema representativo. Não rodar o baseline como tentativa de corrigir um banco existente sem comparar o catálogo.
2. Aplicar `scripts/migration-ai-quotas.sql` com administrador de banco. A função é executável apenas por service_role; anon/authenticated não podem reservar consumo.
3. Revisar duplicações e linhas sem tenant antes de aplicar `scripts/migration-tenant-integrity.sql`. A transaction aborta em duplicações; não apaga nem escolhe donos. Constraints NOT VALID protegem novos writes; validar o legado separadamente pelos comandos comentados.
4. Configurar `META_APP_SECRET`, `META_VERIFY_TOKEN`, `FRONTEND_URL` e os segredos já exigidos pelo projeto. `AI_DISABLED=true` interrompe novas chamadas de IA.
5. Configurar `TRUST_PROXY` somente com os IPs/CIDRs reais do proxy. O default não confia em X-Forwarded-For; atrás de proxy, sem isso, o rate limit pode agrupar usuários. Para múltiplas instâncias, mover rate limit para armazenamento compartilhado/gateway.
6. Publicar frontend e backend juntos: o SSE agora exige Authorization. **Todos os tokens antigos exigirão novo login**, pois não possuem a versão de credencial. Trocar a senha também encerra as sessões anteriores.
7. Executar smoke autenticado em staging, duas empresas, handoff durante geração, quota esgotada e webhook assinado. Depois publicar com acompanhamento e plano de rollback.

Quotas iniciais por empresa: 60 tentativas/minuto; por dia UTC: trial 100, basic 500, pro 2000, enterprise 5000. Cada embedding/retry/memória conta. São limites técnicos conservadores, não franquias comerciais aprovadas nem um teto monetário: custo varia com modelo, tokens e mídia. Ajustar no SQL após medição. Limites de saída do wrapper: padrão 1024 tokens, teto 2048 no modelo; chat mantém suas configurações existentes. A janela diária não substitui orçamento mensal/global no provedor.

## Pendências para produção — não encerradas

1. **WA-002 / WA-003: inbox/outbox duráveis.** O ACK continua antes da persistência e timers/filas estão em memória. Persistir evento bruto validado antes de 200; worker com lease, retry limitado, fila de falhas e recuperação de processing. Serializar por conversa e definir reconciliação de envios com confirmação ambígua. Até lá, uma instância reduz conflitos, mas não elimina perda em reinício.
2. **COST-001: proteção financeira completa.** Aplicar a migration, medir tokens/custo real por tenant, impor teto global no provedor e retenção/arquivamento de ai_usage. Não considerar reserva por chamada como orçamento em reais.
3. **DB-001 / DB-002 / DB-003:** reconciliar schema remoto e baseline, grants/RLS, RPC de conhecimento, colunas usadas pelo CRM/status e constraints antigas. Ensaiar restore e upgrade de snapshot anonimizado. Não foi auditado o catálogo remoto.
4. **AUTH-004:** alteração de senha já existe e ganhou revogação; recuperação por e-mail, confirmação de endereço, MFA do administrador e sessões revogáveis individualmente continuam faltando. Logout local não revoga um JWT copiado.
5. **WA-005 / UX-001:** homologar número Meta, status real, token/reconexão, opt-out persistente, janela de atendimento e templates. Handoff no backend melhorou, mas precisa de prova com Meta real. Não oferecer onboarding self-service sem esse fluxo.
6. **AI-001 a AI-004 / SEC-007:** validar modelos disponíveis à conta, migrar SDK por plano testado, evals por nicho, respostas fundamentadas, orçamento de contexto, cancelamento de timeouts e ingestão DOCX em processo limitado para conter expansão de ZIP. A proteção atual não prova resistência a prompt injection.
7. **UX-002 a UX-005 / PERF-001:** maquetes já têm vários avisos de “em breve”; ainda revisar cada ação, métricas reais e persistência. Paginação REST existente precisa de navegação correspondente no frontend e agregações SQL corretas. Homologar mobile com conta real.
8. **SEC-002 / SEC-004 / SEC-006 / SEO-001:** tokens Meta ainda precisam de estratégia de criptografia/rotação; revisar logs de provedores e todas as rotas de erro; CSP e comportamento de robots/sitemap na hospedagem real.
9. **OPS-001 / OPS-002 / PRIV-001:** alertas de erro/latência/readiness/fila, backups restauráveis, runbooks, retenção/exportação/exclusão verificáveis e revisão de promessas de privacidade com responsáveis. Políticas e preços da auditoria antiga não foram reconfirmados nesta revisão.

## Recomendações de produto

Manter React, Express, Supabase e Meta oficial. O próximo investimento deve ser confiabilidade do atendimento, e não troca de framework. Recomendo um piloto supervisionado com limites conservadores depois de fechar fila durável, quotas implantadas e recuperação de acesso. Medir: conversas atendidas sem retrabalho, transferências ao humano, tempo de primeira resposta, falhas de entrega e custo por empresa. Billing automático e um segundo provedor de IA devem vir após esses indicadores e um fluxo de onboarding real.

## Reproduzir

```powershell
npm ci
npm ci --prefix frontend
npm test
npm run build --prefix frontend
npm run lint --prefix frontend
npm audit
npm audit --prefix frontend
# Terminal 1: .env já configurado, sem imprimir segredos
npm run local
# Terminal 2
$env:VITE_API_URL='http://127.0.0.1:3001'
npm run dev --prefix frontend -- --host 127.0.0.1 --strictPort
```

Referências oficiais consultadas: [segurança Express](https://expressjs.com/en/advanced/best-practice-security/), [funções e permissões Supabase](https://supabase.com/docs/guides/database/functions). As provas locais estão nos testes versionáveis; fontes externas não comprovam a configuração do seu ambiente.
