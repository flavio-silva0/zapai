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

async function invokeApp(method, url, body) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(base + url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    return { statusCode: response.status, body: text };
  } finally {
    server.closeAllConnections?.();
    server.close();
  }
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
