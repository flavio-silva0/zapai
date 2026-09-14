# 🚀 Guia de Implantação e Operação — ZapAI (Multi-Tenant SaaS)

> **Arquitetura Oficial:**
> - 🟢 **Frontend (SPA React 19 + Vite)** → [Vercel](https://vercel.com)
> - 🟡 **Backend (API REST + SSE + Webhook Meta)** → [Railway](https://railway.app) ou [Render](https://render.com)
> - 🔵 **Banco de Dados (PostgreSQL + pgvector)** → [Supabase](https://supabase.com)
> - 🟣 **Motor de IA** → Google Gemini API (`gemini-3.5-flash-lite` com fallback para `gemini-2.5-flash`)
> - 💬 **Mensageria Oficial** → Meta Cloud API WhatsApp v20.0 (Graph API)

---

## 1. Pré-requisitos

1. **Conta no GitHub** com o repositório do ZapAI configurado.
2. **Conta no Supabase** para provisionamento do banco de dados relacional e busca vetorial.
3. **Conta no Google AI Studio** com chave de API do Gemini ativa.
4. **Conta no Meta for Developers** com App do tipo Business e produto WhatsApp configurado.
5. **Conta no Railway ou Render** para hospedagem persistente da API Node.js.
6. **Conta na Vercel** para distribuição global do frontend.

---

## 2. Passo a Passo do Banco de Dados (Supabase)

1. Acesse o painel do seu projeto no Supabase.
2. Navegue até o **SQL Editor**.
3. Abra e execute o script baseline de migração localizado em:
   ```
   scripts/00-baseline-schema.sql
   ```
4. Este script irá:
   - Habilitar as extensões `pgcrypto` e `vector`.
   - Criar todas as tabelas: `tenants`, `users`, `users_whatsapp`, `messages`, `knowledge_base`, `whatsapp_message_processing`, além das tabelas de sandbox.
   - Definir restrições de unicidade (`phone_number_id` único por tenant, `(tenant_id, telefone)` único).
   - Configurar o RPC `match_knowledge` para busca semântica RAG.
   - Ativar o Row Level Security (RLS) protegendo o acesso direto via Data API.

---

## 3. Implantação do Backend (Railway / Render)

### 3.1 — Configuração do Serviço
1. Conecte seu repositório GitHub ao Railway / Render.
2. Defina o comando de inicialização:
   - **Start Command**: `node src/index.js`
   - **Root Directory**: `/`
3. Certifique-se de usar Node.js versão **20.x** ou **22.x LTS**.

### 3.2 — Variáveis de Ambiente do Backend
Configure as variáveis conforme o arquivo `.env.example`:

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta de escuta da aplicação | `3001` |
| `NODE_ENV` | Ambiente de execução | `production` |
| `FRONTEND_URL` | Domínio do frontend para CORS | `https://zapai.com.br` |
| `JWT_SECRET` | Chave secreta de assinatura JWT (32+ bytes hex) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SUPABASE_URL` | URL do projeto Supabase | `https://xxxxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Chave de serviço do Supabase (service_role) | `eyJhbGciOi...` |
| `GEMINI_API_KEY` | Chave de API Google Gemini | `AIzaSy...` |
| `GEMINI_MODEL` | Modelo principal de linguagem | `gemini-3.5-flash-lite` |
| `GEMINI_FALLBACK_MODEL`| Modelo secundário de contingência | `gemini-2.5-flash` |
| `META_VERIFY_TOKEN` | Token de verificação para o webhook Meta | `seu_verify_token_secreto` |
| `META_APP_SECRET` | App Secret da Meta para validação HMAC SHA-256 | `sua_chave_secreta_app_meta` |

### 3.3 — Health Check e Verificação
Após o deploy, valide a saúde da API acessando:
- `GET https://seu-backend.up.railway.app/health` → deve retornar `{ "status": "ok" }`
- `GET https://seu-backend.up.railway.app/health/ready` → valida conexão com o Supabase

---

## 4. Configuração do Webhook na Meta (WhatsApp Cloud API)

1. Acesse o **Meta for Developers** → Seu App → **WhatsApp** → **Configuration**.
2. No campo **Callback URL**, insira:
   ```
   https://seu-backend.up.railway.app/webhook
   ```
3. No campo **Verify Token**, insira exatamente o valor definido em `META_VERIFY_TOKEN`.
4. Clique em **Verify and Save**.
5. Em **Webhook Fields**, assine o evento **`messages`**.

---

## 5. Implantação do Frontend (Vercel)

1. No painel da Vercel, clique em **Add New Project** e selecione o repositório.
2. Em **Root Directory**, selecione: `frontend`.
3. O preset do framework será detectado automaticamente como **Vite**.
4. Configure as variáveis de ambiente:
   | Variável | Valor |
   |---|---|
   | `VITE_API_URL` | URL do backend implantado (ex: `https://seu-backend.up.railway.app`) |
5. Clique em **Deploy**.
6. A Vercel aplicará as regras de segurança e cabeçalhos definidos em `frontend/vercel.json`, além de servir estaticamente `robots.txt` e `sitemap.xml`.

---

## 6. Onboarding de Nova Organização (Tenant)

Diferente de sistemas legados que exigiam deploys isolados, o ZapAI é **100% Multi-Tenant**:

1. Acesse o painel de Super Admin (`/admin`).
2. Cadastre uma nova organização ou permita que ela se registre pela tela de cadastro (`/cadastro`).
3. Obtenha o **Phone Number ID** e o **Permanent System User Access Token** da clínica/empresa no Meta Business Suite.
4. Salve essas credenciais nos detalhes da organização.
5. O ZapAI roteia automaticamente as mensagens de entrada e saída com base no `phone_number_id`, garantindo isolamento criptográfico e lógico por organização.

---

## 7. Monitoramento e Manutenção

- **Logs de Aplicação**: Monitore stdout/stderr no painel do Railway/Render. Erros de rede e status da Meta Cloud API são registrados de forma sanitizada (telefones e dados confidenciais são mascarados).
- **Rate Limit de IA**: Cada organização possui uma quota de requisições por minuto gerenciada automaticamente para evitar estouro de custos.
- **Transição Humana**: Caso o cliente solicite atendimento humano ou envie palavras-chave de pausa, a IA desativa-se instantaneamente para o contato e notifica o painel.
