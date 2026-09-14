import { useState } from "react";
import {
  Smartphone, Plug, CheckCircle2, AlertCircle, ExternalLink,
  Plus, RefreshCw, Settings, Zap, ShoppingBag, Mail, Calendar,
  BarChart2, MessageSquare, Globe, ArrowRight, ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";

// Official Brand SVG Icons
function WhatsAppIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"
        fill="#25D366"
      />
      <path
        d="M17.5 14.33C17.2 14.18 15.73 13.46 15.45 13.36C15.18 13.26 14.98 13.21 14.78 13.51C14.58 13.81 14.01 14.48 13.84 14.68C13.66 14.88 13.49 14.9 13.19 14.75C12.89 14.6 11.93 14.29 10.79 13.27C9.9 12.48 9.3 11.5 9.13 11.2C8.95 10.9 9.11 10.74 9.26 10.59C9.4 10.46 9.56 10.24 9.71 10.07C9.86 9.9 9.91 9.78 10.01 9.58C10.11 9.38 10.06 9.2 9.98 9.05C9.91 8.9 9.31 7.42 9.06 6.82C8.82 6.24 8.57 6.32 8.39 6.31C8.22 6.3 8.02 6.3 7.82 6.3C7.62 6.3 7.3 6.38 7.03 6.67C6.76 6.97 6 7.68 6 9.13C6 10.58 7.05 11.98 7.2 12.18C7.35 12.38 9.28 15.36 12.24 16.64C12.94 16.94 13.5 17.13 13.93 17.27C14.64 17.49 15.29 17.46 15.8 17.39C16.37 17.3 17.55 16.67 17.8 15.97C18.05 15.27 18.05 14.67 17.97 14.55C17.9 14.43 17.7 14.36 17.5 14.33Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function ShopifyIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.4 6.1c-.04-.3-.29-.5-.59-.5-.3 0-2.1-.1-2.1-.1s-1.4-1.4-1.6-1.5c-.2-.2-.5-.1-.6-.1 0 0-.7.2-2 .5-1.2-1.5-2.8-2.1-4.4-2.1-3.5 0-5.2 2.6-5.2 5.4 0 3.7 3.3 6.8 3.3 6.8s-1.9 6.9-2.2 8c-.3 1.1.3 1.6.9 1.6.2 0 .5-.1.9-.3 1-.5 5.8-3.2 5.8-3.2s3.6 1.5 4.4 1.8c1.2.4 2.1.1 2.5-.6.3-.7 1.1-5.9 1.1-5.9s1.3-.4 1.5-.5c.6-.3.6-.8.6-.8l-1.8-9z" fill="#95BF47"/>
      <path d="M14.4 3.8c-.2-.2-.5-.1-.6-.1 0 0-.7.2-2 .5-1.2-1.5-2.8-2.1-4.4-2.1-3.5 0-5.2 2.6-5.2 5.4 0 3.7 3.3 6.8 3.3 6.8s-1.9 6.9-2.2 8c-.3 1.1.3 1.6.9 1.6.2 0 .5-.1.9-.3 1-.5 5.8-3.2 5.8-3.2s3.6 1.5 4.4 1.8c1.2.4 2.1.1 2.5-.6.3-.7 1.1-5.9 1.1-5.9l-6.1-9.9z" fill="#5E8E3E" opacity="0.35"/>
      <path d="M12.9 8.2c-.4-.1-1-.1-1.5-.1-.3 0-.4.2-.4.4 0 .5.7.7 1.3 1 .8.3 1.7.8 1.7 1.9 0 1.4-1.1 2.2-2.7 2.2-1 0-1.8-.2-2.1-.4l.3-1.3c.3.1 1 .3 1.6.3.5 0 .9-.2.9-.5 0-.5-.7-.7-1.3-.9-.8-.4-1.6-.8-1.6-1.9 0-1.3 1.1-2.2 2.6-2.2.8 0 1.5.2 1.8.3l-.6 1.3z" fill="#FFFFFF"/>
    </svg>
  );
}

function GoogleCalendarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="17" rx="3.5" fill="#FFFFFF" />
      <path d="M17 2.5V5.5M7 2.5V5.5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 8.5H21" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="3" y="4" width="18" height="4.5" rx="3.5" fill="#4285F4" />
      <rect x="3" y="6.5" width="18" height="2" fill="#4285F4" />
      <circle cx="17.5" cy="17.5" r="1.5" fill="#34A853" />
      <circle cx="6.5" cy="17.5" r="1.5" fill="#EA4335" />
      <circle cx="17.5" cy="12" r="1.5" fill="#FBBC05" />
      <text x="12" y="16.5" textAnchor="middle" fill="#1E293B" fontSize="7" fontWeight="bold" fontFamily="system-ui, sans-serif">31</text>
    </svg>
  );
}

function HubSpotIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.8 7.6V4.8a1.8 1.8 0 1 0-2.6 0v2.8a4.5 4.5 0 0 0-3.1 1.2L7 5.8a2.3 2.3 0 1 0-1.9 1l5.2 3a4.6 4.6 0 0 0-.3 1.7c0 1 .3 1.9.8 2.6l-2.4 2.4a1.8 1.8 0 1 0 1.3 1.3l2.4-2.4a4.6 4.6 0 1 0 5.7-7.8zm-1.3 7.2a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z"
        fill="#FF7A59"
      />
    </svg>
  );
}

function ZapierIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#FF4F00" />
      <path
        d="M12 4.5V19.5M4.5 12H19.5M6.7 6.7L17.3 17.3M6.7 17.3L17.3 6.7"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmailIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#7C3AED" />
      <path
        d="M5 8.5L11.23 12.87C11.7 13.2 12.3 13.2 12.77 12.87L19 8.5M6 6H18C19.1 6 20 6.9 20 8V16C20 17.1 19.1 18 18 18H6C4.9 18 4 17.1 4 16V8C4 6.9 4.9 6 6 6Z"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WidgetIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#00D4FF" />
      <path
        d="M6 7.5H18C18.8 7.5 19.5 8.2 19.5 9V14C19.5 14.8 18.8 15.5 18 15.5H15L12 18V15.5H6C5.2 15.5 4.5 14.8 4.5 14V9C4.5 8.2 5.2 7.5 6 7.5Z"
        fill="#0F172A"
      />
      <circle cx="9" cy="11.5" r="1" fill="#00D4FF" />
      <circle cx="12" cy="11.5" r="1" fill="#00D4FF" />
      <circle cx="15" cy="11.5" r="1" fill="#00D4FF" />
    </svg>
  );
}

