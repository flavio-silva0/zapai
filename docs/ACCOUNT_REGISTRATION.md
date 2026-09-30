# Cadastro completo — ativação

Implementado: Google/Gmail, e-mail e senha, CPF com dígitos verificadores, nome, nascimento (18+), telefone, endereço, empresa, segmento, aceite versionado da privacidade, confirmação/reenvio e recuperação de senha. A validação de CPF é matemática; não consulta a Receita Federal nem comprova titularidade.

## Configuração obrigatória

1. Execute `scripts/migration-account-registration.sql` no SQL Editor do projeto Supabase, depois da migration multi-tenant. A migration mantém as contas antigas e cria tabelas privadas de cadastro. A função de criação de usuário/empresa é atômica e aceita apenas identidades confirmadas.
2. No backend, configure `SUPABASE_ANON_KEY` com a chave pública anon/publishable do projeto e `AUTH_REDIRECT_URL` com a URL exata do frontend, por exemplo `https://zapai.com.br/auth/confirmacao`. Mantenha a service key apenas no servidor. O frontend obtém somente a chave pública via `/api/auth/config`.
3. Supabase → Authentication → Sign In / Providers: habilite Email e **Confirm email**. Habilite Google com Client ID e Client Secret do OAuth Google. No Google Cloud, cadastre a callback do Supabase exibida na configuração do provedor. Não cadastre a callback do aplicativo como callback do Google.
4. Authentication → URL Configuration: configure a Site URL e adicione a URL exata de `AUTH_REDIRECT_URL` às URLs permitidas. Para desenvolvimento, use `http://localhost:5173/auth/confirmacao` e a URL local correspondente.
5. Authentication → Emails → SMTP Settings: configure seu remetente e SMTP de produção. O serviço padrão do Supabase tem restrições. Personalize Confirm signup e Reset password preservando `{{ .ConfirmationURL }}` como destino do botão.
6. Reinicie/republique backend e frontend. Valide o ciclo completo com uma conta de teste: cadastro, mensagem recebida, confirmação, painel, saída e novo login. Repita com Google, conclusão dos dados, senha inválida, reenvio, link expirado e recuperação.

## Comportamento e armazenamento

- Contas antigas mantêm login por bcrypt. A vinculação automática de uma identidade Google a uma conta antiga pelo e-mail é recusada; o usuário entra pelo método original.
- Novas contas usam Supabase Auth para credenciais. O JWT do painel só é emitido depois de `auth.getUser(accessToken)` e confirmação do e-mail. Nenhuma role ou empresa é aceita do token sem consulta ao banco privado.
- CPF/endereço não são enviados para metadados do Supabase Auth, JWT ou armazenamento do navegador. O perfil pendente fica em `account_registrations`; depois da confirmação vai para `account_profiles`. Ambas as tabelas têm RLS e acesso público revogado.
- Recuperação de senha atende às novas contas Supabase. Contas legadas continuam com alteração de senha autenticada; a recuperação via e-mail de contas legadas exige migração de credenciais própria.
- A recuperação revoga as sessões anteriores do painel. A sessão temporária do Supabase fica em sessionStorage e é removida localmente depois de entrar no painel.
- Limpe cadastros pendentes abandonados conforme a política de retenção da operação, por exemplo `delete from public.account_registrations where created_at < now() - interval '30 days';`. Isso não exclui a identidade em Auth; o usuário poderá completar os dados ao confirmar posteriormente.

Documentação oficial: [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls).

## Validação

`npm test` inclui validação de CPF/dados, identidade confirmada, recusa de e-mail divergente, rollback atômico, repetição da migration e bloqueio de leitura/execução por anon/authenticated em PostgreSQL local (PGlite). Build e lint do frontend são verificações locais. Não comprovam configuração do projeto remoto, entrega de SMTP ou OAuth real.

## Ativação real — 30/09/2026

Aplicado no projeto Supabase do `.env`: migration de cadastro, RLS e permissões privadas também em `users`/`tenants`, confirmação obrigatória, templates de confirmação/recuperação em português e URLs de retorno locais (`localhost:5173` e `127.0.0.1:5173`). A chave pública foi obtida pela API de gerenciamento e gravada apenas no `.env`, junto com `AUTH_REDIRECT_URL` e `FRONTEND_URL`. As três contas e as duas empresas existentes foram preservadas.

