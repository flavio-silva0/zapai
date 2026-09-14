import { useState, useContext } from "react";
import {
  User, CreditCard, Users, Shield, Key, Bell, ChevronRight,
  Eye, EyeOff, Copy, Check, Zap, Globe, LogOut, Trash2,
  Lock, AlertCircle, X, ShieldAlert
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { apiFetch } from "../api";

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[var(--border-subtle)]">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      className={`toggle-track ${checked ? "on" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => { if (!disabled && onChange) onChange(!checked); }}
    >
      <div className="toggle-thumb" />
    </div>
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

export default function Settings() {
  const { user, tenant, logout } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState("account");
  const [apiVisible, setApiVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notifications, setNotifications] = useState({
    newConversation: true,
    dailyReport: true,
    weeklyInsights: false,
    alerts: true,
  });

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

      setPasswordSuccess("Senha alterada com sucesso!");
      setPasswordForm({ senhaAtual: "", novaSenha: "", confirmaSenha: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const MOCK_API_KEY = "sk-zapai-em-breve";

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_API_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">

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
          Gerencie sua conta, equipe, faturamento e preferências do sistema
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Sidebar Nav ── */}
        <div className="lg:w-52 shrink-0">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-2 lg:sticky lg:top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
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
            <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1 animate-fade-scale">
              <h2 className="text-[var(--text-primary)] font-bold text-base mb-5">Informações da Conta</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 py-4 mb-2 border-b border-[var(--border-subtle)]">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)]">
                  {user?.nome?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-bold">{user?.nome || "Usuário"}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{user?.email || "email@exemplo.com"}</p>
                  <button className="text-[11px] font-semibold mt-1 transition-colors text-[var(--clr-primary)] hover:opacity-80">
                    Alterar foto
                  </button>
                </div>
              </div>

              <SettingRow label="Nome" description="Seu nome exibido no sistema">
                <input defaultValue={user?.nome || ""} className="input-premium text-[12px]" style={{ width: 200 }} />
              </SettingRow>

              <SettingRow label="E-mail" description="Seu endereço de e-mail de acesso">
                <input defaultValue={user?.email || ""} className="input-premium text-[12px]" style={{ width: 200 }} />
              </SettingRow>

              <SettingRow label="Empresa / Tenant" description="Nome da sua organização no sistema">
                <input defaultValue={tenant?.nome || ""} className="input-premium text-[12px]" style={{ width: 200 }} />
              </SettingRow>

              <SettingRow label="Idioma" description="Idioma preferido da interface">
                <select className="input-premium text-[12px] appearance-none" style={{ width: 200 }}>
                  <option className="bg-[var(--bg-surface)]">Português (BR)</option>
                  <option className="bg-[var(--bg-surface)]">English</option>
                  <option className="bg-[var(--bg-surface)]">Español</option>
                </select>
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button className="btn-primary text-sm">Salvar Alterações</button>
              </div>
            </div>
          )}

          {/* Billing */}
          {activeSection === "billing" && (
            <div className="space-y-4 animate-fade-scale">
              <div className="bg-gradient-to-br from-[var(--clr-primary)]/10 to-[var(--clr-info)]/5 border border-[var(--clr-primary)]/20 rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge badge-brand text-[10px] mb-2">Plano da Organização</span>
                    <h2 className="text-[var(--text-primary)] font-black text-xl font-display">
                      Plano {tenant?.plan ? tenant.plan.toUpperCase() : "PRO"}
                    </h2>
                    <p className="text-[13px] mt-1 text-[var(--text-secondary)]">
                      Status: <span className="font-semibold text-emerald-400 capitalize">{tenant?.status || "ativo"}</span>
                      {tenant?.trial_ends_at && tenant?.status === "trial" && (
                        <span> · Período de teste até {new Date(tenant.trial_ends_at).toLocaleDateString("pt-BR")}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-brand text-xs font-mono">
                      {tenant?.status === "trial" ? "TRIAL ATIVO" : "CONTRATUAL"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-1">
                  <p>• Suporte dedicado e integração oficial Meta Cloud API inclusa.</p>
                  <p>• Faturamento mensal por contrato corporativo ou ordem de serviço.</p>
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[var(--text-primary)] font-bold text-base">Faturamento & Cobrança</h2>
                  <span className="badge badge-warning text-[10px]">Em breve: Checkout Online</span>
                </div>
                <SettingRow label="Modelo de Cobrança" description="Gestão contratual de pagamentos">
                  <span className="text-xs text-[var(--text-secondary)]">Boleto / PIX Corporativo</span>
                </SettingRow>
                <SettingRow label="Emissão de Notas Fiscais" description="Enviadas mensalmente para o e-mail cadastrado">
                  <span className="text-xs text-emerald-400 font-semibold">Ativo</span>
                </SettingRow>
                <div className="pt-2 flex justify-between items-center">
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Deseja alterar seu plano ou adicionar mais números? Fale com nosso suporte comercial.
                  </p>
                  <a
                    href="mailto:contato@zapai.com.br?subject=Upgrade%20de%20Plano%20ZapAI"
                    className="btn-primary text-xs py-2 px-4 inline-block text-center"
                  >
                    Solicitar Upgrade
                  </a>
                </div>
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

              {[
                { id: "newConversation", label: "Nova conversa iniciada", description: "Receba alertas quando um novo cliente iniciar uma conversa" },
                { id: "dailyReport", label: "Relatório diário", description: "Resumo de performance enviado por e-mail às 8h" },
                { id: "weeklyInsights", label: "Insights semanais", description: "Análise de tendências e oportunidades toda segunda-feira" },
                { id: "alerts", label: "Alertas do sistema", description: "Notificações sobre status de conexão e erros críticos" },
              ].map(n => (
                <SettingRow key={n.id} label={n.label} description={n.description}>
                  <Toggle
                    checked={notifications[n.id]}
                    onChange={v => setNotifications(prev => ({ ...prev, [n.id]: v }))}
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
                      <h2 className="text-[var(--text-primary)] font-bold text-base">API Pública REST</h2>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Integração externa via token seguro para desenvolvedores
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-warning text-[10px]">Em breve</span>
                </div>

                <div className="p-4 rounded-xl flex items-center gap-3 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                  <ShieldAlert size={18} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    A API pública do ZapAI e o suporte a webhooks externos customizados estão em fase de homologação. O acesso programático será liberado em breve para contas corporativas.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

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
