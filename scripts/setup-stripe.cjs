#!/usr/bin/env node
/**
 * scripts/setup-stripe.cjs
 *
 * Script de auto-provisionamento da Stripe para a ZapAI.
 * Configura automaticamente na sua conta Stripe:
 * 1. Produtos e Preços dos planos (Starter, Growth, Profissional) em BRL
 * 2. Portal do Cliente (Customer Portal) self-service
 * 3. Endpoint de Webhook Oficial (/api/billing/webhooks/stripe) e retorna o STRIPE_WEBHOOK_SECRET
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_live_xxx BACKEND_PUBLIC_URL=https://seu-backend.com node scripts/setup-stripe.cjs
 */

"use strict";

require("dotenv").config();
const axios = require("axios");

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || "").trim();
const BACKEND_PUBLIC_URL = (process.env.BACKEND_PUBLIC_URL || "").trim().replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://zapai-iota.vercel.app").trim().replace(/\/$/, "");

if (!STRIPE_SECRET_KEY) {
  console.error("\n❌ Erro: Defina a variável STRIPE_SECRET_KEY antes de executar.");
  console.error("Exemplo:");
  console.error("  STRIPE_SECRET_KEY=sk_test_... BACKEND_PUBLIC_URL=https://seu-backend.up.railway.app node scripts/setup-stripe.cjs\n");
  process.exit(1);
}

