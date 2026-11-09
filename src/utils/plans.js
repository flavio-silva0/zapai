"use strict";

/**
 * ZapAI — Catálogo Oficial de Planos, Limites de Leads e Unit Economics
 *
 * Faixas de Leads:
 * - Starter / Basic: Até 150 leads (1 a 150)
 * - Growth (Crescimento): De 151 a 300 leads
 * - Pro (Profissional): De 301 a 500 leads
 * - Enterprise: Acima de 500 leads (Personalizado)
 *
 * Precificação calculada para ser a mais acessível do mercado brasileiro,
 * cobrindo custos de IA (Gemini 2.5 Flash-Lite + Embeddings ~R$ 0,018/lead),
 * Meta Cloud API (conversas receptivas de serviço são gratuitas pela Meta na janela de 24h),
 * taxas de gateway (Asaas PIX R$ 1,99 / Stripe) e infraestrutura, mantendo margem > 80%.
 */

const PLANS = Object.freeze({
  starter: {
    id: "starter",
    dbSlug: "starter",
    aliases: ["starter", "basic"],
    name: "Starter",
    displayName: "Essencial (Starter)",
    badge: "Até 150 leads",
    subtitle: "Ideal para autônomos, consultórios e pequenos negócios iniciando no atendimento com IA.",
    minLeads: 1,
    maxLeads: 150,
    leadRangeLabel: "Até 150 leads",
    priceMonthly: 69.90,
    priceAnnualMonthly: 59.90,
    priceAnnualTotal: 718.80,
    dailyAiQuota: 600,
    whatsappNumbers: 1,
    teamMembers: 1,
    popular: false,
    customPricing: false,
    unitEconomics: {
      estimatedAiCostBRL: 2.70,
      metaServiceWindowCostBRL: 0.00,
      gatewayPixFeeBRL: 1.99,
      estimatedGrossMarginPct: 88,
    },
    features: [
      "Até 150 leads ativos no CRM & WhatsApp",
      "1 número de WhatsApp Oficial (Meta Cloud API)",
      "Atendente IA 24/7 (Texto e Áudio)",
      "Base de Conhecimento RAG (FAQs e Documentos)",
      "Funil CRM Kanban (4 etapas) + Handoff Humano",
      "Suporte via WhatsApp em horário comercial",
    ],
  },

  growth: {
    id: "growth",
    dbSlug: "growth",
    aliases: ["growth", "intermediario"],
    name: "Growth",
    displayName: "Crescimento (Growth)",
    badge: "151 a 300 leads",
    subtitle: "Para clínicas, lojas e empresas em expansão que precisam de memória contínua e relatórios.",
    minLeads: 151,
    maxLeads: 300,
    leadRangeLabel: "De 151 a 300 leads",
    priceMonthly: 119.90,
    priceAnnualMonthly: 99.90,
    priceAnnualTotal: 1198.80,
    dailyAiQuota: 1500,
    whatsappNumbers: 1,
    teamMembers: 3,
    popular: true,
    customPricing: false,
    unitEconomics: {
      estimatedAiCostBRL: 5.40,
      metaServiceWindowCostBRL: 0.00,
      gatewayPixFeeBRL: 1.99,
      estimatedGrossMarginPct: 87,
    },
    features: [
      "De 151 até 300 leads ativos no CRM & WhatsApp",
      "1 número de WhatsApp Oficial + até 3 operadores",
      "IA Multimodal (Texto, Áudio e Leitura de Imagens)",
      "Memória de Longo Prazo automática por cliente",
      "Treinamento com PDF, DOCX e importação de Site (URL)",
      "Ficha do Contato estilo HubSpot + Exportação CSV/PDF",
      "Suporte prioritário via WhatsApp",
    ],
  },

  pro: {
    id: "pro",
    dbSlug: "pro",
    aliases: ["pro", "profissional"],
    name: "Pro",
    displayName: "Profissional (Pro)",
    badge: "301 a 500 leads",
    subtitle: "Operação comercial acelerada com análise preditiva de fechamento (Lead Score) por IA.",
    minLeads: 301,
    maxLeads: 500,
    leadRangeLabel: "De 301 a 500 leads",
    priceMonthly: 169.90,
    priceAnnualMonthly: 144.90,
    priceAnnualTotal: 1738.80,
    dailyAiQuota: 3000,
    whatsappNumbers: 2,
    teamMembers: 10,
    popular: false,
    customPricing: false,
    unitEconomics: {
      estimatedAiCostBRL: 9.00,
      metaServiceWindowCostBRL: 0.00,
      gatewayPixFeeBRL: 1.99,
      estimatedGrossMarginPct: 86,
    },
    features: [
      "De 301 até 500 leads ativos no CRM & WhatsApp",
      "Até 2 números de WhatsApp Oficial + até 10 operadores",
      "Análise Comercial IA (Lead Score, Sentimento e 5 Próximos Passos)",
      "Memória Contínua + RAG Vetorial de Alta Precisão",
      "Simulador Sandbox de Treinamento em Tempo Real",
      "Prioridade máxima de processamento na fila de IA",
      "Suporte VIP prioritário",
    ],
  },

  enterprise: {
    id: "enterprise",
    dbSlug: "enterprise",
    aliases: ["enterprise", "premium", "custom"],
    name: "Enterprise",
    displayName: "Enterprise",
    badge: "Acima de 500 leads",
    subtitle: "Arquitetura sob medida para alto volume, múltiplos números, API dedicada e SLA contratual.",
    minLeads: 501,
    maxLeads: null, // Ilimitado ou definido sob medida em tenant.max_leads
    leadRangeLabel: "Acima de 500 leads (Personalizado)",
    priceMonthly: 249.90,
    priceAnnualMonthly: 219.90,
    priceAnnualTotal: 2638.80,
    dailyAiQuota: 5000,
    whatsappNumbers: 99,
    teamMembers: 99,
    popular: false,
    customPricing: true,
    unitEconomics: {
      estimatedAiCostBRL: 25.00,
      metaServiceWindowCostBRL: 0.00,
      gatewayPixFeeBRL: 1.99,
      estimatedGrossMarginPct: 85,
    },
    features: [
      "Acima de 500 leads (volume personalizado sob demanda)",
      "Múltiplos números de WhatsApp Oficial",
      "Implantação Assistida (Configuramos sua IA e Meta API)",
      "API REST + Webhooks customizados para ERP/CRM",
      "SLA de disponibilidade 99,9% contratual",
      "Gerente de Sucesso Dedicado (CSM)",
    ],
  },
});

