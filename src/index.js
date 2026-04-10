// ============================================================
//  SofiaAI — Backend Server  |  v3.0.0  (SaaS Multi-Tenant)
//  Agente IA + Express REST + Supabase + Webhooks Meta Cloud
// ============================================================

"use strict";

require("dotenv").config();

const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const cors = require("cors");
const path = require("path");

// Rotas multi-tenant (Fase 1)
const authRouter  = require("./routes/auth");
const adminRouter = require("./routes/admin");

// ── 1. VARIÁVEIS DE AMBIENTE ─────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN ?? "sofia123";

// Configurações do chatbot (delays, top-limit)
const HISTORICO_LIMITE = parseInt(process.env.HISTORICO_LIMITE ?? "10", 10);
const TIMEOUT_GEMINI_MS = parseInt(process.env.TIMEOUT_GEMINI_MS ?? "25000", 10);
const DELAY_MINIMO_MS = parseInt(process.env.DELAY_MINIMO_MS ?? "3000", 10);
const MS_POR_PALAVRA = parseInt(process.env.MS_POR_PALAVRA ?? "80", 10);
const DELAY_MAXIMO_MS = parseInt(process.env.DELAY_MAXIMO_MS ?? "12000", 10);

// ── 2. VALIDAÇÕES NA INICIALIZAÇÃO ───────────────────────────
const erros = [];
if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith("AIza")) erros.push("GEMINI_API_KEY inválida ou não definida");
if (!SUPABASE_URL) erros.push("SUPABASE_URL não definida");
if (!SUPABASE_SERVICE_KEY) erros.push("SUPABASE_SERVICE_KEY não definida");

if (erros.length > 0) {
  erros.forEach((e) => console.error(`❌  ${e}`));
  process.exit(1);
}

// ── 3. CLIENTES EXTERNOS ─────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ── 4. UTILITÁRIOS ───────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function calcularDelayRestante(resposta, inicioMs) {
  const palavras = resposta.trim().split(/\s+/).length;
  const tempoDigitacao = palavras * MS_POR_PALAVRA;
  const tempoTotal = Math.min(DELAY_MAXIMO_MS, Math.max(DELAY_MINIMO_MS, tempoDigitacao));
  const tempoCorrido = Date.now() - inicioMs;
  return Math.max(0, tempoTotal - tempoCorrido);
}

function comTimeout(promise, ms) {
  const rejeicao = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout de ${ms}ms`)), ms)
  );
  return Promise.race([promise, rejeicao]);
}

// ── 5. FUNÇÕES SUPABASE ──────────────────────────────────────
async function getOrCreatePatient(telefone, nome = "Contato", tenantId = null) {
  // Busca pela combinação de telefone + tenant_id (se houver isolamento por número)
  // No momento, pacientes são ligados a um telefone.
  const query = supabase.from("users_whatsapp").select("*").eq("telefone", telefone);
  if (tenantId) query.eq("tenant_id", tenantId);
  
  const { data } = await query.maybeSingle();
  if (data) return data;

  const { data: novo, error } = await supabase
    .from("users_whatsapp")
    .insert({ telefone, nome, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar lead: ${error.message}`);
  return novo;
}

async function saveMessage(patient_id, texto, origin, tenantId = null) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ patient_id, texto, origin, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw new Error(`Erro ao salvar msg: ${error.message}`);
  return data;
}

async function getHistoricoGemini(patient_id) {
  const { data = [] } = await supabase
    .from("messages")
    .select("texto, origin")
    .eq("patient_id", patient_id)
    .order("created_at", { ascending: true })
    .limit(HISTORICO_LIMITE * 2);

  const history = [];
  for (const m of data) {
    const role = m.origin === "user" ? "user" : "model";
    if (history.length > 0 && history[history.length - 1].role === role) {
      history[history.length - 1].parts[0].text += `\n${m.texto}`;
    } else {
      history.push({ role, parts: [{ text: m.texto }] });
    }
  }
  return history;
}

// ── 6. GEMINI ────────────────────────────────────────────────
const MAX_TENTATIVAS_GEMINI = 3;
const BACKOFF_BASE_MS = 2000;

function ehErroSobrecarga(err) {
  const msg = err?.message ?? "";
  return msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("overloaded");
}

