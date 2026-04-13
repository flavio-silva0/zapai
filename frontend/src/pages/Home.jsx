import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import {
  Users, Bot, MessageSquare, Activity, TrendingUp,
  ArrowRight, Zap, KanbanSquare, FlaskConical
} from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Erro stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <Zap size={20} className="text-white" />
          </div>
          <p className="text-slate-500 text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  const total = Math.max(stats?.total || 1, 1);

  const cards = [
    {
      label: "Total de Contatos",
      value: stats?.total || 0,
      icon: Users,
      gradient: "from-indigo-500 to-violet-600",
      glow: "rgba(99,102,241,0.3)",
      change: "+12%",
    },
    {
      label: "Atendimentos via IA",
      value: stats?.aiAtivo || 0,
      icon: Bot,
      gradient: "from-emerald-500 to-teal-500",
      glow: "rgba(16,185,129,0.3)",
      change: "+8%",
    },
    {
      label: "Total de Mensagens",
      value: stats?.totalMensagens || 0,
      icon: MessageSquare,
      gradient: "from-violet-500 to-fuchsia-600",
      glow: "rgba(139,92,246,0.3)",
      change: "+23%",
    },
    {
      label: "Novos Contatos",
      value: stats?.novo || 0,
      icon: Activity,
      gradient: "from-rose-500 to-pink-600",
      glow: "rgba(239,68,68,0.3)",
      change: "+5%",
    },
  ];

  const kanbanCols = [
    {
      label: "Novos",
      value: stats?.novo || 0,
      dot: "bg-slate-400",
      bar: "bg-gradient-to-r from-slate-400 to-slate-500",
      textColor: "text-slate-400",
    },
    {
      label: "Em Atendimento",
      value: stats?.emAtendimento || 0,
      dot: "bg-amber-400",
      bar: "bg-gradient-to-r from-amber-400 to-orange-500",
      textColor: "text-amber-400",
    },
    {
      label: "Agendados",
      value: stats?.agendado || 0,
      dot: "bg-emerald-400",
      bar: "bg-gradient-to-r from-emerald-400 to-teal-500",
      textColor: "text-emerald-400",
    },
  ];

  return (
    <div className="p-8 overflow-y-auto space-y-8">

      {/* ── Header ── */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              Sistema Online
            </span>
          </div>
          <h1 className="font-display text-3xl font-black text-white mb-1">
            Visão Geral
          </h1>
          <p className="text-slate-500 text-sm">
            {stats?.clinica ? `Painel de ${stats.clinica}` : "Painel de Controle"} · Dados em tempo real
          </p>
        </div>
        <Link
          to="/painel/chat"
          id="home-go-chat"
          className="btn-primary flex items-center gap-2 text-sm py-2.5 px-5 self-start mt-1"
        >
          Ver mensagens
          <ArrowRight size={15} />
        </Link>
      </header>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <div
            key={i}
            id={`stat-card-${i}`}
            className="glass glass-hover rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group cursor-default"
          >
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: card.glow }}
            />
            <div className="relative">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                <card.icon size={20} />
              </div>
              <p className="text-slate-500 text-xs font-medium mb-1">{card.label}</p>
              <div className="flex items-end gap-2">
                <h3 className="font-display text-3xl font-black text-white">{card.value}</h3>
                <span className="text-emerald-400 text-xs font-semibold mb-1 flex items-center gap-0.5">
                  <TrendingUp size={11} />
                  {card.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">

        {/* Kanban Status */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-lg">Status do Kanban</h2>
              <p className="text-slate-500 text-xs mt-0.5">Distribuição de atendimentos</p>
            </div>
            <Link
              to="/painel/kanban"
              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition"
            >
              Ver Kanban <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-5">
            {kanbanCols.map(({ label, value, dot, bar, textColor }) => {
              const pct = Math.max(2, (value / total) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      <span className="text-slate-300 text-sm font-medium">{label}</span>
                    </div>
                    <span className={`${textColor} font-bold text-sm`}>{value}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className={`h-full rounded-full ${bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-1">Ações Rápidas</h2>
          <p className="text-slate-500 text-xs mb-5">Acesse as principais áreas</p>

          <div className="space-y-2">
            {[
              { label: "Abrir Mensagens",  to: "/painel/chat",   icon: MessageSquare, color: "from-indigo-500 to-violet-600" },
              { label: "Quadro Kanban",    to: "/painel/kanban", icon: KanbanSquare,  color: "from-amber-500 to-orange-500"  },
              { label: "Testar Assistente", to: "/painel/test",  icon: FlaskConical,  color: "from-cyan-500 to-blue-500"     },
              { label: "Meu Perfil",       to: "/painel/perfil", icon: Users,         color: "from-emerald-500 to-teal-500"  },
            ].map(({ label, to, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-indigo-500/25 hover:bg-indigo-500/5 transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon size={15} />
                </div>
                <span className="text-slate-400 group-hover:text-white text-sm font-medium transition-colors flex-1">
                  {label}
                </span>
                <ArrowRight size={13} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
