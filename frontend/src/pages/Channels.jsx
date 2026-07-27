import { useState } from "react";
import {
  Smartphone, Plug, CheckCircle2, AlertCircle, ExternalLink,
  Plus, RefreshCw, Settings, Zap, ShoppingBag, Mail, Calendar,
  BarChart2, MessageSquare, Globe
} from "lucide-react";

function StatusDot({ connected }) {
  return (
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${connected ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
  );
}

function IntegrationCard({ name, description, icon: Icon, iconBg, connected, badge, comingSoon, onClick }) {
  return (
    <div
      onClick={!comingSoon ? onClick : undefined}
      className={`bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 flex flex-col gap-4 transition-all hover:bg-[var(--bg-surface-hover)] ${comingSoon ? "opacity-50" : "cursor-pointer"}`}
      style={{
        borderColor: connected ? "rgba(6,214,160,0.25)" : "var(--border-medium)",
        background: connected ? "rgba(6,214,160,0.03)" : "var(--bg-surface)"
      }}
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: iconBg || "rgba(124,58,237,0.15)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {typeof Icon === "string" ? Icon : <Icon size={22} className="text-[var(--text-primary)]" />}
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className="badge badge-brand text-[9px]">{badge}</span>}
          {comingSoon && <span className="badge badge-warning text-[9px]">Em Breve</span>}
          <StatusDot connected={connected} />
        </div>
      </div>

      <div>
        <p className="text-[var(--text-primary)] font-bold text-sm mb-1">{name}</p>
        <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">{description}</p>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <span className={`badge text-[10px] ${connected ? "badge-success" : ""}`}
          style={!connected ? { background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" } : {}}>
          {connected ? "Conectado" : comingSoon ? "Indisponível" : "Desconectado"}
        </span>
        {!comingSoon && (
          <button className="text-[11px] font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: connected ? "#06d6a0" : "#a78bfa" }}>
            {connected ? <><Settings size={11} />Gerenciar</> : <><Plus size={11} />Conectar</>}
          </button>
        )}
      </div>
    </div>
  );
}

const INTEGRATIONS = [
  {
    name: "Shopify",
    description: "Consulte pedidos, status de entrega e estoque automaticamente nas conversas",
    icon: ShoppingBag,
    iconBg: "rgba(149,191,71,0.15)",
    connected: false,
    badge: "Popular",
  },
  {
    name: "Google Calendar",
    description: "Agende consultas e reuniões diretamente pelo WhatsApp com sincronização em tempo real",
    icon: Calendar,
    iconBg: "rgba(66,133,244,0.15)",
    connected: false,
    badge: "Popular",
  },
  {
    name: "HubSpot CRM",
    description: "Registre leads e atualize contatos automaticamente a cada interação",
    icon: BarChart2,
    iconBg: "rgba(255,122,0,0.15)",
    connected: false,
    comingSoon: false,
  },
  {
    name: "Email (SMTP)",
    description: "Envie notificações e resumos de conversa por e-mail automaticamente",
    icon: Mail,
    iconBg: "rgba(124,58,237,0.15)",
    connected: false,
  },
  {
    name: "Zapier",
    description: "Conecte com mais de 5.000 aplicativos via automações sem código",
    icon: Zap,
    iconBg: "rgba(255,75,75,0.15)",
    connected: false,
    comingSoon: true,
  },
  {
    name: "Site Próprio (Widget)",
    description: "Adicione um botão de WhatsApp flutuante no seu site com um código simples",
    icon: Globe,
    iconBg: "rgba(0,212,255,0.15)",
    connected: false,
    comingSoon: true,
  },
];

export default function Channels() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00d4ff" }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#00d4ff" }}>
            Canais de Atendimento
          </span>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
          Canais & Integrações
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gerencie seus canais de comunicação e conecte ferramentas que já utiliza
        </p>
      </header>

      {/* ── WhatsApp Hero Card ── */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(37,211,102,0.1) 0%, rgba(0,212,255,0.06) 100%)",
          border: "1px solid rgba(37,211,102,0.25)"
        }}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(37,211,102,0.08)" }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}>
              💬
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[var(--text-primary)] font-black text-xl font-display">WhatsApp Business</h2>
                <span className="badge badge-success text-[10px]">Principal</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Canal de atendimento primário via API oficial do WhatsApp
              </p>
            </div>
          </div>

          <div className="lg:ml-auto flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-[13px] font-semibold text-[var(--text-primary)]">Conta Conectada</span>
              </div>
              <p className="text-[12px] font-mono pl-5" style={{ color: "#6ee7b7" }}>
                +55 (11) 99999-0000
              </p>
              <p className="text-[11px] pl-5" style={{ color: "var(--text-muted)" }}>
                Última atividade: agora mesmo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(37,211,102,0.15)", color: "#06d6a0", border: "1px solid rgba(37,211,102,0.2)" }}>
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Verificando..." : "Verificar Status"}
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                <Settings size={13} />
                Configurar
              </button>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5"
          style={{ borderTop: "1px solid rgba(37,211,102,0.15)" }}>
          {[
            { label: "Mensagens Hoje", value: "1.284", icon: MessageSquare },
            { label: "Taxa de Entrega", value: "99.2%", icon: CheckCircle2 },
            { label: "Tempo de Resp.", value: "1m 42s", icon: Zap },
            { label: "Satisfação CSAT", value: "4.8/5", icon: "⭐" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <span className="text-base">{typeof m.icon === "string" ? m.icon : ""}</span>
              {typeof m.icon !== "string" && <m.icon size={14} className="text-emerald-400 shrink-0" />}
              <div>
                <p className="text-[var(--text-primary)] font-black text-sm font-display">{m.value}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add New Channel CTA ── */}
      <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed transition-all hover:border-[rgba(124,58,237,0.4)] hover:bg-[rgba(124,58,237,0.04)]"
        style={{ borderColor: "rgba(124,58,237,0.2)", color: "var(--text-secondary)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
          <Plus size={16} style={{ color: "#a78bfa" }} />
        </div>
        <div className="text-left">
          <p className="text-[var(--text-primary)] font-semibold text-sm">+ Conectar Novo Canal</p>
          <p className="text-[11px] text-[var(--text-muted)]">Instagram DM, Telegram, e-mail e mais</p>
        </div>
      </button>

      {/* ── Integrations Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[var(--text-primary)] font-bold text-base">Integrações Disponíveis</h2>
            <p className="text-[12px] mt-0.5 text-[var(--text-muted)]">
              Conecte suas ferramentas para um atendimento ainda mais poderoso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
          {INTEGRATIONS.map((integration, i) => (
            <IntegrationCard key={i} {...integration} />
          ))}
        </div>
      </div>
    </div>
  );
}
