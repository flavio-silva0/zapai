import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { User, Building, Phone, CheckCircle, Edit2, Save, X, Shield, Zap } from "lucide-react";
import { apiFetch } from "../api";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function StaticValue({ children, mono = false }) {
  return (
    <div
      className={`w-full rounded-xl px-4 py-3 text-slate-200 text-sm border ${mono ? "font-mono" : ""}`}
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {children}
    </div>
  );
}

function EditInput({ type = "text", value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all border"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderColor: "rgba(99,102,241,0.3)",
      }}
      onFocus={(e)  => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
      onBlur={(e)   => { e.target.style.borderColor = "rgba(99,102,241,0.3)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

export default function Profile() {
  const { user, tenant, login } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [erro,      setErro]      = useState("");

  const [formData, setFormData] = useState({
    nome: "", email: "", tenant_nome: "", clinic_phone: "", bot_name: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome:         user.nome       || "",
        email:        user.email      || "",
        tenant_nome:  tenant?.nome    || "",
        clinic_phone: tenant?.clinic_phone || "",
        bot_name:     tenant?.bot_name || "",
      });
    }
  }, [user, tenant, isEditing]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setErro("");
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar");
      }
      const updatedUser   = { ...user,   nome: formData.nome, email: formData.email };
      const updatedTenant = tenant
        ? { ...tenant, nome: formData.tenant_nome, clinic_phone: formData.clinic_phone, bot_name: formData.bot_name }
        : null;
      const token = localStorage.getItem("sofia_token");
      login(token, updatedUser, updatedTenant);
      setIsEditing(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }));

  const roleBadge = user.role === "super_admin"
    ? { label: "Super Admin", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)", text: "#a78bfa" }
    : { label: user.role,     bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#818cf8" };

  return (
    <div className="p-8 overflow-y-auto space-y-6">

      {/* ── Header ── */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-white mb-1">Meu Perfil</h1>
          <p className="text-slate-500 text-sm">Suas informações de login e configurações do negócio</p>
        </div>
        {!isEditing ? (
          <button
            id="profile-edit-btn"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-300 rounded-xl transition-all border"
            style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.25)" }}
          >
            <Edit2 size={14} />
            Editar informações
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-400 rounded-xl transition-all border"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              id="profile-save-btn"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 btn-primary"
            >
              <Save size={14} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </header>

      {/* Error */}
      {erro && (
        <div className="p-4 rounded-xl text-rose-300 text-sm border"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
        >
          {erro}
        </div>
      )}

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">

        {/* User Card */}
        <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <User size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Informações de Login</h2>
              <p className="text-slate-500 text-xs">Seus dados de acesso à plataforma</p>
            </div>
          </div>

          <Field label="Nome">
            {isEditing
              ? <EditInput value={formData.nome}  onChange={f("nome")} />
              : <StaticValue>{user.nome}</StaticValue>
            }
          </Field>

          <Field label="E-mail">
            {isEditing
              ? <EditInput type="email" value={formData.email} onChange={f("email")} />
              : (
                <div className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-slate-200 text-sm border"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {user.email}
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <CheckCircle size={10} /> Verificado
                  </span>
                </div>
              )
            }
          </Field>

          <Field label="Nível de Acesso">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border"
              style={{ background: roleBadge.bg, borderColor: roleBadge.border, color: roleBadge.text }}
            >
              <Shield size={13} />
              {roleBadge.label.toUpperCase()}
            </div>
          </Field>
        </div>

        {/* Business Card */}
        {tenant && (
          <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Building size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Meu Negócio</h2>
                <p className="text-slate-500 text-xs">Configurações do seu espaço no ZapAI</p>
              </div>
            </div>

            <Field label="Empresa / Sistema">
              {isEditing
                ? <EditInput value={formData.tenant_nome} onChange={f("tenant_nome")} />
                : <p className="font-bold text-white text-xl">{tenant.nome}</p>
              }
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Robô Atendente">
                {isEditing
                  ? <EditInput value={formData.bot_name} onChange={f("bot_name")} />
                  : (
                    <div className="rounded-xl px-4 py-3 text-slate-200 text-sm border flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-lg">{tenant.bot_emoji}</span>
                      <span className="font-semibold">{tenant.bot_name}</span>
                    </div>
                  )
                }
              </Field>

              <Field label="Telefone">
                {isEditing
                  ? <EditInput value={formData.clinic_phone} onChange={f("clinic_phone")} placeholder="5511..." mono />
                  : (
                    <div className="rounded-xl px-4 py-3 text-slate-200 text-sm border flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <Phone size={13} className="text-cyan-400 shrink-0" />
                      <span className="font-mono">{tenant.clinic_phone || "—"}</span>
                    </div>
                  )
                }
              </Field>
            </div>

            {/* Status bar */}
            <div className="rounded-xl px-4 py-3 border flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Status da Conta</p>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                  <CheckCircle size={13} /> {tenant.status?.toUpperCase()}
                </p>
              </div>
              {tenant.trial_ends_at && tenant.status === "trial" && (
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Trial expira</p>
                  <p className="text-amber-400 text-sm font-semibold">
                    {new Date(tenant.trial_ends_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