Verificação real com identidade temporária: leitura pública negada, função de provisionamento privada, login recusado antes da confirmação, link real confirmado, criação atômica de empresa/usuário/perfil, `/me` autenticado, login posterior e limpeza da conta de teste. Nenhum e-mail foi enviado. Evidências: `docs/qa-registration/supabase-activation.json` e `docs/qa-registration/supabase-real-verification.json`.

Pendências confirmadas no projeto remoto: Google sem Client ID/Secret; SMTP próprio ausente. O usuário informou que ainda não tem essas credenciais. O SMTP padrão do Supabase não garante envio para usuários externos. OAuth com Google e entrega de e-mail continuam sem homologação.

Os callbacks atuais são locais. Antes de publicar, configure `FRONTEND_URL` e `AUTH_REDIRECT_URL` com o domínio real e execute `node --use-system-ca scripts/activate-account-registration.cjs`. O script preserva as URLs permitidas existentes, adiciona as novas, reaplica a migration de forma idempotente e só configura Google/SMTP se as credenciais completas estiverem disponíveis. Não imprime credenciais. O token de gerenciamento é operacional e não deve ser enviado ao frontend nem ao ambiente público.

Teste real sem envio de mensagem: `node --use-system-ca scripts/verify-registration-real.cjs`. O script gera uma identidade descartável, valida a confirmação diretamente no Supabase e remove somente a própria conta temporária.

## Identidade visual dos e-mails — 30/09/2026

Os templates de confirmação e recuperação foram redesenhados e publicados no Supabase, com logo oficial azul, destaque de abertura em azul, botão principal e orientação dos próximos passos. A logo oficial está no bucket público exclusivo `zapai-brand-assets`, com nome versionado pelo hash do arquivo. Nenhum dado de usuário foi publicado nesse bucket.

Fontes em `templates/auth/confirmation.html` e `templates/auth/recovery.html`; prévias sem tokens reais nos arquivos com sufixo `-preview.html`. Ambos preservam `{{ .ConfirmationURL }}`. O layout usa tabelas e estilos inline, com ajustes para celular, Arial como alternativa ao Inter e cor sólida como alternativa ao gradiente. A revisão de navegador passou em 760 e 390 pixels, incluindo logo carregada, ausência de transbordamento e leitura sem o bloco de CSS do cabeçalho. A revisão não representa homologação em todos os clientes de e-mail.

Atualização somente dos templates: `node --use-system-ca scripts/update-auth-email-design.cjs`. A ativação completa também reutiliza o novo visual, evitando regressão para o template anterior. Evidências em `docs/qa-registration/email-design-deployment.json`, `email-visual-qa.json` e screenshots `email-*.png`. A configuração remota foi relida e comparada após a publicação; callbacks, confirmação obrigatória e Google foram preservados. Nenhum e-mail foi enviado nesta revisão.

### Correção da fonte dos e-mails

A landing page renderiza Inter Bold, peso 700 nos títulos: a regra `.landing h1, .landing h2, .landing h3, .landing h4` sobrescreve o peso 800. Verificação pela fonte realmente usada no Chrome (CDP), não apenas pelo nome da classe. Os títulos do e-mail usam peso 700 e espaçamento -0.03em. Os templates carregam os arquivos reais da família Inter (400, 500, 600, 700 e 800), hospedados no bucket público exclusivo `zapai-brand-fonts`, com a família explícita nos elementos de texto e espaçamento dos títulos alinhado à página. A revisão exige `interLoaded: true`, depois de `document.fonts.ready`, nas prévias de desktop e celular e em um iframe srcDoc com o sandbox usado pelo Studio. Confirmação e recuperação foram republicadas no Supabase. Essa reprodução local não comprova o estado da aba aberta pelo usuário. Clientes de e-mail que bloqueiam fontes externas continuam usando Arial; a prévia de navegador não comprova suporte do destinatário. Fonte: https://www.caniemail.com/features/css-at-font-face/.
