// ============================================================
//  ZapAI — Backend Server  |  v3.0.0  (SaaS Multi-Tenant)
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
const {
  SAFE_ERROR_FALLBACK,
  buildGeminiHistoryFromRows,
  extractAiTextFromProviderResponse,
  getSafeFallback,
  sanitizeAiMessage,
  sanitizeAiMessageWithReport,
  validateAiMessage,
} = require("./utils/aiMessageSafety");

// Rotas multi-tenant (Fase 1) - requeridas depois da injeção de mocks

// ── 1. VARIÁVEIS DE AMBIENTE ─────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN ?? "sofia123";

// Configurações do chatbot (delays, top-limit)
const HISTORICO_LIMITE = parseInt(process.env.HISTORICO_LIMITE ?? "20", 10);
const TIMEOUT_GEMINI_MS = parseInt(process.env.TIMEOUT_GEMINI_MS ?? "25000", 10);

const DELAY_MINIMO_MS = parseInt(process.env.DELAY_MINIMO_MS ?? "2500", 10);
const MS_POR_PALAVRA = parseInt(process.env.MS_POR_PALAVRA ?? "70", 10);
const DELAY_MAXIMO_MS = parseInt(process.env.DELAY_MAXIMO_MS ?? "7000", 10);

const RAW_WHATSAPP_MAX_CHARS = parseInt(process.env.WHATSAPP_MAX_CHARS ?? "1600", 10);
const WHATSAPP_MAX_CHARS = Number.isFinite(RAW_WHATSAPP_MAX_CHARS)
  ? Math.min(3000, Math.max(600, RAW_WHATSAPP_MAX_CHARS))
  : 1600;
const RAW_WHATSAPP_MAX_MESSAGES = parseInt(process.env.WHATSAPP_MAX_MESSAGES ?? "1", 10);
const WHATSAPP_MAX_MESSAGES = Number.isFinite(RAW_WHATSAPP_MAX_MESSAGES)
  ? Math.min(3, Math.max(1, RAW_WHATSAPP_MAX_MESSAGES))
  : 1;
const DELAY_ENTRE_MENSAGENS_MIN_MS = parseInt(process.env.DELAY_ENTRE_MENSAGENS_MIN_MS ?? "800", 10);
const DELAY_ENTRE_MENSAGENS_MAX_MS = parseInt(process.env.DELAY_ENTRE_MENSAGENS_MAX_MS ?? "1600", 10);

// Defaults tuned for conservative outputs to reduce hallucinations
const GEMINI_MAX_OUTPUT_TOKENS = parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? "700", 10);
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE ?? "0.20");
const GEMINI_TOP_P = Number(process.env.GEMINI_TOP_P ?? "0.80");
const GEMINI_TOP_K = parseInt(process.env.GEMINI_TOP_K ?? "40", 10);

// ── 2. VALIDAÇÕES NA INICIALIZAÇÃO ───────────────────────────
const erros = [];
if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith("AIza")) erros.push("GEMINI_API_KEY inválida ou não definida");
if (!SUPABASE_URL) erros.push("SUPABASE_URL não definida");
if (!SUPABASE_SERVICE_KEY) erros.push("SUPABASE_SERVICE_KEY não definida");

if (erros.length > 0) {
  erros.forEach((e) => console.error(`❌  ${e}`));
  // Em modo de teste, não abortamos o processo — permitimos mocks e injeções
  if (process.env.TEST_MODE === "1" || process.env.TEST_MODE === "true") {
    console.warn("⚠️ [INIT] Ambiente incompleto, seguindo em TEST_MODE");
  } else {
    process.exit(1);
  }
}

// ── 3. CLIENTES EXTERNOS ─────────────────────────────────────
// Allow test-mode injection/mocks
let supabase;
let genAI;
if (process.env.TEST_MODE === "1" || process.env.TEST_MODE === "true") {
  try {
    // In test mode, prefer local mocks (optional)
    const geminiMock = require("./mocks/geminiMock");
    genAI = geminiMock;
    const supabaseMock = require("./mocks/supabaseMock");
    supabase = supabaseMock;
    console.log("🧪 [TEST MODE] Mocks de Gemini e Supabase ativados");
  } catch (e) {
    console.warn("⚠️ [TEST MODE] Falha ao carregar mocks:", e.message);
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// ── 4. UTILITÁRIOS ───────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── IDEMPOTÊNCIA: Rastreia mensagens recebidas (cache em memória + TTL)
const processedMessages = new Map();
const MESSAGE_CACHE_TTL_MS = 3600000; // 1 hora
let dbIdempotencyAvailable = null;

function getMessageProcessingState(messageId) {
  if (!messageId || !processedMessages.has(messageId)) return null;
  const state = processedMessages.get(messageId);
  const isExpired = Date.now() - state.updatedAt > MESSAGE_CACHE_TTL_MS;
  if (isExpired) {
    processedMessages.delete(messageId);
    return null;
  }
  return state;
}

function claimIncomingMessage(messageId, details = {}) {
  if (!messageId) {
    return { claimed: true, key: null, status: "received" };
  }

  const current = getMessageProcessingState(messageId);
  if (current && ["received", "processing", "answered"].includes(current.status)) {
    return { claimed: false, key: messageId, status: current.status };
  }

  const now = Date.now();
  processedMessages.set(messageId, {
    ...details,
    status: "received",
    createdAt: current?.createdAt || now,
    updatedAt: now,
  });

  return { claimed: true, key: messageId, status: "received" };
}

function updateIncomingMessageStatus(messageId, status, details = {}) {
  if (!messageId) return;
  const current = getMessageProcessingState(messageId) || {};
  processedMessages.set(messageId, {
    ...current,
    ...details,
    status,
    updatedAt: Date.now(),
  });

  updateIncomingMessageStatusInDatabase(messageId, status, details).catch((err) => {
    if (dbIdempotencyAvailable !== false) {
      console.warn(`⚠️ [IDEMPOTÊNCIA] Falha ao atualizar status no banco: ${err.message}`);
    }
  });
}

function isMissingIdempotencyTableError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || message.includes("whatsapp_message_processing") || message.includes("does not exist");
}

async function claimIncomingMessageInDatabase(messageId, tenant, paramMsg) {
  if (!messageId || dbIdempotencyAvailable === false) {
    return { claimed: true, status: "received", source: "memory" };
  }

  try {
    const { data: existing, error: selectError } = await supabase
      .from("whatsapp_message_processing")
      .select("status")
      .eq("whatsapp_message_id", messageId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing && ["received", "processing", "answered"].includes(existing.status)) {
      dbIdempotencyAvailable = true;
      return { claimed: false, status: existing.status, source: "database" };
    }

    const payload = {
      whatsapp_message_id: messageId,
      tenant_id: tenant?.id || null,
      phone_number_id: tenant?.phone_number_id || paramMsg?.metadata?.phone_number_id || null,
      from_phone: paramMsg?.from || null,
      status: "received",
      updated_at: new Date().toISOString(),
    };

    const query = existing
      ? supabase.from("whatsapp_message_processing").update(payload).eq("whatsapp_message_id", messageId)
      : supabase.from("whatsapp_message_processing").insert(payload);

    const { error: writeError } = await query;
    if (writeError) {
      if (writeError.code === "23505") {
        return { claimed: false, status: "processing", source: "database" };
      }
      throw writeError;
    }

    dbIdempotencyAvailable = true;
    return { claimed: true, status: "received", source: "database" };
  } catch (error) {
    if (isMissingIdempotencyTableError(error)) {
      dbIdempotencyAvailable = false;
      console.warn("⚠️ [IDEMPOTÊNCIA] Tabela whatsapp_message_processing ausente; usando cache em memória.");
      return { claimed: true, status: "received", source: "memory" };
    }

    throw error;
  }
}

async function updateIncomingMessageStatusInDatabase(messageId, status, details = {}) {
  if (!messageId || dbIdempotencyAvailable === false) return;

  const update = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (details.patientId) update.patient_id = details.patientId;
  if (details.reason || details.fallback || details.skipped) {
    update.last_error = details.reason || details.fallback || details.skipped;
  }

  const { error } = await supabase
    .from("whatsapp_message_processing")
    .update(update)
    .eq("whatsapp_message_id", messageId);

  if (error) {
    if (isMissingIdempotencyTableError(error)) {
      dbIdempotencyAvailable = false;
      return;
    }
    throw error;
  }
}

// Test-mode global state (populated only in TEST_MODE)
if (process.env.TEST_MODE === "true") {
  global.__testState__ = global.__testState__ || { sentMessages: [], geminiCalls: [] };
}

// Limpar cache expirado a cada 10 minutos
const processedMessagesCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [msgId, state] of processedMessages.entries()) {
    if (now - state.updatedAt > MESSAGE_CACHE_TTL_MS) {
      processedMessages.delete(msgId);
    }
  }

  for (const [turnKey, timestamp] of recentUserTurns.entries()) {
    if (now - timestamp > RECENT_TURN_TTL_MS) {
      recentUserTurns.delete(turnKey);
    }
  }
}, 600000);
if (typeof processedMessagesCleanupTimer.unref === "function") {
  processedMessagesCleanupTimer.unref();
}

