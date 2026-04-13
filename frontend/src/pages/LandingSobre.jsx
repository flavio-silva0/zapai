import { Link } from "react-router-dom";
import {
  Target, Lightbulb, Heart, ArrowRight,
  Users, MessageSquare, Globe
} from "lucide-react";

const VALUES = [
  {
    icon: <Target size={22} />,
    color: "from-indigo-500 to-violet-500",
    title: "Foco em Resultados",
    desc: "Cada funcionalidade é construída para gerar retorno real. Sem floreios — apenas o que funciona.",
  },
  {
    icon: <Lightbulb size={22} />,
    color: "from-amber-500 to-orange-500",
    title: "Inovação Contínua",
    desc: "Acompanhamos os avanços em IA de perto, trazendo as melhores tecnologias para nossos clientes.",
  },
  {
    icon: <Heart size={22} />,
    color: "from-rose-500 to-pink-500",
    title: "Feito com Cuidado",
    desc: "Cada detalhe da plataforma é pensado para facilitar a vida do empreendedor brasileiro.",
  },
];

const STATS = [
  { icon: <Users size={22} />,        value: "100+",  label: "Clientes ativos",          color: "text-indigo-400" },
  { icon: <MessageSquare size={22} />, value: "50k+",  label: "Mensagens processadas",    color: "text-violet-400" },
  { icon: <Globe size={22} />,         value: "99.8%", label: "Uptime garantido",          color: "text-cyan-400" },
];

export default function LandingSobre() {
  return (
    <div className="pt-20 overflow-x-hidden">

      {/* ── Orbs de fundo ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section id="sobre-hero" className="relative py-24 px-5 text-center bg-grid">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          Sobre nós
        </span>
        <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-6">
          Construindo o futuro<br />
          <span className="gradient-text">do atendimento</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
          Somos uma startup brasileira apaixonada por Inteligência Artificial e comunicação.
          Nascemos com um objetivo claro: tornar o atendimento inteligente acessível para qualquer negócio.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════
          MISSÃO / VISÃO
      ══════════════════════════════════════════════════════ */}
      <section id="sobre-missao" className="py-20 px-5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Missão */}
          <div className="relative glass rounded-2xl p-10 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-indigo-600/20 blur-3xl" />
            <div className="relative">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 px-2 py-1 rounded-full bg-indigo-500/10">
                Nossa Missão
              </span>
              <h2 className="font-display text-3xl font-black text-white mb-4">
                Democratizar a IA no atendimento
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Acreditamos que toda empresa — do microempreendedor ao grande negócio — merece ter
                um assistente inteligente disponível 24 horas. Nossa missão é tornar isso possível
                de forma simples, rápida e acessível.
              </p>
            </div>
          </div>

          {/* Visão */}
          <div className="relative glass rounded-2xl p-10 overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="relative">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 px-2 py-1 rounded-full bg-violet-500/10">
                Nossa Visão
              </span>
              <h2 className="font-display text-3xl font-black text-white mb-4">
                Ser referência em IA conversacional
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Queremos que o ZapAI seja o primeiro nome que vem à mente quando se fala em
                atendimento automatizado no Brasil — com a melhor tecnologia, o melhor suporte
                e os melhores resultados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section id="sobre-stats" className="py-16 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {STATS.map(({ icon, value, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className={`${color} opacity-80`}>{icon}</div>
              <p className={`font-display text-5xl font-black ${color}`}>{value}</p>
              <p className="text-slate-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          VALORES
      ══════════════════════════════════════════════════════ */}
      <section id="sobre-valores" className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-400 mb-4 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              Nossos valores
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white">
              O que nos <span className="gradient-text">move</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map(({ icon, color, title, desc }) => (
              <div key={title} className="glass glass-hover rounded-2xl p-8 text-center group transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HISTORIA
      ══════════════════════════════════════════════════════ */}
      <section id="sobre-historia" className="py-20 px-5 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-black text-white mb-6">
            Nossa <span className="gradient-text">história</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-6">
            O ZapAI nasceu da frustração de ver empresas perderem clientes por demora no
            atendimento ou ausência fora do horário comercial. Fundado por empreendedores que
            viveram esse problema na prática, desenvolvemos uma solução que combina o poder das
            LLMs mais modernas com a ubiquidade do WhatsApp.
          </p>
          <p className="text-slate-400 text-lg leading-relaxed">
            Hoje, ajudamos centenas de negócios a escalar seu atendimento sem aumentar a equipe —
            e continuamos evoluindo, guiados pelo feedback dos nossos clientes.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════ */}
      <section id="sobre-cta" className="py-24 px-5 text-center">
        <div className="max-w-xl mx-auto glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-violet-600/5 rounded-3xl pointer-events-none" />
          <h2 className="relative font-display text-3xl font-black text-white mb-4">
            Faça parte dessa história
          </h2>
          <p className="relative text-slate-400 mb-8">
            Crie sua conta e comece a automatizar hoje.
          </p>
          <Link
            to="/cadastro"
            id="sobre-cta-btn"
            className="relative btn-primary inline-flex items-center gap-2"
          >
            Começar agora
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
