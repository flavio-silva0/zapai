import { Link } from "react-router-dom";
import {
  MessageSquare, Bot, Zap, BarChart3, Shield, Clock,
  ChevronRight, ArrowRight, CheckCircle2, Star
} from "lucide-react";

/* ─── Features ──────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Bot size={24} />,
    color: "from-indigo-500 to-violet-500",
    title: "IA Conversacional",
    desc:  "Seu agente aprende o contexto do negócio e responde com naturalidade, 24 horas por dia.",
  },
  {
    icon: <MessageSquare size={24} />,
    color: "from-emerald-500 to-teal-500",
    title: "WhatsApp Nativo",
    desc:  "Integração direta via API oficial do WhatsApp — sem instabilidades nem banimentos.",
  },
  {
    icon: <BarChart3 size={24} />,
    color: "from-violet-500 to-fuchsia-500",
    title: "Painel de Controle",
    desc:  "Kanban visual, histórico de conversas e métricas em tempo real para sua equipe.",
  },
  {
    icon: <Zap size={24} />,
    color: "from-amber-500 to-orange-500",
    title: "Respostas Instantâneas",
    desc:  "Debounce inteligente que combina mensagens consecutivas antes de responder.",
  },
  {
    icon: <Shield size={24} />,
    color: "from-cyan-500 to-blue-500",
    title: "Multi-Tenant Seguro",
    desc:  "Cada cliente tem seu ambiente isolado, com autenticação JWT e permissões granulares.",
  },
  {
    icon: <Clock size={24} />,
    color: "from-rose-500 to-pink-500",
    title: "Disponível 24/7",
    desc:  "Nunca perca um lead. Seu atendimento funciona enquanto você dorme.",
  },
];

/* ─── Steps ─────────────────────────────────────────────── */
const STEPS = [
  { n: "01", title: "Crie sua conta",       desc: "Cadastro simples e rápido. Em minutos você já está dentro da plataforma." },
  { n: "02", title: "Configure seu agente", desc: "Defina a personalidade, as respostas e o escopo do seu assistente de IA." },
  { n: "03", title: "Conecte o WhatsApp",  desc: "Vincule seu número via API oficial do Meta e comece a atender." },
  { n: "04", title: "Suba os resultados",  desc: "Acompanhe métricas, gerencie conversas e escale sem esforço." },
];

/* ─── Logos Section ──────────────────────────────────────── */
const METRICS = [
  { value: "10k+",  label: "Mensagens processadas" },
  { value: "98%",   label: "Satisfação dos clientes" },
  { value: "24/7",  label: "Disponibilidade" },
  { value: "< 2s",  label: "Tempo de resposta" },
];

export default function LandingHome() {
  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 bg-grid"
      >
        {/* Mesh blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-600/20 to-violet-600/15 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 left-10 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-0 right-10 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px] animate-pulse-glow" style={{ animationDelay: "0.75s" }} />
        </div>

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-indigo-500/20 mb-8 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
            IA para WhatsApp — Disponível agora
          </span>
        </div>

        {/* Headline */}
        <h1
          className="relative font-display text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          Seu negócio<br />
          <span className="gradient-text">atendendo 24/7</span><br />
          com IA
        </h1>

        <p
          className="relative text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          O ZapAI transforma o WhatsApp do seu negócio em uma máquina de atendimento inteligente —
          automatizada, personalizada e sempre disponível.
        </p>

        {/* CTAs */}
        <div
          className="relative flex flex-col sm:flex-row gap-4 justify-center animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link to="/cadastro" id="hero-cta-primary" className="btn-primary flex items-center gap-2 justify-center">
            Começar gratuitamente
            <ArrowRight size={16} />
          </Link>
          <Link to="/planos" id="hero-cta-planos" className="btn-outline flex items-center gap-2 justify-center">
            Ver planos
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Social proof stars */}
        <div className="relative flex items-center gap-2 mt-10 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex -space-x-2">
            {["bg-indigo-500","bg-violet-500","bg-cyan-500","bg-pink-500"].map((c, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-[#060e1a] flex items-center justify-center text-xs font-bold text-white`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="flex gap-0.5 ml-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
          </div>
          <span className="text-slate-400 text-sm">+100 clientes satisfeitos</span>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-soft text-slate-600">
          <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-indigo-400 animate-pulse" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          METRICS
      ══════════════════════════════════════════════════════ */}
      <section id="metrics" className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8">
          {METRICS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl font-black gradient-text mb-1">{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-5">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Funcionalidades
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
              Tudo que você precisa,<br />
              <span className="gradient-text">em um só lugar</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Da IA conversacional até o painel de gestão — o ZapAI cobre todo o ciclo de atendimento.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, color, title, desc }) => (
              <div
                key={title}
                className="glass glass-hover rounded-2xl p-6 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-5 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
              Como funciona
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
              Comece em <span className="gradient-text">4 passos simples</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map(({ n, title, desc }, i) => (
              <div
                key={n}
                className="glass glass-hover rounded-2xl p-8 flex gap-6 items-start"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="font-display text-4xl font-black gradient-text opacity-60 shrink-0 leading-none">
                  {n}
                </span>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section id="final-cta" className="py-24 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative glass rounded-3xl p-12 overflow-hidden">
            {/* Glow bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/8 to-transparent pointer-events-none rounded-3xl" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-600/15 blur-[80px] pointer-events-none" />

            <span className="relative inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              Pronto para começar?
            </span>
            <h2 className="relative font-display text-4xl md:text-5xl font-black text-white mb-4">
              Automatize seu atendimento<br />
              <span className="gradient-text">hoje mesmo</span>
            </h2>
            <p className="relative text-slate-400 mb-8 text-lg">
              Junte-se a centenas de negócios que já estão escalando com o ZapAI.
            </p>

            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro" id="final-cta-btn" className="btn-primary flex items-center gap-2 justify-center">
                Criar minha conta grátis
                <ArrowRight size={16} />
              </Link>
              <Link to="/planos" id="final-planos-btn" className="btn-outline flex items-center gap-2 justify-center">
                Comparar planos
              </Link>
            </div>

            <p className="relative text-slate-600 text-xs mt-6">
              Sem cartão de crédito · Configuração em minutos
            </p>

            {/* Checkmarks */}
            <div className="relative flex flex-wrap justify-center gap-4 mt-8">
              {["Suporte via WhatsApp", "IA personalizada", "Painel em tempo real"].map(item => (
                <div key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
