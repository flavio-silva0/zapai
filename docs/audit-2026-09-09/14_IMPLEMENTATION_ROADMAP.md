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