/**
 * Normaliza número de telefone brasileiro para o formato E.164 sem o "+".
 * Corrige automaticamente celulares BR com 12 dígitos (sem o 9º dígito)
 * para 13 dígitos, ex: 557388066822 → 5573988066822.
 */
function normalizarTelefoneBR(telefone) {
  // Remove qualquer caractere não numérico
  const numero = String(telefone).replace(/\D/g, "");

  // Número BR com DDI 55 + DDD 2 dígitos + número 8 dígitos = 12 dígitos (faltando o 9)
  if (numero.startsWith("55") && numero.length === 12) {
    const ddd = numero.slice(2, 4);
    const resto = numero.slice(4); // 8 dígitos
    const normalizado = `55${ddd}9${resto}`;
    console.log(`🔧 [TELEFONE] Número normalizado: ${numero} → ${normalizado}`);
    return normalizado;
  }

  return numero;
}

function calcularDelayRestante(resposta, inicioMs) {
  const palavras = resposta.trim().split(/\s+/).length;
  const tempoDigitacao = palavras * MS_POR_PALAVRA;
  const tempoTotal = Math.min(DELAY_MAXIMO_MS, Math.max(DELAY_MINIMO_MS, tempoDigitacao));
  const tempoCorrido = Date.now() - inicioMs;
  return Math.max(0, tempoTotal - tempoCorrido);
}

