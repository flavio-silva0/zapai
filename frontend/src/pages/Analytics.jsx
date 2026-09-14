import { useState, useEffect } from "react";
import {
  TrendingUp, MessageSquare, Clock, Star, Download,
  BarChart2, ArrowUp, ArrowDown, Users, Zap, RefreshCw, Activity
} from "lucide-react";
import { apiFetch } from "../api";

// Line Chart SVG
function LineChart({ data, color = "#06b6d4" }) {
  const safeData = data && data.length > 1 ? data : [0, 0];
  const w = 100, h = 60;
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData);
  const range = max - min || 1;
  const points = safeData.map((v, i) => {
    const x = (i / (safeData.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const fillPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g, "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Donut chart SVG
function DonutChart({ segments, size = 100 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((acc, s) => acc + s.value, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" className="text-[var(--border-subtle)]" strokeWidth="10" />
      {segments.map((seg, i) => {
        const pct = total > 0 ? (seg.value / total) * 100 : 0;
        const dashArray = (pct / 100) * circumference;
        const currentOffset = segments.slice(0, i).reduce((acc, s) => {
          const sPct = total > 0 ? (s.value / total) * 100 : 0;
          return acc + (sPct / 100) * circumference;
        }, 0);
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 1s ease" }}
          />
        );
      })}
    </svg>
  );
}

// Metric card with sparkline
function MetricCard({ label, value, subtext, sparkData, color, icon: Icon }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-md animate-fade-up">
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--clr-primary)]/15 text-[var(--clr-primary)]">
            <Icon size={16} />
          </div>
          <span className="badge badge-brand text-[10px]">{subtext}</span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
          {label}
        </p>
        <p className="font-display font-black text-2xl text-[var(--text-primary)] mb-3">{value}</p>
        <div className="h-10">
          <LineChart data={sparkData} color={color} />
        </div>
      </div>
    </div>
  );
}

const PERIODS = ["7 dias", "30 dias", "90 dias"];

export default function Analytics() {
  const [period, setPeriod] = useState("7 dias");
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/stats").then((r) => r.json()).catch(() => null),
      apiFetch("/api/patients").then((r) => r.json()).catch(() => []),
    ])
      .then(([statsData, patientsData]) => {
        setStats(statsData);
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      })
      .catch((err) => console.error("Erro analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  const total = stats?.total || 0;
  const aiAtivo = stats?.aiAtivo || 0;
  const automacaoRate = total > 0 ? Math.round((aiAtivo / total) * 100) : 0;
  const totalMensagens = stats?.totalMensagens || 0;

  // Real volume for last 14 days
  const dailyCounts = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const dateStr = d.toISOString().split("T")[0];
    const count = patients.filter((p) => p.created_at && p.created_at.startsWith(dateStr)).length;
    return count;
  });

  const maxVolume = Math.max(...dailyCounts, 1);

  // Kanban status segments (UX-005: separar dimensões claramente)
  const agendadosCount = patients.filter((p) => {
    const s = String(p.status_kanban || "").toLowerCase();
    return s.includes("agendad") || s.includes("convertid") || s.includes("concluid");
  }).length || stats?.agendado || 0;

  const agendamentoRate = total > 0 ? Math.round((agendadosCount / total) * 100) : 0;

  const novosCount = patients.filter((p) => {
    const s = String(p.status_kanban || "").toLowerCase();
    return s.includes("novo");
  }).length || stats?.novo || 0;

  const emAtendimentoCount = patients.filter((p) => {
    const s = String(p.status_kanban || "").toLowerCase();
    return s.includes("atendimento");
  }).length || stats?.emAtendimento || 0;

  const humanoCount = patients.filter((p) => p.is_ai_active === false).length;

  const statusSegments = [
    { label: "Novos Contatos", value: novosCount, color: "#10b981" },
    { label: "Em Atendimento", value: emAtendimentoCount, color: "#06b6d4" },
    { label: "Agendados", value: agendadosCount, color: "#8b5cf6" },
    { label: "Atendimento Humano", value: humanoCount, color: "#f59e0b" },
  ];

  const metrics = [
    {
      label: "Volume de Atendimentos",
      value: String(total),
      subtext: "Total cadastrado",
      sparkData: dailyCounts.slice(-7),
      color: "#06b6d4",
      icon: MessageSquare,
    },
    {
      label: "Taxa de Automação IA",
      value: `${automacaoRate}%`,
      subtext: `${aiAtivo} sob condução IA`,
      sparkData: [automacaoRate, automacaoRate],
      color: "#10b981",
      icon: Zap,
    },
    {
      label: "Taxa de Agendamento",
      value: `${agendamentoRate}%`,
      subtext: `${agendadosCount} agendados/convertidos`,
      sparkData: [agendamentoRate, agendamentoRate],
      color: "#8b5cf6",
      icon: Clock,
    },
    {
      label: "Total de Mensagens",
      value: String(totalMensagens),
      subtext: "Trocadas no WhatsApp",
      sparkData: dailyCounts,
      color: "#f59e0b",
      icon: Activity,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#06d6a0" }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#06d6a0" }}>
              Performance de Conversão
            </span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
            Análise & Relatórios
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Acompanhe o desempenho do seu atendimento e identifique oportunidades de melhoria
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-surface-active)] border border-[var(--border-medium)]">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${period === p ? "bg-[var(--clr-primary)] text-white" : "text-[var(--text-muted)]"}`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Export buttons */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] text-[var(--text-secondary)]">
            <Download size={13} />
            PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] text-[var(--text-secondary)]">
            <Download size={13} />
            CSV
          </button>
        </div>
      </header>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>

      {/* ── Volume Chart ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 animate-fade-up delay-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[var(--text-primary)] font-bold text-base">Volume de Conversas</h2>
            <p className="text-[12px] mt-0.5 text-[var(--text-muted)]">
              Distribuição diária nos últimos 14 dias
            </p>
          </div>
          <span className="badge badge-brand text-[10px]">
            {dailyCounts.reduce((a, b) => a + b, 0)} conversas no período
          </span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-40">
          {dailyCounts.map((v, i) => {
            const pct = (v / maxVolume) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                <span className="text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-[var(--clr-primary)]">
                  {v}
                </span>
                <div className="w-full relative group-hover:scale-y-105 transition-transform origin-bottom">
                  <div
                    className="rounded-t-lg w-full overflow-hidden relative bg-[var(--border-subtle)]"
                    style={{ height: `${Math.max(pct, 6)}%`, minHeight: 4 }}
                  >
                    {v > 0 && (
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-[var(--clr-info)] to-[var(--clr-primary)]"
                      />
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-[var(--text-muted)]">D{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-8">
        {/* Top Questions / Categorias */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 animate-fade-up delay-400">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-base">Perguntas Mais Frequentes</h2>
              <p className="text-[12px] mt-0.5 text-[var(--text-muted)]">
                Agrupamento inteligente por IA
              </p>
            </div>
            <MessageSquare size={16} className="text-[var(--text-muted)]" />
          </div>

          {total > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[var(--text-primary)]">Dúvidas gerais de atendimento</span>
                  <span className="font-bold text-[var(--clr-primary)]">{total} interações</span>
                </div>
                <div className="w-full bg-[var(--border-subtle)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--clr-primary)] h-full rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] flex items-center justify-center mb-2">
                <MessageSquare size={18} />
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Sem dados de perguntas ainda</p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs mt-1 leading-relaxed">
                As dúvidas mais frequentes dos clientes serão agrupadas automaticamente conforme as conversas forem ocorrendo via WhatsApp.
              </p>
            </div>
          )}
        </div>

        {/* Status Breakdown Widget */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 animate-fade-up delay-500">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-base">Status dos Atendimentos</h2>
              <p className="text-[12px] mt-0.5 text-[var(--text-muted)]">
                Distribuição de contatos por estágio
              </p>
            </div>
            <BarChart2 size={16} className="text-[var(--clr-primary)]" />
          </div>

          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0">
              <DonutChart segments={statusSegments} size={120} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-black text-xl text-[var(--text-primary)]">{total}</span>
                <span className="text-[10px] text-[var(--text-muted)]">contatos</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5">
              {statusSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-[12px] text-[var(--text-secondary)]">{seg.label}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">
                    {seg.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