async function chamarModelo(modelo, historico, arrayMultiModal) {
  const chat = modelo.startChat({
    history: historico,
    generationConfig: { maxOutputTokens: 800, temperature: 0.85 },
  });
  const resultado = await comTimeout(chat.sendMessage(arrayMultiModal), TIMEOUT_GEMINI_MS);
  return resultado.response.text();
}

async function consultarGeminiDinamicamente(historico, payloadObject, tenant) {
  const prompt = tenant.prompt_text || "Você é a Sofia, uma assistente prestativa.";
  const modeloPrincipal = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: prompt });
  const modeloFallback  = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: prompt });

  const arrayMultiModal = [];
  if (payloadObject.inlineDatas && Array.isArray(payloadObject.inlineDatas)) {
    for (const data of payloadObject.inlineDatas) {
      arrayMultiModal.push({ inlineData: data });
    }
  } else if (payloadObject.inlineData) {
    arrayMultiModal.push({ inlineData: payloadObject.inlineData });
  }
  arrayMultiModal.push({ text: payloadObject.textoUsuario });

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_GEMINI; tentativa++) {
    try {
      return await chamarModelo(modeloPrincipal, historico, arrayMultiModal);
    } catch (err) {
      if (ehErroSobrecarga(err) && tentativa < MAX_TENTATIVAS_GEMINI) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, tentativa - 1));
      } else if (ehErroSobrecarga(err)) {
        console.warn(`[GEMINI] Fallback gemini-2.0-flash acionado para ${tenant.nome}.`);
        return await chamarModelo(modeloFallback, historico, arrayMultiModal);
      } else {
        throw err;
      }
    }
  }
}

// ── 7. SSE (Server-Sent Events) ──────────────────────────────
const sseClients = new Set();
function emitirEvento(evento, dados) {
  const payload = `event: ${evento}\ndata: ${JSON.stringify(dados)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch (_) { sseClients.delete(res); }
  }
}

// ── 8. EXPRESS — ROTAS API ───────────────────────────────────
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    whatsapp: "api_meta",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// Rota legado /api/config para evitar 404 no frontend
app.get("/api/config", (req, res) => {
  res.json({
    clinica: "ZapAI",
    botName: "Sofia",
    botEmoji: "🤖",
    promptFile: "geral"
  });
});

app.get("/api/stats", async (_req, res) => {
  const { data: patients = [] } = await supabase.from("users_whatsapp").select("status_kanban, is_ai_active");
  const { count: totalMensagens } = await supabase.from("messages").select("*", { count: "exact", head: true });
  
  // Busca o número ativo conectado na API Meta para mostrar na sidebar
  const { data: tenantInfo } = await supabase.from("tenants").select("clinic_phone").not("clinic_phone", "is", null).limit(1).maybeSingle();
  const numeroConectado = tenantInfo?.clinic_phone || "Cloud API";

  res.json({
    total: patients.length,
    novo: patients.filter((p) => p.status_kanban === "Novo").length,
    emAtendimento: patients.filter((p) => p.status_kanban === "Em Atendimento").length,
    agendado: patients.filter((p) => p.status_kanban === "Agendado").length,
    aiAtivo: patients.filter((p) => p.is_ai_active).length,
    aiPausado: patients.filter((p) => !p.is_ai_active).length,
    totalMensagens: totalMensagens ?? 0,
    whatsappStatus: "api_meta",
    sofiaNumero: numeroConectado,
  });
});

// GET /api/events — SSE stream
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`event: connected\ndata: {"ok":true}\n\n`);
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch (_) { clearInterval(heartbeat); }
  }, 30_000);
  sseClients.add(res);
  req.on("close", () => { clearInterval(heartbeat); sseClients.delete(res); });
});

app.get("/api/patients", async (_req, res) => {
  const { data, error } = await supabase.from("users_whatsapp").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/patients/:id/messages", async (req, res) => {
  const { data, error } = await supabase.from("messages").select("*").eq("patient_id", req.params.id).order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put("/api/patients/:id/status", async (req, res) => {
  const { status_kanban } = req.body;
  const { data, error } = await supabase.from("users_whatsapp").update({ status_kanban }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  emitirEvento("patient_updated", data);
  res.json(data);
});

app.put("/api/patients/:id/ai-status", async (req, res) => {
  const { is_ai_active } = req.body;
  const { data, error } = await supabase.from("users_whatsapp").update({ is_ai_active }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  emitirEvento("patient_updated", data);
  res.json(data);
});

async function enviarMensagemMeta(telefoneDestino, texto, tenant) {
  if (!tenant || !tenant.phone_number_id || !tenant.wa_access_token) return;
  try {
    const url = `https://graph.facebook.com/v20.0/${tenant.phone_number_id}/messages`;
    await axios.post(url, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telefoneDestino,
      type: "text",
      text: { preview_url: false, body: texto },
    }, {
      headers: { "Authorization": `Bearer ${tenant.wa_access_token}`, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`❌ [META API] ${tenant.nome}: erro ao enviar para ${telefoneDestino} -> ${error.response?.data?.error?.message || error.message}`);
  }
}

