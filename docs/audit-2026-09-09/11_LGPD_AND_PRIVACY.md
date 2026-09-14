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
