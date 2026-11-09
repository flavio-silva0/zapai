"use strict";

process.env.TEST_MODE = "true";
process.env.USE_REAL_GEMINI = "false";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "isolated-test-secret-not-for-production";

const assert = require("node:assert/strict");
const { criarToken, credentialVersion } = require("../src/middleware/authMiddleware");
const getDatabase = require("../src/utils/database");
const { app } = require("../src/index");

async function invoke(method, url, { token, body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", async () => {
      try {
        const { port } = server.address();
        const reqHeaders = { ...headers };
        if (token) reqHeaders.Authorization = `Bearer ${token}`;
        if (body !== undefined) reqHeaders["Content-Type"] = "application/json";

        const response = await fetch(`http://127.0.0.1:${port}${url}`, {
          method,
          headers: reqHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const text = await response.text();
        let parsed = text;
        try {
          parsed = JSON.parse(text);
        } catch (_) {}
        resolve({ status: response.status, body: parsed });
      } catch (err) {
        reject(err);
      } finally {
        server.closeAllConnections?.();
        server.close();
      }
    });
    server.on("error", reject);
  });
}

(async () => {
  const db = getDatabase();
  if (typeof db.reset === "function") db.reset();
  else if (typeof db._reset === "function") db._reset();

  const tenantId = "tenant-billing-test-01";
  const userId = "user-billing-test-01";
  const passwordHash = "$2a$12$abcdefghijklmnopqrstuv";

  await db.from("tenants").insert({
    id: tenantId,
    nome: "Clínica Sorriso Perfeito",
    nicho: "dental",
    plan: "starter",
    max_leads: 2, // Limit set to 2 for fast test verification
    status: "trial",
    bot_name: "ZapAI",
    bot_emoji: "🦷",
    trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  await db.from("users").insert({
    id: userId,
    tenant_id: tenantId,
    email: "owner@sorriso.com.br",
    password_hash: passwordHash,
    nome: "Dr. Flávio",
    role: "owner",
    is_active: true,
  });

  const ownerToken = criarToken({
    userId,
    tenantId,
    role: "owner",
    email: "owner@sorriso.com.br",
    credentialVersion: credentialVersion(passwordHash),
  });

  // 1. Verify GET /api/billing/plans returns 4 plans with ultra-competitive pricing
  const plansRes = await invoke("GET", "/api/billing/plans");
  assert.equal(plansRes.status, 200);
  assert.equal(Array.isArray(plansRes.body.plans), true);
  assert.equal(plansRes.body.plans.length, 4);
  assert.deepEqual(
    plansRes.body.plans.map((p) => [p.id, p.maxLeads, p.priceMonthly]),
    [
      ["starter", 150, 69.9],
      ["growth", 300, 119.9],
      ["pro", 500, 169.9],
      ["enterprise", null, 249.9],
    ]
  );

  // 2. Verify Lead Limit Enforcement on POST /api/patients
  const lead1 = await invoke("POST", "/api/patients", {
    token: ownerToken,
    body: { nome: "Lead 1", telefone: "5511988880001" },
  });
  assert.equal(lead1.status, 201);

  const lead2 = await invoke("POST", "/api/patients", {
    token: ownerToken,
    body: { nome: "Lead 2", telefone: "5511988880002" },
  });
  assert.equal(lead2.status, 201);

  // 3rd lead must be blocked with HTTP 402 LEAD_LIMIT_REACHED
  const lead3Blocked = await invoke("POST", "/api/patients", {
    token: ownerToken,
    body: { nome: "Lead 3", telefone: "5511988880003" },
  });
  assert.equal(lead3Blocked.status, 402);
  assert.equal(lead3Blocked.body.code, "LEAD_LIMIT_REACHED");

  // 3. Verify GET /api/billing/subscription shows limitReached = true
  const subBefore = await invoke("GET", "/api/billing/subscription", { token: ownerToken });
  assert.equal(subBefore.status, 200);
  assert.equal(subBefore.body.usage.currentLeads, 2);
  assert.equal(subBefore.body.usage.maxLeads, 2);
  assert.equal(subBefore.body.usage.limitReached, true);

  // 4. Upgrade to Growth plan (300 leads) via Checkout + Sandbox Confirmation
  const checkoutRes = await invoke("POST", "/api/billing/checkout", {
    token: ownerToken,
    body: {
      planId: "growth",
      billingCycle: "monthly",
      paymentMethod: "PIX",
    },
  });
  assert.equal(checkoutRes.status, 201);
  assert.equal(checkoutRes.body.plan.id, "growth");
  assert.ok(checkoutRes.body.invoiceId);

  const confirmRes = await invoke("POST", "/api/billing/confirm-sandbox", {
    token: ownerToken,
    body: { invoiceId: checkoutRes.body.invoiceId },
  });
  assert.equal(confirmRes.status, 200);
  assert.equal(confirmRes.body.plan.id, "growth");
  assert.equal(confirmRes.body.usage.maxLeads, 300);
  assert.equal(confirmRes.body.usage.limitReached, false);

  // 5. Creating the 3rd lead now succeeds after plan upgrade!
  const lead3AfterUpgrade = await invoke("POST", "/api/patients", {
    token: ownerToken,
    body: { nome: "Lead 3", telefone: "5511988880003" },
  });
  assert.equal(lead3AfterUpgrade.status, 201);

  // 6. Verify Self-Service WhatsApp Cloud API Configuration
  const saveWaRes = await invoke("PUT", "/api/tenant/whatsapp", {
    token: ownerToken,
    body: {
      clinic_phone: "5511999997777",
      phone_number_id: "1092837465",
      wa_access_token: "EAAG_TEST_PERMANENT_META_TOKEN_123456",
    },
  });
  assert.equal(saveWaRes.status, 200);
  assert.equal(saveWaRes.body.success, true);

  const getWaRes = await invoke("GET", "/api/tenant/whatsapp", { token: ownerToken });
  assert.equal(getWaRes.status, 200);
  assert.equal(getWaRes.body.phone_number_id, "1092837465");
  assert.equal(getWaRes.body.clinic_phone, "5511999997777");
  assert.equal(getWaRes.body.has_token, true);

  // 7. Verify Stripe Webhook Simulation (checkout.session.completed -> Pro Plan upgrade to 500 leads)
  const stripeWebhookRes = await invoke("POST", "/api/billing/webhooks/stripe", {
    body: {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_mock_stripe_session_999",
          customer: "cus_mock_stripe_tenant",
          subscription: "sub_mock_stripe_subscription_999",
          client_reference_id: tenantId,
          metadata: {
            tenant_id: tenantId,
            plan_id: "pro",
            billing_cycle: "annual",
          },
        },
      },
    },
  });
  assert.equal(stripeWebhookRes.status, 200);
  assert.equal(stripeWebhookRes.body.received, true);

  const subAfterStripe = await invoke("GET", "/api/billing/subscription", { token: ownerToken });
  assert.equal(subAfterStripe.status, 200);
  assert.equal(subAfterStripe.body.plan.id, "pro");
  assert.equal(subAfterStripe.body.plan.maxLeads, 500);
  assert.equal(subAfterStripe.body.usage.maxLeads, 500);
  assert.equal(subAfterStripe.body.tenant.billing_customer_id, "cus_mock_stripe_tenant");
  assert.equal(subAfterStripe.body.tenant.billing_provider, "stripe");

  // 8. Verify Stripe Webhook (customer.subscription.deleted -> canceled status & tenant paused)
  const stripeCancelWebhookRes = await invoke("POST", "/api/billing/webhooks/stripe", {
    body: {
      type: "customer.subscription.deleted",
      data: {
        object: {
          client_reference_id: tenantId,
          metadata: {
            tenant_id: tenantId,
          },
        },
      },
    },
  });
  assert.equal(stripeCancelWebhookRes.status, 200);
  assert.equal(stripeCancelWebhookRes.body.received, true);

  // Directly check DB state: tenant is canceled and paused
  const { data: tenantInDb } = await db.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  assert.equal(tenantInDb.subscription_status, "canceled");
  assert.equal(tenantInDb.status, "pausado");

  // Inactive tenant correctly blocks authenticated requests with HTTP 401
  const subAfterCancel = await invoke("GET", "/api/billing/subscription", { token: ownerToken });
  assert.equal(subAfterCancel.status, 401);

  console.log("✅ Billing, Lead Limits, Stripe Webhooks & Self-Service WhatsApp tests passed!");
  process.exit(0);
})();
