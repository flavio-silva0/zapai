import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Plus,
  Minus,
  ArrowRight,
  Shield,
  Zap,
  ExternalLink,
  Cpu,
  CheckCircle2,
  Sparkles,
  Users,
  CreditCard,
} from "lucide-react";
import PublicEyebrow from "../components/PublicEyebrow";

const PLANS_DATA = [
  {
    id: "starter",
    name: "Starter",
    badge: "Até 150 leads",
    leadRange: "1 a 150 leads",
    maxLeads: 150,
    priceMonthly: 69.90,
    priceAnnual: 59.90,
    description:
      "Para autônomos, consultórios e pequenos negócios que querem atendimento automático 24/7 com o menor custo do mercado.",
    popular: false,
    features: [
      "Até 150 leads ativos no CRM & WhatsApp",
      "1 número de WhatsApp Oficial (Meta Cloud API)",
      "Atendente IA 24/7 (Texto e Áudio)",
      "Base de Conhecimento RAG (FAQs e Documentos)",
      "Funil CRM Kanban (4 etapas) + Handoff Humano",
      "Suporte via WhatsApp em horário comercial",
    ],
    ctaLabel: "Começar com até 150 leads",
    ctaLink: "/cadastro?plan=starter",
  },
  {
    id: "growth",
    name: "Growth",
    badge: "151 a 300 leads",
    leadRange: "151 a 300 leads",
    maxLeads: 300,
    priceMonthly: 119.90,
    priceAnnual: 99.90,
    description:
      "Ideal para clínicas, salões, lojas e imobiliárias em crescimento que precisam de memória contínua e leitura de imagens/áudios.",
    popular: true,
    features: [
      "De 151 até 300 leads ativos no CRM & WhatsApp",
      "1 número de WhatsApp Oficial + até 3 operadores",
      "IA Multimodal (Texto, Áudio e Leitura de Imagens)",
      "Memória de Longo Prazo automática por cliente",
      "Treinamento com PDF, DOCX e importação de Site",
      "Ficha estilo HubSpot + Exportação CSV/PDF",
      "Suporte prioritário via WhatsApp",
    ],
    ctaLabel: "Testar plano Growth grátis",
    ctaLink: "/cadastro?plan=growth",
  },
  {
    id: "pro",
    name: "Profissional",
    badge: "301 a 500 leads",
    leadRange: "301 a 500 leads",
    maxLeads: 500,
    priceMonthly: 169.90,
    priceAnnual: 144.90,
    description:
      "Para operações comerciais aceleradas que exigem análise preditiva de fechamento (Lead Score), sentimento e múltiplos operadores.",
    popular: false,
    features: [
      "De 301 até 500 leads ativos no CRM & WhatsApp",
      "Até 2 números de WhatsApp Oficial + 10 operadores",
      "Análise Comercial IA (Lead Score, Sentimento e 5 Passos)",
      "Memória Contínua + RAG Vetorial de Alta Precisão",
      "Simulador Sandbox de Treinamento em Tempo Real",
      "Prioridade máxima de processamento na fila de IA",
      "Suporte VIP prioritário",
    ],
    ctaLabel: "Começar no Profissional",
    ctaLink: "/cadastro?plan=pro",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Limite de Leads no CRM",
    starter: "Até 150 leads",
    growth: "151 a 300 leads",
    pro: "301 a 500 leads",
    enterprise: "Acima de 500 (Sob medida)",
  },
  {
    feature: "Investimento Mensal",
    starter: "R$ 69,90/mês",
    growth: "R$ 119,90/mês",
    pro: "R$ 169,90/mês",
    enterprise: "Sob consulta",
  },
  {
    feature: "Números de WhatsApp Oficial",
    starter: "1 número",
    growth: "1 número",
    pro: "Até 2 números",
    enterprise: "Múltiplos números",
  },
  {
    feature: "Atendentes na Equipe",
    starter: "1 operador",
    growth: "Até 3 operadores",
    pro: "Até 10 operadores",
    enterprise: "Ilimitados",
  },
  {
    feature: "Capacidade Diária de IA",
    starter: "500 interações/dia",
    growth: "1.200 interações/dia",
    pro: "2.000 interações/dia",
    enterprise: "5.000+ interações/dia",
  },
  {
    feature: "API Oficial Meta (Cloud API)",
    starter: true,
    growth: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Compreensão de Áudio e Texto",
    starter: true,
    growth: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Leitura de Imagens + Memória de Longo Prazo",
    starter: "Básica",
    growth: "Completa automática",
    pro: "Avançada + Lead Score",
    enterprise: "Dedicada + Custom",
  },
  {
    feature: "Painel CRM Kanban + Handoff Humano",
    starter: true,
    growth: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Exportação de Relatórios (CSV / PDF)",
    starter: "—",
    growth: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Suporte e Onboarding",
    starter: "WhatsApp comercial",
    growth: "Prioritário",
    pro: "VIP prioritário",
    enterprise: "Implantação assistida + CSM",
  },
];

