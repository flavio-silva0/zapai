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
