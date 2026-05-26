"use strict";

process.env.TEST_MODE = "true";
process.env.PORT = "0";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "test-service-key";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIza_TEST_KEY";
process.env.DEBOUNCE_MS = "10";
process.env.DELAY_MINIMO_MS = "0";
process.env.MS_POR_PALAVRA = "0";
process.env.DELAY_MAXIMO_MS = "0";
process.env.DELAY_ENTRE_MENSAGENS_MIN_MS = "0";
process.env.DELAY_ENTRE_MENSAGENS_MAX_MS = "0";
process.env.WHATSAPP_MAX_CHARS = "500";

const assert = require("assert");
const { Readable, Writable } = require("stream");
const { app, clearTestState } = require("../../src/index");
const supabaseMock = require("../../src/mocks/supabaseMock");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function payload(id, body) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "TEST_PHONE_ID" },
              contacts: [{ profile: { name: "Test User" } }],
              messages: [
                {
                  id,
                  from: "5511999999999",
                  type: "text",
                  text: { body },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function invokeApp(method, url, body) {
  return new Promise((resolve, reject) => {
    const rawBody = JSON.stringify(body);
    const req = new Readable({
      read() {
        this.push(rawBody);
        this.push(null);
      },
    });

    req.method = method;
    req.url = url;
    req.headers = {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(rawBody),
    };

    const res = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    res.headers = {};
    res.statusCode = 200;
    res.setHeader = (key, value) => {
      res.headers[key.toLowerCase()] = value;
    };
    res.getHeader = (key) => res.headers[key.toLowerCase()];
    res.end = (chunk) => {
      Writable.prototype.end.call(res, chunk);
      resolve({ statusCode: res.statusCode, body: String(chunk || "") });
    };
    res.on("error", reject);

    app.handle(req, res, reject);
  });
}

async function postWebhook(id, text) {
  await invokeApp("POST", "/webhook/whatsapp", payload(id, text));
}

async function run() {
  try {
    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-json", "__JSON__");
    await wait(80);
    assert.strictEqual(global.__testState__.sentMessages.length, 1, "JSON bruto deve gerar uma resposta segura");
    assert.ok(!/[{}]|\"role\"|\"content\"/.test(global.__testState__.sentMessages[0].text), "JSON bruto não deve ser enviado ao WhatsApp");

    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-dup", "Olá, por favor responda");
    await postWebhook("msg-dup", "Olá, por favor responda");
    await wait(80);
    assert.strictEqual(global.__testState__.geminiCalls.length, 1, "mensagem duplicada não deve chamar a IA duas vezes");
    assert.strictEqual(global.__testState__.sentMessages.length, 1, "mensagem duplicada não deve gerar duas respostas");

    clearTestState();
    await postWebhook("msg-dup", "Olá, por favor responda");
    await wait(80);
    assert.strictEqual(global.__testState__.geminiCalls.length, 0, "mensagem duplicada após reset de memória deve ser bloqueada pelo registro persistente");
    assert.strictEqual(global.__testState__.sentMessages.length, 0, "mensagem duplicada após reset de memória não deve enviar resposta");

    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-draft", "__DRAFT__");
    await wait(80);
    const sentDraft = global.__testState__.sentMessages[0]?.text || "";
    assert.ok(sentDraft, "fallback seguro deve ser enviado quando a IA retorna rascunho");
    assert.ok(!/Drafting|Message 1|Message 2|\]\)\./i.test(sentDraft), "rascunho interno não deve ser enviado");
    assert.ok(!supabaseMock.messages.some((msg) => /Drafting|Message 2/i.test(msg.texto)), "resposta inválida da IA não deve ser salva");

    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-commercial", "__GENERIC_GREETING__ Gostaria de saber mais sobre os serviços");
    await wait(80);
    const commercialReply = global.__testState__.sentMessages[0]?.text || "";
    assert.ok(commercialReply.length > 20, "fallback comercial deve retornar uma resposta útil");
    assert.ok(!/^Oi! Tudo ótimo/i.test(commercialReply), "saudação genérica não deve dominar a resposta");
    assert.ok(/estratégia|criação|execução|resultado/i.test(commercialReply), "repair pass deve gerar resposta contextual");

    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-cut", "__CUT__");
    await wait(80);
    const cutReply = global.__testState__.sentMessages[0]?.text || "";
    assert.ok(cutReply.length > 30, "resposta cortada deve ser reparada");
    assert.ok(!/\($|log$/i.test(cutReply), "resposta final não deve terminar truncada");

    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-cut-qualifier", "__CUT_QUALIFIER__");
    await wait(80);
    const qualifierReply = global.__testState__.sentMessages[0]?.text || "";
    assert.ok(qualifierReply.length > 35, "resposta com qualificador pendente deve ser reparada");
    assert.ok(!/com quase$/i.test(qualifierReply), "resposta final não deve terminar em qualificador pendente");

    clearTestState();
    supabaseMock.reset();

    await postWebhook("msg-error", "__ERROR__");
    await wait(80);
    const errorReply = global.__testState__.sentMessages[0]?.text || "";
    assert.ok(errorReply, "erro da IA deve gerar fallback amigável");
    assert.ok(!/TypeError|stack|at gerarResposta|undefined/i.test(errorReply), "stack trace não deve vazar ao usuário");

    console.log("Webhook integration safety tests passed ✅");
  } finally {
    clearTestState();
  }
}

run().catch((err) => {
  console.error("Webhook integration test failed:", err);
  process.exit(1);
});