const FAQS = [
  {
    q: "Como funciona o limite de leads em cada plano?",
    a: "Cada plano é dimensionado pelo volume de contatos únicos (leads) na sua base: o Starter atende até 150 leads, o Growth de 151 a 300 leads, o Profissional de 301 a 500 leads e o Enterprise operações acima de 500 leads. Dentro do seu limite de leads, sua atendente IA conversa 24 horas por dia sem cobrar taxa por mensagem enviada.",
  },
  {
    q: "Por que a ZapAI consegue ter o preço mais acessível do mercado?",
    a: "Nossa arquitetura combina os modelos mais eficientes de IA de última geração com a API Oficial da Meta (onde conversas receptivas de atendimento iniciadas pelo cliente dentro da janela de 24h têm tarifa zero da Meta). Repassamos essa eficiência diretamente para você.",
  },
  {
    q: "Quais formas de pagamento são aceitas para contratar?",
    a: "Os pagamentos são processados com a segurança global da Stripe. Aceitamos Cartão de Crédito (com renovação simplificada), PIX instantâneo, Boleto Bancário, Apple Pay e Google Pay nos ciclos mensal ou anual (com desconto). Você também tem acesso ao Portal do Cliente Stripe para gerenciar faturas e assinaturas com autonomia.",
  },
  {
    q: "Preciso de cartão de crédito para começar o teste grátis de 7 dias?",
    a: "Não! Você cria sua conta gratuitamente, configura sua atendente digital, treina a base de conhecimento e testa no simulador sem informar dados de pagamento. Você só escolhe e paga seu plano quando decidir ativar sua operação.",
  },
  {
    q: "O que acontece se minha empresa crescer e passar do limite de leads do plano?",
    a: "Você nunca perde nenhuma mensagem! O painel avisa quando você atingir 85% da capacidade e, ao chegar em 100%, novos contatos continuam sendo salvos no seu CRM para atendimento manual até que você faça o upgrade com 1 clique no painel.",
  },
];

function formatPrice(val) {
  return val.toFixed(2).replace(".", ",");
}