function StatusDot({ connected }) {
  return (
    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${connected ? "bg-emerald-400 animate-pulse" : "bg-amber-500"}`} />
  );
}

function IntegrationCard({ name, description, icon: Icon, iconBg, connected, badge, comingSoon, onClick }) {
  return (
    <div
      onClick={!comingSoon ? onClick : undefined}
      className={`bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 flex flex-col gap-4 transition-all hover:bg-[var(--bg-surface-hover)] ${comingSoon ? "opacity-75" : "cursor-pointer"}`}
      style={{
        borderColor: connected ? "rgba(6,214,160,0.25)" : "var(--border-medium)",
        background: connected ? "rgba(6,214,160,0.03)" : "var(--bg-surface)"
      }}
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: iconBg || "rgba(124,58,237,0.15)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon className="w-6 h-6" />
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
    icon: ShopifyIcon,
    iconBg: "rgba(149,191,71,0.15)",
    connected: false,
    badge: "E-commerce",
    comingSoon: true,
  },
  {
    name: "Google Calendar",
    description: "Agende consultas e reuniões diretamente pelo WhatsApp com sincronização em tempo real",
    icon: GoogleCalendarIcon,
    iconBg: "rgba(66,133,244,0.15)",
    connected: false,
    badge: "Agenda",
    comingSoon: true,
  },
  {
    name: "HubSpot CRM",
    description: "Registre leads e atualize contatos automaticamente a cada interação",
    icon: HubSpotIcon,
    iconBg: "rgba(255,122,0,0.15)",
    connected: false,
    badge: "CRM",
    comingSoon: true,
  },
  {
    name: "Zapier",
    description: "Conecte com mais de 5.000 aplicativos via automações sem código",
    icon: ZapierIcon,
    iconBg: "rgba(255,79,0,0.15)",
    connected: false,
    badge: "Automação",
    comingSoon: true,
  },
  {
    name: "Email (SMTP)",
    description: "Envie notificações e resumos de conversa por e-mail automaticamente",
    icon: EmailIcon,
    iconBg: "rgba(124,58,237,0.15)",
    connected: false,
    badge: "Notificação",
    comingSoon: true,
  },
  {
    name: "Site Próprio (Widget)",
    description: "Adicione um botão de WhatsApp flutuante no seu site com um código simples",
    icon: WidgetIcon,
    iconBg: "rgba(0,212,255,0.15)",
    connected: false,
    badge: "Web Chat",
    comingSoon: true,
  },
];

export default function Channels() {
  const { tenant, login } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  const isConnected = Boolean(tenant?.phone_number_id || tenant?.clinic_phone);

  const formatPhone = (phone) => {
    if (!phone) return "";
    const cleaned = String(phone).replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith("55")) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  const displayPhone = tenant?.clinic_phone 
    ? formatPhone(tenant.clinic_phone) 
    : (tenant?.phone_number_id ? `Phone ID: ${tenant.phone_number_id}` : "Nenhum número cadastrado");

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMessage("");
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.tenant && login) {
          login(localStorage.getItem("sofia_token"), data.user, data.tenant);
        }
        setRefreshMessage("Status verificado com sucesso!");
      } else {
        setRefreshMessage("Não foi possível verificar status no momento.");
      }
    } catch {
      setRefreshMessage("Erro de conexão ao verificar status.");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMessage(""), 4000);
    }
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
          background: isConnected
            ? "linear-gradient(135deg, rgba(37,211,102,0.1) 0%, rgba(0,212,255,0.06) 100%)"
            : "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(100,116,139,0.06) 100%)",
          border: isConnected ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(245,158,11,0.25)"
        }}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: isConnected ? "rgba(37,211,102,0.08)" : "rgba(245,158,11,0.08)" }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{
                background: isConnected ? "rgba(37,211,102,0.15)" : "rgba(245,158,11,0.15)",
                border: isConnected ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(245,158,11,0.3)"
              }}>
              <WhatsAppIcon className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[var(--text-primary)] font-black text-xl font-display">WhatsApp Business Cloud</h2>
                <span className={`badge text-[10px] ${isConnected ? "badge-success" : "badge-warning"}`}>
                  {isConnected ? "Oficial Ativo" : "Pendente"}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {isConnected
                  ? "Canal de atendimento conectado via API oficial do WhatsApp (Meta Cloud API)"
                  : "Canal oficial aguardando configuração de credenciais da Meta Cloud API"}
              </p>
            </div>
          </div>

          <div className="lg:ml-auto flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">Conta Conectada</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="text-amber-400" />
                    <span className="text-[13px] font-semibold text-amber-400">Pendente de Onboarding</span>
                  </>
                )}
              </div>
              <p className="text-[13px] font-mono pl-5 font-semibold" style={{ color: isConnected ? "#6ee7b7" : "var(--text-muted)" }}>
                {displayPhone}
              </p>
              {tenant?.phone_number_id && tenant?.clinic_phone && (
                <p className="text-[10px] font-mono pl-5 text-[var(--text-muted)]">
                  Phone Number ID: {tenant.phone_number_id}
                </p>
              )}
              {refreshMessage && (
                <p className="text-[11px] pl-5 text-emerald-400 animate-fade-in">{refreshMessage}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  background: isConnected ? "rgba(37,211,102,0.15)" : "rgba(245,158,11,0.15)",
                  color: isConnected ? "#06d6a0" : "#f59e0b",
                  border: isConnected ? "1px solid rgba(37,211,102,0.2)" : "1px solid rgba(245,158,11,0.2)"
                }}>
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Verificando..." : "Verificar Status"}
              </button>
            </div>
          </div>
        </div>

        {/* Status / Checklist row */}
        {isConnected ? (
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5"
            style={{ borderTop: "1px solid rgba(37,211,102,0.15)" }}>
            {[
              { label: "Status do Canal", value: "Operacional", icon: ShieldCheck },
              { label: "Integração", value: "Meta Cloud v20.0", icon: CheckCircle2 },
              { label: "Atendente IA", value: tenant?.bot_name || "ZapAI", icon: Zap },
              { label: "Webhook", value: "Ativo", icon: MessageSquare },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <m.icon size={14} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[var(--text-primary)] font-black text-sm font-display">{m.value}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative mt-5 pt-5 border-t border-[var(--border-subtle)] space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Checklist de Conexão WhatsApp Business Cloud API:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">1</span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Meta Developers</p>
                  <p className="text-[var(--text-muted)] text-[11px]">Crie sua conta no Meta for Developers e adicione o produto WhatsApp.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">2</span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Phone Number ID</p>
                  <p className="text-[var(--text-muted)] text-[11px]">Gere o Phone Number ID e o Token de Acesso Permanente (System User).</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">3</span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Vincular Credenciais</p>
                  <p className="text-[var(--text-muted)] text-[11px]">Insira o Phone Number ID e Token nas configurações da sua organização.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">4</span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Webhook de Entrada</p>
                  <p className="text-[var(--text-muted)] text-[11px]">Configure a URL do webhook no Meta App com o seu Verify Token.</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] italic">
              * Métricas e volume de mensagens serão exibidos automaticamente assim que o canal for homologado e receber as primeiras mensagens.
            </p>
          </div>
        )}
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
