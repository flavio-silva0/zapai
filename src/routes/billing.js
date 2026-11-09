"use strict";

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const database = require("../utils/database");
const { requireAuth, forbidViewer } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/requestProtection");
const {
  PLANS,
  PLAN_ORDER,
  getPlanConfig,
  buildTenantUsageSummary,
} = require("../utils/plans");

const router = express.Router();
const supabase = database();

function getActiveBillingProvider() {
  const preferred = String(process.env.BILLING_PROVIDER || "stripe").toLowerCase();
  if (preferred === "stripe") {
    if (process.env.STRIPE_SECRET_KEY) return "stripe";
    if (process.env.TEST_MODE === "true" || process.env.TEST_MODE === "1") return "sandbox";
  }
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  if (process.env.ASAAS_API_KEY) return "asaas";
  return "sandbox";
}

function getAsaasBaseUrl() {
  const env = String(process.env.ASAAS_ENVIRONMENT || "production").toLowerCase();
  return env === "sandbox"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";
}

function computeNextPeriodEnd(billingCycle = "monthly") {
  const next = new Date();
  if (billingCycle === "annual") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
}

async function getTenantLeadCount(tenantId) {
  if (!tenantId) return 0;
  const { data, count, error } = await supabase
    .from("users_whatsapp")
    .select("id", { count: "exact" })
    .eq("tenant_id", tenantId);
  if (error) return 0;
  if (typeof count === "number") return count;
  return Array.isArray(data) ? data.length : 0;
}

async function activateTenantSubscription({
  tenantId,
  planId,
  billingCycle = "monthly",
  provider = "sandbox",
  customerId = null,
  subscriptionId = null,
}) {
  const planConfig = getPlanConfig(planId);
  const periodEnd = computeNextPeriodEnd(billingCycle);

  const fullUpdate = {
    status: "ativo",
    plan: planConfig.dbSlug,
    max_leads: planConfig.maxLeads,
    billing_provider: provider,
    billing_cycle: billingCycle,
    subscription_status: "active",
    current_period_end: periodEnd,
  };
  if (customerId) fullUpdate.billing_customer_id = customerId;
  if (subscriptionId) fullUpdate.billing_subscription_id = subscriptionId;

  let { data, error } = await supabase
    .from("tenants")
    .update(fullUpdate)
    .eq("id", tenantId)
    .select()
    .single();

  // Fallback seguro caso a migration de colunas extras ainda não tenha sido aplicada no banco remoto
  if (error && (error.code === "42703" || String(error.message || "").includes("column"))) {
    const safePlan = ["basic", "pro", "enterprise"].includes(planConfig.dbSlug)
      ? planConfig.dbSlug
      : planConfig.id === "starter"
        ? "basic"
        : "pro";
    const minimalResult = await supabase
      .from("tenants")
      .update({
        status: "ativo",
        plan: safePlan,
      })
      .eq("id", tenantId)
      .select()
      .single();
    data = minimalResult.data;
    error = minimalResult.error;
  }

  if (error) throw error;
  return data;
}

// ── GET /api/billing/plans (Público) ──────────────────────────
router.get("/plans", (_req, res) => {
  const plansList = PLAN_ORDER.map((key) => PLANS[key]);
  res.json({
    provider: getActiveBillingProvider(),
    currency: "BRL",
    plans: plansList,
  });
});

// ── GET /api/billing/subscription (Autenticado) ───────────────
router.get("/subscription", requireAuth, async (req, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) {
    return res.json({
      provider: getActiveBillingProvider(),
      usage: buildTenantUsageSummary({ plan: "enterprise", status: "ativo" }, 0),
      invoices: [],
    });
  }

  const [{ data: tenant, error: tenantErr }, currentLeads] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
    getTenantLeadCount(tenantId),
  ]);

  if (tenantErr || !tenant) {
    return res.status(404).json({ error: "Organização não encontrada." });
  }

  let invoices = [];
  try {
    const { data: invData, error: invErr } = await supabase
      .from("billing_invoices")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(12);
    if (!invErr && Array.isArray(invData)) {
      invoices = invData;
    }
  } catch (_) {
    invoices = [];
  }

  const usage = buildTenantUsageSummary(tenant, currentLeads);
  const allPlans = PLAN_ORDER.map((key) => PLANS[key]);
  const activePlan = getPlanConfig(tenant?.plan);

  res.json({
    provider: getActiveBillingProvider(),
    tenant,
    plan: activePlan,
    usage,
    plans: allPlans,
    availablePlans: allPlans,
    invoices,
  });
});

