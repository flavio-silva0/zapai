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
