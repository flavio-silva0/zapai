# 🤖 ZapAI (SaaS Multi-Tenant)

> **Plataforma de Atendimento Inteligente 24/7** via WhatsApp Cloud API (Oficial da Meta), gerenciada por um único painel e utilizando o **Google Gemini 2.5 Flash** como motor conversacional para múltiplos nichos.

---

## 🏗️ Arquitetura do Sistema

O ZapAI (antes conhecido como DentistAI) evoluiu de um script único para uma plataforma **SaaS completa**.

- **Frontend (Vercel):** Painel Administrativo em React/Vite para gestão de clientes, visualização do Kanban em tempo real, ativação/desativação da IA e faturamento.
- **Backend (DigitalOcean):** API REST em Express.js, levíssima. Recebe Webhooks oficiais da Meta e gerencia os chats de forma escalável (sem precisar de Chromium/Puppeteer).
- **Banco de Dados (Supabase):** PostgreSQL com Row Level Security (RLS). Mantém a gestão de `tenants` (contas dos clientes), separando rigorosamente leads, templates de IA e históricos por cada negócio.

---

## 📁 Estrutura do Projeto

```
ZapAI/
├── frontend/             # Código do Painel Web (React + Vite)
│   ├── src/pages/        # Dashboard, Kanban, Login, Registro
│   └── src/context/      # Contexto de Autenticação Multi-tenant
├── prompts/              # Biblioteca de Prompts (Templates por Nicho)
├── scripts/              # SQLs (Supabase)
├── src/                  # Backend 
│   ├── routes/           # Rotas /api/auth, /api/admin
│   └── index.js          # Roteamento Webhook Meta e Integração Gemini
└── .env                  # Variáveis de ambiente
```

---

## ⚙️ Pré-requisitos & Deploy

### Para rodar o Backend (A "Inteligência"):
1. **Supabase:** Projeto criado, tabelas e políticas RLS executadas pelo arquivo `scripts/migration-multitenant.sql`.
2. **Meta for Developers:** App WhatsApp API Oficial. É gerado um *Phone Number ID* e um *Access Token*.
3. **DigitalOcean (App Platform):** Recomendado para rodar a API Node.js.

### Para o Frontend (O Painel):
1. **Vercel:** Conecte este GitHub à Vercel apontando para a pasta `frontend`. Crie suas variáveis e lance a aplicação!

---

## 🚀 Como Configurar em Produção

Após hospedar o Front (Vercel) e o Back (DigitalOcean), preencha o arquivo `.env` (ou Environment Variables na hospedagem):

```env
# Chaves 
GEMINI_API_KEY=sua_chave_google
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_service_role_key

# Autenticação e Segurança
JWT_SECRET=super_secret_gerado
ADMIN_EMAIL=seu@email.com
ADMIN_PASSWORD=senha_segura
ADMIN_NOME=Seu Nome

# Webhook do WhatsApp API
META_VERIFY_TOKEN=sofia123
```

### Webhook da Meta
Na plataforma Meta for Developers, configure o Webhook do WhatsApp usando:
- **Callback URL:** `https://seu-backend-digitalocean.com/webhook/whatsapp`
- **Verify Token:** `sofia123` (ou o que definiu no seu .env)
- Inscreva para o campo: `messages`.

Para iniciar o primeiro admin:
Faça um `POST` para `/api/admin/seed` na sua raiz da API. Depois, vá até o Frontend para testar e cadastrar os Tenants!

---

## 🧠 Fluxo Múltiplos Inquilinos (Tenants)

```
Lead (WhatsApp) → Meta API → Webhook do ZapAI (/webhook/whatsapp)
                                    │
                                    ├── 1. Lê `phone_number_id` e descobre o Tenant.
                                    ├── 2. Lê Prompt Dinâmico do Tenant no Banco.
                                    ├── 3. Salva Lead no Banco do Tenant Específico.
                                    ├── 4. Puxa histórico + Gera Resposta no Gemini.
                                    └── 5. Responde o Lead (Graph API Facebook).
```

---

## 🔒 Segurança

- **Isolamento de Dados:** Cada requisição web no painel envia no Headers o `tenant_id` garantido por um JSON Web Token criptografado. O painel só enxerga pacientes e mensagens relativas ao seu token.
- **Controle de Sessão Super Admin:** O painel exibe e gerencia múltiplos clientes num "Modo Admin Master" se a conta possuir a Role de `super_admin`.
- **API Externa:** Todo o tráfego HTTP ocorre com Criptografia, e o webhook checa pelo Validation Hub da Meta.

---

> Desenvolvido para escalar fácil, responder instantaneamente e dar controle 100% autônomo nas mãos dos seus vários clientes!
