# Executar e conferir localmente

Ambiente exclusivo da auditoria. Aplicação original preservada; dados fictícios. Meta, Gemini e embeddings simulados. PostgreSQL e consultas REST são reais no computador.

## URLs e acesso

- Front: http://127.0.0.1:5173
- Painel: http://127.0.0.1:5173/painel
- Backend health: http://127.0.0.1:3001/health
- PostgreSQL: 127.0.0.1:55432, database `zapai_audit_utf8`
- PostgREST: 127.0.0.1:55433; gateway de compatibilidade `/rest/v1`: 127.0.0.1:55434

| Perfil fictício | E-mail | Senha local |
|---|---|---|
| Empresa A | demo@zapai.local | ZapAI-local-2026! |
| Empresa B | empresa-b@zapai.local | ZapAI-local-2026! |
| Admin | admin@zapai.local | ZapAI-local-2026! |

Essas credenciais foram criadas para a demonstração e não são credenciais reais encontradas no projeto. Não usar dados pessoais ou credenciais reais neste ambiente de auditoria vulnerável.

## O que foi adicionado

16 relatórios, achados JSON, evidências e ferramentas de auditoria em `docs/audit-2026-09-09`. Nenhuma correção arquitetural, migration de produção, configuração externa, envio WhatsApp ou chamada paga de IA foi realizada.

O banco usa PostgreSQL 18.4 nativo, instalado isoladamente em `%LOCALAPPDATA%\ZapAI-audit-runtime`, e PostgREST 16.2. Como as migrations originais não recriam o schema, `tools/local-stack.cjs` constrói uma base demonstrativa separada. `knowledge_base.embedding` usa texto e `match_knowledge` retorna linhas filtradas por tenant, sem busca vetorial real. `patients` é placeholder necessário ao SQL legado. Isso NÃO valida schema/RLS/grants/backup de produção.

As tabelas/fixtures geradas nos testes podem incluir registros que demonstram vulnerabilidades, claramente fictícios. Usuários inválidos de teste não devem ser tratados como falha de preparação: são a prova de validação insuficiente.

## Iniciar novamente

No PowerShell, a partir da raiz do ZapAI, em dois terminais:

```powershell
node docs/audit-2026-09-09/tools/local-stack.cjs
```

```powershell
Set-Location frontend
node node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort
```

O launcher sobe PostgreSQL, PostgREST, gateway e backend com bloqueio das integrações externas. Não usar `npm start` sozinho esperando mocks: ele inicia a aplicação normal.

Dependências frontend foram instaladas com `npm ci --prefix frontend --ignore-scripts`. O runtime PostgreSQL foi instalado fora do package.json do produto. Os binários devem continuar em `%LOCALAPPDATA%\ZapAI-audit-runtime`. `local-secrets.json` e `postgrest.conf` ficam apenas nessa pasta local e nunca devem ser commitados.

## Parar

Interromper os dois terminais com Ctrl+C, ou executar `tools/stop-local.ps1`. O comando de parada encerra somente processos identificados desta auditoria e preserva os dados. Após a parada, as portas 3001, 5173, 55432, 55433 e 55434 devem ficar livres.

## Reproduzir auditoria

```powershell
$env:JWT_SECRET='audit-local-test-only-no-production'
$env:USE_REAL_GEMINI='false'
npm test
npm run lint --prefix frontend
npm run build --prefix frontend
node docs/audit-2026-09-09/tools/runtime-audit.cjs
node docs/audit-2026-09-09/tools/browser-audit.cjs --local --auth
```

`runtime-audit.cjs` modifica somente fixtures locais e registra expected/actual. Seu exit 0 não significa que a aplicação é segura. A reprodução de transferência usa trigger temporário que falha insert para um telefone fictício; a existência dessa condição em produção não foi inspecionada.

`tools/browser-audit.cjs` sem `--local` acessa apenas páginas públicas do site informado, sem autenticar, cadastrar, enviar mensagem ou alterar dados remotos. Screenshots fullPage não expandem containers com scroll interno.
