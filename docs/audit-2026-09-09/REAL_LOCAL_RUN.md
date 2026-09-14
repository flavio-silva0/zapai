# Ambiente local conectado aos dados reais

Atualização posterior à auditoria: frontend e backend foram iniciados localmente com o `.env` fornecido pelo usuário. O banco é o Supabase remoto configurado nesse arquivo; não foi feita cópia para o PostgreSQL demonstrativo.

- Acesso: http://127.0.0.1:5173/login
- Backend: http://127.0.0.1:3001/health
- Usar a conta real já cadastrada. Contas fictícias da auditoria não se aplicam.
- Sem mocks. As ações na interface utilizam o banco e as integrações reais configuradas.
- Verificação realizada: consultas somente de leitura nas tabelas tenants, users, users_whatsapp e messages; todas responderam HTTP 200 e contêm registros. Nenhuma mensagem WhatsApp ou chamada de IA foi executada na conferência.
- `.env` permanece ignorado pelo Git; suas credenciais não foram copiadas para relatórios.

Para reiniciar, na raiz do projeto:

```powershell
node docs/audit-2026-09-09/tools/real-local.cjs
```

Em outro terminal:

```powershell
Set-Location frontend
$env:VITE_API_URL='http://127.0.0.1:3001'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort
```

Ctrl+C em cada terminal encerra os serviços. O launcher real limita a API à interface 127.0.0.1 e desativa TEST_MODE. Não usar o launcher local-stack.cjs para este modo: ele serve exclusivamente à demonstração fictícia documentada em LOCAL_RUN.md.
