import { useState } from "react";
import {
  TrendingUp, MessageSquare, Clock, Star, Download,
  BarChart2, ArrowUp, ArrowDown, Users, Zap, RefreshCw
} from "lucide-react";

// Line Chart SVG
function LineChart({ data, color = "#7c3aed" }) {
  const w = 100, h = 60;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  const fillPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Donut chart SVG
function DonutChart({ segments, size = 100 }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2, cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      {segments.map((seg, i) => {
        const dashArray = (seg.pct / 100) * circumference;
        const currentOffset = segments.slice(0, i).reduce((acc, s) => acc + ((s.pct / 100) * circumference), 0);
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
function MetricCard({ label, value, change, changeUp, sparkData, color, icon: Icon }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 relative overflow-hidden transition-all hover:shadow-lg hover:border-[var(--border-strong)] animate-fade-up">
      <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(ellipse at top right, ${color}15, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}22`, border: `1px solid ${color}33`, color: "var(--text-primary)" }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className={`text-[11px] font-bold flex items-center gap-0.5`}
            style={{ color: changeUp ? "#06d6a0" : "#ef4444" }}>
            {changeUp ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {change}
          </span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
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

const TOP_QUESTIONS = [
  { q: "Qual é o horário de funcionamento?", count: 412, pct: 100 },
  { q: "Como faço para agendar?", count: 287, pct: 70 },
  { q: "Vocês aceitam cartão de crédito?", count: 234, pct: 57 },
  { q: "Qual é o prazo de entrega?", count: 189, pct: 46 },
  { q: "Posso cancelar meu pedido?", count: 143, pct: 35 },
  { q: "Têm desconto para pagamento à vista?", count: 98, pct: 24 },
  { q: "Como funciona a garantia?", count: 76, pct: 18 },
];

const VOLUME_DATA = [28, 42, 38, 55, 47, 51, 39, 62, 58, 44, 67, 71, 48, 55];
const RESPONSE_DATA = [3.2, 2.8, 2.5, 2.1, 1.9, 2.2, 1.8, 1.7, 1.5, 1.9, 1.4, 1.8, 1.6, 1.7];
const CSAT_DATA = [4.2, 4.5, 4.3, 4.6, 4.8, 4.7, 4.9, 4.6, 4.8, 4.7, 4.9, 4.8, 4.9, 4.8];

const CSAT_SEGMENTS = [
  { label: "Excelente", pct: 62, color: "#06d6a0" },
  { label: "Bom", pct: 21, color: "#00d4ff" },
  { label: "Regular", pct: 11, color: "#f59e0b" },
  { label: "Ruim", pct: 6, color: "#ef4444" },
];

export default function Analytics() {
  const [period, setPeriod] = useState("7 dias");

  const metrics = [
    { label: "Volume de Conversas", value: "1.284", change: "+18%", changeUp: true, sparkData: VOLUME_DATA, color: "#7c3aed", icon: MessageSquare },
    { label: "Resolução Automatizada", value: "72%", change: "+4.2%", changeUp: true, sparkData: [60, 65, 70, 68, 72, 69, 72], color: "#06d6a0", icon: Zap },
    { label: "Tempo Médio de Resp.", value: "1m 42s", change: "-18s", changeUp: true, sparkData: RESPONSE_DATA, color: "#00d4ff", icon: Clock },
    { label: "Satisfação (CSAT)", value: "4.8/5", change: "+0.3", changeUp: true, sparkData: CSAT_DATA, color: "#f59e0b", icon: Star },
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
      <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 animate-fade-up delay-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[var(--text-primary)] font-bold text-base">Volume de Conversas</h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Distribuição diária no período selecionado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success text-[10px]">↑ 18% vs período anterior</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-40">
          {VOLUME_DATA.map((v, i) => {
            const max = Math.max(...VOLUME_DATA);
            const pct = (v / max) * 100;
            const days = ["S","T","Q","Q","S","S","D","S","T","Q","Q","S","S","D"];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-full relative group-hover:scale-y-105 transition-transform origin-bottom">
                  <div className="rounded-t-lg w-full overflow-hidden relative"
                    style={{ height: `${Math.max(pct, 4)}%`, minHeight: 4 }}>
                    <div className="absolute inset-0 bar-animate"
                      style={{
                        background: i === VOLUME_DATA.length - 1
                          ? "linear-gradient(to top, #7c3aed, #00d4ff)"
                          : "linear-gradient(to top, rgba(124,58,237,0.7), rgba(0,212,255,0.5))",
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: "both"
                      }} />
                  </div>
                </div>
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{days[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-8">

        {/* Top Questions */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 animate-fade-up delay-400">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-base">Perguntas Mais Frequentes</h2>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                O que seus clientes mais perguntam
              </p>
            </div>
            <MessageSquare size={16} style={{ color: "var(--text-muted)" }} />
          </div>

          <div className="space-y-3">
            {TOP_QUESTIONS.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-[11px] font-black shrink-0 mt-0.5 font-display"
                      style={{ color: i === 0 ? "#a78bfa" : "var(--text-muted)" }}>
                      #{i + 1}
                    </span>
                    <p className="text-[12px] truncate" style={{ color: "var(--text-primary)" }}>
                      {q.q}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold shrink-0" style={{ color: "var(--text-muted)" }}>
                    {q.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full bar-animate"
                    style={{
                      width: `${q.pct}%`,
                      background: i === 0 ? "linear-gradient(90deg, #7c3aed, #00d4ff)" : "rgba(124,58,237,0.4)",
                      animationDelay: `${i * 80}ms`,
                      animationFillMode: "both"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CSAT Widget */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 animate-fade-up delay-500">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-base">Satisfação do Cliente</h2>
              <p className="text-[12px] mt-0.5 text-[var(--text-muted)]">
                CSAT — Customer Satisfaction Score
              </p>
            </div>
            <Star size={16} style={{ color: "#f59e0b" }} />
          </div>

          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0">
              <DonutChart segments={CSAT_SEGMENTS} size={120} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-black text-xl text-[var(--text-primary)]">4.8</span>
                <span className="text-[10px] text-[var(--text-muted)]">/ 5.0</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5">
              {CSAT_SEGMENTS.map((seg, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]" style={{ width: 60 }}>
                      <div className="h-full rounded-full bar-animate" style={{ width: `${seg.pct}%`, background: seg.color }} />
                    </div>
                    <span className="text-[11px] font-bold w-8 text-right" style={{ color: "var(--text-muted)" }}>
                      {seg.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stars display */}
          <div className="mt-5 pt-4 flex items-center gap-2 border-t border-[var(--border-subtle)]">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={16} fill={s <= 4.8 ? "var(--clr-warning)" : "none"} className="text-[var(--clr-warning)]" />
              ))}
            </div>
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">4.8</span>
            <span className="text-[12px] text-[var(--text-muted)]">
              · Baseado em 1.284 avaliações no período
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
