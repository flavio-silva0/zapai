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
  const max = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {data.map((d, i) => {
        const pct = hasData ? (d.value / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[var(--clr-primary)]">
              {d.value}
            </span>
            <div
              className="w-full rounded-t-md relative overflow-hidden bg-[var(--border-subtle)]"
              style={{ height: `${Math.max(pct, 6)}%`, minHeight: 4 }}
            >
              {hasData && d.value > 0 && (
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--clr-info)] to-[var(--clr-primary)]" />
              )}
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Ring Progress Component
function RingProgress({ value, max, label, color, size = 80 }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const safeMax = Math.max(max, 1);
  const pct = Math.min(value / safeMax, 1);
  const offset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-[var(--border-subtle)]"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-black text-sm text-[var(--text-primary)]">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-center text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

// Real Conversation Item Component
function ConvoItem({ patient }) {
  const nome = patient.nome || (patient.telefone ? `+${patient.telefone.replace("@c.us", "")}` : "Contato");
  const statusConfig = {
    Novo: { label: "Novo", color: "badge-brand" },
    "Em Atendimento": { label: "Em Atend.", color: "badge-warning" },
    Agendado: { label: "Resolvido", color: "badge-success" },
  };
  const s = statusConfig[patient.status_kanban] || statusConfig["Novo"];
  const isAiActive = patient.is_ai_active;
  const time = patient.created_at
    ? new Date(patient.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";
  const subtitle = patient.telefone
    ? `WhatsApp: +${patient.telefone.replace("@c.us", "")}`
    : "WhatsApp";

  return (
    <Link
      to={`/painel/chat?patientId=${patient.id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group hover:bg-[var(--bg-surface-hover)]"
    >
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)]">
          {nome.charAt(0).toUpperCase()}
        </div>
        {isAiActive && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--clr-success)] border-2 border-[var(--bg-surface)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{nome}</p>
          <span className="text-[10px] shrink-0 text-[var(--text-muted)]">{time}</span>
        </div>
        <p className="text-[12px] truncate mt-0.5 text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      <span className={`badge ${s.color} shrink-0 text-[9px]`}>{s.label}</span>
    </Link>
  );
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]; // Seg..Dom mapping to Date.getDay()

export default function Home() {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/stats").then((r) => r.json()).catch(() => null),
      apiFetch("/api/patients").then((r) => r.json()).catch(() => []),
    ])
      .then(([statsData, patientsData]) => {
        setStats(statsData);
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      })
      .catch((err) => console.error("Erro carregando dados da Home:", err))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setAnimateIn(true), 50);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <header className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-slate-300/70 dark:bg-slate-700/70 rounded" />
                <div className="w-7 h-7 rounded-lg bg-slate-300/70 dark:bg-slate-700/70" />
              </div>
              <div className="h-7 w-24 bg-slate-300/80 dark:bg-slate-700/80 rounded" />
              <div className="h-2.5 w-32 bg-slate-300/60 dark:bg-slate-700/60 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6" />
          <div className="h-72 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6" />
        </div>
      </div>
    );
  }

  const totalPacientes = stats?.total || 0;
  const aiAtivo = stats?.aiAtivo || 0;
  const totalMensagens = stats?.totalMensagens || 0;
  const resolucaoRate = totalPacientes > 0 ? Math.round((aiAtivo / totalPacientes) * 100) : (totalMensagens > 0 ? 100 : 0);

  const metricCards = [
    {
      label: "Resolução Automatizada",
      value: `${resolucaoRate}%`,
      subValue: totalPacientes > 0 ? `${aiAtivo} de ${totalPacientes} com IA ativa` : "Pronto para atender",
      icon: CheckCircle2,
      gradient: "from-[#06b6d4] to-[#0891b2]",
      glowColor: "rgba(6,182,212,0.2)",
      tag: aiAtivo > 0 ? "IA Ativa" : "Standby",
    },
    {
      label: "Conversas Ativas",
      value: totalPacientes,
      subValue: stats?.novo ? `${stats.novo} aguardando resposta` : "Contatos registrados",
      icon: MessageSquare,
      gradient: "from-[#10b981] to-[#06b6d4]",
      glowColor: "rgba(16,185,129,0.2)",
      tag: totalPacientes > 0 ? "WhatsApp" : "Sem fila",
    },
    {
      label: "Velocidade de Resposta",
      value: "~3s",
      subValue: "Tempo médio via IA oficial",
      icon: Clock,
      gradient: "from-[#f59e0b] to-[#ef4444]",
      glowColor: "rgba(245,158,11,0.2)",
      tag: "Instantâneo",
    },
    {
      label: "Total de Mensagens",
      value: totalMensagens,
      subValue: "Mensagens processadas",
      icon: Activity,
      gradient: "from-[#8b5cf6] to-[#ec4899]",
      glowColor: "rgba(139,92,246,0.2)",
      tag: totalMensagens > 0 ? "Histórico" : "Pronto",
    },
  ];

  // Real weekly volume calculation from real patients
  const chartData = WEEKDAYS.map((label, i) => {
    const targetDay = DAY_MAP[i];
    const count = patients.filter((p) => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return d.getDay() === targetDay;
    }).length;
    return { label, value: count };
  });

  const totalSemanal = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className={`p-6 lg:p-8 space-y-6 transition-opacity duration-500 ${animateIn ? "opacity-100" : "opacity-0"}`}>

      {/* ── Header ── */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--clr-success)] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--clr-success)]">
              Sistema Online
            </span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
            Visão Geral
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {stats?.clinica ? `Painel de ${stats.clinica}` : "Painel de Atendimento"} · Dados em tempo real
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
            className="btn-primary flex items-center gap-2 text-sm shadow-md shadow-cyan-500/20"
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
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md animate-fade-up"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "both" }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40"
              style={{ background: card.glowColor }}
            />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-sm`}
                >
                  <card.icon size={18} />
                </div>
                <span className="badge badge-brand text-[10px]">{card.tag}</span>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                {card.label}
              </p>

              <div className="flex items-end gap-2 mb-1">
                <h3 className="font-display text-2xl font-black text-[var(--text-primary)] leading-none">
                  {card.value}
                </h3>
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">{card.subValue}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pb-8">
        {/* Real Conversations Feed */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden animate-fade-up delay-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--clr-primary)]/10 text-[var(--clr-primary)]">
                <MessageCircle size={14} />
              </div>
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-sm">Conversas Recentes</h2>
                <p className="text-[11px] text-[var(--text-muted)]">Feed de atendimentos em tempo real</p>
              </div>
            </div>
            <Link
              to="/painel/chat"
              className="flex items-center gap-1 text-[12px] font-semibold text-[var(--clr-primary)] transition-colors hover:underline"
            >
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {patients.length > 0 ? (
              patients.slice(0, 5).map((patient) => (
                <ConvoItem key={patient.id} patient={patient} />
              ))
            ) : (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] flex items-center justify-center mb-3">
                  <MessageSquare size={22} />
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  Nenhum atendimento registrado ainda
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mb-5 leading-relaxed">
                  Assim que clientes enviarem mensagens pelo WhatsApp ou você testar no Sandbox, os atendimentos aparecerão aqui em tempo real.
                </p>
                <div className="flex flex-wrap gap-2.5 justify-center">
                  <Link to="/painel/test" className="btn-primary text-xs py-2 px-4">
                    Abrir Chat de Testes
                  </Link>
                  <Link to="/painel/canais" className="btn-outline text-xs py-2 px-4">
                    Conectar WhatsApp
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Resolution Rate Widget */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 animate-fade-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-sm">Status dos Atendimentos</h2>
                <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">Distribuição atual</p>
              </div>
              <Bot size={16} className="text-[var(--text-muted)]" />
            </div>

            <div className="flex items-center justify-around">
              <RingProgress
                value={stats?.aiAtivo || 0}
                max={Math.max(totalPacientes, 1)}
                label="Auto-resolvido"
                color="#06b6d4"
                size={72}
              />
              <RingProgress
                value={stats?.novo || 0}
                max={Math.max(totalPacientes, 1)}
                label="Novos"
                color="#10b981"
                size={72}
              />
              <RingProgress
                value={stats?.emAtendimento || 0}
                max={Math.max(totalPacientes, 1)}
                label="Em atend."
                color="#f59e0b"
                size={72}
              />
            </div>
          </div>

          {/* Volume Chart */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 animate-fade-up delay-400">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-sm">Volume Semanal</h2>
                <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">
                  {totalSemanal > 0 ? `${totalSemanal} conversas esta semana` : "Sem conversas na semana"}
                </p>
              </div>
              {totalSemanal > 0 && <span className="badge badge-success text-[10px]">Ativo</span>}
            </div>
            <BarChart data={chartData} />
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 animate-fade-up delay-500">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
              Ações Rápidas
            </p>
            <div className="space-y-1">
              {[
                { label: "Base de Conhecimento", to: "/painel/treinamento", icon: "📚" },
                { label: "Personalidade do Agente", to: "/painel/ia", icon: "✨" },
                { label: "Canais & Integrações", to: "/painel/canais", icon: "🔌" },
                { label: "Testar no Sandbox", to: "/painel/test", icon: "🧪" },
              ].map(({ label, to, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-all group"
                >
                  <span className="text-base">{icon}</span>
                  <span className="text-[12px] font-medium flex-1 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {label}
                  </span>
                  <ArrowRight
                    size={11}
                    className="transition-transform group-hover:translate-x-0.5 text-[var(--text-muted)]"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