// ── POST /api/billing/checkout (Cria assinatura / cobrança) ───
router.post(
  "/checkout",
  requireAuth,
  forbidViewer,
  rateLimit({ limit: 20, windowMs: 15 * 60000 }),
  async (req, res) => {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Apenas contas de clientes podem contratar planos." });
    }

    const {
      planId,
      billingCycle = "monthly",
      paymentMethod = "PIX",
      cpfCnpj,
    } = req.body || {};

    const normalizedCycle = billingCycle === "annual" ? "annual" : "monthly";
    const normalizedMethod = ["PIX", "BOLETO", "CREDIT_CARD"].includes(String(paymentMethod).toUpperCase())
      ? String(paymentMethod).toUpperCase()
      : "PIX";

    const targetPlan = getPlanConfig(planId);
    if (!targetPlan) {
      return res.status(400).json({ error: "Plano selecionado inválido." });
    }

    if (targetPlan.id === "enterprise") {
      return res.status(200).json({
        customQuoteRequired: true,
        plan: targetPlan,
        contactUrl: "https://wa.me/5511999999999?text=" + encodeURIComponent("Olá! Quero contratar o plano Enterprise da ZapAI (acima de 500 leads)."),
        message: "O plano Enterprise (acima de 500 leads) é dimensionado sob medida. Nosso consultor ativará sua conta imediatamente.",
      });
    }

    const [{ data: tenant }, currentLeads] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle(),
      getTenantLeadCount(tenantId),
    ]);

    if (!tenant) {
      return res.status(404).json({ error: "Organização não encontrada." });
    }

    // Impede downgrade para um plano cujo limite de leads é menor que a base atual
    if (targetPlan.maxLeads !== null && currentLeads > targetPlan.maxLeads) {
      return res.status(422).json({
        error: `Sua conta já possui ${currentLeads} leads cadastrados, acima do limite de ${targetPlan.maxLeads} leads do plano ${targetPlan.name}. Escolha um plano compatível com seu volume.`,
        code: "PLAN_CAPACITY_EXCEEDED",
        currentLeads,
        maxLeads: targetPlan.maxLeads,
      });
    }

    const amountBrl = normalizedCycle === "annual"
      ? targetPlan.priceAnnualTotal
      : targetPlan.priceMonthly;

    const provider = getActiveBillingProvider();

    // Busca dados de CPF/endereço salvos no cadastro (account_profiles)
    let profileData = {};
    try {
      const { data: profRow } = await supabase
        .from("account_profiles")
        .select("profile")
        .eq("user_id", req.user.userId)
        .maybeSingle();
      if (profRow?.profile) profileData = profRow.profile;
    } catch (_) {
      profileData = {};
    }

    const customerCpf = String(cpfCnpj || profileData.cpf || "").replace(/\D/g, "");

    // ── PROVEDOR 1: STRIPE (Oficial — Cartão de Crédito, PIX, Boleto, Apple Pay, Google Pay) ──
    if (provider === "stripe") {
      try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const params = new URLSearchParams();
        params.append("mode", "subscription");
        params.append("success_url", `${frontendUrl}/painel/configuracoes?section=billing&checkout=success&session_id={CHECKOUT_SESSION_ID}&plan=${targetPlan.id}`);
        params.append("cancel_url", `${frontendUrl}/painel/configuracoes?section=billing&checkout=canceled`);

        if (tenant.billing_customer_id && tenant.billing_customer_id.startsWith("cus_")) {
          params.append("customer", tenant.billing_customer_id);
        } else {
          params.append("customer_email", req.user.email);
        }

        params.append("client_reference_id", String(tenant.id));
        params.append("metadata[tenant_id]", String(tenant.id));
        params.append("metadata[plan_id]", targetPlan.id);
        params.append("metadata[billing_cycle]", normalizedCycle);
        params.append("line_items[0][quantity]", "1");
        params.append("line_items[0][price_data][currency]", "brl");
        params.append("line_items[0][price_data][unit_amount]", String(Math.round(amountBrl * 100)));
        params.append("line_items[0][price_data][recurring][interval]", normalizedCycle === "annual" ? "year" : "month");
        params.append("line_items[0][price_data][product_data][name]", `ZapAI — Plano ${targetPlan.displayName}`);
        params.append("line_items[0][price_data][product_data][description]", `Limite de ${targetPlan.leadRangeLabel} · WhatsApp Cloud API + Atendente IA`);
        params.append("allow_promotion_codes", "true");
        params.append("billing_address_collection", "auto");

        const stripeResp = await axios.post(
          "https://api.stripe.com/v1/checkout/sessions",
          params.toString(),
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout: 15000,
          }
        );

        const session = stripeResp.data;
        let savedInvoice = null;
        try {
          const { data: inv } = await supabase
            .from("billing_invoices")
            .insert({
              tenant_id: tenant.id,
              provider: "stripe",
              external_id: session.id,
              plan: targetPlan.id,
              billing_cycle: normalizedCycle,
              payment_method: "CREDIT_CARD",
              amount_brl: amountBrl,
              status: "pending",
              invoice_url: session.url,
            })
            .select()
            .single();
          savedInvoice = inv;
        } catch (_) {}

        return res.status(201).json({
          provider: "stripe",
          sandbox: false,
          sandboxMode: false,
          plan: targetPlan,
          billingCycle: normalizedCycle,
          paymentMethod: "CREDIT_CARD",
          amountBrl,
          amountFormatted: `R$ ${amountBrl.toFixed(2).replace(".", ",")}`,
          sessionId: session.id,
          invoiceId: savedInvoice?.id || session.id,
          checkoutUrl: session.url,
          status: "pending",
          message: "Sessão Stripe Checkout gerada com sucesso! Redirecionando para pagamento seguro...",
        });
      } catch (err) {
        const stripeMsg = err.response?.data?.error?.message || err.message;
        return res.status(502).json({
          error: `Não foi possível iniciar o Stripe Checkout: ${stripeMsg}`,
        });
      }
    }

    // ── PROVEDOR 2: ASAAS (Alternativa Brasil — PIX, Boleto e Cartão) ──
    if (provider === "asaas") {
      try {
        const asaasUrl = getAsaasBaseUrl();
        const headers = {
          access_token: process.env.ASAAS_API_KEY,
          "Content-Type": "application/json",
        };

        let customerId = tenant.billing_customer_id;
        if (!customerId) {
          const customerPayload = {
            name: tenant.nome || profileData.nome || req.user.email,
            email: req.user.email,
            cpfCnpj: customerCpf || undefined,
            mobilePhone: String(tenant.clinic_phone || profileData.telefone || "").replace(/\D/g, "") || undefined,
            postalCode: String(profileData.cep || "").replace(/\D/g, "") || undefined,
            addressNumber: profileData.numero || undefined,
            externalReference: String(tenant.id),
          };
          const custResp = await axios.post(`${asaasUrl}/customers`, customerPayload, { headers, timeout: 15000 });
          customerId = custResp.data.id;
        }

        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const subPayload = {
          customer: customerId,
          billingType: normalizedMethod,
          value: amountBrl,
          nextDueDate: dueDate,
          cycle: normalizedCycle === "annual" ? "YEARLY" : "MONTHLY",
          description: `Assinatura ZapAI — Plano ${targetPlan.displayName} (${targetPlan.leadRangeLabel})`,
          externalReference: JSON.stringify({
            tenantId: String(tenant.id),
            planId: targetPlan.id,
            billingCycle: normalizedCycle,
          }),
        };

        const subResp = await axios.post(`${asaasUrl}/subscriptions`, subPayload, { headers, timeout: 15000 });
        const subscription = subResp.data;

        // Busca a primeira cobrança gerada pela assinatura para obter link e QR Code PIX
        const paymentsResp = await axios.get(`${asaasUrl}/subscriptions/${subscription.id}/payments`, {
          headers,
          timeout: 15000,
        });
        const firstPayment = paymentsResp.data?.data?.[0] || {};
        let pixQrCode = null;
        let pixCopyPaste = null;

        if (normalizedMethod === "PIX" && firstPayment.id) {
          try {
            const pixResp = await axios.get(`${asaasUrl}/payments/${firstPayment.id}/pixQrCode`, {
              headers,
              timeout: 10000,
            });
            pixQrCode = pixResp.data?.encodedImage || null;
            pixCopyPaste = pixResp.data?.payload || null;
          } catch (_) {
            // Ignora se QR code ainda estiver sendo gerado
          }
        }

        const invoiceRecord = {
          tenant_id: tenant.id,
          provider: "asaas",
          external_id: firstPayment.id || subscription.id,
          plan: targetPlan.id,
          billing_cycle: normalizedCycle,
          payment_method: normalizedMethod,
          amount_brl: amountBrl,
          status: "pending",
          invoice_url: firstPayment.invoiceUrl || firstPayment.bankSlipUrl || null,
          pix_qr_code: pixQrCode,
          pix_copy_paste: pixCopyPaste,
          due_date: dueDate,
          metadata: { subscriptionId: subscription.id, customerId },
        };

        let savedInvoice = null;
        try {
          const { data: inv } = await supabase.from("billing_invoices").insert(invoiceRecord).select().single();
          savedInvoice = inv;
        } catch (_) {}

        return res.status(201).json({
          provider: "asaas",
          plan: targetPlan,
          billingCycle: normalizedCycle,
          paymentMethod: normalizedMethod,
          amountBrl,
          amountFormatted: `R$ ${amountBrl.toFixed(2).replace(".", ",")}`,
          subscriptionId: subscription.id,
          invoiceId: savedInvoice?.id || firstPayment.id || subscription.id,
          paymentId: firstPayment.id || null,
          checkoutUrl: firstPayment.invoiceUrl || null,
          pixQrCode,
          pixCopyPaste,
          status: "pending",
        });
      } catch (err) {
        const providerMsg = err.response?.data?.errors?.[0]?.description || err.message;
        return res.status(502).json({
          error: `Não foi possível gerar a cobrança no Asaas: ${providerMsg}`,
        });
      }
    }

    // ── PROVEDOR 3: SANDBOX / HOMOLOGAÇÃO INTEGRADA ───────────────
    const externalId = `zapai_inv_${crypto.randomUUID().slice(0, 12)}`;
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const pixCopyPaste = `00020126580014BR.GOV.BCB.PIX0136zapai-pagamentos-${targetPlan.id}-${externalId}5204000053039865406${amountBrl.toFixed(2)}5802BR5913ZAPAI SAAS BR6009SAO PAULO62070503***6304ABCD`;

    let savedInvoice = null;
    try {
      const { data: inv } = await supabase
        .from("billing_invoices")
        .insert({
          tenant_id: tenant.id,
          provider: "sandbox",
          external_id: externalId,
          plan: targetPlan.id,
          billing_cycle: normalizedCycle,
          payment_method: normalizedMethod,
          amount_brl: amountBrl,
          status: "pending",
          pix_copy_paste: pixCopyPaste,
          due_date: dueDate,
        })
        .select()
        .single();
      savedInvoice = inv;
    } catch (_) {}

    return res.status(201).json({
      provider: "sandbox",
      sandbox: true,
      sandboxMode: true,
      plan: targetPlan,
      billingCycle: normalizedCycle,
      paymentMethod: normalizedMethod,
      amountBrl,
      amountFormatted: `R$ ${amountBrl.toFixed(2).replace(".", ",")}`,
      externalId,
      invoiceId: savedInvoice?.id || externalId,
      pixCopyPaste,
      invoice: savedInvoice,
      status: "pending",
      message: "Cobrança gerada com sucesso! Confirme o pagamento para ativar o plano imediatamente.",
    });
  }
);

