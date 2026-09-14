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
