"use strict";

const express  = require("express");
const bcrypt   = require("bcryptjs");
const mammoth  = require("mammoth");
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { requireAuth, requireSuperAdmin } = require("../middleware/authMiddleware");

const router  = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Utilitários de Resiliência IA
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function ehErroSobrecarga(err) {
  const msg = err?.message ?? "";
  return msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("overloaded");
}

async function comRetry(operacao, maxTentativas = 3, backoffBaseMs = 2000) {
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      return await operacao();
    } catch (err) {
      if (ehErroSobrecarga(err) && tentativa < maxTentativas) {
        console.warn(`[GEMINI / RAG] 503 API do Google Sobrecarregada. Retentando (${tentativa}/${maxTentativas})...`);
        await sleep(backoffBaseMs * tentativa); // Atraso progressivo: 2s, 4s, etc.
      } else {
        throw err;
      }
    }
  }
}

function chunkText(text, maxChars = 1500) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';
  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) > maxChars && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n\n';
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
}

// â”€â”€ POST /api/admin/seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cria o super_admin inicial. NÃƒO exige autenticaÃ§Ã£o (bootstrap).
// Auto-protegida: sÃ³ funciona se AINDA nÃ£o existir nenhum super_admin.
// ApÃ³s criar, essa rota para de funcionar automaticamente.
router.post("/seed", async (_req, res) => {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNome     = process.env.ADMIN_NOME ?? "Admin";

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ error: "Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env" });
  }

  // Verifica se jÃ¡ existe um super_admin
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Super admin jÃ¡ existe. Esta rota estÃ¡ desabilitada." });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      tenant_id:     null,
      email:         adminEmail.toLowerCase().trim(),
      password_hash: passwordHash,
      nome:          adminNome,
      role:          "super_admin",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  console.log(`ðŸ”‘  Super admin criado: ${adminEmail}`);
  res.status(201).json({ message: "Super admin criado com sucesso!", userId: user.id });
});

