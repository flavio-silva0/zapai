import { useState, useContext, useEffect, useCallback } from "react";
import {
  User, CreditCard, Users, Shield, Key, Bell,
  Copy, Check, Zap, Lock, AlertCircle, X, ShieldAlert,
  Sparkles, Crown, Building2, CheckCircle2, QrCode, ExternalLink, RefreshCw
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { apiFetch, getStoredAuthToken } from "../api";
import { useSearchParams } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 py-4 border-b border-[var(--border-subtle)]">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={Boolean(checked)} aria-label={label} disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"} disabled:opacity-40 disabled:cursor-not-allowed`}
      onClick={() => { if (!disabled && onChange) onChange(!checked); }}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

const SECTIONS = [
  { id: "account", label: "Conta", icon: User },
  { id: "billing", label: "Fatura & Plano", icon: CreditCard },
  { id: "team", label: "Equipe", icon: Users },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "api", label: "API & Integrações", icon: Key },
];

const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Até 150 leads ativos",
    leadRangeLabel: "Até 150 leads",
    maxLeads: 150,
    priceMonthly: 69.90,
    priceAnnualMonthly: 59.90,
    dailyAiQuota: 500,
    features: [
      "Até 150 leads no CRM & WhatsApp",
      "Atendente IA 24/7 (Gemini Flash)",
      "Integração oficial Meta Cloud API",
      "Kanban CRM + Histórico em tempo real",
      "Até 500 respostas de IA/dia",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "De 151 até 300 leads ativos",
    leadRangeLabel: "151 a 300 leads",
    maxLeads: 300,
    priceMonthly: 119.90,
    priceAnnualMonthly: 99.90,
    dailyAiQuota: 1200,
    popular: true,
    features: [
      "De 151 até 300 leads no CRM & WhatsApp",
      "Atendente IA 24/7 + RAG Avançado",
      "Qualificação e agendamento automático",
      "Transbordo humano inteligente",
      "Até 1.200 respostas de IA/dia",
    ],
  },
  {
    id: "pro",
    name: "Profissional",
    tagline: "De 301 até 500 leads ativos",
    leadRangeLabel: "301 a 500 leads",
    maxLeads: 500,
    priceMonthly: 169.90,
    priceAnnualMonthly: 144.90,
    dailyAiQuota: 2000,
    features: [
      "De 301 até 500 leads no CRM & WhatsApp",
      "Atendente IA 24/7 + Múltiplos documentos RAG",
      "Relatórios avançados e exportação CSV/PDF",
      "Prioridade na fila de processamento IA",
      "Até 2.000 respostas de IA/dia",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Acima de 500 leads (Personalizado)",
    leadRangeLabel: "Acima de 500 leads",
    maxLeads: 100000,
    priceMonthly: 249.90,
    priceAnnualMonthly: 219.90,
    customPricing: true,
    dailyAiQuota: 5000,
    features: [
      "Volume personalizado acima de 500 leads",
      "Múltiplos números de WhatsApp Cloud API",
      "Cota de IA de alta capacidade (5.000+/dia)",
      "Onboarding assistido + Gerente dedicado",
      "SLA de disponibilidade prioritário",
    ],
  },
];

export default function Settings() {
  const { user, tenant, login, logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = ["account", "billing", "team", "notifications", "security", "api"].includes(searchParams.get("section"))
    ? searchParams.get("section")
    : "account";
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    const sec = searchParams.get("section");
    if (sec && ["account", "billing", "team", "notifications", "security", "api"].includes(sec)) {
      setActiveSection(sec);
    }
  }, [searchParams]);

  const handleSelectSection = (id) => {
    setActiveSection(id);
    setSearchParams({ section: id }, { replace: true });
  };

  const { preferences: notifications, updatePreference, storageError } = useNotifications();

  // ── Account Profile Form State ──
  const [accountForm, setAccountForm] = useState({
    nome: user?.nome || "",
    email: user?.email || "",
    tenant_nome: tenant?.nome || "",
    clinic_phone: tenant?.clinic_phone || "",
    bot_name: tenant?.bot_name || "ZapAI",
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState({ type: "", text: "" });
  const [copiedEndpoint, setCopiedEndpoint] = useState("");

  const handleCopyEndpoint = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedEndpoint(key);
    setTimeout(() => setCopiedEndpoint(""), 2000);
  };

  useEffect(() => {
    setAccountForm({
      nome: user?.nome || "",
      email: user?.email || "",
      tenant_nome: tenant?.nome || "",
      clinic_phone: tenant?.clinic_phone || "",
      bot_name: tenant?.bot_name || "ZapAI",
    });
  }, [user, tenant]);

  const refreshAuthSession = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (login) {
          login(getStoredAuthToken(), data.user, data.tenant);
        }
      }
    } catch (_) {}
  }, [login]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountSaving(true);
    setAccountMsg({ type: "", text: "" });
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          nome: accountForm.nome,
          tenant_nome: accountForm.tenant_nome,
          clinic_phone: accountForm.clinic_phone,
          bot_name: accountForm.bot_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações.");
      await refreshAuthSession();
      setAccountMsg({ type: "success", text: "Dados da conta atualizados com sucesso!" });
    } catch (err) {
      setAccountMsg({ type: "error", text: err.message });
    } finally {
      setAccountSaving(false);
    }
  };

  // ── Billing & Subscription State ──
  const [billingData, setBillingData] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [checkoutModal, setCheckoutModal] = useState(null); // { plan }
  const [checkoutMethod, setCheckoutMethod] = useState("PIX");
  const [checkoutCpfCnpj, setCheckoutCpfCnpj] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [confirmingSandbox, setConfirmingSandbox] = useState(false);

  const loadBillingSubscription = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await apiFetch("/api/billing/subscription");
      if (res.ok) {
        const data = await res.json();
        setBillingData(data);
        if (data.tenant?.billing_cycle === "annual") {
          setBillingCycle("annual");
        }
      }
    } catch (_) {
      // Fallback to tenant context if offline
    } finally {
      setBillingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "billing") {
      loadBillingSubscription();
    }
  }, [activeSection, loadBillingSubscription]);

  const handleOpenCheckout = (plan) => {
    setCheckoutModal(plan);
    setCheckoutResult(null);
    setCheckoutError("");
    setPixCopied(false);
  };

  const [openingPortal, setOpeningPortal] = useState(false);

  const handleOpenStripePortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await apiFetch("/api/billing/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível abrir o portal da Stripe.");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setOpeningPortal(false);
    }
  };

  const [cancelingRenewal, setCancelingRenewal] = useState(false);

  const handleCancelRenewal = async () => {
    if (!window.confirm("Deseja realmente cancelar a renovação automática da sua assinatura? Seu plano continuará ativo até o fim do período já contratado.")) return;
    setCancelingRenewal(true);
    try {
      const res = await apiFetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cancelar renovação.");
      alert(data.message || "Renovação automática cancelada com sucesso.");
      await Promise.all([loadBillingSubscription(), refreshAuthSession()]);
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelingRenewal(false);
    }
  };

  const handleStartCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutModal) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          planId: checkoutModal.id,
          billingCycle,
          paymentMethod: checkoutMethod,
          cpfCnpj: checkoutCpfCnpj,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível iniciar o checkout.");
      setCheckoutResult(data);
      if (data.checkoutUrl && !data.sandbox) {
        window.location.href = data.checkoutUrl;
        return;
      }
      await loadBillingSubscription();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmPayment = async (invoiceId) => {
    setConfirmingSandbox(true);
    setCheckoutError("");
    try {
      const res = await apiFetch("/api/billing/confirm-sandbox", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: invoiceId || checkoutResult?.invoiceId,
          planId: checkoutModal?.id,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao confirmar pagamento.");
      await Promise.all([loadBillingSubscription(), refreshAuthSession()]);
      setCheckoutResult((prev) => ({
        ...prev,
        confirmed: true,
        message: data.message || "Plano ativado com sucesso!",
      }));
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setConfirmingSandbox(false);
    }
  };

  const handleCopyPix = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ senhaAtual: "", novaSenha: "", confirmaSenha: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.senhaAtual || !passwordForm.novaSenha) {
      setPasswordError("Preencha a senha atual e a nova senha.");
      return;
    }
    if (passwordForm.novaSenha.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (passwordForm.novaSenha !== passwordForm.confirmaSenha) {
      setPasswordError("A confirmação de senha não confere.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          senhaAtual: passwordForm.senhaAtual,
          novaSenha: passwordForm.novaSenha
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar senha.");

      setPasswordSuccess("Senha alterada. Entre novamente com a nova senha.");
      setPasswordForm({ senhaAtual: "", novaSenha: "", confirmaSenha: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
        logout();
      }, 2000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const usage = billingData?.usage || tenant?.usage || {
    planId: tenant?.plan === "basic" ? "starter" : (tenant?.plan || "starter"),
    planName: tenant?.plan === "growth" ? "Growth" : tenant?.plan === "pro" ? "Profissional" : tenant?.plan === "enterprise" ? "Enterprise" : "Starter",
    leadRangeLabel: "Até 150 leads",
    currentLeads: 0,
    maxLeads: 150,
    remainingLeads: 150,
    usagePercent: 0,
    limitReached: false,
    nearLimit: false,
  };
  const availablePlans = billingData?.availablePlans || DEFAULT_PLANS;
  const invoices = billingData?.invoices || [];
  const activePlanId = usage.planId;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Configurações do Sistema
          </span>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
          Configurações
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Gerencie sua conta, planos, limite de leads, faturamento e segurança
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Sidebar Nav ── */}
        <div className="lg:w-52 shrink-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-2 lg:sticky lg:top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSelectSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all mb-0.5 ${
                  activeSection === id
                    ? "bg-[var(--clr-primary)]/12 text-[var(--clr-primary)] font-semibold shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] font-medium"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">

          {/* Account */}
          {activeSection === "account" && (
            <form onSubmit={handleSaveAccount} className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1 animate-fade-scale">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[var(--text-primary)] font-bold text-base">Informações da Conta</h2>
                <span className="badge badge-brand text-[10px]">
                  {user?.role === "owner" ? "Proprietário" : user?.role === "super_admin" ? "Super Admin" : "Membro"}
                </span>
              </div>

              {accountMsg.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-3 ${
                  accountMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {accountMsg.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span>{accountMsg.text}</span>
                </div>
              )}

              {/* Avatar */}
              <div className="flex items-center gap-4 py-4 mb-2 border-b border-[var(--border-subtle)]">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)]">
                  {accountForm.nome?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-bold">{accountForm.nome || "Usuário"}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{accountForm.email || "email@exemplo.com"}</p>
                  <p className="text-[11px] text-cyan-400 font-medium mt-0.5">
                    Plano {usage.planName} · {usage.currentLeads}/{usage.maxLeads} leads utilizados
                  </p>
                </div>
              </div>

              <SettingRow label="Seu Nome" description="Nome exibido para sua equipe no painel">
                <input
                  value={accountForm.nome}
                  onChange={e => setAccountForm(f => ({ ...f, nome: e.target.value }))}
                  className="input-premium text-[12px]"
                  style={{ width: 240 }}
                  required
                />
              </SettingRow>

              <SettingRow label="E-mail de Acesso" description="Endereço de e-mail autenticado da conta">
                <input
                  value={accountForm.email}
                  disabled
                  className="input-premium text-[12px] opacity-60 cursor-not-allowed"
                  style={{ width: 240 }}
                />
              </SettingRow>

              <SettingRow label="Nome da Empresa / Clínica" description="Identificação da sua organização no ZapAI">
                <input
                  value={accountForm.tenant_nome}
                  onChange={e => setAccountForm(f => ({ ...f, tenant_nome: e.target.value }))}
                  className="input-premium text-[12px]"
                  style={{ width: 240 }}
                />
              </SettingRow>

              <SettingRow label="WhatsApp Comercial" description="Telefone principal de atendimento (ex: 5511999999999)">
                <input
                  value={accountForm.clinic_phone}
                  onChange={e => setAccountForm(f => ({ ...f, clinic_phone: e.target.value }))}
                  placeholder="5511999999999"
                  className="input-premium text-[12px]"
                  style={{ width: 240 }}
                />
              </SettingRow>

              <SettingRow label="Nome do Assistente IA" description="Como a IA se apresenta nas conversas do WhatsApp">
                <input
                  value={accountForm.bot_name}
                  onChange={e => setAccountForm(f => ({ ...f, bot_name: e.target.value }))}
                  placeholder="Ex: ZapAI ou Maria"
                  className="input-premium text-[12px]"
                  style={{ width: 240 }}
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={accountSaving} className="btn-primary text-sm px-5 py-2.5">
                  {accountSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          )}

          {/* Billing & Plans */}
          {activeSection === "billing" && (
            <div className="space-y-6 animate-fade-scale">

              {/* Current Plan & Lead Usage Card */}
              <div className="bg-gradient-to-br from-[var(--clr-primary)]/12 via-[var(--bg-surface)] to-[var(--clr-info)]/8 border border-[var(--clr-primary)]/25 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-brand text-[10px]">Assinatura da Organização</span>
                      <span className={`badge text-[10px] ${
                        ["ativo", "active"].includes(billingData?.tenant?.status || tenant?.status)
                          ? "badge-success"
                          : tenant?.status === "trial"
                            ? "badge-warning"
                            : "badge-danger"
                      }`}>
                        {tenant?.status === "trial"
                          ? "Período de Teste (Trial)"
                          : billingData?.tenant?.subscription_status === "canceled_at_period_end"
                            ? "Cancelamento Agendado"
                            : ["ativo", "active"].includes(billingData?.tenant?.status || tenant?.status)
                              ? "Assinatura Ativa"
                              : (tenant?.status?.toUpperCase() || "Pendente")}
                      </span>
                    </div>
                    <h2 className="text-[var(--text-primary)] font-black text-2xl font-display flex items-center gap-2">
                      Plano {usage.planName}
                      <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                        {usage.leadRangeLabel}
                      </span>
                    </h2>
                    <p className="text-[12px] mt-1 text-[var(--text-secondary)]">
                      {tenant?.status === "trial" && tenant?.trial_ends_at
                        ? `Seu período de avaliação vai até ${new Date(tenant.trial_ends_at).toLocaleDateString("pt-BR")}. Contrate um plano abaixo para garantir atendimento contínuo.`
                        : billingData?.tenant?.current_period_end
                          ? `Próxima renovação em ${new Date(billingData.tenant.current_period_end).toLocaleDateString("pt-BR")}`
                          : "Integração oficial Meta Cloud API + IA Gemini 24/7 ativa."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                    {billingData?.tenant?.billing_customer_id && (
                      <button
                        type="button"
                        onClick={handleOpenStripePortal}
                        disabled={openingPortal}
                        className="btn-ghost text-xs flex items-center gap-1.5 py-2 px-3 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                      >
                        <CreditCard size={13} />
                        {openingPortal ? "Abrindo..." : "Portal Stripe"}
                      </button>
                    )}
                    {billingData?.tenant?.subscription_status !== "canceled_at_period_end" && ["ativo", "active"].includes(billingData?.tenant?.status || tenant?.status) && (
                      <button
                        type="button"
                        onClick={handleCancelRenewal}
                        disabled={cancelingRenewal}
                        className="px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition border border-red-500/20 disabled:opacity-50"
                      >
                        {cancelingRenewal ? "Cancelando..." : "Cancelar Renovação"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={loadBillingSubscription}
                      disabled={billingLoading}
                      className="btn-ghost text-xs flex items-center gap-1.5 py-2 px-3"
                    >
                      <RefreshCw size={13} className={billingLoading ? "animate-spin" : ""} />
                      Atualizar Uso
                    </button>
                  </div>
                </div>

                {/* Lead Usage Bar */}
                <div className="mt-6 p-4 rounded-xl bg-[var(--bg-surface)]/90 border border-[var(--border-subtle)] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Users size={14} className="text-cyan-400" />
                      Consumo de Leads no CRM & WhatsApp
                    </span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">
                      {usage.currentLeads} / {usage.maxLeads} leads ({usage.usagePercent}%)
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usage.limitReached
                          ? "bg-red-500"
                          : usage.nearLimit
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-cyan-400 to-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, usage.usagePercent || 0))}%` }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>
                      {usage.limitReached
                        ? "⚠️ Limite de leads atingido! Faça upgrade abaixo para liberar a IA para novos contatos."
                        : `Restam ${usage.remainingLeads} leads disponíveis no seu plano atual.`}
                    </span>
                    {usage.recommendedUpgradePlanId && usage.recommendedUpgradePlanId !== activePlanId && (
                      <span className="text-amber-400 font-semibold">
                        Recomendado: Upgrade para {usage.recommendedUpgradePlanId.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Selector Header + Cycle Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                  <h3 className="text-[var(--text-primary)] font-bold text-lg">
                    Escolha o Plano Ideal para sua Operação
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Upgrade imediato com liberação instantânea de limite de leads e cota de IA
                  </p>
                </div>

                <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-medium)] self-start">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === "monthly"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("annual")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      billingCycle === "annual"
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Anual
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                      -15%
                    </span>
                  </button>
                </div>
              </div>

              {/* 4 Plan Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {availablePlans.map((plan) => {
                  const isCurrent = activePlanId === plan.id && ["ativo", "active"].includes(billingData?.tenant?.status || tenant?.status);
                  const price = billingCycle === "annual" ? plan.priceAnnualMonthly : plan.priceMonthly;
                  const isCustom = Boolean(plan.customPricing);

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl p-5 flex flex-col justify-between border transition-all relative ${
                        plan.popular
                          ? "bg-gradient-to-b from-cyan-500/10 to-[var(--bg-surface)] border-cyan-500/40 shadow-lg shadow-cyan-500/5"
                          : isCurrent
                            ? "bg-[var(--bg-surface)] border-emerald-500/40"
                            : "bg-[var(--bg-surface)] border-[var(--border-medium)]"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-400 text-slate-950 shadow">
                          Mais Escolhido
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                            {plan.leadRangeLabel}
                          </span>
                          {isCurrent && (
                            <span className="badge badge-success text-[9px]">Plano Atual</span>
                          )}
                        </div>

                        <h4 className="text-lg font-black text-[var(--text-primary)] font-display">
                          {plan.name}
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {plan.tagline}
                        </p>

                        <div className="my-4 pt-3 border-t border-[var(--border-subtle)]">
                          {isCustom ? (
                            <div>
                              <span className="text-[11px] text-[var(--text-muted)] block">A partir de</span>
                              <span className="text-2xl font-black text-[var(--text-primary)] font-display">
                                R$ {price.toFixed(2).replace(".", ",")}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">/mês</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-2xl font-black text-[var(--text-primary)] font-display">
                                R$ {price.toFixed(2).replace(".", ",")}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">/mês</span>
                              {billingCycle === "annual" && (
                                <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                                  Economia no ciclo anual
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <ul className="space-y-2 text-xs text-[var(--text-secondary)] mb-5">
                          {(plan.features || []).slice(0, 5).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {isCustom ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleOpenCheckout(plan)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                          >
                            Contratar Enterprise
                          </button>
                          <a
                            href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Quero%20cotar%20o%20plano%20Enterprise%20acima%20de%20500%20leads%20no%20ZapAI"
                            target="_blank"
                            rel="noreferrer"
                            className="block text-center text-[11px] text-[var(--text-muted)] hover:text-cyan-400"
                          >
                            Ou falar com consultor →
                          </a>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(plan)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                              : plan.popular
                                ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow"
                                : "btn-primary"
                          }`}
                        >
                          {isCurrent ? "Renovar / Alterar Ciclo" : "Contratar Plano"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Invoices History */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[var(--text-primary)] font-bold text-base">Histórico de Faturas & Pagamentos</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pagamentos processados via PIX, Boleto ou Cartão de Crédito (Asaas / Stripe)
                    </p>
                  </div>
                </div>

                {invoices.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-muted)]">
                      Nenhuma fatura gerada até o momento. Escolha um dos planos acima para iniciar sua assinatura.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Plano</th>
                          <th className="py-2.5 px-3">Método</th>
                          <th className="py-2.5 px-3">Valor</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-3 px-3 text-[var(--text-secondary)]">
                              {inv.created_at ? new Date(inv.created_at).toLocaleDateString("pt-BR") : "-"}
                            </td>
                            <td className="py-3 px-3 font-semibold text-[var(--text-primary)] uppercase">
                              {inv.plan} ({inv.billing_cycle === "annual" ? "Anual" : "Mensal"})
                            </td>
                            <td className="py-3 px-3 text-[var(--text-secondary)] uppercase">
                              {inv.payment_method || "PIX"}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)]">
                              R$ {(typeof inv.amount_brl === "number" ? inv.amount_brl : ((inv.amount_cents || 0) / 100)).toFixed(2).replace(".", ",")}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`badge text-[10px] ${
                                inv.status === "paid"
                                  ? "badge-success"
                                  : inv.status === "pending"
                                    ? "badge-warning"
                                    : ["canceled", "cancelled", "refunded", "failed", "overdue"].includes(inv.status)
                                      ? "badge-danger"
                                      : ""
                              }`}>
                                {inv.status === "paid"
                                  ? "Pago"
                                  : inv.status === "pending"
                                    ? "Aguardando Pagamento"
                                    : inv.status === "overdue"
                                      ? "Vencido"
                                      : inv.status === "canceled" || inv.status === "cancelled"
                                        ? "Cancelado"
                                        : inv.status === "refunded"
                                          ? "Reembolsado"
                                          : inv.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {inv.status === "pending" && inv.provider === "sandbox" && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(inv.id)}
                                  className="text-xs font-bold text-cyan-400 hover:underline"
                                >
                                  Confirmar Pagamento
                                </button>
                              )}
                              {inv.invoice_url && inv.provider !== "sandbox" && (
                                <a
                                  href={inv.invoice_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                                >
                                  Abrir Fatura <ExternalLink size={11} />
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team */}
          {activeSection === "team" && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-4 animate-fade-scale">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[var(--text-primary)] font-bold text-base">Membros da Organização</h2>
                  <p className="text-xs text-[var(--text-muted)]">Usuários com acesso ao painel de atendimento</p>
                </div>
                <button
                  disabled
                  className="btn-primary text-xs flex items-center gap-1.5 opacity-60 cursor-not-allowed"
                  title="Convite de múltiplos membros em breve"
                >
                  <span>+</span>
                  Convidar Membro
                  <span className="badge badge-warning text-[9px] ml-1">Em breve</span>
                </button>
              </div>

              {/* Real user row */}
              <div className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)]">
                  {user?.nome?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{user?.nome || "Você"}</p>
                    <span className="badge badge-brand text-[9px]">Sua Conta</span>
                  </div>
                  <p className="text-[11px] truncate text-[var(--text-muted)]">{user?.email}</p>
                </div>
                <span className="badge badge-success text-[10px]">
                  Ativo
                </span>
                <span className="text-xs font-semibold text-[var(--text-secondary)] px-3 py-1 bg-[var(--bg-surface-hover)] rounded-lg">
                  {user?.role === "owner" ? "Proprietário" : user?.role === "super_admin" ? "Super Admin" : user?.role === "agent" ? "Operador" : "Visualizador"}
                </span>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] italic pt-2">
                * A funcionalidade de criação e delegação de papéis de operadores adicionais para sua equipe está prevista para a próxima versão.
              </p>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1 animate-fade-scale">
              <h2 className="text-[var(--text-primary)] font-bold text-base mb-5">Preferências de Notificação</h2>
              <p className="text-xs text-[var(--text-muted)] pb-3">Aplicadas ao sininho e salvas automaticamente neste navegador para sua conta e empresa.</p>
              {storageError && <p role="alert" className="text-xs text-amber-600">{storageError}</p>}

              {[
                { id: "newConversation", label: "Novos contatos", description: "Avise quando um cliente for adicionado ao CRM" },
                { id: "newMessages", label: "Mensagens recebidas", description: "Mostre as novas mensagens recebidas dos clientes no WhatsApp" },
                { id: "alerts", label: "Alertas do sistema", description: "Avise quando não for possível atualizar as notificações" },
                { id: "dailyReport", label: "Relatório diário · Em breve", description: "Envio de resumo por e-mail ainda não disponível", disabled: true },
                { id: "weeklyInsights", label: "Insights semanais · Em breve", description: "Envio de análises semanais ainda não disponível", disabled: true },
              ].map(n => (
                <SettingRow key={n.id} label={n.label} description={n.description}>
                  <Toggle
                    label={n.label}
                    disabled={n.disabled}
                    checked={Boolean(notifications[n.id])}
                    onChange={v => updatePreference(n.id, v)}
                  />
                </SettingRow>
              ))}
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="space-y-4 animate-fade-scale">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1">
                <h2 className="text-[var(--text-primary)] font-bold text-base mb-5">Segurança da Conta</h2>

                <SettingRow label="Senha de Acesso" description="Altere a sua senha de login no sistema">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn-primary text-[12px] flex items-center gap-1.5"
                  >
                    <Lock size={12} />
                    Alterar Senha
                  </button>
                </SettingRow>

                <SettingRow label="Autenticação em 2 Fatores (2FA)" description="Adicione uma camada extra de segurança">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-warning text-[10px]">Em breve</span>
                    <Toggle checked={false} disabled onChange={() => {}} />
                  </div>
                </SettingRow>

                <SettingRow label="Sessões Ativas" description="Gerenciamento de múltiplos dispositivos e tokens ativos">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-warning text-[10px]">Em breve</span>
                    <button disabled className="btn-ghost text-[12px] opacity-50 cursor-not-allowed">
                      Ver Sessões
                    </button>
                  </div>
                </SettingRow>
              </div>

              {/* Danger zone */}
              <div className="bg-[var(--clr-danger)]/5 border border-[var(--clr-danger)]/20 rounded-2xl p-6">
                <h3 className="text-[13px] font-bold uppercase tracking-widest mb-4 text-[var(--clr-danger)]">
                  Zona de Risco
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">Encerramento de Conta</p>
                    <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">
                      Para solicitar a exclusão de conta e remoção de dados conforme a LGPD, contate o DPO/Privacidade.
                    </p>
                  </div>
                  <a
                    href="mailto:privacidade@zapai.com.br?subject=Solicitacao%20Exclusao%20Conta%20LGPD"
                    className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-80 bg-[var(--clr-danger)]/10 text-[var(--clr-danger)] border border-[var(--clr-danger)]/20"
                  >
                    Solicitar Exclusão
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeSection === "api" && (
            <div className="space-y-4 animate-fade-scale">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--clr-primary)]/10">
                      <Key size={18} className="text-[var(--clr-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-[var(--text-primary)] font-bold text-base">API Pública REST & Webhooks de Pagamento</h2>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Endpoints oficiais para integração de cobrança e webhooks
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-success text-[10px]">Ativo</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[var(--text-primary)]">Webhook Stripe (Oficial)</p>
                      <button
                        type="button"
                        onClick={() => handleCopyEndpoint(`${window.location.origin}/api/billing/webhooks/stripe`, "stripe")}
                        className="btn-ghost text-[10px] py-1 px-2 flex items-center gap-1"
                      >
                        {copiedEndpoint === "stripe" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedEndpoint === "stripe" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <code className="text-[11px] text-cyan-400 font-mono break-all">
                      {window.location.origin}/api/billing/webhooks/stripe
                    </code>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Eventos suportados: <code>checkout.session.completed</code>, <code>invoice.paid</code>, <code>customer.subscription.deleted</code>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[var(--text-primary)]">Webhook Meta WhatsApp Cloud API</p>
                      <button
                        type="button"
                        onClick={() => handleCopyEndpoint(`${window.location.origin}/webhook/whatsapp`, "whatsapp")}
                        className="btn-ghost text-[10px] py-1 px-2 flex items-center gap-1"
                      >
                        {copiedEndpoint === "whatsapp" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedEndpoint === "whatsapp" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <code className="text-[11px] text-cyan-400 font-mono break-all">
                      {window.location.origin}/webhook/whatsapp
                    </code>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Callback URL oficial para receber notificações de mensagens e status do WhatsApp.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-[var(--text-primary)]">Webhook Alternativo Asaas</p>
                      <button
                        type="button"
                        onClick={() => handleCopyEndpoint(`${window.location.origin}/api/billing/webhooks/asaas`, "asaas")}
                        className="btn-ghost text-[10px] py-1 px-2 flex items-center gap-1"
                      >
                        {copiedEndpoint === "asaas" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedEndpoint === "asaas" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <code className="text-[11px] text-cyan-400 font-mono break-all">
                      {window.location.origin}/api/billing/webhooks/asaas
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Checkout Modal ── */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="badge badge-brand text-[10px] mb-1">Stripe Checkout Oficial</span>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                  Assinar Plano {checkoutModal.name} ({checkoutModal.leadRangeLabel})
                </h3>
              </div>
              <button
                onClick={() => setCheckoutModal(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {!checkoutResult ? (
              <form onSubmit={handleStartCheckout} className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      Plano {checkoutModal.name} · Ciclo {billingCycle === "annual" ? "Anual (-15%)" : "Mensal"}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Capacidade: {checkoutModal.leadRangeLabel} · {checkoutModal.dailyAiQuota} msg IA/dia
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-cyan-400 font-display">
                      R$ {(billingCycle === "annual" ? checkoutModal.priceAnnualMonthly : checkoutModal.priceMonthly).toFixed(2).replace(".", ",")}
                      <span className="text-[11px] font-normal text-[var(--text-muted)]">/mês</span>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Shield size={14} className="text-cyan-400" />
                      Pagamento Seguro via Stripe
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/80 uppercase">Oficial</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Você será direcionado para o Stripe Checkout oficial. Aceita <strong>Cartão de Crédito</strong>, <strong>PIX</strong>, <strong>Apple Pay</strong> e <strong>Google Pay</strong> com faturamento transparente em BRL (R$).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    CPF ou CNPJ do Titular (Opcional — para Nota Fiscal)
                  </label>
                  <input
                    type="text"
                    value={checkoutCpfCnpj}
                    onChange={(e) => setCheckoutCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    className="input-premium text-xs w-full"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutModal(null)}
                    className="btn-ghost text-xs py-2.5 px-4"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5"
                  >
                    {checkoutLoading ? "Conectando ao Stripe..." : "Prosseguir para Stripe Checkout →"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {checkoutResult.confirmed ? (
                  <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                    <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                    <h4 className="font-bold text-base text-emerald-300">
                      {checkoutResult.message}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Seu limite de leads e cota diária de IA já foram atualizados em toda a plataforma.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCheckoutModal(null)}
                      className="btn-primary text-xs py-2 px-6 mx-auto"
                    >
                      Concluir
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <QrCode size={15} className="text-cyan-400" />
                          Cobrança Gerada ({checkoutResult.provider?.toUpperCase()})
                        </span>
                        <span className="font-mono font-bold text-sm text-emerald-400">
                          {checkoutResult.amountFormatted}
                        </span>
                      </div>

                      {checkoutResult.pixCopyPaste && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-[var(--text-muted)]">Código PIX Copia e Cola:</p>
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={checkoutResult.pixCopyPaste}
                              className="input-premium text-[11px] font-mono flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleCopyPix(checkoutResult.pixCopyPaste)}
                              className="btn-ghost text-xs py-2 px-3 flex items-center gap-1"
                            >
                              {pixCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              {pixCopied ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                        </div>
                      )}

                      {checkoutResult.checkoutUrl && !checkoutResult.sandbox && (
                        <a
                          href={checkoutResult.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs py-2.5 px-4 w-full flex items-center justify-center gap-1.5 text-center font-bold"
                        >
                          Pagar com Stripe Checkout Seguro <ExternalLink size={13} />
                        </a>
                      )}
                    </div>

                    {checkoutResult.sandbox && (
                      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-2.5">
                        <p className="text-xs text-cyan-200 font-semibold">
                          Ambiente de Homologação / Sandbox Ativo
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          Você pode confirmar o pagamento instantaneamente abaixo para ativar o plano <strong>{checkoutModal.name}</strong> na conta de teste.
                        </p>
                        <button
                          type="button"
                          disabled={confirmingSandbox}
                          onClick={() => handleConfirmPayment(checkoutResult.invoiceId)}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all shadow"
                        >
                          {confirmingSandbox ? "Ativando Plano..." : "Confirmar Pagamento e Ativar Plano Agora"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Alterar Senha (AUTH-004) ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--clr-primary)]/15 flex items-center justify-center text-[var(--clr-primary)]">
                  <Lock size={16} />
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">Alterar Senha</h3>
              </div>
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordError(""); setPasswordSuccess(""); }}
                className="p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check size={14} className="shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.senhaAtual}
                  onChange={e => setPasswordForm(p => ({ ...p, senhaAtual: e.target.value }))}
                  placeholder="Digite sua senha atual"
                  className="input-premium text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nova Senha (mínimo 8 caracteres)
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.novaSenha}
                  onChange={e => setPasswordForm(p => ({ ...p, novaSenha: e.target.value }))}
                  placeholder="Digite sua nova senha forte"
                  className="input-premium text-xs w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmaSenha}
                  onChange={e => setPasswordForm(p => ({ ...p, confirmaSenha: e.target.value }))}
                  placeholder="Repita a nova senha"
                  className="input-premium text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-ghost text-xs py-2 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {passwordLoading ? "Salvando..." : "Salvar Nova Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
