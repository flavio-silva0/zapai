import { useState, useContext } from "react";
import {
  User, CreditCard, Users, Shield, Key, Bell, ChevronRight,
  Eye, EyeOff, Copy, Check, Zap, Globe, LogOut, Trash2
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

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

function Toggle({ checked, onChange }) {
  return (
    <div className={`toggle-track ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
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

  const MOCK_API_KEY = "sk-zapai-" + "x".repeat(32);

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
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-2 lg:sticky lg:top-6">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all mb-0.5 ${activeSection === id ? "bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] border border-[var(--clr-primary)]/20" : "text-[var(--text-muted)] border border-transparent hover:bg-[var(--bg-surface-hover)]"}`}
              >
                <Icon size={15} />
                {label}
                {activeSection === id && <ChevronRight size={12} className="ml-auto" />}
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
                    <span className="badge badge-brand text-[10px] mb-2">Plano Atual</span>
                    <h2 className="text-[var(--text-primary)] font-black text-xl font-display">Plano Pro</h2>
                    <p className="text-[13px] mt-1 text-[var(--text-secondary)]">
                      R$ 197/mês · Renovação em 15/08/2026
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-black text-3xl text-[var(--text-primary)]">R$197</p>
                    <p className="text-[11px] text-[var(--text-muted)]">/mês</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--border-subtle)]">
                  {[
                    { label: "Conversas/mês", used: 1284, limit: 5000 },
                    { label: "Atendentes", used: 1, limit: 3 },
                    { label: "Canais", used: 1, limit: 5 },
                  ].map((u, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-[var(--text-muted)]">{u.label}</span>
                        <span className="font-semibold text-[var(--text-primary)]">{u.used}/{u.limit}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[var(--clr-primary)] to-[var(--clr-info)]"
                          style={{ width: `${(u.used / u.limit) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1">
                <h2 className="text-[var(--text-primary)] font-bold text-base mb-4">Forma de Pagamento</h2>
                <SettingRow label="Cartão de crédito" description="•••• •••• •••• 4242 · Visa">
                  <button className="btn-ghost text-[12px]">Alterar</button>
                </SettingRow>
                <SettingRow label="Endereço de cobrança" description="São Paulo, SP">
                  <button className="btn-ghost text-[12px]">Editar</button>
                </SettingRow>
                <div className="pt-4 flex justify-between items-center">
                  <button className="text-[12px] font-semibold transition-colors hover:opacity-80" style={{ color: "#a78bfa" }}>
                    Ver histórico de faturas
                  </button>
                  <button className="btn-primary text-sm">Fazer Upgrade</button>
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          {activeSection === "team" && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1 animate-fade-scale">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[var(--text-primary)] font-bold text-base">Membros da Equipe</h2>
                <button className="btn-primary text-sm flex items-center gap-1.5">
                  <span>+</span>
                  Convidar Membro
                </button>
              </div>

              {[
                { name: user?.nome || "Você", email: user?.email || "admin@empresa.com", role: "Administrador", status: "Ativo", isYou: true },
                { name: "Maria Silva", email: "maria@empresa.com", role: "Operador", status: "Ativo" },
                { name: "João Souza", email: "joao@empresa.com", role: "Visualizador", status: "Pendente" },
              ].map((member, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-[var(--border-subtle)]">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)]">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{member.name}</p>
                      {member.isYou && <span className="badge badge-brand text-[9px]">Você</span>}
                    </div>
                    <p className="text-[11px] truncate text-[var(--text-muted)]">{member.email}</p>
                  </div>
                  <span className={`badge text-[10px] ${member.status === "Ativo" ? "badge-success" : "badge-warning"}`}>
                    {member.status}
                  </span>
                  <select className="input-premium text-[11px] rounded-lg px-2 py-1 appearance-none w-32"
                    defaultValue={member.role}>
                    <option className="bg-[var(--bg-surface)]">Administrador</option>
                    <option className="bg-[var(--bg-surface)]">Operador</option>
                    <option className="bg-[var(--bg-surface)]">Visualizador</option>
                  </select>
                  {!member.isYou && (
                    <button className="p-1.5 rounded-lg transition-all text-[var(--text-muted)] hover:bg-[var(--clr-danger)]/10 hover:text-[var(--clr-danger)]">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
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

                <SettingRow label="Senha" description="Altere sua senha de acesso">
                  <button className="btn-ghost text-[12px]">Alterar Senha</button>
                </SettingRow>
                <SettingRow label="Autenticação em 2 Fatores" description="Adicione uma camada extra de segurança com 2FA">
                  <Toggle checked={false} onChange={() => {}} />
                </SettingRow>
                <SettingRow label="Sessões Ativas" description="Gerencie dispositivos com acesso à sua conta">
                  <button className="btn-ghost text-[12px]">Ver Sessões</button>
                </SettingRow>
              </div>

              {/* Danger zone */}
              <div className="bg-[var(--clr-danger)]/5 border border-[var(--clr-danger)]/20 rounded-2xl p-6">
                <h3 className="text-[13px] font-bold uppercase tracking-widest mb-4 text-[var(--clr-danger)]">
                  Zona de Risco
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">Encerrar conta</p>
                    <p className="text-[11px] mt-0.5 text-[var(--text-muted)]">
                      Todos os dados serão excluídos permanentemente
                    </p>
                  </div>
                  <button className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-80 bg-[var(--clr-danger)]/10 text-[var(--clr-danger)] border border-[var(--clr-danger)]/20">
                    Excluir Conta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeSection === "api" && (
            <div className="space-y-4 animate-fade-scale">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--clr-primary)]/10">
                    <Key size={18} className="text-[var(--clr-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-[var(--text-primary)] font-bold text-base">Chave de API</h2>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Use para integrações personalizadas e webhooks
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl flex items-center gap-2 mb-3 bg-[var(--clr-warning)]/10 border border-[var(--clr-warning)]/20">
                  <span className="text-[12px] text-[var(--clr-warning)]">
                    ⚠️ Nunca compartilhe sua chave de API. Ela dá acesso total à sua conta.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex-1 flex items-center px-3 py-2.5 rounded-xl font-mono text-[12px] select-all bg-[var(--bg-surface-active)] border border-[var(--border-subtle)] ${apiVisible ? 'text-[var(--clr-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {apiVisible ? MOCK_API_KEY : "sk-zapai-" + "•".repeat(32)}
                  </div>
                  <button onClick={() => setApiVisible(v => !v)}
                    className="p-2.5 rounded-xl transition-all hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
                    {apiVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={handleCopy}
                    className={`p-2.5 rounded-xl transition-all ${copied ? "bg-[var(--clr-success)]/10 text-[var(--clr-success)]" : "bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] hover:bg-[var(--clr-primary)]/20"}`}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-subtle)]">
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Criada em 01/01/2026 · Nunca expirada
                  </p>
                  <button className="text-[12px] font-semibold transition-colors hover:opacity-80 text-[var(--clr-danger)]">
                    Revogar e gerar nova chave
                  </button>
                </div>
              </div>

              {/* Webhook */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <Globe size={16} className="text-[var(--clr-info)]" />
                  <h3 className="text-[var(--text-primary)] font-bold text-sm">Webhook URL</h3>
                </div>
                <SettingRow label="URL de callback" description="Receba eventos em tempo real na sua URL">
                  <input placeholder="https://sua-api.com/webhook" className="input-premium text-[12px]" style={{ width: 240 }} />
                </SettingRow>
                <SettingRow label="Eventos" description="Quais eventos disparar para o webhook">
                  <div className="flex flex-col gap-1">
                    {["Nova mensagem", "Conversa encerrada", "Transferência humana"].map(ev => (
                      <label key={ev} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-purple-500" />
                        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{ev}</span>
                      </label>
                    ))}
                  </div>
                </SettingRow>
                <div className="pt-4 flex justify-end">
                  <button className="btn-primary text-sm">Salvar Webhook</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
