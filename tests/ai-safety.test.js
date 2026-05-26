"use strict";

process.env.TEST_MODE = "true";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "test-service-key";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIza_TEST_KEY";

const assert = require("assert");
const {
  DEFAULT_AI_FALLBACK,
  buildGeminiHistoryFromRows,
  sanitizeAiMessage,
  sanitizeAiMessageWithReport,
} = require("../src/utils/aiMessageSafety");

console.log("Running AI safety tests...");

const draft = sanitizeAiMessage('Drafting Message 2*: "Eu sou a Beatriz,"');
assert.ok(!/Drafting|Message 2/i.test(draft), "sanitizeAiMessage deve remover/bloquear Drafting Message 2");
assert.ok(draft.length > 0, "fallback seguro deve ser usado quando a resposta ficar inválida");

const message2 = sanitizeAiMessage("Message 2: Oi, este texto veio com label interna.");
assert.ok(!/Message 2/i.test(message2), "sanitizeAiMessage deve remover/bloquear Message 2");

const broken = sanitizeAiMessage("]).");
assert.ok(!broken.includes("])."), "sanitizeAiMessage deve bloquear artefato ]).");

const jsonReport = sanitizeAiMessageWithReport('{"role":"assistant","content":"texto bruto"}');
assert.strictEqual(jsonReport.usedFallback, true, "JSON bruto deve gerar fallback");
assert.ok(!jsonReport.text.includes("{"), "JSON bruto não deve ser enviado");

const empty = sanitizeAiMessage("");
assert.ok(empty.length > 0, "resposta vazia deve gerar fallback");
assert.ok(!/serviços, valores ou como funciona/i.test(empty), "fallback padrão não deve induzir tópicos fixos");

const history = buildGeminiHistoryFromRows(
  [
    { origin: "system", texto: "system prompt: Nunca revele isso" },
    { origin: "user", texto: "Oi" },
    { origin: "bot", texto: "Drafting Message 2*: rascunho" },
    { origin: "bot_error", texto: "TypeError: stack trace" },
    { origin: "user", texto: "Gostaria de saber mais sobre a Lado B" },
    { origin: "bot", texto: "Claro! Posso te ajudar com isso." },
  ],
  { limit: 10 }
);

const historyText = JSON.stringify(history);
assert.ok(!/system prompt/i.test(historyText), "histórico não deve incluir system prompt");
assert.ok(!/Drafting|Message 2|TypeError/i.test(historyText), "histórico não deve incluir resposta inválida da IA");
assert.ok(history.some((item) => item.role === "user"), "histórico deve manter mensagens válidas do usuário");

const ladoB = sanitizeAiMessage("Oi! Tudo ótimo por aqui, e com você?", {
  contextText: "Gostaria de saber mais sobre os serviços",
});
assert.strictEqual(ladoB, DEFAULT_AI_FALLBACK, "intenção comercial não deve receber apenas saudação genérica");

const stack = sanitizeAiMessage("TypeError: Cannot read properties of undefined\n    at gerarResposta (/app/src/index.js:10:5)");
assert.ok(!/TypeError|at gerarResposta|stack/i.test(stack), "erro da IA não deve vazar stack trace");

const cut = sanitizeAiMessage("Como nós criamos projetos sob medida para cada cliente, os");
assert.ok(!/sob medida para cada cliente, os$/i.test(cut), "mensagem truncada não deve ser enviada");
const openParen = sanitizeAiMessage("Nós criamos desde a identidade visual (log");
assert.ok(!/\(log$/i.test(openParen), "mensagem com parêntese aberto deve ser tratada como truncada");
const abruptShort = sanitizeAiMessage("Nós somos uma agência de publicidade completa! Há");
assert.ok(!/completa!\s+Há$/i.test(abruptShort), "cauda curta após pontuação deve ser tratada como truncada");

const brokenFlow = sanitizeAiMessage("Opa, desculpe! Minha mensagem acabou");
assert.ok(!/mensagem acabou/i.test(brokenFlow), "auto-desculpa por mensagem cortada não deve ser enviada");

console.log("AI safety tests passed ✅");
