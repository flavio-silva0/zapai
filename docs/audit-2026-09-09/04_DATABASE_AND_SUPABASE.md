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
