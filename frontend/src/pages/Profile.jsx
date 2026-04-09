import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { User, Building, Phone, CheckCircle, Edit2, Save, X } from "lucide-react";
import { apiFetch } from "../api";

export default function Profile() {
  const { user, tenant, login } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tenant_nome: "",
    clinic_phone: "",
    bot_name: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || "",
        email: user.email || "",
        tenant_nome: tenant?.nome || "",
        clinic_phone: tenant?.clinic_phone || "",
        bot_name: tenant?.bot_name || "",
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
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar");
      }
      
      // Update local context
      const updatedUser = { ...user, nome: formData.nome, email: formData.email };
      const updatedTenant = tenant ? { ...tenant, nome: formData.tenant_nome, clinic_phone: formData.clinic_phone, bot_name: formData.bot_name } : null;
      
      const token = localStorage.getItem("sofia_token");
      login(token, updatedUser, updatedTenant);
      
      setIsEditing(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 relative z-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
          <p className="text-slate-400">Suas informações de login e gerenciamento do negócio.</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 font-medium transition-colors">
            <Edit2 size={16} /> Editar Informações
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 font-medium transition-colors">
              <X size={16} /> Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50">
              <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        )}
      </header>

      {erro && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          Ocorreu um erro: {erro}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Card Usuário */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-cyan-500/5 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
               <User size={24}/>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Informações de Login</h2>
          </div>
          <div className="space-y-5 text-slate-300">
             <div>
                <label className="block text-sm text-slate-500 mb-1">Nome</label>
                {isEditing ? (
                  <input type="text" className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-4 py-2.5 text-white focus:outline-none" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                ) : (
                  <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200">{user.nome}</div>
                )}
             </div>
             <div>
                <label className="block text-sm text-slate-500 mb-1">E-mail</label>
                {isEditing ? (
                  <input type="email" className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-4 py-2.5 text-white focus:outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                ) : (
                  <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 flex justify-between">{user.email} <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">Verificado</span></div>
                )}
             </div>
             <div>
                <p className="text-sm text-slate-500 mb-1">Nível de Acesso</p>
                <p className="font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg inline-block mt-1 text-xs uppercase tracking-wider font-semibold border border-emerald-500/20">
                   {user.role}
                </p>
             </div>
          </div>
        </div>

        {/* Card Negócio (Se não for super admin) */}
        {tenant && (
          <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-lg hover:shadow-blue-500/5 transition-all flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                 <Building size={24}/>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Meu Negócio</h2>
            </div>
            <div className="space-y-5 text-slate-300 flex-1">
               <div>
                  <label className="block text-sm text-slate-500 mb-1">Empresa / Sistema</label>
                  {isEditing ? (
                    <input type="text" className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl px-4 py-2.5 text-white focus:outline-none" value={formData.tenant_nome} onChange={e => setFormData({...formData, tenant_nome: e.target.value})} />
                  ) : (
                    <p className="font-medium text-slate-100 text-lg">{tenant.nome}</p>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Robô Atendente</label>
                    <p className="font-medium text-slate-200 text-lg">{tenant.bot_emoji} {tenant.bot_name}</p>
                 </div>
                 <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Telefone (Suporte)</label>
                    <p className="font-medium text-slate-200 flex items-center gap-2">
                       <Phone size={14} className="text-cyan-400"/> {tenant.clinic_phone || "N/A"}
                    </p>
                 </div>
               </div>
               
               <div className="pt-4 border-t border-slate-700/50 mt-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Status da Conta</p>
                      <p className="font-bold text-emerald-400 flex items-center gap-2 mt-1">
                        <CheckCircle size={16}/> {tenant.status.toUpperCase()}
                      </p>
                    </div>
                    {tenant.trial_ends_at && tenant.status === 'trial' && (
                       <div className="text-right">
                          <p className="text-sm text-slate-500">Trial expira em</p>
                          <p className="text-sm text-amber-400 font-medium mt-1">
                            {new Date(tenant.trial_ends_at).toLocaleDateString()}
                          </p>
                       </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