const stripeClient = axios.create({
  baseURL: "https://api.stripe.com/v1",
  headers: {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 20000,
});

const PLANS_TO_CREATE = [
  {
    id: "starter",
    name: "ZapAI — Plano Starter (Até 150 leads)",
    description: "Atendimento inteligente via WhatsApp Oficial (Meta Cloud API) para até 150 leads ativos.",
    monthlyBrl: 69.90,
    annualBrl: 718.80,
  },
  {
    id: "growth",
    name: "ZapAI — Plano Growth (151 a 300 leads)",
    description: "Atendimento IA multimodal, memória contínua e relatórios para 151 a 300 leads ativos.",
    monthlyBrl: 119.90,
    annualBrl: 1198.80,
  },
  {
    id: "pro",
    name: "ZapAI — Plano Profissional (301 a 500 leads)",
    description: "Operação comercial acelerada com análise preditiva (Lead Score) para 301 a 500 leads ativos.",
    monthlyBrl: 169.90,
    annualBrl: 1738.80,
  },
];

async function ensureProductsAndPrices() {
  console.log("📦 1/3 Verificando e criando Produtos & Preços na Stripe...");
  const { data: existingProducts } = await stripeClient.get("/products?limit=100&active=true");

  for (const plan of PLANS_TO_CREATE) {
    let product = (existingProducts.data || []).find(
      (p) => p.metadata?.zapai_plan_id === plan.id || p.name === plan.name
    );

    if (!product) {
      const pParams = new URLSearchParams();
      pParams.append("name", plan.name);
      pParams.append("description", plan.description);
      pParams.append("metadata[zapai_plan_id]", plan.id);
      const { data: created } = await stripeClient.post("/products", pParams.toString());
      product = created;
      console.log(`   ✅ Produto criado: ${product.name} (${product.id})`);
    } else {
      console.log(`   ℹ️  Produto já existente: ${product.name} (${product.id})`);
    }

    // Cria preço mensal e anual caso não existam
    const { data: prices } = await stripeClient.get(`/prices?product=${product.id}&active=true&limit=20`);
    const hasMonthly = (prices.data || []).some((pr) => pr.recurring?.interval === "month");
    const hasAnnual = (prices.data || []).some((pr) => pr.recurring?.interval === "year");

    if (!hasMonthly) {
      const mParams = new URLSearchParams();
      mParams.append("product", product.id);
      mParams.append("currency", "brl");
      mParams.append("unit_amount", String(Math.round(plan.monthlyBrl * 100)));
      mParams.append("recurring[interval]", "month");
      mParams.append("metadata[zapai_plan_id]", plan.id);
      mParams.append("metadata[billing_cycle]", "monthly");
      const { data: mPrice } = await stripeClient.post("/prices", mParams.toString());
      console.log(`      ↳ Preço Mensal criado: R$ ${plan.monthlyBrl.toFixed(2)} (${mPrice.id})`);
    }

    if (!hasAnnual) {
      const yParams = new URLSearchParams();
      yParams.append("product", product.id);
      yParams.append("currency", "brl");
      yParams.append("unit_amount", String(Math.round(plan.annualBrl * 100)));
      yParams.append("recurring[interval]", "year");
      yParams.append("metadata[zapai_plan_id]", plan.id);
      yParams.append("metadata[billing_cycle]", "annual");
      const { data: yPrice } = await stripeClient.post("/prices", yParams.toString());
      console.log(`      ↳ Preço Anual criado: R$ ${plan.annualBrl.toFixed(2)}/ano (${yPrice.id})`);
    }
  }
}

async function ensureCustomerPortal() {
  console.log("\n🛡️  2/3 Configurando Portal do Cliente (Billing Portal)...");
  try {
    const portalParams = new URLSearchParams();
    portalParams.append("business_profile[headline]", "ZapAI — Gerenciamento de Assinatura e Faturas");
    portalParams.append("features[invoice_history][enabled]", "true");
    portalParams.append("features[payment_method_update][enabled]", "true");
    portalParams.append("features[subscription_cancel][enabled]", "true");
    portalParams.append("features[subscription_cancel][mode]", "at_period_end");
    portalParams.append("default_return_url", `${FRONTEND_URL}/painel/configuracoes?section=billing`);

    const { data: portalConfig } = await stripeClient.post(
      "/billing_portal/configurations",
      portalParams.toString()
    );
    console.log(`   ✅ Portal do Cliente configurado com sucesso (${portalConfig.id})`);
  } catch (err) {
    console.warn(`   ⚠️  Aviso ao configurar Portal do Cliente: ${err.response?.data?.error?.message || err.message}`);
  }
}

async function ensureWebhookEndpoint() {
  console.log("\n🔗 3/3 Configurando Webhook Oficial da ZapAI...");
  if (!BACKEND_PUBLIC_URL || BACKEND_PUBLIC_URL.includes("localhost")) {
    console.log("   ℹ️  BACKEND_PUBLIC_URL não informado ou é localhost. Pulei o registro automático do webhook remoto.");
    console.log("   👉 Quando publicar o backend, rode novamente passando BACKEND_PUBLIC_URL=https://sua-api.com");
    return null;
  }

  const webhookUrl = `${BACKEND_PUBLIC_URL}/api/billing/webhooks/stripe`;
  const { data: existingHooks } = await stripeClient.get("/webhook_endpoints?limit=50");
  const found = (existingHooks.data || []).find((w) => w.url === webhookUrl);

  if (found) {
    console.log(`   ℹ️  Webhook já registrado para: ${webhookUrl} (${found.id})`);
    console.log("   (Nota: O segredo whsec_ só é exibido pela Stripe no momento da criação. Caso precise de um novo, exclua o webhook no painel da Stripe e rode este script novamente.)");
    return null;
  }

  const wParams = new URLSearchParams();
  wParams.append("url", webhookUrl);
  wParams.append("description", "Webhook Oficial ZapAI SaaS (Ativação de Planos e Limites de Leads)");
  [
    "checkout.session.completed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.deleted",
    "customer.subscription.paused",
  ].forEach((ev) => wParams.append("enabled_events[]", ev));

  const { data: createdHook } = await stripeClient.post("/webhook_endpoints", wParams.toString());
  console.log(`   ✅ Webhook criado com sucesso: ${createdHook.url}`);
  console.log(`   🔑 STRIPE_WEBHOOK_SECRET=${createdHook.secret}`);
  return createdHook.secret;
}

(async () => {
  try {
    console.log("====================================================");
    console.log("🚀 ZapAI — Auto-Provisionamento Oficial da Stripe");
    console.log("====================================================\n");

    await ensureProductsAndPrices();
    await ensureCustomerPortal();
    const webhookSecret = await ensureWebhookEndpoint();

    console.log("\n====================================================");
    console.log("✅ Configuração da Stripe concluída com sucesso!");
    console.log("====================================================");
    console.log("\nAdicione no seu arquivo .env / painel de produção:");
    console.log("BILLING_PROVIDER=stripe");
    console.log(`STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY.slice(0, 12)}...`);
    if (webhookSecret) {
      console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
    }
    console.log("");
  } catch (err) {
    console.error("\n❌ Falha ao configurar Stripe:", err.response?.data?.error?.message || err.message);
    process.exit(1);
  }
})();
