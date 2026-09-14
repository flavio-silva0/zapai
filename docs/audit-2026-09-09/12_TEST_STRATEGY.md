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
