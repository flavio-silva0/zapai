# 🚀 Guia de Deploy — DentistAI (Sofia)

> **Arquitetura de produção:**
> - 🟢 **Frontend (Painel)** → [Vercel](https://vercel.com) — **grátis**
> - 🟡 **Backend (Bot + API)** → [Railway.app](https://railway.app) — ~R$ 10-25/mês

---

## Pré-requisitos

- Conta no [GitHub](https://github.com) (para conectar ao Vercel e Railway)
- Conta no [Railway.app](https://railway.app)
- Conta no [Vercel](https://vercel.com)
- Repositório do projeto no GitHub (veja Passo 0)

---

## Passo 0 — Subir o projeto no GitHub

> Faça isso UMA VEZ. Para novos clientes, apenas mude o `.env` no Railway.

```bash
# No terminal, dentro da pasta do projeto:
git init
git add .
git commit -m "feat: sofia v2.1 production ready"

# Crie um repositório PRIVADO no GitHub e conecte:
git remote add origin https://github.com/SEU_USUARIO/dentistai.git
git branch -M main
git push -u origin main
```

> ⚠️ **IMPORTANTE**: O arquivo `.env` já está no `.gitignore`. Nunca remova essa proteção — as chaves API jamais devem ir para o GitHub.

---

## Parte 1 — Deploy do Backend no Railway

### 1.1 — Criar o projeto

1. Acesse [railway.app](https://railway.app) e faça login com o GitHub
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório `dentistai`
5. Railway detecta automaticamente que é Node.js ✅

### 1.2 — Configurar as variáveis de ambiente

No painel do Railway, clique em **"Variables"** e adicione cada uma:

| Variável | Valor |
|---|---|
| `GEMINI_API_KEY` | Sua chave do Google AI Studio |
| `SUPABASE_URL` | URL do seu projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service Role Key do Supabase |
| `PANEL_USER` | Nome de usuário do painel (ex: `admin`) |
| `PANEL_PASSWORD` | Senha forte do painel |
| `JWT_SECRET` | String aleatória longa (gere abaixo 👇) |
| `CLINIC_NAME` | Nome do negócio do cliente |
| `CLINIC_PHONE` | Telefone de contato do cliente |
| `PORT` | `3001` |
| `NUMEROS_BLOQUEADOS` | Vazio (ou números separados por vírgula) |
| `DEBOUNCE_MS` | `8000` |
| `DELAY_MINIMO_MS` | `3000` |
| `DELAY_MAXIMO_MS` | `20000` |
| `MS_POR_PALAVRA` | `100` |
| `HISTORICO_LIMITE` | `10` |
| `SYSTEM_PROMPT` | Prompt customizado (ou deixe vazio para usar o padrão dental) |

**Como gerar um JWT_SECRET forte:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.3 — Configurar o comando de start

No Railway, vá em **"Settings"** → **"Deploy"** e configure:
- **Start Command**: `node src/index.js`
- **Root Directory**: `/` (raiz do projeto)

### 1.4 — Aguardar o deploy e pegar a URL

Após o deploy, o Railway gera uma URL pública tipo:
```
https://dentistai-production-XXXX.railway.app
```

Copie essa URL — você vai precisar dela para configurar o frontend.

### 1.5 — Escanear o QR Code do WhatsApp

O QR Code aparece nos **logs do Railway**. Para acessar:
1. Railway → seu projeto → clique no processo → **"Deploy Logs"**
2. Procure o QR Code no log, escaneie com o celular do cliente

> **Importante**: Após escanear, a sessão fica salva no servidor e não precisa escanear de novo (a não ser que o número seja desconectado manualmente).

---

## Parte 2 — Deploy do Frontend na Vercel

### 2.1 — Criar o projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub
2. Clique em **"Add New Project"**
3. Importe o repositório `dentistai`
4. Em **"Root Directory"**, clique em **"Edit"** e selecione: `frontend`
5. Framework Preset: **Vite** (detectado automaticamente)

### 2.2 — Configurar a variável de ambiente

Ainda na tela de criação, em **"Environment Variables"**, adicione:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | A URL do Railway do Passo 1.4 (ex: `https://dentistai-production-XXXX.railway.app`) |

### 2.3 — Deploy

Clique em **"Deploy"**. Em ~2 minutos o painel estará disponível em:
```
https://dentistai-SEU-USUARIO.vercel.app
```

> 💡 **Dica**: Configure um domínio personalizado gratuito no Vercel (ex: `painel.seudominio.com.br`) nas configurações do projeto.

---

## Parte 3 — Verificação Final

Após o deploy, verifique tudo na ordem:

- [ ] **Backend**: Acesse `https://SEU-PROJETO.railway.app/health` — deve retornar um JSON com `"status": "ok"`
- [ ] **WhatsApp**: Verifique os logs do Railway e confirme que aparece `✅ Sofia está online!`
- [ ] **Frontend**: Acesse a URL da Vercel e faça login com as credenciais configuradas
- [ ] **Painel**: Confirme que o status do WhatsApp aparece como "Conectado" na Home
- [ ] **Teste**: Envie uma mensagem de WhatsApp para o número do cliente e confirme que a Sofia responde

---

## Manutenção do Dia a Dia

### Reiniciar o bot (se travar)
No Railway: **Deploy** → **"Restart"**

### Ver logs em tempo real
No Railway: **Deployments** → clique no deploy ativo → **"View Logs"**

### Atualizar para uma nova versão do código
```bash
git add .
git commit -m "feat: nova atualização"
git push origin main
# Railway faz o redeploy automaticamente em segundos!
```

### Para um novo cliente

1. Crie um **novo projeto no Railway** (não reutilize o do cliente anterior)
2. Use o mesmo repositório do GitHub
3. Configure as variáveis de ambiente com os dados do novo cliente
4. Na Vercel, crie um novo projeto apontando para o mesmo repositório, com `VITE_API_URL` do novo Railway
5. Escanear o QR com o WhatsApp do novo cliente

---

## Custos Estimados por Cliente

| Serviço | Custo | Observação |
|---|---|---|
| Railway (backend) | ~R$ 15-25/mês | Pago por uso de CPU/RAM |
| Vercel (frontend) | **Grátis** | Plano Hobby é suficiente |
| Supabase (banco) | **Grátis** | Até 500MB e 50k usuários |
| Google Gemini (IA) | **~R$ 3-5/mês** | Para 1.000 leads/mês |
| **Total** | **~R$ 20-30/mês** | Por cliente |

Com mensalidade de R$ 297 por cliente → **margem bruta de ~90%**.

---

## Suporte e Troubleshooting

### WhatsApp desconectado
- Verifique os logs no Railway
- Se necessário, reinicie o processo (o QR Code aparecerá nos logs novamente)

### "Erro ao conectar ao Supabase"
- Verifique `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` nas variáveis do Railway

### Frontend não conecta ao backend
- Verifique se `VITE_API_URL` na Vercel aponta para a URL correta do Railway
- Confirme que o CORS está ativado (já está no código, `cors({ origin: "*" })`)

### Bot não responde mensagens
- Verifique se o WhatsApp está conectado (logs do Railway)
- Verifique se o número do remetente não está em `NUMEROS_BLOQUEADOS`
- Confirme que `is_ai_active = true` para o contato no Supabase
