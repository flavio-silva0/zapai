# 🦷 DentistAI — Sofia, Atendente Virtual da Clínica OdontoSorriso

> **MVP** de atendente virtual humanizada para clínicas odontológicas via **WhatsApp**, utilizando o **Google Gemini** como cérebro de IA.

---

## 📁 Estrutura do Projeto

```
DentistAI/
├── src/
│   └── index.js        # Código principal do bot (Sofia)
├── .env                # Variáveis de ambiente (NÃO commitar!)
├── .env.example        # Modelo do .env para compartilhar
├── .gitignore          # Ignora node_modules, .env e sessão do WhatsApp
├── package.json        # Configuração do projeto e dependências
└── README.md           # Este arquivo
```

---

## ⚙️ Pré-requisitos

- **Node.js** v18 ou superior → [nodejs.org](https://nodejs.org)
- **Google Chrome** (ou Chromium) instalado na máquina (usado internamente pelo `whatsapp-web.js` via Puppeteer)
- Uma conta no **Google AI Studio** para obter sua chave de API do Gemini

---

## 🚀 Como Rodar o Projeto

### 1. Instalar as dependências

```bash
npm install
```

### 2. Configurar o arquivo `.env`

Abra o arquivo `.env` e preencha com seus dados reais:

```env
# Chave da API do Gemini (obtenha em https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=sua_chave_real_aqui

# Seu número de WhatsApp no formato: 55 + DDD + Número + @c.us
# Exemplo para (11) 98765-4321 → 5511987654321@c.us
NUMERO_TESTE=5511987654321@c.us

# Limite de mensagens no histórico (padrão: 10 pares)
HISTORICO_LIMITE=10
```

> ⚠️ **Como descobrir seu `NUMERO_TESTE` exato?**  
> Preencha com seu número no formato acima. Se não funcionar, rode o bot uma vez e envie uma mensagem. O console vai exibir o `msg.from` exato — copie e cole no `.env`.

### 3. Iniciar o bot

```bash
npm start
```

Ou em modo de desenvolvimento (reinicia automaticamente ao salvar):

```bash
npm run dev
```

### 4. Escanear o QR Code

- Um QR Code será exibido no terminal.
- Abra o WhatsApp no seu celular → **"Aparelhos Conectados"** → **"Conectar aparelho"**.
- Escaneie o QR Code.
- O console exibirá: `✅ DentistAI — Sofia está online!`

### 5. Testar

Envie uma mensagem de texto do número configurado em `NUMERO_TESTE` para o mesmo número (você mesmo, via WhatsApp Web ou outro celular) e a Sofia responderá!

---

## 🔒 Segurança

- O bot **só responde** ao número definido em `NUMERO_TESTE`. Qualquer outra mensagem é completamente ignorada.
- A sessão autenticada é salva localmente em `.wwebjs_auth/` — **não commite essa pasta**.
- Nunca compartilhe seu `.env` ou sua `GEMINI_API_KEY`.

---

## 🧠 Como Funciona

```
Usuário (WhatsApp)
       │
       ▼
  whatsapp-web.js  ← Recebe a mensagem
       │
       ▼
  Filtro de Número  ← Ignora se não for NUMERO_TESTE
       │
       ▼
  Map de Histórico  ← Busca/cria contexto do usuário
       │
       ▼
  Google Gemini API ← Envia histórico + mensagem atual
       │
       ▼
  Resposta da Sofia ← Salva no histórico + envia ao usuário
```

---

## 📦 Dependências

| Pacote | Finalidade |
|---|---|
| `whatsapp-web.js` | Conexão com WhatsApp via WhatsApp Web (Puppeteer) |
| `qrcode-terminal` | Exibe o QR Code de autenticação no console |
| `@google/generative-ai` | SDK oficial do Google Gemini |
| `dotenv` | Carrega variáveis do arquivo `.env` |

---

## 🛠️ Próximos Passos (Roadmap MVP+)

- [ ] Persistência do histórico em banco de dados (SQLite ou Redis)
- [ ] Agendamento de consultas integrado a Google Calendar
- [ ] Dashboard web para monitorar conversas
- [ ] Suporte a múltiplos números (remover filtro de teste)
- [ ] Deploy em servidor (VPS ou Railway)
