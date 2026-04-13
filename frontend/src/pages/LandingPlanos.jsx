import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X as XIcon, ArrowRight, MessageCircle, Zap } from "lucide-react";

/* ─── Plans ─────────────────────────────────────────────── */
const PLANS = [
  {
    id:       "starter",
    name:     "Starter",
    tagline:  "Para quem está começando",
    price:    null,
    highlight: false,
    gradient: "from-slate-600 to-slate-500",
    features: [
      { text: "1 número de WhatsApp",              ok: true  },
      { text: "Até 500 mensagens/mês",             ok: true  },
      { text: "IA conversacional básica",           ok: true  },
      { text: "Painel de controle",                ok: true  },
      { text: "Suporte via WhatsApp",              ok: true  },
      { text: "Kanban de atendimento",             ok: false },
      { text: "Múltiplos agentes de IA",           ok: false },
      { text: "Integrações avançadas",             ok: false },
      { text: "Relatórios detalhados",             ok: false },
    ],
  },
  {
    id:       "pro",
    name:     "Pro",
    tagline:  "O mais popular do mercado",
    price:    null,
    highlight: true,
    gradient: "from-indigo-500 to-violet-600",
    features: [
      { text: "Até 3 números de WhatsApp",         ok: true  },
      { text: "Mensagens ilimitadas",              ok: true  },
      { text: "IA conversacional avançada",        ok: true  },
      { text: "Painel de controle",                ok: true  },
      { text: "Suporte prioritário",               ok: true  },
      { text: "Kanban de atendimento",             ok: true  },
      { text: "Múltiplos agentes de IA",           ok: true  },
      { text: "Integrações avançadas",             ok: false },
      { text: "Relatórios detalhados",             ok: false },
    ],
  },
  {
    id:       "enterprise",
    name:     "Enterprise",
    tagline:  "Para grandes operações",
    price:    null,
    highlight: false,
    gradient: "from-cyan-500 to-indigo-500",
    features: [
      { text: "Números ilimitados",                ok: true  },
      { text: "Mensagens ilimitadas",              ok: true  },
      { text: "IA conversacional avançada",        ok: true  },
      { text: "Painel de controle",                ok: true  },
      { text: "Suporte dedicado 24/7",             ok: true  },
      { text: "Kanban de atendimento",             ok: true  },
      { text: "Múltiplos agentes de IA",           ok: true  },
      { text: "Integrações avançadas",             ok: true  },
      { text: "Relatórios detalhados",             ok: true  },
    ],
  },
];

const FAQS = [
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. Você pode criar sua conta e experimentar sem fornecer dados de pagamento.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim, você pode fazer upgrade ou downgrade a qualquer momento pelo painel.",
  },
  {
    q: "Como funciona o suporte?",
    a: "Todos os planos incluem suporte via WhatsApp. No Enterprise, o atendimento é dedicado 24/7.",
  },
  {
    q: "Quando os preços serão definidos?",
    a: "Estamos finalizando nossa tabela de preços. Cadastre-se para ser notificado no lançamento.",
  },
];

export default function LandingPlanos() {
  const [annual,   setAnnual]   = useState(false);
  const [openFaq,  setOpenFaq]  = useState(null);

  const WAPP = `https://wa.me/5511962566086?text=${encodeURIComponent("Olá, tenho dúvidas sobre a ZapAI")}`;

  return (
    <div className="pt-20 overflow-x-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section id="planos-hero" className="relative py-24 px-5 text-center bg-grid">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          Planos e Preços
        </span>
        <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-6">
          Escolha o plano<br />
          <span className="gradient-text">ideal para você</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-xl mx-auto mb-10">
          Preços transparentes, sem surpresas. Cancele quando quiser.
        </p>

        {/* Toggle mensal / anual */}
        <div className="inline-flex items-center gap-4 glass rounded-full px-5 py-3">
          <span className={`text-sm font-semibold transition-colors ${!annual ? "text-white" : "text-slate-500"}`}>
            Mensal
          </span>
          <button
            id="planos-toggle-billing"
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-indigo-500" : "bg-slate-700"}`}
            aria-label="Alternar faturamento anual"
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? "left-7" : "left-1"}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors ${annual ? "text-white" : "text-slate-500"}`}>
            Anual
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
              -20%
            </span>
          </span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING CARDS
      ══════════════════════════════════════════════════════ */}
      <section id="planos-cards" className="py-12 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, idx) => (
            <div
              key={plan.id}
              id={`plan-${plan.id}`}
              className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300 ${
                plan.highlight
                  ? "ring-2 ring-indigo-500/60 shadow-2xl shadow-indigo-500/20 scale-105"
                  : "glass glass-hover"
              }`}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              )}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-lg">
                  ⭐ Mais Popular
                </div>
              )}

              {/* Card body */}
              <div className={`flex flex-col flex-1 p-8 ${plan.highlight ? "bg-gradient-to-b from-indigo-950/60 to-violet-950/40" : ""}`}>
                {/* Header */}
                <div className="mb-8">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-4`}>
                    <Zap size={22} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-display text-2xl font-black text-white">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mt-1">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      <span className="font-display text-5xl font-black text-white">Em breve</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      {annual ? "cobrado anualmente" : "cobrado mensalmente"}
                    </p>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-3.5 flex-1">
                  {plan.features.map(({ text, ok }) => (
                    <li key={text} className="flex items-start gap-3">
                      {ok
                        ? <Check size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                        : <XIcon size={16} className="text-slate-700 mt-0.5 shrink-0" />
                      }
                      <span className={`text-sm ${ok ? "text-slate-300" : "text-slate-600"}`}>{text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  {plan.id === "enterprise" ? (
                    <a
                      href={WAPP}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`plan-${plan.id}-cta`}
                      className="btn-outline w-full text-center flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Falar com a equipe
                    </a>
                  ) : (
                    <Link
                      to="/cadastro"
                      id={`plan-${plan.id}-cta`}
                      className={plan.highlight
                        ? "btn-primary w-full flex items-center justify-center gap-2"
                        : "btn-outline w-full flex items-center justify-center gap-2"
                      }
                    >
                      Criar conta grátis
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-600 text-sm mt-8">
          Preços serão definidos em breve · Cadastre-se para ser avisado primeiro
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section id="planos-faq" className="py-24 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-black text-white mb-3">
              Dúvidas <span className="gradient-text">frequentes</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="glass glass-hover rounded-2xl overflow-hidden">
                <button
                  id={`faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-white font-semibold">{q}</span>
                  <span className={`text-slate-400 text-xl transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40" : "max-h-0"}`}>
                  <p className="px-6 pb-6 text-slate-400 text-sm leading-relaxed">{a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section id="planos-final-cta" className="py-20 px-5 text-center">
        <div className="max-w-xl mx-auto glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/5 rounded-3xl pointer-events-none" />
          <h2 className="relative font-display text-3xl font-black text-white mb-4">
            Pronto para escalar?
          </h2>
          <p className="relative text-slate-400 mb-8">
            Comece grátis — sem cartão, sem compromisso.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro" id="planos-cta-final" className="btn-primary inline-flex items-center gap-2 justify-center">
              Criar minha conta
              <ArrowRight size={16} />
            </Link>
            <a
              href={WAPP}
              target="_blank"
              rel="noopener noreferrer"
              id="planos-wapp-cta"
              className="btn-outline inline-flex items-center gap-2 justify-center"
            >
              <MessageCircle size={16} />
              Falar com suporte
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
