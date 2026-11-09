import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, AlertCircle, Plus, RefreshCw, Settings, Zap,
  MessageSquare, ShieldCheck, Key, Copy, Check, Wifi
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, getStoredAuthToken } from "../api";

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

function WebhookIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"
        stroke="#818CF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"
        stroke="#818CF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"
        stroke="#818CF8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="2.5" cy="16.5" r="1.5" fill="#C7D2FE" />
      <circle cx="15.2" cy="5.8" r="1.5" fill="#C7D2FE" />
      <circle cx="18" cy="17" r="1.5" fill="#C7D2FE" />
    </svg>
  );
}

function GoogleCalendarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(3.75 3.75)">
        <path fill="#FFFFFF" d="M148.882 43.618l-47.368-5.263-57.895 5.263L38.355 96.25l5.263 52.632 52.632 6.579 52.632-6.579 5.263-53.947-4.263-51.317z"/>
        <path fill="#1A73E8" d="M65.211 125.276c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c.829 3.158 2.276 5.605 4.342 7.342 2.053 1.737 4.553 2.592 7.474 2.592 2.987 0 5.553-.908 7.697-2.724s3.224-4.132 3.224-6.934c0-2.868-1.132-5.211-3.395-7.026s-5.105-2.724-8.5-2.724h-5.276v-9.039H76.5c2.921 0 5.382-.789 7.382-2.368 2-1.579 3-3.737 3-6.487 0-2.447-.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684 0-4.816.711-6.395 2.145s-2.724 3.197-3.447 5.276l-9.039-3.763c1.197-3.395 3.395-6.395 6.618-8.987 3.224-2.592 7.342-3.895 12.342-3.895 3.697 0 7.026.711 9.974 2.145 2.947 1.434 5.263 3.421 6.934 5.947 1.671 2.539 2.5 5.382 2.5 8.539 0 3.224-.776 5.947-2.329 8.184-1.553 2.237-3.461 3.947-5.724 5.145v.539c2.987 1.25 5.421 3.158 7.342 5.724 1.908 2.566 2.868 5.632 2.868 9.211s-.908 6.776-2.724 9.579c-1.816 2.803-4.329 5.013-7.513 6.618-3.197 1.605-6.789 2.421-10.776 2.421-7.053 0-11.316-1.329-15.25-3.987z"/>
        <path fill="#1A73E8" d="M121.25 79.961l-9.974 7.25-5.013-7.605 17.987-12.974h6.895v61.197h-9.895V79.961z"/>
        <path fill="#EA4335" d="M148.882 196.25l47.368-47.368-23.684-10.526-23.684 10.526-10.526 23.684 10.526 23.684z"/>
        <path fill="#34A853" d="M33.092 172.566l10.526 23.684h105.263v-47.368H43.618l-10.526 23.684z"/>
        <path fill="#4285F4" d="M12.039-3.75C3.316-3.75-3.75 3.316-3.75 12.039v136.842l23.684 10.526 23.684-10.526V43.618h105.263l10.526-23.684L148.882-3.75H12.039z"/>
        <path fill="#188038" d="M-3.75 148.882v31.579c0 8.724 7.066 15.789 15.789 15.789h31.579v-47.368H-3.75z"/>
        <path fill="#FBBC04" d="M148.882 43.618v105.263h47.368V43.618l-23.684-10.526-23.684 10.526z"/>
        <path fill="#1967D2" d="M196.25 43.618V12.039c0-8.724-7.066-15.789-15.789-15.789h-31.579v47.368H196.25z"/>
      </g>
    </svg>
  );
}

function HubSpotIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z"
        fill="#FF7A59"
      />
    </svg>
  );
}

function N8nIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.8 16.8c.45 0 .6-.15.6-.6V15c0-1.8.6-2.4 2.4-2.4H9c1.8 0 2.4.6 2.4 2.4v1.2c0 .45.15.6.6.6s.6-.15.6-.6V15c0-1.8.6-2.4 2.4-2.4h1.2c1.8 0 2.4.6 2.4 2.4v1.2c0 .45.15.6.6.6s.6-.15.6-.6V15c0-1.8.6-2.4 2.4-2.4h1.2c.45 0 .6-.15.6-.6s-.15-.6-.6-.6h-1.2c-1.8 0-2.4-.6-2.4-2.4V7.8c0-.45-.15-.6-.6-.6s-.6.15-.6.6V9c0 1.8-.6 2.4-2.4 2.4H15c-1.8 0-2.4-.6-2.4-2.4V7.8c0-.45-.15-.6-.6-.6s-.6.15-.6.6V9c0 1.8-.6 2.4-2.4 2.4H7.8c-1.8 0-2.4-.6-2.4-2.4V7.8c0-.45-.15-.6-.6-.6s-.6.15-.6.6V9c0 1.8-.6 2.4-2.4 2.4H.6c-.45 0-.6.15-.6.6s.15.6.6.6h1.2c1.8 0 2.4.6 2.4 2.4v1.2c0 .45.15.6.6.6"
        fill="#EA4B71"
      />
    </svg>
  );
}

function EmailIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="4" fill="#7C3AED" fillOpacity="0.2" stroke="#8B5CF6" strokeWidth="1.75" />
      <path d="m4 7 8 6 8-6" stroke="#C4B5FD" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WidgetIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        fill="#00D4FF"
        fillOpacity="0.2"
        stroke="#00D4FF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="12" r="1.25" fill="#00D4FF" />
      <circle cx="12.5" cy="12" r="1.25" fill="#00D4FF" />
      <circle cx="16" cy="12" r="1.25" fill="#00D4FF" />
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
    name: "Webhook",
    description: "Dispare e receba eventos em tempo real conectando endpoints HTTP e APIs externas",
    icon: WebhookIcon,
    iconBg: "rgba(99,102,241,0.15)",
    connected: false,
    badge: "API & Eventos",
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
    iconBg: "rgba(255,122,89,0.15)",
    connected: false,
    badge: "CRM",
    comingSoon: true,
  },
  {
    name: "n8n",
    description: "Automatize fluxos de trabalho avançados e conecte centenas de ferramentas sem código",
    icon: N8nIcon,
    iconBg: "rgba(234,75,113,0.15)",
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
  const { user, tenant, login } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  // Self-service WhatsApp Cloud API Config State
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [waConfig, setWaConfig] = useState({
    clinic_phone: tenant?.clinic_phone || "",
    phone_number_id: tenant?.phone_number_id || "",
    wa_access_token: "",
    has_token: false,
    token_preview: null,
    webhook_url: `${window.location.origin}/webhook/whatsapp`,
    verify_token: "",
  });
  const [savingWa, setSavingWa] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [waMessage, setWaMessage] = useState({ type: "", text: "" });
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [verifyCopied, setVerifyCopied] = useState(false);

  const loadWhatsAppConfig = useCallback(async () => {
    try {
      const res = await apiFetch("/api/tenant/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setWaConfig((prev) => ({
          ...prev,
          clinic_phone: data.clinic_phone || "",
          phone_number_id: data.phone_number_id || "",
          has_token: Boolean(data.has_token || data.has_access_token),
          token_preview: data.token_preview || null,
          webhook_url: data.webhook_url || `${window.location.origin}/webhook/whatsapp`,
          verify_token: data.verify_token || "",
        }));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadWhatsAppConfig();
  }, [loadWhatsAppConfig]);

  const isConnected = Boolean(
    (waConfig.phone_number_id || tenant?.phone_number_id) &&
    (waConfig.has_token || tenant?.wa_access_token)
  );

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

  const displayPhone = (waConfig.clinic_phone || tenant?.clinic_phone)
    ? formatPhone(waConfig.clinic_phone || tenant?.clinic_phone)
    : ((waConfig.phone_number_id || tenant?.phone_number_id) ? `Phone ID: ${waConfig.phone_number_id || tenant.phone_number_id}` : "Nenhum número cadastrado");

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMessage("");
    try {
      await loadWhatsAppConfig();
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.tenant && login) {
          login(getStoredAuthToken(), data.user, data.tenant);
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

  const handleSaveWhatsApp = async (e) => {
    e.preventDefault();
    setSavingWa(true);
    setWaMessage({ type: "", text: "" });
    try {
      const res = await apiFetch("/api/tenant/whatsapp", {
        method: "PUT",
        body: JSON.stringify({
          clinic_phone: waConfig.clinic_phone,
          phone_number_id: waConfig.phone_number_id,
          wa_access_token: waConfig.wa_access_token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar credenciais do WhatsApp.");
      setWaConfig((prev) => ({ ...prev, wa_access_token: "" }));
      await handleRefresh();
      setWaMessage({ type: "success", text: data.message || "Credenciais salvas com sucesso!" });
    } catch (err) {
      setWaMessage({ type: "error", text: err.message });
    } finally {
      setSavingWa(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingWa(true);
    setWaMessage({ type: "", text: "" });
    try {
      const res = await apiFetch("/api/tenant/whatsapp/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao testar conexão com a Meta Cloud API.");
      setWaMessage({
        type: "success",
        text: `${data.message}${data.verified_name ? ` (${data.verified_name} - ${data.display_phone_number})` : ""}`,
      });
    } catch (err) {
      setWaMessage({ type: "error", text: err.message });
    } finally {
      setTestingWa(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(waConfig.webhook_url).catch(() => {});
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2000);
  };

  const handleCopyVerifyToken = () => {
    if (!waConfig.verify_token) return;
    navigator.clipboard.writeText(waConfig.verify_token).catch(() => {});
    setVerifyCopied(true);
    setTimeout(() => setVerifyCopied(false), 2000);
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm("Deseja realmente desconectar o WhatsApp oficial desta conta? As mensagens deixarão de ser processadas via Meta Cloud API.")) return;
    setSavingWa(true);
    try {
      const res = await apiFetch("/api/tenant/whatsapp", {
        method: "PUT",
        body: JSON.stringify({ phone_number_id: "", wa_access_token: "" }),
      });
      if (!res.ok) throw new Error("Erro ao desconectar WhatsApp.");
      setWaConfig((prev) => ({
        ...prev,
        phone_number_id: "",
        has_token: false,
        token_preview: null,
      }));
      setWaMessage({ type: "success", text: "WhatsApp desconectado com sucesso." });
      setTimeout(() => setWaMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setWaMessage({ type: "error", text: err.message || "Erro ao desconectar" });
    } finally {
      setSavingWa(false);
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
          Conecte seu número oficial do WhatsApp Business Cloud API e gerencie suas integrações
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
                  : "Configure suas credenciais da Meta Cloud API abaixo para ativar seu atendimento automático"}
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
                    <span className="text-[13px] font-semibold text-amber-400">Aguardando Credenciais</span>
                  </>
                )}
              </div>
              <p className="text-[13px] font-mono pl-5 font-semibold" style={{ color: isConnected ? "#6ee7b7" : "var(--text-muted)" }}>
                {displayPhone}
              </p>
              {(waConfig.phone_number_id || tenant?.phone_number_id) && (
                <p className="text-[10px] font-mono pl-5 text-[var(--text-muted)]">
                  Phone Number ID: {waConfig.phone_number_id || tenant?.phone_number_id}
                </p>
              )}
              {refreshMessage && (
                <p className="text-[11px] pl-5 text-emerald-400 animate-fade-in">{refreshMessage}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user?.role !== "viewer" && (
                <button
                  type="button"
                  onClick={() => setShowConfigForm((v) => !v)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Key size={13} />
                  {showConfigForm ? "Fechar Configuração" : isConnected ? "Editar Credenciais" : "Conectar WhatsApp Agora"}
                </button>
              )}
              <button
                type="button"
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

        {/* Self-Service Credentials Configuration Panel */}
        {(showConfigForm || !isConnected) && user?.role !== "viewer" && (
          <form
            onSubmit={handleSaveWhatsApp}
            className="relative mt-6 pt-6 border-t border-[var(--border-subtle)] space-y-4 animate-fade-scale"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Key size={15} className="text-cyan-400" />
                  Configuração Self-Service — Meta WhatsApp Cloud API
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Insira o Phone Number ID e o Token Permanente gerados no painel Meta for Developers
                </p>
              </div>
              {waConfig.has_token && (
                <span className="badge badge-success text-[10px]">
                  Token Criptografado ({waConfig.token_preview})
                </span>
              )}
            </div>

            {waMessage.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                waMessage.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {waMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{waMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Número do WhatsApp (com DDI)
                </label>
                <input
                  type="text"
                  value={waConfig.clinic_phone}
                  onChange={(e) => setWaConfig((c) => ({ ...c, clinic_phone: e.target.value }))}
                  placeholder="Ex: 5511999999999"
                  className="input-premium text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Phone Number ID (Meta Cloud API)
                </label>
                <input
                  type="text"
                  value={waConfig.phone_number_id}
                  onChange={(e) => setWaConfig((c) => ({ ...c, phone_number_id: e.target.value }))}
                  placeholder="Ex: 105938475610293"
                  className="input-premium text-xs w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  System User Access Token (EAAG...)
                </label>
                <input
                  type="password"
                  value={waConfig.wa_access_token}
                  onChange={(e) => setWaConfig((c) => ({ ...c, wa_access_token: e.target.value }))}
                  placeholder={waConfig.has_token ? "Deixe em branco para manter o token atual" : "Cole seu token permanente da Meta"}
                  className="input-premium text-xs w-full font-mono"
                />
              </div>
            </div>

            {/* Webhook & Verify Token helpers */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    URL de Callback do Webhook (para colar no Meta for Developers):
                  </p>
                  <code className="text-[11px] text-cyan-400 font-mono break-all">
                    {waConfig.webhook_url}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-center shrink-0"
                >
                  {webhookCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {webhookCopied ? "URL Copiada!" : "Copiar Webhook URL"}
                </button>
              </div>

              {waConfig.verify_token && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      Token de Verificação do Webhook (Verify Token):
                    </p>
                    <code className="text-[11px] text-cyan-400 font-mono break-all">
                      {waConfig.verify_token}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVerifyToken}
                    className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-center shrink-0"
                  >
                    {verifyCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {verifyCopied ? "Token Copiado!" : "Copiar Verify Token"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {isConnected ? (
                <button
                  type="button"
                  disabled={savingWa}
                  onClick={handleDisconnectWhatsApp}
                  className="px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition border border-red-500/20"
                >
                  Desconectar WhatsApp
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                {waConfig.phone_number_id && (
                  <button
                    type="button"
                    disabled={testingWa}
                    onClick={handleTestWhatsApp}
                    className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <Wifi size={13} />
                    {testingWa ? "Testando API Meta..." : "Testar Conexão com a Meta"}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingWa}
                  className="btn-primary text-xs py-2.5 px-5"
                >
                  {savingWa ? "Salvando Credenciais..." : "Salvar e Ativar WhatsApp"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Status / Checklist row */}
        {isConnected && (
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
        )}
      </div>

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
