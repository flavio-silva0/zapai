import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import {
  Users, MessageSquare, Activity, TrendingUp,
  ArrowRight, CheckCircle2, Clock, Bot,
  MoreHorizontal, PhoneCall, MessageCircle
} from "lucide-react";

// SVG Bar Chart Component
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--clr-brand-start)" }}>
              {d.value}
            </span>
            <div className="w-full rounded-t-md relative overflow-hidden"
              style={{ height: `${Math.max(pct, 4)}%`, minHeight: 4 }}>
              <div className="absolute inset-0 bar-animate"
                style={{
                  background: `linear-gradient(to top, #7c3aed, #00d4ff)`,
                  animationDelay: `${i * 80}ms`,
                  animationFillMode: "both"
                }} />
            </div>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Ring Progress Component
function RingProgress({ value, max, label, color, size = 80 }) {
  const radius = (size / 2) - 8;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-black text-sm text-[var(--text-primary)]">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-center" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

// Conversation Item Component
function ConvoItem({ name, message, time, status, avatar }) {
  const statusConfig = {
    resolved: { label: "Resolvido", color: "badge-success" },
    active: { label: "Ativo", color: "badge-brand" },
    waiting: { label: "Aguardando", color: "badge-warning" },
  };
  const s = statusConfig[status] || statusConfig.active;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-[var(--clr-primary)]/20 hover:bg-[var(--bg-surface-hover)]">
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})` }}>
          {name.charAt(0)}
        </div>
        {status === "active" && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2"
            style={{ borderColor: "var(--bg-surface)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{name}</p>
          <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{time}</span>
        </div>
        <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{message}</p>
      </div>
      <span className={`badge ${s.color} shrink-0 text-[9px]`}>{s.label}</span>
    </div>
  );
}

const MOCK_CONVOS = [
  { name: "Ana Beatriz", message: "Obrigada! Meu pedido chegou perfeito.", time: "14h23", status: "resolved", avatar: { from: "#7c3aed", to: "#00d4ff" } },
  { name: "Carlos Mendes", message: "Qual é o prazo de entrega para SP?", time: "14h18", status: "active", avatar: { from: "#06d6a0", to: "#22d3ee" } },
  { name: "Juliana Costa", message: "Gostaria de reagendar minha consulta...", time: "13h55", status: "waiting", avatar: { from: "#f59e0b", to: "#ef4444" } },
  { name: "Roberto Silva", message: "O suporte resolveu meu problema!", time: "13h30", status: "resolved", avatar: { from: "#8b5cf6", to: "#ec4899" } },
  { name: "Fernanda Lima", message: "Vocês têm esse produto em azul?", time: "13h10", status: "active", avatar: { from: "#00d4ff", to: "#0ea5e9" } },
];

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Erro stats:", err))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setAnimateIn(true), 50);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium animate-pulse" style={{ color: "var(--text-muted)" }}>
            Carregando painel...
          </p>
        </div>
      </div>
    );
  }

  const total = Math.max(stats?.total || 1, 1);
  const resolucaoRate = stats?.aiAtivo ? Math.round((stats.aiAtivo / total) * 100) : 72;

  const metricCards = [
    {
      label: "Resolução Automatizada",
      value: `${resolucaoRate}%`,
      subValue: `${stats?.aiAtivo || 0} conversas resolvidas`,
      icon: CheckCircle2,
      gradient: "from-[#7c3aed] to-[#00d4ff]",
      glowColor: "rgba(124,58,237,0.25)",
      change: "+4.2%",
      changeUp: true,
    },
    {
      label: "Conversas Ativas",
      value: stats?.total || 0,
      subValue: "em andamento agora",
      icon: MessageSquare,
      gradient: "from-[#06d6a0] to-[#22d3ee]",
      glowColor: "rgba(6,214,160,0.2)",
      change: "+12%",
      changeUp: true,
    },
    {
      label: "Tempo Médio de Resposta",
      value: "1m 42s",
      subValue: "média das últimas 24h",
      icon: Clock,
      gradient: "from-[#f59e0b] to-[#ef4444]",
      glowColor: "rgba(245,158,11,0.2)",
      change: "-18s",
      changeUp: true,
    },
    {
      label: "Total de Mensagens",
      value: stats?.totalMensagens || 0,
      subValue: "trocadas no período",
      icon: Activity,
      gradient: "from-[#8b5cf6] to-[#ec4899]",
      glowColor: "rgba(139,92,246,0.2)",
      change: "+23%",
      changeUp: true,
    },
  ];

  const chartData = WEEKDAYS.map((label, i) => ({
    label,
    value: [28, 42, 38, 55, 47, 31, 19][i]
  }));

  return (
    <div className={`p-6 lg:p-8 space-y-6 transition-opacity duration-500 ${animateIn ? "opacity-100" : "opacity-0"}`}>

      {/* ── Header ── */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#06d6a0" }}>
              Sistema Online
            </span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
            Visão Geral
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {stats?.clinica ? `Painel de ${stats.clinica}` : "Painel de Controle"} · Dados em tempo real
          </p>
        </div>

        <div className="flex items-center gap-3 self-start mt-1">
          <Link
            to="/painel/analytics"
            id="home-view-analytics"
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <TrendingUp size={15} />
            Ver Relatórios
          </Link>
          <Link
            to="/painel/chat"
            id="home-go-chat"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <MessageSquare size={15} />
            Ver Mensagens
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div
            key={i}
            id={`stat-card-${i}`}
            className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-lg hover:border-[var(--border-strong)] animate-fade-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            {/* Glow orb */}
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-60"
              style={{ background: card.glowColor }} />

            <div className="relative">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-3 shadow-md`}>
                <card.icon size={18} />
              </div>

              {/* Label */}
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                {card.label}
              </p>

              {/* Value */}
              <div className="flex items-end gap-2 mb-1">
                <h3 className="font-display text-2xl font-black text-[var(--text-primary)] leading-none">
                  {card.value}
                </h3>
                <span className="text-[11px] font-bold mb-0.5 flex items-center gap-0.5"
                  style={{ color: card.changeUp ? "#06d6a0" : "#ef4444" }}>
                  {card.changeUp ? "↑" : "↓"} {card.change}
                </span>
              </div>

              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{card.subValue}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-8">

        {/* Conversations Feed */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl overflow-hidden animate-fade-up delay-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,212,255,0.2))" }}>
                <MessageCircle size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-sm">Conversas Recentes</h2>
                <p className="text-[11px] text-[var(--text-muted)]">Feed de atendimentos em tempo real</p>
              </div>
            </div>
            <Link
              to="/painel/chat"
              className="flex items-center gap-1 text-[12px] font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--clr-brand-start)" }}
            >
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y" style={{ divideColor: "var(--border-subtle)" }}>
            {MOCK_CONVOS.map((c, i) => (
              <ConvoItem key={i} {...c} />
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Resolution Rate Widget */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 animate-fade-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-sm">Taxa de Resolução</h2>
                <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">Últimos 7 dias</p>
              </div>
              <Bot size={16} className="text-[var(--text-muted)]" />
            </div>

            <div className="flex items-center justify-around">
              <RingProgress value={resolucaoRate} max={100} label="Auto-resolvido" color="#7c3aed" size={72} />
              <RingProgress value={stats?.novo || 0} max={total} label="Novos" color="#00d4ff" size={72} />
              <RingProgress value={stats?.emAtendimento || 0} max={total} label="Em atend." color="#f59e0b" size={72} />
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 animate-fade-up delay-400">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-sm">Volume Semanal</h2>
                <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">Conversas por dia</p>
              </div>
              <span className="badge badge-success text-[10px]">↑ 12%</span>
            </div>
            <BarChart data={chartData} />
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-4 animate-fade-up delay-500">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">Ações Rápidas</p>
            <div className="space-y-1.5">
              {[
                { label: "Base de Conhecimento", to: "/painel/treinamento", icon: "📚" },
                { label: "Personalidade do Agente", to: "/painel/ia", icon: "✨" },
                { label: "Canais & Integrações", to: "/painel/canais", icon: "🔌" },
              ].map(({ label, to, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-transparent hover:border-[var(--clr-primary)]/20 hover:bg-[var(--bg-surface-hover)] transition-all group"
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-[12px] font-medium flex-1 text-[var(--text-secondary)]">
                    {label}
                  </span>
                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5 text-[var(--text-muted)]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