export default function LandingPlanos() {
  const [openFaq, setOpenFaq] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedTierIdx, setSelectedTierIdx] = useState(1);

  useEffect(() => {
    document.title = "Planos & Preços por Volume de Leads — ZapAI";
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const tierSimulation = [
    { label: "Até 150 leads", plan: "Starter", price: billingCycle === "annual" ? 59.90 : 69.90, perLead: "R$ 0,46" },
    { label: "151 a 300 leads", plan: "Growth", price: billingCycle === "annual" ? 99.90 : 119.90, perLead: "R$ 0,39" },
    { label: "301 a 500 leads", plan: "Profissional", price: billingCycle === "annual" ? 144.90 : 169.90, perLead: "R$ 0,33" },
    { label: "Acima de 500 leads", plan: "Enterprise", price: null, perLead: "Sob medida" },
  ];

  const activeSim = tierSimulation[selectedTierIdx];

  return (
    <div className="font-body selection:bg-teal-100 selection:text-teal-900 bg-[#FAFAF8] text-[#1a1a1a]">
      {/* ══════════════════════════════════════════════════════
          HERO — Posicionamento Transparente por Faixa de Leads
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-28 lg:pt-36 pb-16 lg:pb-24 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-5 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          <div className="flex-1 text-left">
            <PublicEyebrow className="mb-6">
              Planos & Preços Transparentes
            </PublicEyebrow>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-[1.08] tracking-tight">
              O melhor custo-benefício do Brasil para atender no WhatsApp com IA.
            </h1>

            <p className="text-lg lg:text-xl text-[#555] mt-6 max-w-xl leading-relaxed">
              Pague apenas pelo tamanho da sua operação de leads — de{" "}
              <strong className="text-[#1a1a1a]">R$ 69,90/mês</strong> (até 150 leads) ao{" "}
              <strong className="text-[#1a1a1a]">Enterprise</strong> para grandes volumes. Sem cobrança extra por mensagem da IA.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/cadastro"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3.5 rounded-full font-semibold hover:bg-teal-700 transition-colors shadow-sm"
              >
                Começar 7 dias grátis <ArrowRight size={20} />
              </Link>
              <a
                href="#estrutura-planos"
                className="inline-flex items-center gap-2 bg-white border border-[#e8e5e0] text-[#1a1a1a] px-6 py-3.5 rounded-full font-medium hover:bg-[#f8f7f5] transition-colors"
              >
                Ver tabela de planos
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-[#666]">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-teal-600" />
                <span>API Oficial Meta (Zero risco de ban)</span>
              </div>
              <span className="text-[#ccc]">·</span>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-teal-600" />
                <span>Stripe Oficial (Cartão, PIX ou Boleto)</span>
              </div>
              <span className="text-[#ccc]">·</span>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-teal-600" />
                <span>Sem fidelidade no plano mensal</span>
              </div>
            </div>
          </div>

          {/* Simulador Rápido de Faixa de Leads */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e8e5e0] overflow-hidden w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                  <Sparkles size={14} /> Simulador de Investimento
                </span>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Economia de 92% vs Recepção
                </span>
              </div>

              <p className="text-sm font-bold text-[#1a1a1a] mb-3">
                Quantos leads sua empresa atende no WhatsApp?
              </p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {tierSimulation.map((item, idx) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSelectedTierIdx(idx)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                      selectedTierIdx === idx
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-[#f8f7f5] text-[#444] border-[#e8e5e0] hover:border-teal-500/40"
                    }`}
                  >
                    <div className="font-bold">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 ${selectedTierIdx === idx ? "text-teal-100" : "text-[#777]"}`}>
                      Plano {item.plan}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#f8f7f5] border border-[#e8e5e0] rounded-xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#666] font-medium">Plano ideal:</span>
                  <span className="text-sm font-bold text-teal-700">ZapAI {activeSim.plan}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#666] font-medium">Valor mensal:</span>
                  <span className="text-2xl font-extrabold text-[#1a1a1a]">
                    {activeSim.price ? `R$ ${formatPrice(activeSim.price)}/mês` : "Sob consulta"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-[#e8e5e0] text-[11px] text-[#666]">
                  <span>Custo médio por lead atendido:</span>
                  <span className="font-bold text-emerald-700">{activeSim.perLead}</span>
                </div>
              </div>

              <Link
                to={activeSim.price ? `/cadastro?plan=${PLANS_DATA[selectedTierIdx]?.id || "starter"}` : "mailto:contato@zapai.com.br"}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white py-3 rounded-full text-xs font-bold hover:bg-[#333] transition-colors"
              >
                {activeSim.price ? `Testar Plano ${activeSim.plan} Grátis` : "Falar com Consultor Enterprise"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ESTRUTURA DE PLANOS (3 Planos por Faixa de Leads + Enterprise)
      ══════════════════════════════════════════════════════ */}
      <section id="estrutura-planos" className="py-20 lg:py-24 px-5 bg-white border-y border-[#e8e5e0] scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <PublicEyebrow className="mb-3">
              Planos por Volume de Leads
            </PublicEyebrow>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] tracking-tight">
              Cresça no seu ritmo, sem surpresas na fatura
            </h2>
            <p className="text-base sm:text-lg text-[#666] mt-4">
              Todos os planos incluem 7 dias de teste grátis, API Oficial da Meta e inteligência artificial configurada para o seu nicho.
            </p>

            {/* Seletor Mensal / Anual */}
            <div className="mt-7 inline-flex items-center bg-[#f3f1ed] p-1.5 rounded-full border border-[#e8e5e0]">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-[#1a1a1a] shadow-xs"
                    : "text-[#666] hover:text-[#1a1a1a]"
                }`}
              >
                Ciclo Mensal
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-[#666] hover:text-[#1a1a1a]"
                }`}
              >
                <span>Ciclo Anual</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  billingCycle === "annual" ? "bg-teal-800 text-teal-100" : "bg-teal-100 text-teal-800"
                }`}>
                  Economize 15%
                </span>
              </button>
            </div>
          </div>

          {/* Grid dos 3 Planos Principais (Até 150 | 151 a 300 | 301 a 500) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PLANS_DATA.map((plan) => {
              const activePrice = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-7 lg:p-8 flex flex-col justify-between relative transition-all ${
                    plan.popular
                      ? "bg-white border-2 border-teal-600 shadow-xl lg:-translate-y-2"
                      : "bg-white border border-[#e8e5e0] shadow-sm"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          plan.popular
                            ? "bg-teal-50 border border-teal-200 text-teal-700"
                            : "bg-[#f3f1ed] border border-[#e8e5e0] text-[#444]"
                        }`}
                      >
                        <Users size={13} className="text-teal-600" />
                        {plan.badge}
                      </span>
                      {plan.popular && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-teal-600 px-2.5 py-1 rounded-full">
                          Mais Escolhido
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#666] mt-2 leading-relaxed min-h-[48px]">
                      {plan.description}
                    </p>

                    {/* Preço */}
                    <div className="my-6 pt-5 border-t border-[#e8e5e0]">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-[#666]">R$</span>
                        <span className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight">
                          {formatPrice(activePrice)}
                        </span>
                        <span className="text-xs font-semibold text-[#666]">/mês</span>
                      </div>
                      <p className="text-[11px] text-[#777] mt-1.5">
                        {billingCycle === "annual"
                          ? `Faturado anualmente (R$ ${formatPrice(activePrice * 12)}/ano) · PIX ou Cartão`
                          : "Cobrança mensal sem fidelidade · PIX, Boleto ou Cartão"}
                      </p>
                    </div>

                    {/* Capacidade Destacada */}
                    <div className="mb-5 p-3 rounded-xl bg-[#f8f7f5] border border-[#e8e5e0] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#555]">Capacidade de Leads</span>
                      <span className="text-xs font-extrabold text-teal-700">{plan.leadRange}</span>
                    </div>

                    {/* Lista de Recursos */}
                    <div className="space-y-3 text-xs text-[#444]">
                      {plan.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 size={15} className="text-teal-600 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#e8e5e0]">
                    <Link
                      to={plan.ctaLink}
                      className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm transition-all ${
                        plan.popular
                          ? "bg-teal-600 text-white hover:bg-teal-700 shadow-md"
                          : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                      }`}
                    >
                      {plan.ctaLabel}
                      <ArrowRight size={16} />
                    </Link>
                    <p className="text-center text-[11px] text-[#888] mt-2.5">
                      7 dias de teste grátis · Ativação imediata
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── ENTERPRISE (ACIMA DE 500 LEADS) — HORIZONTAL CONSULTIVO ── */}
          <div className="mt-8 bg-[#1a1a1a] text-white rounded-2xl border border-[#333] p-7 lg:p-9 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a2a] border border-[#444] text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Acima de 500 Leads · Corporativo & Personalizado
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                  Enterprise (500+ Leads)
                </h3>
                <p className="text-sm text-[#aaa] mt-2 max-w-2xl leading-relaxed">
                  Sua operação recebe mais de 500 leads por mês? Montamos um plano personalizado com múltiplos números de WhatsApp Oficial, implantação assistida pela nossa equipe de engenharia, API REST e SLA contratual de 99,9%.
                </p>

                <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-white">Personalizado</span>
                  <span className="text-xs text-teal-400 font-semibold">· A partir de R$ 249,90/mês sob medida para o seu volume</span>
                </div>
              </div>

              <div className="w-full lg:w-96 space-y-4 shrink-0">
                <div className="grid grid-cols-2 gap-2.5 text-xs text-[#ddd]">
                  <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                    <Check size={14} className="text-teal-400 shrink-0" />
                    <span>+500 leads sob medida</span>
                  </div>
                  <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                    <Check size={14} className="text-teal-400 shrink-0" />
                    <span>Múltiplos WhatsApps</span>
                  </div>
                  <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                    <Check size={14} className="text-teal-400 shrink-0" />
                    <span>Setup Done-For-You</span>
                  </div>
                  <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                    <Check size={14} className="text-teal-400 shrink-0" />
                    <span>Gerente CSM direto</span>
                  </div>
                </div>

                <a
                  href="mailto:contato@zapai.com.br?subject=Proposta%20Enterprise%20ZapAI%20(%2B500%20leads)"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm bg-teal-600 text-white hover:bg-teal-500 transition-all"
                >
                  Solicitar proposta personalizada
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COMPARAÇÃO TÉCNICA DIRETA (4 Faixas de Leads)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-[#FAFAF8] border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <PublicEyebrow className="mb-3">
              Matriz de Capacidade
            </PublicEyebrow>
            <h2 className="text-2xl lg:text-4xl font-bold text-[#1a1a1a] tracking-tight">
              Comparativo completo entre planos
            </h2>
            <p className="text-base text-[#666] mt-2">
              Compare os limites de leads e recursos inclusos em cada faixa operacional.
            </p>
          </div>

          <div className="border border-[#e8e5e0] rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-5">Recurso / Faixa</th>
                    <th className="py-4 px-4 text-center">Starter (Até 150)</th>
                    <th className="py-4 px-4 text-center text-teal-300 bg-[#252525]">
                      Growth (151 a 300)
                    </th>
                    <th className="py-4 px-4 text-center">Pro (301 a 500)</th>
                    <th className="py-4 px-4 text-center">Enterprise (+500)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e5e0]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-[#f8f7f5]"}
                    >
                      <td className="py-3.5 px-5 font-medium text-[#1a1a1a] text-xs sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#555] text-xs sm:text-sm">
                        {typeof row.starter === "boolean" ? (
                          <Check size={16} className="text-teal-600 mx-auto" />
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#1a1a1a] text-xs sm:text-sm bg-teal-50/40">
                        {typeof row.growth === "boolean" ? (
                          <Check size={16} className="text-teal-700 mx-auto font-bold" />
                        ) : (
                          row.growth
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#555] text-xs sm:text-sm">
                        {typeof row.pro === "boolean" ? (
                          <Check size={16} className="text-teal-600 mx-auto" />
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#555] text-xs sm:text-sm">
                        {typeof row.enterprise === "boolean" ? (
                          <Check size={16} className="text-teal-600 mx-auto" />
                        ) : (
                          row.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ (Dúvidas sobre Limites de Leads e Pagamento)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-white border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-5 text-left">
            <PublicEyebrow className="mb-3">
              Dúvidas Frequentes
            </PublicEyebrow>
            <h2 className="text-2xl lg:text-4xl font-bold text-[#1a1a1a] tracking-tight">
              Perguntas sobre faixas de leads e cobrança
            </h2>
            <p className="text-base text-[#666] mt-3 leading-relaxed">
              Transparência total do primeiro teste gratuito à contratação via PIX, Boleto ou Cartão.
            </p>

            <div className="mt-8 bg-[#f8f7f5] border border-[#e8e5e0] rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-[#1a1a1a] mb-1">
                Precisa de ajuda para dimensionar seu plano?
              </div>
              <p className="text-xs text-[#666] mb-4 leading-relaxed">
                Nosso time comercial ajuda você a escolher a faixa ideal de leads para o seu negócio.
              </p>
              <a
                href="mailto:contato@zapai.com.br"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Falar com especialista ZapAI
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3.5">
            {FAQS.map(({ q, a }, i) => {
              const isOpen = openFaq === i;
              const buttonId = `faq-btn-${i}`;
              const panelId = `faq-panel-${i}`;
              return (
                <div
                  key={i}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "bg-white border-teal-600/50 shadow-sm"
                      : "bg-white border-[#e8e5e0] hover:border-[#ccc]"
                  }`}
                >
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-2xl"
                  >
                    <span className="font-bold text-[#1a1a1a] text-sm sm:text-base pr-4">
                      {q}
                    </span>
                    <span className="p-1 rounded-lg text-[#666] shrink-0">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 pb-5 text-[#555] text-sm leading-relaxed border-t border-[#e8e5e0] pt-3 animate-fade-up"
                    >
                      {a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-[#FAFAF8] text-[#1a1a1a] text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <PublicEyebrow className="mb-6">
            Pronto para começar
          </PublicEyebrow>

          <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
            Comece hoje por apenas R$ 69,90/mês após seus 7 dias grátis.
          </h2>

          <p className="text-[#666] text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Configure sua atendente digital em poucos minutos e nunca mais deixe um lead esperando no WhatsApp.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all"
            >
              Criar minha conta grátis
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium text-base border border-[#e8e5e0] text-[#1a1a1a] bg-white hover:bg-[#f8f7f5] transition-all"
            >
              Já tenho conta · Entrar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
