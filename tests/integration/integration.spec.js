"use strict";

const { Readable, Writable } = require("stream");

process.env.TEST_MODE = "true";
process.env.PORT = "0";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost/mock";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "test-key";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaTEST";
process.env.DEBOUNCE_MS = "10";
process.env.DELAY_MINIMO_MS = "0";
process.env.MS_POR_PALAVRA = "0";
process.env.DELAY_MAXIMO_MS = "0";
process.env.DELAY_ENTRE_MENSAGENS_MIN_MS = "0";
process.env.DELAY_ENTRE_MENSAGENS_MAX_MS = "0";

const { app, clearTestState } = require("../../src/index");
const supabaseMock = require("../../src/mocks/supabaseMock");

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

async function runTest() {
  clearTestState();
  supabaseMock.reset();

  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "TEST_PHONE_ID" },
              contacts: [{ profile: { name: "Test User" } }],
              messages: [{ id: "msg-1", from: "5511999999999", type: "text", text: { body: "Olá, por favor responda" } }],
            },
          },
        ],
      },
    ],
  };

  await invokeApp("POST", "/webhook/whatsapp", payload);
  await new Promise((r) => setTimeout(r, 80));

  const sent = global.__testState__.sentMessages;
  console.log("[TEST] sent:", sent);

  if (!sent.length) {
    console.error("[TEST][FAIL] No messages sent");
    process.exit(2);
  }

  if (!Array.isArray(supabaseMock.messages) || supabaseMock.messages.length === 0) {
    console.error("[TEST][FAIL] No messages saved to supabaseMock");
    process.exit(3);
  }

  console.log("[TEST][OK] Integration test passed");
}

runTest().catch((err) => {
  console.error("[TEST][ERROR]", err);
  process.exit(1);
});