app.post("/api/patients/:id/send", async (req, res) => {
  const { texto } = req.body;
  if (!texto?.trim()) return res.status(400).json({ error: "texto obrigatório" });
  
  const { data: patient, error: pErr } = await supabase
    .from("users_whatsapp")
    .select("*, tenants(id, phone_number_id, wa_access_token)")
    .eq("id", req.params.id).single();

  if (pErr || !patient) return res.status(404).json({ error: "Contato não encontrado" });

  try {
    await enviarMensagemMeta(patient.telefone, texto.trim(), patient.tenants);
    const msg = await saveMessage(patient.id, texto.trim(), "human", patient.tenant_id);
    emitirEvento("new_message", { ...msg, patient_id: patient.id });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 8.5 DOWNLOAD DE MÍDIA DA META ─────────────────────────────
async function baixarMidiaMeta(mediaId, tenant) {
  try {
    const { data: info } = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${tenant.wa_access_token}` }
    });
    
    if (!info.url) return null;
    
    const { data: buffer } = await axios.get(info.url, {
      headers: { Authorization: `Bearer ${tenant.wa_access_token}` },
      responseType: 'arraybuffer'
    });
    
    return {
      mimeType: info.mime_type,
      data: Buffer.from(buffer).toString('base64')
    };
  } catch (error) {
    console.error(`❌ [META API] Erro ao baixar mídia ${mediaId}:`, error.message);
    return null;
  }
}

// ── 9. WEBHOOKS DA META ───────────────────────────────────────
const debounceTimers = new Map();
const userPayloadBuffers = new Map();
const DEBOUNCE_MS = 8000;

// Validação
app.get("/webhook/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    console.log("✅ Webhook verificado pela Meta!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recebimento
app.post("/webhook/whatsapp", async (req, res) => {
  const body = req.body;
  console.log("📩 [WEBHOOK] Chamada recebida da Meta!");
  console.log("📦 [WEBHOOK] Payload:", JSON.stringify(body, null, 2));

  if (!body.object) return res.sendStatus(404);
  res.sendStatus(200); // 200 OK imediato exigido pela Meta

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change || !change.messages || change.messages.length === 0) {
      console.log("ℹ️ [WEBHOOK] Notificação recebida (status/read), mas sem novas mensagens.");
      return;
    }

    const phoneNumberId = change.metadata.phone_number_id;
    console.log(`🔍 [WEBHOOK] Buscando tenant para o Phone ID: ${phoneNumberId}`);
    const { data: tenant } = await supabase.from("tenants").select("*").eq("phone_number_id", phoneNumberId).single();
    
    if (!tenant) {
      console.error(`❌ [WEBHOOK] Nenhum tenant encontrado para o ID: ${phoneNumberId}. Verifique o Painel Admin.`);
      return;
    }

    console.log(`✅ [WEBHOOK] Tenant identificado: ${tenant.nome}`);

    const paramMsg = change.messages[0];
    const telefoneUsuario = paramMsg.from;
    const nomeContato = change.contacts?.[0]?.profile?.name || "Contato";
    
    let textoLogSupabase = "[Formato não suportado]";
    let textoParaGemini = "";
    let inlineData = null;

    if (paramMsg.type === "text") {
      textoLogSupabase = paramMsg.text.body;
      textoParaGemini = textoLogSupabase;
    } else if (paramMsg.type === "audio") {
      textoLogSupabase = "[Áudio]";
      textoParaGemini = "O usuário te enviou este áudio. Transcreva ou ouça-o com atenção e responda de forma natural, sem dizer explicitamente que está lendo um áudio, apenas aja como uma pessoa normal conversando.";
      const media = await baixarMidiaMeta(paramMsg.audio.id, tenant);
      if (media) inlineData = media;
    } else if (paramMsg.type === "image") {
      const caption = paramMsg.image.caption ? ` Legenda do usuário: "${paramMsg.image.caption}"` : "";
      textoLogSupabase = `[Imagem]${caption}`;
      textoParaGemini = `O usuário te enviou esta imagem.${caption} Responda ou atenda ao pedido dele baseando-se com riqueza de detalhes no que você vê na imagem.`;
      const media = await baixarMidiaMeta(paramMsg.image.id, tenant);
      if (media) inlineData = media;
    } else {
      textoLogSupabase = `[${paramMsg.type}]`;
      textoParaGemini = `O usuário enviou um formato (${paramMsg.type}) que você não suporta ler no momento. Diga educadamente que só consegue entender textos, imagens e áudios.`;
    }

    const patient = await getOrCreatePatient(telefoneUsuario, nomeContato, tenant.id);
    
    // Atualiza nome/tenant do paciente caso estivesse incompleto
    if (patient.nome !== nomeContato || !patient.tenant_id) {
      await supabase.from("users_whatsapp").update({ nome: nomeContato, tenant_id: tenant.id }).eq("id", patient.id);
      patient.nome = nomeContato;
    }

    const msgUser = await saveMessage(patient.id, textoLogSupabase, "user", tenant.id);
    emitirEvento("new_message", msgUser);

    if (!patient.is_ai_active) return;
    
    // Se era um áudio/imagem mas o download falhou, avisar a IA
    if ((paramMsg.type === "audio" || paramMsg.type === "image") && !inlineData) {
       textoParaGemini = "O usuário enviou um arquivo de mídia, mas ocorreu um erro técnico ao baixar. Peça educadamente para ele digitar por texto.";
    }

    // ── DEBOUNCE / QUEUE ────────────────────────────────
    if (!userPayloadBuffers.has(patient.id)) {
      userPayloadBuffers.set(patient.id, []);
    }
    userPayloadBuffers.get(patient.id).push({ textoParaGemini, inlineData });

    // Dinamicamente aumenta o tempo de espera se for áudio (para dar tempo do cliente gravar outro)
    const delayDebounceAtivo = paramMsg.type === "audio" ? 16000 : DEBOUNCE_MS;

    clearTimeout(debounceTimers.get(patient.id));
    const timer = setTimeout(async () => {
      const items = userPayloadBuffers.get(patient.id) || [];
      userPayloadBuffers.delete(patient.id);
      debounceTimers.delete(patient.id);
      
      if (items.length === 0) return;

      let combinedTexto = "";
      const combinedInlineDatas = [];
      for (const item of items) {
        if (item.textoParaGemini) combinedTexto += `${item.textoParaGemini}\n`;
        if (item.inlineData) combinedInlineDatas.push(item.inlineData);
      }

      const inicioMs = Date.now();
      const historico = await getHistoricoGemini(patient.id);
      // Remove o texto que acabamos de salvar no banco da memória do histórico, 
      // pois ele já vai explicitamente via prompt do 'sendMessage' agrupado.
      if (historico.length > 0 && historico[historico.length - 1].role === "user") {
         historico.pop();
      }

      let respostaSofia;

      try {
        respostaSofia = await consultarGeminiDinamicamente(historico, { 
          textoUsuario: combinedTexto.trim(), 
          inlineDatas: combinedInlineDatas 
        }, tenant);
      } catch (e) {
        console.error(`❌ [GEMINI ERROR] Falha ao processar IA. Abortando silenciosamente para não quebrar o personagem: ${e.message}`);
        return; // Encerra o processamento sem enviar a mensagem robótica
      }

      const delay = calcularDelayRestante(respostaSofia, inicioMs);
      if (delay > 0) await sleep(delay);

      await enviarMensagemMeta(telefoneUsuario, respostaSofia, tenant);

      const msgBot = await saveMessage(patient.id, respostaSofia, "bot", tenant.id);
      emitirEvento("new_message", msgBot);

      if (patient.status_kanban === "Novo") {
        const { data: atualizado } = await supabase.from("users_whatsapp").update({ status_kanban: "Em Atendimento" }).eq("id", patient.id).select().single();
        if (atualizado) emitirEvento("patient_updated", atualizado);
      }
    }, delayDebounceAtivo);
    debounceTimers.set(patient.id, timer);

  } catch (err) {
    console.error("❌ Erro ao processar webhook:", err.message);
  }
});

// ── 10. INICIAÇÃO ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SofiaAI SaaS v3.0.0 (API Oficial Meta) em http://localhost:${PORT}`);
});