function comTimeout(promise, ms) {
  let timeoutId;

  const rejeicao = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout de ${ms}ms`)), ms);
  });

  return Promise.race([promise, rejeicao]).finally(() => clearTimeout(timeoutId));
}

function delayAleatorio(min = DELAY_ENTRE_MENSAGENS_MIN_MS, max = DELAY_ENTRE_MENSAGENS_MAX_MS) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizarEspacos(texto) {
  return String(texto || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function limparRespostaIA(texto, options = {}) {
  return sanitizeAiMessage(texto, options);
}

function dividirTextoLongo(texto, maxChars = WHATSAPP_MAX_CHARS) {
  const clean = String(texto || "").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const partes = [];
  const frases = clean.match(/[^.!?;:\n]+[.!?;:]?|\n+/g) || [clean];
  let atual = "";

  const pushAtual = () => {
    if (atual.trim()) {
      partes.push(atual.trim());
      atual = "";
    }
  };

  const adicionarLinha = (linha) => {
    if (!linha) return;
    const textoCombinado = atual ? `${atual} ${linha}` : linha;
    if (textoCombinado.length <= maxChars) {
      atual = textoCombinado;
    } else {
      pushAtual();
      atual = linha;
    }
  };

  for (const frase of frases) {
    const pedaco = frase.trim();
    if (!pedaco) continue;

    if (pedaco.length <= maxChars) {
      adicionarLinha(pedaco);
      continue;
    }

    pushAtual();

    const tokens = pedaco.split(/(\s+)/).filter(Boolean);
    let linhaAtual = "";

    for (const token of tokens) {
      if (linhaAtual.length + token.length <= maxChars) {
        linhaAtual += token;
        continue;
      }

      if (!token.trim()) {
        if (linhaAtual.trim()) {
          partes.push(linhaAtual.trim());
        }
        linhaAtual = "";
        continue;
      }

      if (token.length > maxChars) {
        if (linhaAtual.trim()) {
          partes.push(linhaAtual.trim());
          linhaAtual = "";
        }
        for (let i = 0; i < token.length; i += maxChars) {
          partes.push(token.slice(i, i + maxChars));
        }
        continue;
      }

      if (linhaAtual.trim()) {
        partes.push(linhaAtual.trim());
      }
      linhaAtual = token.trim();
    }

    if (linhaAtual.trim()) {
      partes.push(linhaAtual.trim());
    }
  }

  if (atual.trim()) partes.push(atual.trim());
  return partes;
}

function dividirMensagensWhatsApp(texto, maxChars = WHATSAPP_MAX_CHARS, maxMessages = WHATSAPP_MAX_MESSAGES, options = {}) {
  const clean = limparRespostaIA(texto, { ...options, maxChars: maxChars * maxMessages });
  if (!clean) return [];

  const sentences = clean.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g) || [clean];
  const messages = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) messages.push(trimmed);
    current = "";
  };

  for (const sentence of sentences) {
    const piece = sentence.replace(/\s+/g, " ").trim();
    if (!piece) continue;

    const candidate = current ? `${current} ${piece}` : piece;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    pushCurrent();
    if (piece.length <= maxChars) {
      current = piece;
    } else {
      const chunks = dividirTextoLongo(piece, maxChars);
      for (const chunk of chunks) messages.push(chunk.trim());
    }
  }

  pushCurrent();

  const selected = messages.filter(Boolean).slice(0, maxMessages);
  if (selected.length >= 2) {
    const last = selected[selected.length - 1];
    const prev = selected[selected.length - 2];
    const lastShort = last.length <= 18 || last.split(/\s+/).length <= 3;
    if (lastShort && prev.length + 1 + last.length <= maxChars) {
      selected[selected.length - 2] = `${prev} ${last}`;
      selected.pop();
    }
  }

  return selected;
}

function normalizeTurnText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipRecentTurn(patientId, text) {
  const normalized = normalizeTurnText(text);
  if (!patientId || !normalized) return false;
  const key = `${patientId}:${normalized}`;
  const now = Date.now();
  const prev = recentUserTurns.get(key);
  if (prev && now - prev < RECENT_TURN_TTL_MS) return true;
  recentUserTurns.set(key, now);
  return false;
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
  let textoSeguro = String(texto || "");

  if (origin === "bot") {
    const validation = validateAiMessage(textoSeguro);
    if (!validation.valid || !validation.text) {
      throw new Error(`Mensagem do bot bloqueada pela validação: ${validation.reasons.join(", ")}`);
    }
    textoSeguro = validation.text;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ patient_id, texto: textoSeguro, origin, tenant_id: tenantId })
    .select()
    .single();

  if (error) throw new Error(`Erro ao salvar msg: ${error.message}`);
  return data;
}

async function getHistoricoGemini(patient_id, tenantId = null) {
  let query = supabase
    .from("messages")
    .select("texto, origin, tenant_id")
    .eq("patient_id", patient_id);

  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data = [] } = await query
    .order("created_at", { ascending: false })
    .limit(HISTORICO_LIMITE * 2);

  return buildGeminiHistoryFromRows(data.reverse(), { limit: HISTORICO_LIMITE });
}

function sanitizeGeminiHistory(history) {
  const rows = Array.isArray(history)
    ? history.map((item) => ({
        origin: item?.role === "user" ? "user" : item?.role === "model" ? "bot" : "ignored",
        texto: Array.isArray(item?.parts) ? item.parts.map((part) => part?.text || "").join("\n") : "",
      }))
    : [];

  return buildGeminiHistoryFromRows(rows, { limit: HISTORICO_LIMITE });
}

// ── 6.5 MEMÓRIA DE LONGO PRAZO ──────────────────────────────
async function atualizarMemoriaLongoPrazo(patient, historico, ultimaRespostaBot) {
  try {
    let textoConversa = historico.map(h => `${h.role === 'user' ? 'Usuário' : 'IA'}: ${h.parts[0].text}`).join("\n");
    textoConversa += `\nIA: ${ultimaRespostaBot}`;

    const promptMemoria = `Você é um analista de dados extraindo contexto vital de retenção.
Extraia os fatos mais importantes sobre o 'Usuário' com base na conversa abaixo.
Gere um JSON (apenas o formato JSON, sem crases de markdown) com informações úteis para manter o contexto em futuras conversas. 
Exemplos do que buscar: nome, preferências pessoais, intenção de compra, objeções, orçamento, dúvidas recorrentes.

Memória Existente (Base atual):
${patient.ai_memory ? JSON.stringify(patient.ai_memory) : "{}"}

Conversa Recente:
${textoConversa}

Regras:
1. Responda APENAS com um objeto JSON válido. Nada de texto antes ou depois.
2. Mescle os dados novos com os dados da "Memória Existente". Mantenha o que for importante.
3. Preserve fatos numéricos e dados de operação, como número de caminhões, tamanho da frota, tipo de carga e dor do cliente.
4. Se a conversa recente não tiver nenhuma informação nova ou relevante, retorne exatamente o JSON da Memória Existente.
`;

    const abstractor = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await abstractor.generateContent(promptMemoria);
    let textResult = result.response.text().trim();
    // Limpeza de blocos de código se vierem acidentalmente
    textResult = textResult.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();

    try {
      const novaMemoria = JSON.parse(textResult);
      if (Object.keys(novaMemoria).length > 0) {
        await supabase.from("users_whatsapp").update({ ai_memory: novaMemoria }).eq("id", patient.id);
        console.log(`🧠 [MEMÓRIA] Perfil do contato ${patient.telefone} enriquecido!`);
      }
    } catch (parseErr) {
      console.log(`🧠 [MEMÓRIA] Falha ao efetuar parse do JSON de memória: ${textResult}`);
    }
  } catch (err) {
    console.error(`🧠 [MEMÓRIA] Erro ao processar memória de longo prazo: ${err.message}`);
  }
}

// ── 6. GEMINI ────────────────────────────────────────────────
const MAX_TENTATIVAS_GEMINI = 3;
const BACKOFF_BASE_MS = 2000;

function ehErroSobrecarga(err) {
  const status = err?.status || err?.statusCode || err?.code;
  const msg = String(err?.message || "").toLowerCase();

  return (
    [408, 429, 500, 502, 503, 504, "408", "429", "500", "502", "503", "504"].includes(status) ||
    msg.includes("503") ||
    msg.includes("service unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("resource exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("timeout") ||
    msg.includes("deadline")
  );
}

async function chamarModelo(modelo, historico, arrayMultiModal) {
  const chat = modelo.startChat({
    history: historico,
    generationConfig: {
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      temperature: GEMINI_TEMPERATURE,
      topP: GEMINI_TOP_P,
      topK: GEMINI_TOP_K,
    },
  });

  const resultado = await comTimeout(chat.sendMessage(arrayMultiModal), TIMEOUT_GEMINI_MS);
  const texto = extractAiTextFromProviderResponse(resultado);
  if (!texto || typeof texto !== "string") {
    throw new Error("Resposta vazia ou inválida retornada pelo provedor de IA.");
  }
  return texto;
}

async function consultarGeminiDinamicamente(historico, payloadObject, tenant, patientMemory = null) {
  // Test-mode shortcut: deterministic responses for integration tests
  if (process.env.TEST_MODE === "1" || process.env.TEST_MODE === "true") {
    global.__testState__ = global.__testState__ || { sentMessages: [], geminiCalls: [] };
    global.__testState__.geminiCalls.push({ tenantId: tenant?.id || null, texto: payloadObject?.textoUsuario || "" });
    const userText = String(payloadObject?.textoUsuario || "");
    if (userText.includes("__DRAFT__")) {
      return { text: "Drafting Message 2*: \"Eu sou a Beatriz,\"", ragUsed: false, possibleHallucination: false };
    }
    if (userText.includes("__JSON__")) {
      return { text: "{\"role\":\"assistant\",\"content\":\"Oi, isso não deve ir ao WhatsApp\"}", ragUsed: false, possibleHallucination: false };
    }
    if (userText.includes("__EMPTY__")) {
      return { text: "", ragUsed: false, possibleHallucination: false };
    }
    if (userText.includes("__ERROR__")) {
      throw new Error("TypeError: Cannot read properties of undefined\n    at gerarResposta (/app/src/index.js:10:5)");
    }
    if (userText.includes("__GENERIC_GREETING__")) {
      if (userText.includes("Reescreva apenas a resposta final para WhatsApp")) {
        return {
          text: "Claro. Sobre isso, trabalhamos com estratégia, criação e execução para posicionar sua marca e gerar resultado. Se você quiser, eu te explico os próximos passos.",
          ragUsed: false,
          possibleHallucination: false
        };
      }
      return { text: "Oi! Tudo ótimo por aqui, e com você? Oi! Tudo ótimo por aqui, e com você?", ragUsed: false, possibleHallucination: false };
    }
    if (userText.includes("__CUT__")) {
      if (userText.includes("Reescreva apenas a resposta final para WhatsApp")) {
        return {
          text: "Nós criamos projetos sob medida, começando por diagnóstico, depois estratégia e execução completa da comunicação.",
          ragUsed: false,
          possibleHallucination: false
        };
      }
      return { text: "Nós criamos desde a identidade visual (log", ragUsed: false, possibleHallucination: false };
    }
    if (userText.includes("__CUT_QUALIFIER__")) {
      if (userText.includes("Reescreva apenas a resposta final para WhatsApp")) {
        return {
          text: "Nós somos uma agência de publicidade com mais de 11 anos de mercado, atendendo marcas com estratégia, criação e execução.",
          ragUsed: false,
          possibleHallucination: false
        };
      }
      return { text: "Nós somos uma agência de publicidade com quase", ragUsed: false, possibleHallucination: false };
    }
    if (userText.includes("__HALLU__")) {
      return { text: "A empresa Tozzo é cliente da nossa operação.", ragUsed: false, possibleHallucination: true };
    }
    return { text: "Resposta final limpa e natural.", ragUsed: false, possibleHallucination: false };
  }
  let prompt = tenant.prompt_text || "Você é a Sofia, uma assistente prestativa.";
  let ragContext = "";

  if (patientMemory && typeof patientMemory === "object" && Object.keys(patientMemory).length > 0) {
    prompt += `

=== MEMÓRIA DE LONGO PRAZO ===
Você já conversou com este usuário no passado ou nesta mesma sessão.

Informações úteis sobre ele:
${JSON.stringify(patientMemory, null, 2)}

Use estes detalhes com naturalidade para manter contexto e personalizar o atendimento.
Não mencione que você possui uma memória interna.`;
  }

  // --- INJEÇÃO RAG (BASE DE CONHECIMENTO VETORIAL) ---
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const queryResult = await embeddingModel.embedContent(payloadObject.textoUsuario);
    const queryVector = queryResult.embedding.values.slice(0, 768);
    const vectorString = `[${queryVector.join(",")}]`;

    const { data: matches, error: rpcError } = await supabase.rpc("match_knowledge", {
      query_embedding: vectorString,
      match_threshold: 0.42,
      match_count: 7,
      p_tenant_id: tenant.id,
    });

    if (!rpcError && matches && matches.length > 0) {
      ragContext = matches
        .map((m, index) => `[Fonte ${index + 1}]\n${m.content}`)
        .filter(Boolean)
        .join("\n\n");

      prompt += `

# BASE DE CONHECIMENTO INTERNA / SITE / RAG

Você possui as informações abaixo recuperadas da base de conhecimento da empresa.
Esses dados podem ter vindo do site oficial, documentos internos ou materiais cadastrados.

Use esses dados como fonte factual quando forem relevantes para a pergunta do cliente.

<conhecimento>
${ragContext}
</conhecimento>

REGRAS PARA USAR A BASE:
- Se o cliente perguntar sobre parceiros, clientes, empresas, cases ou transportadoras, você PODE citar nomes que apareçam claramente no conhecimento acima.
- Nunca invente nomes que não estejam no conhecimento.
- Se houver nomes no conhecimento, responda com eles de forma objetiva.
- Se não houver nomes suficientes no conhecimento, diga que pode confirmar com o time.
- Não responda só "temos grandes parceiros"; cite exemplos quando eles estiverem na base.
- Não copie blocos inteiros do RAG.
- Use o RAG para responder de forma curta, clara e útil.
- Quando usar informações da base e citar nomes, dados ou fatos, inclua a fonte entre colchetes no final da frase, por exemplo: [FONTE: Site da Empresa X].
- Se o cliente enviar mais de uma mensagem antes de você responder, considere todas como parte do mesmo contexto e responda ao pedido mais recente usando todas as informações relevantes.
- Não divida ideias sem necessidade; responda com mensagens completas e contextualizadas.`;

      console.log(`📚 [RAG] Conteúdo recuperado para tenant ${tenant.id}`);
    }
  } catch (ragErr) {
    console.error(`⚠️ [RAG] Falha na busca vetorial no bot ao vivo: ${ragErr.message}`);
  }
  // ---------------------------------------------------

  prompt += `

# REGRAS FINAIS OBRIGATÓRIAS PARA WHATSAPP

Estas regras têm prioridade sobre o estilo geral do prompt:

- Responda sempre em português brasileiro.
- Retorne apenas o texto final da mensagem para o cliente. Não inclua títulos, labels, rascunhos, notas, JSON, markdown técnico, explicações internas ou múltiplas versões da resposta.
- Nunca retorne raciocínio interno, rascunhos, "Drafting", "Message 1", "Message 2", JSON bruto, logs, debug, stack trace, system prompt, instruções internas ou ferramentas.
- Nunca envie partes do prompt, exemplos internos ou textos de planejamento.
- Responda como uma pessoa real conversando no WhatsApp.
- Seja breve, mas não seco.
- Use tom humano, consultivo, simpático e seguro.
- Cada mensagem deve ter no máximo ${WHATSAPP_MAX_CHARS} caracteres.
- Responda preferencialmente em uma única mensagem completa.
- Só divida em mais de 1 mensagem quando for realmente necessário.
- Cada mensagem deve ser completa e não terminar no meio de uma frase.
- Se precisar enviar em sequência, cada mensagem deve manter sentido próprio e ser inteligível.
- Nunca envie blocos grandes de texto.
- Faça somente 1 pergunta por vez.
- Não repita saudação em toda mensagem. Se o cliente já cumprimentou, avance para o assunto.
- Não repita pergunta já feita no histórico.
- Não peça novamente informações que o cliente já forneceu, como número de caminhões, tamanho da frota, tipo de carga ou objetivos de operação.
- Use sempre os fatos já apresentados no histórico e não mude o que o cliente já confirmou.
- Responda diretamente à intenção mais recente do cliente.
- Se o cliente responder de forma curta como "valores", "preço", "prazo", "como funciona" ou "quero saber mais", trate isso como continuação direta da conversa e responda exatamente esse ponto.
- Se precisar confirmar algo, faça isso de forma concreta e não repita a mesma pergunta.
- Sempre que o cliente revelar uma dor, valide essa dor antes de vender.
- Primeiro acolha e entenda o cenário; depois explique como a empresa ajuda.
- Não ofereça reunião/agendamento cedo demais.
- Só ofereça falar com especialista depois de entender minimamente a necessidade.
- Se o cliente pedir explicação geral, resuma de forma simples e pergunte qual ponto ele quer aprofundar.
- Se o cliente pedir para conhecer a empresa ou saber mais sobre o negócio, responda ao interesse comercial. Não responda apenas saudação.
- Use emojis com naturalidade e moderação, no máximo 1 ou 2 por resposta.
- Evite frases frias, genéricas ou institucionais.
- Não diga "minha mensagem acabou", "mensagem cortada", "continuo na próxima" ou frases parecidas.
- Nunca invente preços, prazos, promessas, disponibilidade, clientes, parceiros, cases ou condições.
- Quando usar informações da base de conhecimento, seja específico.
- Se a pergunta for "quem são?", "quais empresas?", "quais parceiros?" ou similar, responda com nomes concretos que estejam na base.
- Se não tiver certeza, diga que vai confirmar com o time.

# COMO RESPONDER SOBRE PARCEIROS, CLIENTES OU CASES

Se houver nomes no RAG:
1. Confirme de forma natural.
2. Cite alguns exemplos encontrados na base.
3. Não exagere dizendo que são clientes se o texto só indicar parceiro, case ou empresa citada.
4. Faça uma pergunta simples para avançar.

Exemplo:
"Sim. Na nossa base aparecem empresas do setor como Tozzo e Aceville, por exemplo."

"A PX.Center atua conectando operações logísticas a profissionais qualificados sob demanda."

"Você quer entender mais pela parte de motoristas, ajudantes ou tecnologia?"

Se não houver nomes no RAG:
"Temos atuação com empresas do setor logístico, sim."

"Mas para te passar nomes específicos com segurança, preciso confirmar com o time."

"Quer que eu te explique enquanto isso como funciona a operação?"
`;

  const modeloPrincipal = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    systemInstruction: prompt,
  });

  const modeloFallback = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: prompt,
  });

  const arrayMultiModal = [];

  if (payloadObject.inlineDatas && Array.isArray(payloadObject.inlineDatas)) {
    for (const data of payloadObject.inlineDatas) {
      arrayMultiModal.push({ inlineData: data });
    }
  } else if (payloadObject.inlineData) {
    arrayMultiModal.push({ inlineData: payloadObject.inlineData });
  }

  arrayMultiModal.push({ text: payloadObject.textoUsuario });

  let lastError = null;
  let modelText = null;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_GEMINI; tentativa++) {
    try {
      modelText = await chamarModelo(modeloPrincipal, historico, arrayMultiModal);
      break;
    } catch (err) {
      lastError = err;
      if (ehErroSobrecarga(err) && tentativa < MAX_TENTATIVAS_GEMINI) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, tentativa - 1));
        continue;
      } else if (ehErroSobrecarga(err)) {
        console.warn(`[GEMINI] Fallback gemini-2.5-flash-lite acionado para ${tenant.nome}.`);
        try {
          modelText = await chamarModelo(modeloFallback, historico, arrayMultiModal);
          break;
        } catch (fbErr) {
          lastError = fbErr;
          break;
        }
      } else {
        throw err;
      }
    }
  }

  if (!modelText && lastError) throw new Error(`Falha ao consultar Gemini: ${lastError.message}`);

  // Pós-processamento: detectar possíveis alucinações simples
  const ragUsed = Boolean(ragContext && ragContext.trim().length > 0);
  const { detectPossibleHallucination } = require("./utils/hallucination");
  const possibleHallucination = detectPossibleHallucination(modelText, ragUsed);

  return { text: modelText, ragUsed, possibleHallucination };
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

// Now require routers (after possible TEST_MODE injection)
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");

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

// ── RETRY COM BACKOFF EXPONENCIAL ────────────────────────────
const MAX_TENTATIVAS_META = 3;
const BACKOFF_BASE_META_MS = 1000;

function isRetryableMetaError(error) {
  const status = error?.response?.status;
  const code = error?.code;
  // Retentar em: timeout, rate limit, 5xx
  return [408, 429, 500, 502, 503, 504].includes(status) || 
         code === 'ECONNABORTED' || 
         code === 'ECONNRESET' ||
         code === 'ETIMEDOUT';
}

async function enviarMensagemMeta(telefoneDestino, texto, tenant) {
  // In test mode, don't call external Meta API — record the message locally
  if (process.env.TEST_MODE === "1" || process.env.TEST_MODE === "true") {
    global.__testState__ = global.__testState__ || { sentMessages: [], geminiCalls: [] };
    const msgObj = { to: telefoneDestino, text: texto, tenant: tenant?.nome || null };
    global.__testState__.sentMessages.push(msgObj);
    console.log(`✅ [META MOCK] (TEST_MODE) Mensagem simulada para ${telefoneDestino}`);
    return msgObj;
  }

  if (!tenant || !tenant.phone_number_id || !tenant.wa_access_token) {
    throw new Error("Tenant sem phone_number_id ou wa_access_token configurado.");
  }

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_META; tentativa++) {
    try {
      const url = `https://graph.facebook.com/v20.0/${tenant.phone_number_id}/messages`;

      await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: telefoneDestino,
          type: "text",
          text: {
            preview_url: false,
            body: texto,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${tenant.wa_access_token}`,
            "Content-Type": "application/json",
          },
          timeout: 25000,
        }
      );

      console.log(`✅ [META API] Mensagem enviada com sucesso para ${telefoneDestino} (tentativa ${tentativa}/${MAX_TENTATIVAS_META})`);
      return true;
    } catch (error) {
      const metaMessage = error.response?.data?.error?.message || error.message;
      const isRetryable = isRetryableMetaError(error);
      
      console.warn(`⚠️ [META API] Tentativa ${tentativa}/${MAX_TENTATIVAS_META} falhou para ${telefoneDestino}: ${metaMessage}`);

      if (isRetryable && tentativa < MAX_TENTATIVAS_META) {
        const delayMs = BACKOFF_BASE_META_MS * Math.pow(2, tentativa - 1);
        console.log(`⏳ [META API] Aguardando ${delayMs}ms antes de retentar...`);
        await sleep(delayMs);
        continue;
      }
      
      console.error(`❌ [META API] ${tenant.nome}: erro crítico ao enviar para ${telefoneDestino} -> ${metaMessage}`);
      throw new Error(`Erro ao enviar mensagem Meta: ${metaMessage}`);
    }
  }

  throw new Error("Falha ao enviar mensagem após todas as tentativas");
}

function logSanitization(stage, report, extra = {}) {
  if (!report || (report.valid && report.reasons.length === 0)) return;
  const context = Object.entries(extra)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  console.warn(`⚠️  [AI SAFETY] ${stage}: ${report.reasons.join(", ")}${context ? ` (${context})` : ""}`);
}

function isShortContinuation(text) {
  const clean = String(text || "").trim().toLowerCase();
  if (!clean) return false;
  if (clean.length <= 2) return true;
  if (clean.split(/\s+/).length <= 3) return true;
  return /^(valores?|pre(?:ç|c)o|or(?:ç|c)amento|prazo|como\s+funciona|e\s+mais|mais|ok|sim|isso|esse|essa|quero\s+saber\s+mais)$/i.test(clean);
}

function getLastAssistantQuestion(historico = []) {
  const reversed = [...historico].reverse();
  for (const item of reversed) {
    if (item?.role !== "model") continue;
    const text = String(item?.parts?.[0]?.text || "").trim();
    if (!text) continue;
    if (text.includes("?")) return text;
  }
  return "";
}

function enrichUserIntentForModel(combinedTexto, historico = []) {
  const raw = String(combinedTexto || "").trim();
  if (!raw) return raw;

  const cleanUserLine = raw
    .split("\n")
    .filter((line) => line.trim().toLowerCase().startsWith("usuário:"))
    .map((line) => line.replace(/^usuário:\s*/i, "").trim())
    .filter(Boolean)
    .join(" ");

  if (!isShortContinuation(cleanUserLine)) return raw;

  const lastQuestion = getLastAssistantQuestion(historico);
  if (!lastQuestion) return raw;

  return `${raw}

Contexto adicional:
- O cliente respondeu de forma curta à última pergunta do atendimento.
- Última pergunta feita ao cliente: "${lastQuestion}"
- Responda diretamente ao ponto pedido pelo cliente, sem repetir a pergunta anterior.`;
}

async function finalizeAssistantResponse({ candidateText, historico, tenant, payloadObject, contextText, maxRepairAttempts = 2 }) {
  let currentText = String(candidateText || "");
  let lastReport = null;

  for (let attempt = 0; attempt <= maxRepairAttempts; attempt++) {
    const report = sanitizeAiMessageWithReport(currentText, {
      contextText,
      fallback: getSafeFallback(contextText),
      maxChars: WHATSAPP_MAX_CHARS * WHATSAPP_MAX_MESSAGES,
      allowFallback: false,
    });
    lastReport = report;

    if (report.valid) {
      return {
        text: report.text,
        report,
        repaired: attempt > 0,
        usedFallback: false,
      };
    }

    if (attempt >= maxRepairAttempts) break;

    const repairInstruction = `Reescreva apenas a resposta final para WhatsApp.
Regras obrigatórias:
- Responda diretamente ao último pedido do cliente.
- Entregue uma resposta completa, sem frase cortada.
- Não repita saudação, não repita perguntas já feitas.
- Não inclua notas internas, rascunhos, labels, markdown técnico ou JSON.
- Texto curto, claro e natural em português brasileiro.

Resposta anterior para corrigir:
"${currentText}"`;

    const repairPayload = {
      ...payloadObject,
      textoUsuario: `${payloadObject.textoUsuario}\n\n${repairInstruction}`,
    };

    try {
      const repairedObj = await consultarGeminiDinamicamente(historico, repairPayload, tenant);
      currentText = String(repairedObj?.text || "");
    } catch (err) {
      console.warn(`⚠️ [AI SAFETY] Repair pass ${attempt + 1} falhou: ${err.message}`);
      break;
    }
  }

  const fallbackReport = sanitizeAiMessageWithReport(lastReport?.original || currentText, {
    contextText,
    fallback: getSafeFallback(contextText),
    maxChars: WHATSAPP_MAX_CHARS * WHATSAPP_MAX_MESSAGES,
    allowFallback: true,
  });

  return {
    text: fallbackReport.text,
    report: fallbackReport,
    repaired: true,
    usedFallback: true,
  };
}

async function sendAndSaveBotMessage({ patient, telefoneUsuario, text, tenant, contextText = "", fallback, stage = "webhook" }) {
  const report = sanitizeAiMessageWithReport(text, {
    contextText,
    fallback: fallback || getSafeFallback(contextText),
    maxChars: WHATSAPP_MAX_CHARS,
  });

  logSanitization(stage, report, { patientId: patient?.id, tenantId: tenant?.id });

  await enviarMensagemMeta(telefoneUsuario, report.text, tenant);
  const msgBot = await saveMessage(patient.id, report.text, "bot", tenant.id);
  emitirEvento("new_message", msgBot);
  return msgBot;
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
    // 1. Obtém o link temporário e tamanho do arquivo
    const { data: info } = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${tenant.wa_access_token}` },
      timeout: 25000
    });

    if (!info.url) {
      console.warn(`⚠️ [META API] Link de mídia não encontrado para ID: ${mediaId}`);
      return null;
    }

    // Calcula timeout dinâmico: mínimo 45s, ou proporcional ao tamanho (1s por 100KB) + folga
    const fileSizeKB = (info.file_size || 0) / 1024;
    const dynamicTimeout = Math.max(30000, Math.min(120000, (fileSizeKB * 10) + 30000));

    console.log(`📥 [META API] Iniciando download de ${fileSizeKB.toFixed(1)}KB. Timeout planejado: ${Math.round(dynamicTimeout / 1000)}s`);

    // 2. Faz o download do binário
    const { data: buffer } = await axios.get(info.url, {
      headers: { Authorization: `Bearer ${tenant.wa_access_token}` },
      responseType: 'arraybuffer',
      timeout: dynamicTimeout
    });

    const cleanMimeType = info.mime_type?.split(';')[0] || 'audio/ogg';
    console.log(`✅ [META API] Mídia ${mediaId} baixada com sucesso (${cleanMimeType})`);

    return {
      mimeType: cleanMimeType,
      data: Buffer.from(buffer).toString('base64')
    };
  } catch (error) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ [META API] Erro ao baixar mídia ${mediaId} [Status ${status}]:`, errorMsg);
    return null;
  }
}

// ── 9. WEBHOOKS DA META ───────────────────────────────────────
const debounceTimers = new Map();
const userPayloadBuffers = new Map();
const processingUsers = new Set();
const processingLocks = new Map(); // Locks por usuário para evitar race condition
const DEBOUNCE_MS = parseInt(process.env.DEBOUNCE_MS ?? "7500", 10);
const recentUserTurns = new Map();
const RECENT_TURN_TTL_MS = parseInt(process.env.RECENT_TURN_TTL_MS ?? "25000", 10);

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
  let activeMessageId = null;
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

    const paramMsg = change.messages[0];
    const messageId = paramMsg.id;
    activeMessageId = messageId;
    
    // ── VERIFICAÇÃO DE IDEMPOTÊNCIA ──────────────────────
    const claim = claimIncomingMessage(messageId, {
      phoneNumberId: change.metadata?.phone_number_id,
      from: paramMsg.from,
    });
    if (!claim.claimed) {
      console.log(`⏭️  [WEBHOOK] Mensagem ${messageId} já está com status ${claim.status}. Ignorando duplicata.`);
      return;
    }

    const phoneNumberId = change.metadata.phone_number_id;
    console.log(`🔍 [WEBHOOK] Buscando tenant para o Phone ID: ${phoneNumberId}`);
    const { data: tenant } = await supabase.from("tenants").select("*").eq("phone_number_id", phoneNumberId).single();

    if (!tenant) {
      console.error(`❌ [WEBHOOK] Nenhum tenant encontrado para o ID: ${phoneNumberId}. Verifique o Painel Admin.`);
      return;
    }

    const dbClaim = await claimIncomingMessageInDatabase(messageId, tenant, paramMsg);
    if (!dbClaim.claimed) {
      updateIncomingMessageStatus(messageId, dbClaim.status, { source: dbClaim.source });
      console.log(`⏭️  [WEBHOOK] Mensagem ${messageId} já registrada no banco com status ${dbClaim.status}. Ignorando duplicata.`);
      return;
    }

    console.log(`✅ [WEBHOOK] Tenant identificado: ${tenant.nome}`);
    const telefoneUsuario = normalizarTelefoneBR(paramMsg.from);
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

    if (!patient.is_ai_active) {
      updateIncomingMessageStatus(messageId, "answered", { patientId: patient.id, skipped: "ai_inactive" });
      return;
    }

    // Se era um áudio/imagem mas o download falhou, avisar a IA
    if ((paramMsg.type === "audio" || paramMsg.type === "image") && !inlineData) {
      textoParaGemini = "O usuário enviou um arquivo de mídia, mas ocorreu um erro técnico ao baixar. Peça educadamente para ele digitar por texto.";
    }

    // ── DEBOUNCE / QUEUE ────────────────────────────────
    if (!userPayloadBuffers.has(patient.id)) {
      userPayloadBuffers.set(patient.id, []);
    }
    userPayloadBuffers.get(patient.id).push({ textoParaGemini, inlineData, messageId });
    updateIncomingMessageStatus(messageId, "processing", { patientId: patient.id });

    // Se já estiver sendo processado pela IA, não reinicia o timer. 
    // O loop 'while' abaixo vai pegar o conteúdo novo do buffer quando terminar.
    if (processingUsers.has(patient.id)) {
      console.log(`⏳ [QUEUE] Usuário ${patient.id} já em processamento. Mensagem enfileirada.`);
      return;
    }

    // Dinamicamente aumenta o tempo de espera se for áudio (para dar tempo do cliente gravar outro)
    const delayDebounceAtivo = paramMsg.type === "audio" ? 16000 : DEBOUNCE_MS;

    clearTimeout(debounceTimers.get(patient.id));
    const timer = setTimeout(async () => {
      processingUsers.add(patient.id);
      processingLocks.set(patient.id, true);
      let currentMessageIds = [];

      try {
        // Loop para processar todas as mensagens que chegarem durante o processamento
        while (userPayloadBuffers.has(patient.id) && userPayloadBuffers.get(patient.id).length > 0) {
          const items = [...userPayloadBuffers.get(patient.id)];
          userPayloadBuffers.set(patient.id, []); // Esvazia o buffer para a rodada atual
          const itemMessageIds = items.map((item) => item.messageId).filter(Boolean);
          currentMessageIds = itemMessageIds;
          const markItemsStatus = (status, details = {}) => {
            for (const id of itemMessageIds) {
              updateIncomingMessageStatus(id, status, details);
            }
          };

          const combinedTexto = items
            .filter((item) => item.textoParaGemini)
            .map((item) => `Usuário: ${item.textoParaGemini}`)
            .join("\n");
          const combinedInlineDatas = [];
          for (const item of items) {
            if (item.inlineData) combinedInlineDatas.push(item.inlineData);
          }

          const inicioMs = Date.now();
          const historico = await getHistoricoGemini(patient.id, tenant.id);

          if (shouldSkipRecentTurn(patient.id, combinedTexto)) {
            console.log(`⏭️  [QUEUE] Turno duplicado recente detectado para usuário ${patient.id}. Ignorando.`);
            markItemsStatus("answered", { patientId: patient.id, skipped: "recent_turn_duplicate" });
            continue;
          }

          // Remove o texto que acabamos de salvar no banco da memória do histórico, 
          // pois ele já vai explicitamente via prompt do 'sendMessage' agrupado.
          if (historico.length > 0 && historico[historico.length - 1].role === "user") {
            historico.pop();
          }

          const combinedTextoEnriquecido = enrichUserIntentForModel(combinedTexto, historico);
          const payloadModel = {
            textoUsuario: combinedTextoEnriquecido.trim(),
            inlineDatas: combinedInlineDatas
          };

          let respostaObj;
          try {
            respostaObj = await consultarGeminiDinamicamente(historico, payloadModel, tenant, patient.ai_memory);
          } catch (e) {
            console.error(`❌ [GEMINI ERROR] Falha ao processar IA: ${e.message}`);
            try {
              await sendAndSaveBotMessage({
                patient,
                telefoneUsuario,
                text: SAFE_ERROR_FALLBACK,
                tenant,
                contextText: combinedTexto,
                fallback: SAFE_ERROR_FALLBACK,
                stage: "gemini_error",
              });
              markItemsStatus("answered", { patientId: patient.id, fallback: "gemini_error" });
            } catch (sendErr) {
              console.error(`❌ [WEBHOOK] Erro ao enviar mensagem de erro: ${sendErr.message}`);
              markItemsStatus("failed", { patientId: patient.id, reason: "gemini_error_fallback_failed" });
            }
            break; // Sai do loop em caso de erro crítico
          }

          // Se o modelo possivelmente alucinou, enviar fallback e registrar
          if (respostaObj && respostaObj.possibleHallucination) {
            console.warn(`⚠️ [HALLUCINATION] Possível alucinação detectada para patient ${patient.id}`);
            const fallback = "Desculpe, não tenho essa informação confirmada. Posso verificar com a equipe ou explicar de forma geral?";
            try {
              await sendAndSaveBotMessage({
                patient,
                telefoneUsuario,
                text: fallback,
                tenant,
                contextText: combinedTexto,
                fallback,
                stage: "hallucination_fallback",
              });
              markItemsStatus("answered", { patientId: patient.id, fallback: "hallucination" });
            } catch (sendErr) {
              console.error(`❌ [WEBHOOK] Erro ao enviar fallback de alucinação: ${sendErr.message}`);
              markItemsStatus("failed", { patientId: patient.id, reason: "hallucination_fallback_failed" });
            }
            // Não envia a resposta do modelo potencialmente incorreta
            continue;
          }

          const respostaSofia = respostaObj?.text || "";
          const finalResult = await finalizeAssistantResponse({
            candidateText: respostaSofia,
            historico,
            tenant,
            payloadObject: payloadModel,
            contextText: combinedTexto,
          });
          const safetyReport = finalResult.report;
          logSanitization("model_response_finalized", safetyReport, { patientId: patient.id, tenantId: tenant.id });

          // Divide a resposta para WhatsApp (prioriza mensagem única para evitar cortes por falha parcial de envio)
          const mensagensSofia = dividirMensagensWhatsApp(finalResult.text, WHATSAPP_MAX_CHARS, WHATSAPP_MAX_MESSAGES, {
            contextText: combinedTexto,
            fallback: getSafeFallback(combinedTexto),
          });

          if (mensagensSofia.length === 0) {
            console.warn(`⚠️  [WEBHOOK] Nenhuma mensagem foi gerada após dividir. Enviando fallback...`);
            try {
              await sendAndSaveBotMessage({
                patient,
                telefoneUsuario,
                text: getSafeFallback(combinedTexto),
                tenant,
                contextText: combinedTexto,
                stage: "empty_split_fallback",
              });
              markItemsStatus("answered", { patientId: patient.id, fallback: "empty_split" });
            } catch (sendErr) {
              console.error(`❌ [WEBHOOK] Erro ao enviar fallback: ${sendErr.message}`);
              markItemsStatus("failed", { patientId: patient.id, reason: "empty_split_fallback_failed" });
            }
            continue;
          }

          // Atraso de digitação simulado baseado no conteúdo completo
          const textoCompletoSofia = mensagensSofia.join("\n\n");
          const delay = calcularDelayRestante(textoCompletoSofia, inicioMs);
          if (delay > 0) await sleep(delay);

          // Envia e salva cada mensagem separadamente com melhor tratamento de erro
          let envioCompleto = true;
          for (const mensagem of mensagensSofia) {
            try {
              await sendAndSaveBotMessage({
                patient,
                telefoneUsuario,
                text: mensagem,
                tenant,
                contextText: combinedTexto,
                stage: "before_whatsapp_send",
              });
              console.log(`✅ [WEBHOOK] Mensagem salva e enviada com sucesso para ${telefoneUsuario}`);
            } catch (sendErr) {
              envioCompleto = false;
              console.error(`❌ [WEBHOOK] Erro ao enviar mensagem para ${telefoneUsuario}: ${sendErr.message}`);
              break;
            }
            await sleep(delayAleatorio());
          }

          markItemsStatus(envioCompleto ? "answered" : "failed", {
            patientId: patient.id,
            reason: envioCompleto ? "sent" : "send_failed",
          });

          // Atualiza memória em background
          atualizarMemoriaLongoPrazo({ ...patient, ai_memory: patient.ai_memory }, historico, textoCompletoSofia).catch((err) => {
            console.warn(`⚠️  [WEBHOOK] Erro ao atualizar memória: ${err.message}`);
          });

          if (patient.status_kanban === "Novo") {
            try {
              const { data: atualizado } = await supabase.from("users_whatsapp").update({ status_kanban: "Em Atendimento" }).eq("id", patient.id).select().single();
              if (atualizado) emitirEvento("patient_updated", atualizado);
            } catch (updateErr) {
              console.warn(`⚠️  [WEBHOOK] Erro ao atualizar status do paciente: ${updateErr.message}`);
            }
          }

          // Pequeno respiro entre mensagens em fila para não parecer robótico demais
          if (userPayloadBuffers.get(patient.id).length > 0) await sleep(1500);
        }
      } catch (err) {
        console.error("❌ Erro no loop de processamento:", err.message, err.stack);
        for (const id of currentMessageIds) {
          updateIncomingMessageStatus(id, "failed", { patientId: patient.id, reason: "processing_loop_exception" });
        }
      } finally {
        processingUsers.delete(patient.id);
        processingLocks.delete(patient.id);
        userPayloadBuffers.delete(patient.id);
        debounceTimers.delete(patient.id);
        console.log(`✅ [WEBHOOK] Limpeza concluída para usuário ${patient.id}`);
      }
    }, delayDebounceAtivo);
    debounceTimers.set(patient.id, timer);

  } catch (err) {
    console.error("❌ Erro ao processar webhook:", err.message);
    if (activeMessageId) {
      updateIncomingMessageStatus(activeMessageId, "failed", { reason: "webhook_exception" });
    }
  }
});

// ── 10. INICIAÇÃO ────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 SofiaAI SaaS v3.0.0 (API Oficial Meta) em http://localhost:${PORT}`);
  });
}

module.exports = {
  app,
  enviarMensagemMeta,
  consultarGeminiDinamicamente,
  buildGeminiHistoryFromRows,
  getHistoricoGemini,
  getMessageProcessingState,
  sanitizeAiMessage,
  sanitizeAiMessageWithReport,
  validateAiMessage,
  testState: global.__testState__ || null,
  clearTestState: () => {
    global.__testState__ = { sentMessages: [], geminiCalls: [] };
    processedMessages.clear();
    dbIdempotencyAvailable = null;
    for (const timer of debounceTimers.values()) clearTimeout(timer);
    debounceTimers.clear();
    userPayloadBuffers.clear();
    processingUsers.clear();
    processingLocks.clear();
    recentUserTurns.clear();
    return global.__testState__;
  },
};