const PLAN_ORDER = ["starter", "growth", "pro", "enterprise"];
const VALID_DB_PLANS = ["basic", "starter", "growth", "pro", "enterprise"];

/**
 * Normaliza qualquer slug de plano ("basic", "starter", "growth", "pro", "enterprise", "premium")
 * para o objeto de plano correspondente.
 */
function getPlanConfig(planSlug) {
  const normalized = String(planSlug || "starter").trim().toLowerCase();
  if (normalized === "basic" || normalized === "starter") return PLANS.starter;
  if (normalized === "growth" || normalized === "intermediario") return PLANS.growth;
  if (normalized === "pro" || normalized === "profissional") return PLANS.pro;
  if (normalized === "enterprise" || normalized === "premium" || normalized === "custom") return PLANS.enterprise;
  return PLANS.starter;
}

/**
 * Retorna o limite máximo de leads de um tenant.
 * Se o tenant possuir `max_leads` explícito (ex: Enterprise customizado), respeita o valor do tenant.
 */
function getTenantMaxLeads(tenant) {
  if (!tenant) return PLANS.starter.maxLeads;
  if (typeof tenant.max_leads === "number" && tenant.max_leads > 0) {
    return tenant.max_leads;
  }
  const cfg = getPlanConfig(tenant.plan);
  return cfg.maxLeads; // null = ilimitado (Enterprise)
}

/**
 * Calcula o resumo de uso de leads e status de assinatura de um tenant.
 */
function buildTenantUsageSummary(tenant, currentLeadsCount = 0) {
  const planConfig = getPlanConfig(tenant?.plan);
  const maxLeads = getTenantMaxLeads(tenant);
  const count = Math.max(0, Number(currentLeadsCount) || 0);
  const isUnlimited = maxLeads === null;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((count / maxLeads) * 100));
  const isLimitReached = !isUnlimited && count >= maxLeads;
  const isNearLimit = !isUnlimited && !isLimitReached && count >= Math.floor(maxLeads * 0.85);

  const now = Date.now();
  const trialEndsMs = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at).getTime() : null;
  const isTrial = tenant?.status === "trial";
  const isTrialExpired = Boolean(isTrial && trialEndsMs && trialEndsMs <= now);
  const trialDaysRemaining = isTrial && trialEndsMs
    ? Math.max(0, Math.ceil((trialEndsMs - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // Recomenda o próximo plano caso esteja perto ou no limite
  let recommendedUpgrade = null;
  if (planConfig.id === "starter") recommendedUpgrade = PLANS.growth;
  else if (planConfig.id === "growth") recommendedUpgrade = PLANS.pro;
  else if (planConfig.id === "pro") recommendedUpgrade = PLANS.enterprise;

  return {
    planId: planConfig.id,
    planName: planConfig.name,
    planDisplayName: planConfig.displayName,
    leadRangeLabel: planConfig.leadRangeLabel,
    priceMonthly: planConfig.priceMonthly,
    priceAnnualMonthly: planConfig.priceAnnualMonthly,
    dailyAiQuota: planConfig.dailyAiQuota,
    currentLeads: count,
    maxLeads: maxLeads === null ? "Ilimitado" : maxLeads,
    isUnlimited,
    percentage,
    usagePercent: percentage,
    remainingLeads: isUnlimited ? "Ilimitado" : Math.max(0, maxLeads - count),
    isLimitReached,
    limitReached: isLimitReached,
    isNearLimit,
    nearLimit: isNearLimit,
    isTrial,
    isTrialExpired,
    trialDaysRemaining,
    trialEndsAt: tenant?.trial_ends_at || null,
    status: tenant?.status || "trial",
    subscriptionStatus: tenant?.subscription_status || (tenant?.status === "ativo" ? "active" : tenant?.status || "trial"),
    billingProvider: tenant?.billing_provider || null,
    currentPeriodEnd: tenant?.current_period_end || null,
    recommendedUpgradePlanId: recommendedUpgrade ? recommendedUpgrade.id : null,
    recommendedUpgrade: recommendedUpgrade
      ? {
          id: recommendedUpgrade.id,
          name: recommendedUpgrade.name,
          leadRangeLabel: recommendedUpgrade.leadRangeLabel,
          maxLeads: recommendedUpgrade.maxLeads,
          priceMonthly: recommendedUpgrade.priceMonthly,
        }
      : null,
  };
}

/**
 * Sugere o plano ideal com base no número de leads.
 */
function recommendPlanForLeadCount(leadCount) {
  const n = Number(leadCount) || 0;
  if (n <= 150) return PLANS.starter;
  if (n <= 300) return PLANS.growth;
  if (n <= 500) return PLANS.pro;
  return PLANS.enterprise;
}

module.exports = {
  PLANS,
  PLAN_ORDER,
  VALID_DB_PLANS,
  getPlanConfig,
  getTenantMaxLeads,
  buildTenantUsageSummary,
  recommendPlanForLeadCount,
};