// ── POST /api/billing/confirm-sandbox (Confirmação em homologação/teste) ──
router.post("/confirm-sandbox", requireAuth, forbidViewer, async (req, res) => {
  const provider = getActiveBillingProvider();
  if (provider !== "sandbox" && process.env.TEST_MODE !== "true" && process.env.BILLING_SANDBOX_MODE !== "true") {
    return res.status(403).json({ error: "Confirmação direta disponível apenas em modo de homologação." });
  }

  const tenantId = req.user.tenantId;
  let { invoiceId, externalId, planId, billingCycle = "monthly" } = req.body || {};
  if (!tenantId) {
    return res.status(400).json({ error: "Organização é obrigatória." });
  }

  let matchedInvoice = null;
  if (invoiceId || externalId) {
    try {
      const { data: invById } = invoiceId
        ? await supabase.from("billing_invoices").select("*").eq("id", invoiceId).eq("tenant_id", tenantId).maybeSingle()
        : { data: null };
      if (invById) {
        matchedInvoice = invById;
      } else {
        const lookupExt = externalId || invoiceId;
        const { data: invByExt } = await supabase
          .from("billing_invoices")
          .select("*")
          .eq("external_id", lookupExt)
          .eq("tenant_id", tenantId)
          .maybeSingle();
        if (invByExt) matchedInvoice = invByExt;
      }
    } catch (_) {}
  }

  if (matchedInvoice) {
    if (!planId) planId = matchedInvoice.plan;
    if (matchedInvoice.billing_cycle) billingCycle = matchedInvoice.billing_cycle;
  }

  if (!planId) {
    return res.status(400).json({ error: "Plano e organização são obrigatórios." });
  }

  const targetPlan = getPlanConfig(planId);
  const updatedTenant = await activateTenantSubscription({
    tenantId,
    planId: targetPlan.id,
    billingCycle: billingCycle === "annual" ? "annual" : "monthly",
    provider: "sandbox",
    subscriptionId: matchedInvoice?.external_id || externalId || `sub_sandbox_${Date.now()}`,
  });

  if (matchedInvoice) {
    try {
      await supabase
        .from("billing_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", matchedInvoice.id)
        .eq("tenant_id", tenantId);
    } catch (_) {}
  } else if (externalId) {
    try {
      await supabase
        .from("billing_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("external_id", externalId)
        .eq("tenant_id", tenantId);
    } catch (_) {}
  }

  const currentLeads = await getTenantLeadCount(tenantId);
  res.json({
    success: true,
    message: `Plano ${targetPlan.displayName} (${targetPlan.leadRangeLabel}) ativado com sucesso!`,
    plan: targetPlan,
    tenant: updatedTenant,
    usage: buildTenantUsageSummary(updatedTenant, currentLeads),
  });
});

// ── POST /api/billing/cancel (Cancelamento de assinatura) ─────
router.post("/cancel", requireAuth, forbidViewer, async (req, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Tenant inválido." });

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  if (!tenant) return res.status(404).json({ error: "Organização não encontrada." });

  try {
    await supabase
      .from("tenants")
      .update({ subscription_status: "canceled_at_period_end" })
      .eq("id", tenantId);
  } catch (_) {}

  res.json({
    success: true,
    message: "Renovação automática cancelada. Seu acesso permanece ativo até o fim do período contratado.",
  });
});

// ── POST /api/billing/webhooks/asaas (Webhook Oficial Asaas) ──
router.post("/webhooks/asaas", async (req, res) => {
  const expectedToken = (process.env.ASAAS_WEBHOOK_TOKEN || "").trim();
  const receivedToken = req.headers["asaas-access-token"];

  if (expectedToken && receivedToken !== expectedToken) {
    return res.status(401).json({ error: "Token de webhook Asaas inválido." });
  }

  const { event, payment } = req.body || {};
  if (!event || !payment) {
    return res.status(200).json({ received: true });
  }

  let ref = {};
  try {
    ref = JSON.parse(payment.externalReference || "{}");
  } catch (_) {
    ref = { tenantId: payment.externalReference };
  }

  const tenantId = ref.tenantId;
  const planId = ref.planId || "starter";
  const billingCycle = ref.billingCycle || "monthly";

  if (["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(event) && tenantId) {
    try {
      await activateTenantSubscription({
        tenantId,
        planId,
        billingCycle,
        provider: "asaas",
        customerId: payment.customer || null,
        subscriptionId: payment.subscription || payment.id || null,
      });

      await supabase
        .from("billing_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("external_id", payment.id);
    } catch (err) {
      console.error("[ASAAS WEBHOOK] Erro ao ativar assinatura:", err.message);
      return res.status(500).json({ error: "Erro ao processar pagamento." });
    }
  } else if (["PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED"].includes(event) && tenantId) {
    try {
      await supabase
        .from("billing_invoices")
        .update({ status: event === "PAYMENT_OVERDUE" ? "overdue" : "canceled" })
        .eq("external_id", payment.id);
    } catch (_) {}
  }

  return res.status(200).json({ received: true });
});

// ── POST /api/billing/webhooks/stripe (Webhook Oficial Stripe) ─
router.post("/webhooks/stripe", async (req, res) => {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const sigHeader = req.headers["stripe-signature"];

  if (webhookSecret) {
    if (!sigHeader) return res.status(401).json({ error: "Assinatura Stripe ausente." });
    const parts = Object.fromEntries(
      String(sigHeader)
        .split(",")
        .map((p) => p.split("="))
    );
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) return res.status(401).json({ error: "Cabeçalho Stripe inválido." });

    const rawBody = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body || {});
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(403).json({ error: "Assinatura Stripe inválida." });
    }
  }

  const { type, data } = req.body || {};
  const obj = data?.object || {};
  const tenantId = obj.metadata?.tenant_id || obj.client_reference_id;
  const planId = obj.metadata?.plan_id || "starter";
  const billingCycle = obj.metadata?.billing_cycle || "monthly";

  if (["checkout.session.completed", "invoice.paid"].includes(type) && tenantId) {
    try {
      await activateTenantSubscription({
        tenantId,
        planId,
        billingCycle,
        provider: "stripe",
        customerId: obj.customer || null,
        subscriptionId: obj.subscription || obj.id || null,
      });

      await supabase
        .from("billing_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("external_id", obj.id);
    } catch (err) {
      console.error("[STRIPE WEBHOOK] Erro ao ativar assinatura:", err.message);
      return res.status(500).json({ error: "Erro ao processar webhook Stripe." });
    }
  } else if (["customer.subscription.deleted", "customer.subscription.paused"].includes(type) && tenantId) {
    try {
      await supabase
        .from("tenants")
        .update({ subscription_status: "canceled", status: "pausado" })
        .eq("id", tenantId);
    } catch (_) {}
  } else if (type === "invoice.payment_failed" && tenantId) {
    try {
      await supabase
        .from("tenants")
        .update({ subscription_status: "past_due" })
        .eq("id", tenantId);
      await supabase
        .from("billing_invoices")
        .update({ status: "failed" })
        .eq("external_id", obj.id);
    } catch (_) {}
  }

  return res.status(200).json({ received: true });
});

// ── POST /api/billing/stripe/portal (Portal do Cliente Stripe) ─
router.post("/stripe/portal", requireAuth, forbidViewer, async (req, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Tenant não identificado." });

  const { data: tenant } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  if (!tenant) return res.status(404).json({ error: "Organização não encontrada." });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: "Chave STRIPE_SECRET_KEY não configurada no servidor." });
  }

  const customerId = tenant.billing_customer_id;
  if (!customerId || !String(customerId).startsWith("cus_")) {
    return res.status(400).json({
      error: "Sua conta ainda não possui uma assinatura Stripe ativa vinculada.",
    });
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const params = new URLSearchParams();
    params.append("customer", customerId);
    params.append("return_url", `${frontendUrl}/painel/configuracoes?section=billing`);

    const portalResp = await axios.post(
      "https://api.stripe.com/v1/billing_portal/sessions",
      params.toString(),
      {
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 12000,
      }
    );

    res.json({ url: portalResp.data.url });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(502).json({ error: `Erro ao abrir portal Stripe: ${msg}` });
  }
});

module.exports = {
  router,
  getTenantLeadCount,
  activateTenantSubscription,
};
