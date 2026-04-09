import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { User, Building, Phone, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user, tenant } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
        <p className="text-slate-400">Suas informações de login e gerenciamento do negócio.</p>
      </header>

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
                <p className="text-sm text-slate-500 mb-1">Nome</p>
                <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200">
                  {user.nome}
                </div>
             </div>
             <div>
                <p className="text-sm text-slate-500 mb-1">E-mail</p>
                <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 flex items-center justify-between">
                  {user.email}
                  <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">Verificado</span>
                </div>
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
                  <p className="text-sm text-slate-500 mb-1">Empresa / Sistema</p>
                  <p className="font-medium text-slate-100 text-lg">{tenant.nome}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Robô Atendente</p>
                    <p className="font-medium text-slate-200 text-lg">{tenant.bot_emoji} {tenant.bot_name}</p>
                 </div>
                 <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Telefone (Suporte)</p>
                    <p className="font-medium text-slate-200 flex items-center gap-2">
                       <Phone size={14} className="text-cyan-400"/> {tenant.clinic_phone || "Não informado"}
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
