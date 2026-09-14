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
