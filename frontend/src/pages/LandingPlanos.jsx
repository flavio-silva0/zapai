import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, Minus, ArrowRight } from "lucide-react";

const PLANS = [
  {
    id:       "starter",
    name:     "Starter",
    tagline:  "Para operações que estão começando a organizar o canal.",
    price:    "Em breve",
    features: [
      "1 número de WhatsApp",
      "Até 500 conversas/mês",
      "Triagem e respostas baseadas em FAQ",
      "Acesso ao painel básico",
      "Suporte via WhatsApp",
    ],
    highlight: false,
  },
  {
    id:       "pro",
    name:     "Profissional",
    tagline:  "Para empresas que precisam de controle total e escala.",
    price:    "Em breve",
    features: [
      "Até 3 números de WhatsApp",
      "Conversas ilimitadas",
      "Detecção de intenção avançada",
      "Painel com contexto completo e CRM básico",
      "Transferência fluida para múltiplos vendedores",
      "Relatórios de tempo de resposta",
      "Suporte prioritário",
    ],
    highlight: true,
  },
  {
    id:       "enterprise",
    name:     "Enterprise",
    tagline:  "Para grandes volumes e integrações com sistemas legados.",
    price:    "Sob consulta",
    features: [
      "Números ilimitados",
      "SLA de disponibilidade (99.9%)",
      "Integração via API com seu ERP/CRM",
      "Regras de roteamento complexas",
      "Gerente de Sucesso (CSM) dedicado",
      "Treinamento da equipe de vendas",
    ],
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Preciso de cartão de crédito para criar a conta?",
    a: "Não. A criação de conta e os primeiros testes de configuração da plataforma não exigem dados de pagamento.",
  },
  {
    q: "A ZapAI usa a API Oficial do WhatsApp?",
    a: "Sim. Toda a infraestrutura roda através da API oficial da Meta (Cloud API), garantindo estabilidade e minimizando riscos de bloqueio numérico.",
  },
  {
    q: "Posso mudar de plano depois?",
    a: "Sim. A transição entre planos pode ser feita a qualquer momento através do seu painel, com o ajuste proporcional na fatura.",
  },
  {
    q: "E se minha equipe não se adaptar?",
    a: "A plataforma é projetada para exigir o mínimo de atrito. Sua equipe usará uma interface muito familiar. Além disso, o botão de 'Assumir Atendimento' devolve o controle instantaneamente para o humano em qualquer caso de dúvida.",
  },
];

export default function LandingPlanos() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="pt-20 font-body bg-white selection:bg-cyan-100 selection:text-cyan-900">
      
      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="pt-24 lg:pt-32 pb-32 px-5 text-center bg-slate-900 border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-white mb-6 tracking-tight leading-[1.1]">
            Planos desenhados para o tamanho da sua operação
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Sem pegadinhas, sem taxas ocultas por mensagem. Escolha o nível de controle que sua equipe precisa.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════ */}
      <section className="pb-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-20">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-8 ${
                plan.highlight 
                  ? "bg-slate-900 border-slate-700 shadow-2xl relative lg:-mt-4 lg:mb-[-1rem] z-10 ring-4 ring-white" 
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-400 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Mais Escolhido
                </div>
              )}
              
              <div className="mb-6">
                <h3 className={`text-2xl font-black mb-2 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <p className={`text-sm leading-relaxed min-h-[40px] ${plan.highlight ? "text-slate-400" : "text-slate-600"}`}>{plan.tagline}</p>
              </div>

              <div className={`mb-8 pb-8 border-b ${plan.highlight ? "border-slate-800" : "border-slate-100"}`}>
                <span className={`text-3xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={18} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-cyan-400" : "text-slate-900"}`} />
                    <span className={`text-sm font-medium ${plan.highlight ? "text-slate-300" : "text-slate-700"}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "enterprise" ? (
                <a href="mailto:contato@zapai.com.br" className="btn-outline w-full mt-auto">
                  Falar com Consultor
                </a>
              ) : (
                <Link to="/cadastro" className={plan.highlight ? "btn-primary w-full mt-auto bg-white text-slate-900 hover:bg-slate-100" : "btn-outline w-full mt-auto"}>
                  Criar conta gratuita
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dúvidas comuns</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition"
                >
                  <span className="font-bold text-slate-900">{q}</span>
                  {openFaq === i ? <Minus size={20} className="text-slate-400" /> : <Plus size={20} className="text-slate-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed text-sm">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 text-center bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
            Pronto para iniciar?
          </h2>
          <Link to="/cadastro" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
            Começar configuração
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}
