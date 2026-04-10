import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { Building2, Users, CheckCircle, XCircle, Clock, Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

const STATUS_COLORS = {
  trial:     "bg-amber-500/20 text-amber-300 border-amber-500/30",
  ativo:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  pausado:   "bg-slate-500/20 text-slate-300 border-slate-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
};
const STATUS_ICONS = {
  trial: <Clock size={12} />, ativo: <CheckCircle size={12} />,
  pausado: <XCircle size={12} />, cancelado: <XCircle size={12} />,
};

function TenantCard({ tenant, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    nome:             tenant.nome ?? "",
    nicho:            tenant.nicho ?? "",
    plan:             tenant.plan ?? "basic",
    trial_ends_at:    tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toISOString().split('T')[0] : "",
    status:           tenant.status,
    phone_number_id:  tenant.phone_number_id ?? "",
    wa_access_token:  "",  // não exibimos o token salvo por segurança
    bot_name:         tenant.bot_name,
    clinic_phone:     tenant.clinic_phone ?? "",
    prompt_text:      tenant.prompt_text ?? "",
  });

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const salvar = async () => {
    setSaving(true);
    const body = { ...form };
    if (!body.wa_access_token) delete body.wa_access_token; // não sobrescreve se vazio
    const res  = await apiFetch(`/api/admin/tenants/${tenant.id}`, { method: "PUT", body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) { onUpdate(data); setEditing(false); }
    setSaving(false);
  };

  const temWhats = !!tenant.phone_number_id;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header do card */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-700/30 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg flex-shrink-0">
          {tenant.bot_emoji ?? "🤖"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{tenant.nome}</p>
          <p className="text-slate-400 text-xs truncate">{tenant.nicho} · {tenant.totalContatos ?? 0} contatos</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {temWhats ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400"><Wifi size={12} /> WhatsApp</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-slate-500"><WifiOff size={12} /> Sem número</span>
          )}
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[tenant.status]}`}>
            {STATUS_ICONS[tenant.status]} {tenant.status}
          </span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-slate-700 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-500">Plano:</span> <span className="text-slate-200">{tenant.plan}</span></div>
            <div><span className="text-slate-500">Trial até:</span> <span className="text-slate-200">{tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString("pt-BR") : "—"}</span></div>
            <div><span className="text-slate-500">Criado em:</span> <span className="text-slate-200">{new Date(tenant.created_at).toLocaleDateString("pt-BR")}</span></div>
            <div><span className="text-slate-500">Bot name:</span> <span className="text-slate-200">{tenant.bot_name}</span></div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nome do Negócio</label>
                  <input value={form.nome} onChange={update("nome")}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nicho</label>
                  <input value={form.nicho} onChange={update("nicho")}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Plano</label>
                  <select value={form.plan} onChange={update("plan")}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                    {["basic","pro","premium"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Data Fim Trial</label>
                  <input type="date" value={form.trial_ends_at} onChange={update("trial_ends_at")}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 [color-scheme:dark]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Status</label>
                  <select value={form.status} onChange={update("status")}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                    {["trial","ativo","pausado","cancelado"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nome do Bot</label>
                  <input value={form.bot_name} onChange={update("bot_name")}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone Number ID (Meta API)</label>
                <input value={form.phone_number_id} onChange={update("phone_number_id")}
                  placeholder="123456789012345"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">WhatsApp Access Token (deixe vazio para manter atual)</label>
                <input value={form.wa_access_token} onChange={update("wa_access_token")} type="password"
                  placeholder="EAAxxxxxxx..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Telefone de contato</label>
                <input value={form.clinic_phone} onChange={update("clinic_phone")}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Prompt Personalizado da Inteligência (Regras, Tom de Voz, Preços)</label>
                <textarea value={form.prompt_text} onChange={update("prompt_text")}
                  rows="6"
                  placeholder="Você é um assistente da clínica..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs resize-y" />
              </div>
              <div className="flex gap-2">
                <button onClick={salvar} disabled={saving}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-semibold transition">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}
              className="w-full py-2 border border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-slate-300 rounded-lg text-sm transition">
              ✏️ Editar configurações
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
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("todos");

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
    total:   tenants.length,
    ativos:  tenants.filter((t) => t.status === "ativo").length,
    trial:   tenants.filter((t) => t.status === "trial").length,
    semNum:  tenants.filter((t) => !t.phone_number_id).length,
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors border border-slate-700/50 hover:border-slate-600"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 size={24} className="text-cyan-400" /> Painel Admin
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gerencie todos os clientes da plataforma</p>
          </div>
        </div>
        <button onClick={carregar}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",         value: stats.total,  color: "text-white",         icon: <Users size={16} /> },
          { label: "Ativos",        value: stats.ativos, color: "text-emerald-400",    icon: <CheckCircle size={16} /> },
          { label: "Trial",         value: stats.trial,  color: "text-amber-400",      icon: <Clock size={16} /> },
          { label: "Sem WhatsApp",  value: stats.semNum, color: "text-red-400",        icon: <WifiOff size={16} /> },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className={`flex items-center gap-2 ${s.color} mb-1`}>{s.icon}
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou nicho..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition cursor-pointer">
          <option value="todos">Todos</option>
          <option value="trial">Trial</option>
          <option value="ativo">Ativos</option>
          <option value="pausado">Pausados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">Carregando clientes...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          {tenants.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum resultado para o filtro."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((t) => (
            <TenantCard key={t.id} tenant={t} onUpdate={atualizar} />
          ))}
        </div>
      )}
    </div>
  );
}
