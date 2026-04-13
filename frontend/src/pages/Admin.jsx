import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  Building2, Users, CheckCircle, XCircle, Clock, Wifi, WifiOff,
  RefreshCw, ChevronDown, ChevronUp, ArrowLeft, Search, Filter,
  Edit3, Save, X, ShieldAlert, Zap
} from "lucide-react";

const STATUS_STYLES = {
  trial:     { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)",  text: "#fbbf24", label: "Trial",     icon: Clock },
  ativo:     { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)",  text: "#34d399", label: "Ativo",     icon: CheckCircle },
  pausado:   { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", text: "#94a3b8", label: "Pausado",   icon: XCircle },
  cancelado: { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",   text: "#f87171", label: "Cancelado", icon: XCircle },
};

const NICHOS = [
  { value: "dental",        label: "🦷 Clínica Odontológica" },
  { value: "imobiliaria",   label: "🏠 Imobiliária" },
  { value: "academia",      label: "💪 Academia / Fitness" },
  { value: "petshop",       label: "🐾 Petshop / Veterinária" },
  { value: "restaurante",   label: "🍽️ Restaurante / Bar" },
  { value: "salao",         label: "💇 Salão de Beleza" },
  { value: "psicologia",    label: "🧠 Psicologia / Saúde Mental" },
  { value: "veterinaria",   label: "🐶 Clínica Veterinária" },
  { value: "estetica",      label: "✨ Clínica Estética" },
  { value: "contabilidade", label: "📊 Escritório de Contabilidade" },
  { value: "educacao",      label: "🎓 Escola / Cursos" },
  { value: "ti",            label: "💻 Empresa de TI" },
  { value: "eventos",       label: "🎊 Eventos / Cerimonial" },
  { value: "construcao",    label: "🏗️ Construtora / Reformas" },
  { value: "geral",         label: "🤖 Outro negócio" },
];

function AdminInput({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, type = "text", mono = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all border ${mono ? "font-mono" : ""}`}
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
      onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; }}
      onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
    />
  );
}

function StyledSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-all border appearance-none cursor-pointer"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
      onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; }}
      onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {options.map(({ value: v, label: l }) => (
        <option key={v} value={v} style={{ background: "#0d1929" }}>{l}</option>
      ))}
    </select>
  );
}

function TenantCard({ tenant, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    nome:            tenant.nome            ?? "",
    nicho:           tenant.nicho           ?? "",
    plan:            tenant.plan            ?? "basic",
    trial_ends_at:   tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toISOString().split("T")[0] : "",
    status:          tenant.status,
    phone_number_id: tenant.phone_number_id ?? "",
    wa_access_token: "",
    bot_name:        tenant.bot_name,
    clinic_phone:    tenant.clinic_phone    ?? "",
    prompt_text:     tenant.prompt_text     ?? "",
  });

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const salvar = async () => {
    setSaving(true);
    const body = { ...form };
    if (!body.wa_access_token) delete body.wa_access_token;
    const res  = await apiFetch(`/api/admin/tenants/${tenant.id}`, { method: "PUT", body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { onUpdate(data); setEditing(false); }
    setSaving(false);
  };

  const temWhats  = !!tenant.phone_number_id;
  const statusCfg = STATUS_STYLES[tenant.status] ?? STATUS_STYLES.pausado;
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${expanded ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
        onClick={() => { setExpanded(!expanded); if (expanded) setEditing(false); }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-xl shrink-0 border"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          {tenant.bot_emoji ?? "🤖"}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{tenant.nome}</p>
          <p className="text-slate-500 text-xs truncate">
            {tenant.nicho} · {tenant.totalContatos ?? 0} contatos
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {temWhats ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <Wifi size={12} /> WhatsApp
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <WifiOff size={12} /> Sem número
            </span>
          )}
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border"
            style={{ background: statusCfg.bg, borderColor: statusCfg.border, color: statusCfg.text }}
          >
            <StatusIcon size={10} /> {statusCfg.label}
          </span>
          {expanded
            ? <ChevronUp  size={16} className="text-slate-500" />
            : <ChevronDown size={16} className="text-slate-500" />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Quick info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {[
              { label: "Plano",      value: tenant.plan },
              { label: "Bot",        value: `${tenant.bot_emoji} ${tenant.bot_name}` },
              { label: "Trial até",  value: tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString("pt-BR") : "—" },
              { label: "Criado em",  value: new Date(tenant.created_at).toLocaleDateString("pt-BR") },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl px-3 py-2.5 border"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</p>
                <p className="text-slate-200 text-sm font-semibold truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Edit form */}
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput label="Nome do Negócio">
                  <StyledInput value={form.nome} onChange={update("nome")} />
                </AdminInput>
                <AdminInput label="Nicho">
                  <StyledSelect value={form.nicho} onChange={update("nicho")}
                    options={NICHOS.map((n) => ({ value: n.value, label: n.label }))} />
                </AdminInput>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <AdminInput label="Plano">
                  <StyledSelect value={form.plan} onChange={update("plan")}
                    options={["basic","pro","premium"].map((p) => ({ value: p, label: p }))} />
                </AdminInput>
                <AdminInput label="Status">
                  <StyledSelect value={form.status} onChange={update("status")}
                    options={["trial","ativo","pausado","cancelado"].map((s) => ({ value: s, label: s }))} />
                </AdminInput>
                <AdminInput label="Data Fim Trial">
                  <input
                    type="date"
                    value={form.trial_ends_at}
                    onChange={update("trial_ends_at")}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none border [color-scheme:dark]"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                  />
                </AdminInput>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AdminInput label="Nome do Bot">
                  <StyledInput value={form.bot_name} onChange={update("bot_name")} />
                </AdminInput>
                <AdminInput label="Telefone de Contato">
                  <StyledInput value={form.clinic_phone} onChange={update("clinic_phone")} mono />
                </AdminInput>
              </div>

              <AdminInput label="Phone Number ID (Meta API)">
                <StyledInput value={form.phone_number_id} onChange={update("phone_number_id")}
                  placeholder="123456789" mono />
              </AdminInput>

              <AdminInput label="WhatsApp Access Token (deixe vazio para manter)">
                <StyledInput type="password" value={form.wa_access_token}
                  onChange={update("wa_access_token")} placeholder="EAAxxxx..." mono />
              </AdminInput>

              <AdminInput label="Prompt Personalizado (Regras · Tom · Preços)">
                <textarea
                  value={form.prompt_text}
                  onChange={update("prompt_text")}
                  rows={5}
                  placeholder="Você é um assistente da clínica..."
                  className="w-full rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none border font-mono resize-y"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
              </AdminInput>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={salvar}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 btn-primary"
                >
                  <Save size={14} />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-400 transition-all border"
                  style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 transition-all border"
              style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
            >
              <Edit3 size={14} />
              Editar configurações
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("todos");

  const carregar = async () => {
    setLoading(true);
    const res  = await apiFetch("/api/admin/tenants");
    const data = await res.json();
    setTenants(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const atualizar = (updated) =>
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));

  const filtrados = tenants.filter((t) => {
    const matchSearch = t.nome.toLowerCase().includes(search.toLowerCase()) ||
                        t.nicho.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "todos" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total:  tenants.length,
    ativos: tenants.filter((t) => t.status === "ativo").length,
    trial:  tenants.filter((t) => t.status === "trial").length,
    semNum: tenants.filter((t) => !t.phone_number_id).length,
  };

  const statCards = [
    { label: "Total",        value: stats.total,  icon: Users,       gradient: "from-indigo-500 to-violet-600" },
    { label: "Ativos",       value: stats.ativos, icon: CheckCircle, gradient: "from-emerald-500 to-teal-500"  },
    { label: "Trial",        value: stats.trial,  icon: Clock,       gradient: "from-amber-500 to-orange-500"  },
    { label: "Sem WhatsApp", value: stats.semNum, icon: WifiOff,     gradient: "from-rose-500 to-pink-600"     },
  ];

  return (
    <div className="p-8 overflow-y-auto space-y-7 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/painel")}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            title="Voltar ao Painel"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            <ArrowLeft size={18} className="text-slate-400" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <ShieldAlert size={16} className="text-white" />
              </div>
              <h1 className="font-display text-2xl font-black text-white">Painel Admin</h1>
            </div>
            <p className="text-slate-500 text-sm ml-10">Gerencie todos os clientes da plataforma</p>
          </div>
        </div>

        <button
          onClick={carregar}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 rounded-xl transition-all border"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.color = "#a5b4fc"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#cbd5e1"; }}
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className="glass rounded-2xl p-4 relative overflow-hidden group">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-md`}>
              <Icon size={16} />
            </div>
            <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
            <p className="font-display text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou nicho..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.4)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
        </div>

        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 pr-4 py-2.5 text-sm text-slate-200 rounded-xl focus:outline-none border appearance-none cursor-pointer"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <option value="todos"     style={{ background: "#0d1929" }}>Todos</option>
            <option value="trial"     style={{ background: "#0d1929" }}>Trial</option>
            <option value="ativo"     style={{ background: "#0d1929" }}>Ativos</option>
            <option value="pausado"   style={{ background: "#0d1929" }}>Pausados</option>
            <option value="cancelado" style={{ background: "#0d1929" }}>Cancelados</option>
          </select>
        </div>
      </div>

      {/* ── Tenant List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 flex items-center justify-center animate-pulse">
            <Zap size={22} className="text-violet-400" />
          </div>
          <p className="text-slate-500 text-sm">Carregando clientes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-600 text-4xl mb-3">🏢</p>
          <p className="text-slate-400 font-semibold">
            {tenants.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum resultado para o filtro."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {filtrados.map((t) => (
            <TenantCard key={t.id} tenant={t} onUpdate={atualizar} />
          ))}
        </div>
      )}
    </div>
  );
}