// ── POST /api/admin/magic-setup (Acessível a Tenants) ────────
router.post("/magic-setup", requireAuth, async (req, res) => {
  try {
    const { formSetup, tenantId } = req.body;
    
    if (!formSetup || !formSetup.resumo) {
      return res.status(400).json({ error: "Dados do formulário insuficientes." });
    }

    // Segurança Multi-tenant: Se não for admin, força a usar o próprio tenantId do token
    let targetTenant = req.user.role === "super_admin" ? (tenantId || req.user.tenantId) : req.user.tenantId;

    const sysPrompt = `Você é um engenheiro de prompt especialista em IA conversacional para WhatsApp.
O cliente forneceu as seguintes configurações estruturadas para o seu assistente virtual:

- Tom de Voz Solicitado: ${formSetup.tomVoz}
- Objetivo Principal do Bot: ${formSetup.objetivo}
- Endereço Físico: ${formSetup.endereco || "Não especificado ou puramente online"}
- Dias e Horários de Func.: ${formSetup.horarios || "Não especificado"}
- Resumo do Negócio e Serviços/Preços: "${formSetup.resumo}"

Sua tarefa: Transformar essas informações em um 'System Prompt' (texto de instrução de sistema global) ultra profissional, completo e estruturado em Markdown, para que o modelo responda aos clientes finais obedecendo perfeitamente a esses critérios. Use o template abaixo preenchendo as entrelinhas e formatando a saída de forma persuasiva.

# IDENTIDADE
Você é a inteligência artificial responsável pelo atendimento de WhatsApp. 
Seu tom de voz exato e absoluto é: ${formSetup.tomVoz}. Assuma essa persona imediatamente.

# CONTEXTO E LOGÍSTICA
- Nosso endereço: ${formSetup.endereco || "(Não informe endereço, loja online)"}.
- Nosso horário de funcionamento: ${formSetup.horarios || "(Sem horário restrito informado)"}.

# PACOTES E PREÇOS (OFERTAS)
[Adapte e expanda os dados recebidos na linha de "Resumo" do negócio de forma clara, amigável e como uma lista de serviços que a IA pode vender/informar] 

# REGRAS DE OURO 
- VOCÊ TRABALHA 24/7: Continue o atendimento ativa e normalmente a qualquer hora do dia ou da noite. O "horário de funcionamento" acima serve APENAS para informar sobre o trabalho humano ou visitas físicas. Nunca recuse atendimento ou encerre o chat alegando estar fora do horário de expediente.
- Seja sempre amigável, conciso e não envie textos blockbusters longos (é WhatsApp).
- Nunca invente preços ou prometa serviços fora da lista de Ofertas acima.
- O seu ÚNICO OU PRINCIPAL OBJETIVO NESTE CHAT É: ${formSetup.objetivo}. Encerre ou conduza as respostas sempre visando concluir este objetivo.
- Se o cliente perguntar algo fora do escopo ou fizer uma reclamação sentida, diga gentilmente que um humano assumirá no próximo horário útil.

Atenção: A sua resposta DEVE ser ÚNICA e EXCLUSIVAMENTE o conteúdo do prompt formatado. Não escreva 'Aqui está seu prompt' ou explique seus passos em hipótese alguma.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(sysPrompt);
    const generatedPrompt = response.response.text().trim();

    res.json({ promptGerado: generatedPrompt });
  } catch (error) {
    console.error("Erro no magic-setup:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── PUT /api/admin/magic-setup/save (Acessível a Tenants) ────────
router.put("/magic-setup/save", requireAuth, async (req, res) => {
  try {
    const { prompt_text } = req.body;
    if (!prompt_text) return res.status(400).json({ error: "prompt_text é obrigatório." });
    if (!req.user.tenantId) return res.status(403).json({ error: "Apenas tenants podem salvar." });
    
    const { error } = await supabase.from("tenants").update({ prompt_text }).eq("id", req.user.tenantId);
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/admin/sandbox/chat (Acessível a Tenants) ────────
router.post("/sandbox/chat", requireAuth, async (req, res) => {
  try {
    const { prompt_text, mensagemUsuario, historicoAnterior = [] } = req.body;
    
    if (!prompt_text || !mensagemUsuario) {
      return res.status(400).json({ error: "prompt_text e mensagemUsuario são obrigatórios." });
    }

    const currentTenantId = req.user.role === "super_admin" ? (req.body.tenantId || req.user.tenantId) : req.user.tenantId;

    // --- RAG: Busca de Conhecimento Semântico ---
    let ragContext = "";
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const queryResult = await embeddingModel.embedContent(mensagemUsuario);
      const queryVector = queryResult.embedding.values.slice(0, 768);
      const vectorString = `[${queryVector.join(",")}]`;

      const { data: matches, error: rpcError } = await supabase.rpc("match_knowledge", {
        query_embedding: vectorString,
        match_threshold: 0.65, // Aceita apenas matches relevantes (~65%+)
        match_count: 3,        // Retorna top 3 blocos
        p_tenant_id: currentTenantId
      });

      if (!rpcError && matches && matches.length > 0) {
        ragContext = matches.map(m => m.content).join("\n\n");
      }
    } catch (ragErr) {
      console.warn("[RAG Warn] Falha na busca semântica do Sandbox:", ragErr);
    }

    let finalSystemPrompt = prompt_text;
    if (ragContext) {
      finalSystemPrompt += `\n\n# BASE DE CONHECIMENTO INTERNA (RAG)\nVocê possui as seguintes informações extraídas dos manuais da empresa para responder à última pergunta. Use ABSOLUTAMENTE esses dados se forem relevantes.\n<conhecimento>\n${ragContext}\n</conhecimento>`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: finalSystemPrompt });
    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite", systemInstruction: finalSystemPrompt });
    
    let respostaBot = "";
    let success = false;
    let lastError = null;

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        const chat = (tentativa === 3 ? fallbackModel : model).startChat({
          history: historicoAnterior,
          generationConfig: { maxOutputTokens: 1500, temperature: 0.85 },
        });

        // Timeout de 25s manual para evitar que o worker congele
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de 25000ms da IA")), 25000));
        const result = await Promise.race([chat.sendMessage([{ text: mensagemUsuario }]), timeoutPromise]);

        respostaBot = result.response.text();
        success = true;
        break; // Sucesso, sai do loop
      } catch (err) {
        lastError = err;
        if (ehErroSobrecarga(err) && tentativa < 3) {
          console.warn(`[SANDBOX] IA sobrecarregada (tentativa ${tentativa}). Retentando...`);
          await sleep(2000 * tentativa);
        } else if (!ehErroSobrecarga(err)) {
          // Erro fatal (ex: chave bloqueada), não tenta dnv
          throw err;
        }
      }
    }

    if (!success) {
      throw lastError || new Error("Falha ao comunicar com a IA após 3 tentativas.");
    }

    res.json({ resposta: respostaBot });
  } catch (error) {
    console.error("Erro no sandbox/chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/admin/knowledge (Acessível a Tenants) ────────
router.get("/knowledge", requireAuth, async (req, res) => {
  try {
    const targetTenant = req.user.role === "super_admin" ? (req.query.tenantId || req.user.tenantId) : req.user.tenantId;
    if (!targetTenant) return res.status(403).json({ error: "Sessão inválida" });

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, content, created_at")
      .eq("tenant_id", targetTenant)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/knowledge (Acessível a Tenants) ────────
router.post("/knowledge", requireAuth, async (req, res) => {
  try {
    const { tipo, url, texto, fileType, base64Data } = req.body;
    const targetTenant = req.user.role === "super_admin" ? (req.body.tenantId || req.user.tenantId) : req.user.tenantId;
    
    if (!targetTenant) return res.status(403).json({ error: "Sessão inválida." });

    let textToProcess = texto || "";

    // -- 1. Processamento de Web Scraping --
    if (tipo === 'url' && url) {
      const response = await fetch("https://r.jina.ai/" + url, { headers: { "Accept": "text/plain" } });
      if (!response.ok) throw new Error("Falha ao ler o site alvo.");
      textToProcess = await response.text();
    }

    // -- 2. Processamento de Arquivos Binários (DOCX, PDF, JPG, PNG) --
    if (tipo === 'file' && base64Data && fileType) {
      const buffer = Buffer.from(base64Data, "base64");
      
      // a) DOCX -> Mammoth (Local)
      if (fileType.includes("wordprocessingml")) {
         const result = await mammoth.extractRawText({ buffer });
         textToProcess = result.value;
      } 
      // b) PDF / Imagens -> Gemini Vision OCR (Nuvem)
      else if (fileType.includes("pdf") || fileType.includes("image")) {
         const vModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
         let promptInst = "Transcreva todo o texto visível desta imagem integralmente.";
         if (fileType.includes("pdf")) promptInst = "Extraia rigorosamente o conteúdo deste arquivo e transcreva tudo em tópicos estruturados, sem omitir regras sistêmicas.";
         
         const analysis = await comRetry(() => vModel.generateContent([
           promptInst,
           { inlineData: { data: base64Data, mimeType: fileType } }
         ]));
         textToProcess = analysis.response.text();
      } else {
         throw new Error("Formato de arquivo não suportado.");
      }
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      return res.status(400).json({ error: "Conteúdo vazio ou ilegível (O arquivo pode ser apenas scan sem texto identificável)." });
    }

    // -- 3. Geração Vetorial --
    const chunks = chunkText(textToProcess);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    let successCount = 0;
    for (const chunk of chunks) {
      // 1. Gera Embedding do chunk usando o Google (Com proteção de sobrecarga)
      const result = await comRetry(() => embeddingModel.embedContent(chunk), 4, 1500);
      const vector = result.embedding.values.slice(0, 768);
      const vectorString = `[${vector.join(",")}]`;

      // 2. Salva no banco de dados vetorial do Supabase
      const { error } = await supabase.from("knowledge_base").insert({
        tenant_id: targetTenant,
        content: chunk,
        embedding: vectorString
      });

      if (error) {
        console.error("Erro inserindo RAG:", error);
      } else {
        successCount++;
      }
    }

    res.json({ success: true, chunksIngested: successCount, totalChunks: chunks.length });
  } catch (err) {
    console.error("Erro RAG:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/admin/knowledge/:id (Acessível a Tenants) ────────
router.put("/knowledge/:id", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    const targetTenant = req.user.role === "super_admin" && req.query.tenantId ? req.query.tenantId : req.user.tenantId;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "O conteúdo não pode ser vazio." });
    }

    // 1. Recalcula o vetor de Embedding atualizado
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await comRetry(() => embeddingModel.embedContent(content), 4, 1500);
    const vector = result.embedding.values.slice(0, 768);
    const vectorString = `[${vector.join(",")}]`;

    // 2. Atualiza os dados isoladamente no Tenant
    let query = supabase.from("knowledge_base").update({ content, embedding: vectorString }).eq("id", req.params.id);
    if (req.user.role !== "super_admin") {
       query = query.eq("tenant_id", targetTenant);
    }

    const { error } = await query;
    if (error) throw error;
    
    res.json({ success: true });
  } catch (err) {
    console.error("Erro RAG Update:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/admin/knowledge/:id (Acessível a Tenants) ────────
router.delete("/knowledge/:id", requireAuth, async (req, res) => {
  try {
    const targetTenant = req.user.role === "super_admin" && req.query.tenantId ? req.query.tenantId : req.user.tenantId;
    
    // Deleta garantindo o tenant do usuario logado (Tenant Isolation)
    let query = supabase.from("knowledge_base").delete().eq("id", req.params.id);
    if (req.user.role !== "super_admin") {
       query = query.eq("tenant_id", targetTenant);
    }

    const { error } = await query;
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Todas as rotas ABAIXO exigem autenticação + super_admin ──
router.use(requireAuth, requireSuperAdmin);


// â”€â”€ GET /api/admin/tenants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/tenants", async (_req, res) => {
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(`
      id, nome, nicho, status, plan,
      bot_name, bot_emoji, clinic_name, clinic_phone,
      phone_number_id, wa_access_token, prompt_text,
      trial_ends_at, created_at
    `)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Adicionar contagem de contatos por tenant
  const { data: counts } = await supabase
    .from("users_whatsapp")
    .select("tenant_id")
    .not("tenant_id", "is", null);

  const countMap = {};
  (counts ?? []).forEach((r) => {
    countMap[r.tenant_id] = (countMap[r.tenant_id] ?? 0) + 1;
  });

  res.json(tenants.map((t) => ({ ...t, totalContatos: countMap[t.id] ?? 0 })));
});

// â”€â”€ GET /api/admin/tenants/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/tenants/:id", async (req, res) => {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (!tenant) return res.status(404).json({ error: "Tenant nÃ£o encontrado." });

  const { data: users } = await supabase
    .from("users")
    .select("id, email, nome, role, is_active, created_at")
    .eq("tenant_id", req.params.id);

  res.json({ tenant, users: users ?? [] });
});

// â”€â”€ PUT /api/admin/tenants/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Campos que vocÃª pode atualizar: status, phone_number_id, wa_access_token,
//   prompt_text, bot_name, bot_emoji, clinic_name, clinic_phone, plan
router.put("/tenants/:id", async (req, res) => {
  const campos = [
    "status", "phone_number_id", "wa_access_token",
    "prompt_text", "bot_name", "bot_emoji",
    "clinic_name", "clinic_phone", "plan", "nicho",
    "nome", "trial_ends_at",
  ];

  const update = {};
  campos.forEach((c) => { if (req.body[c] !== undefined) update[c] = req.body[c]; });

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Nenhum campo vÃ¡lido para atualizar." });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update(update)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  console.log(`🔧  Admin atualizou tenant ${req.params.id}: ${JSON.stringify(update)}`);
  res.json(data);
});

// Antigo bloco de rotas removido e movido para cima

// ── POST /api/admin/seed ───────────────────────────────────────
// Cria o super_admin inicial. Só funciona se ainda não existir.
// Chame UMA VEZ após o primeiro deploy, depois proteja ou remova.
router.post("/seed", async (req, res) => {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNome     = process.env.ADMIN_NOME ?? "Admin";

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ error: "Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env" });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .single();

  if (existing) {
    return res.status(409).json({ error: "Super admin jÃ¡ existe." });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      tenant_id:     null,
      email:         adminEmail,
      password_hash: passwordHash,
      nome:          adminNome,
      role:          "super_admin",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  console.log(`ðŸ”‘  Super admin criado: ${adminEmail}`);
  res.status(201).json({ message: "Super admin criado com sucesso.", userId: user.id });
});

module.exports = router;

