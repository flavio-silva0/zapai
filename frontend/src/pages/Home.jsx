import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import { Users, Bot, MessageSquare, Activity } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Erro stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Carregando estatísticas...
      </div>
    );
  }

  const cards = [
    { label: "Total de Contatos", value: stats?.total || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Atendimentos via IA", value: stats?.aiAtivo || 0, icon: Bot, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Total de Mensagens", value: stats?.totalMensagens || 0, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Novos Contatos", value: stats?.novo || 0, icon: Activity, color: "text-rose-400", bg: "bg-rose-400/10" },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-white mb-2">Visão Geral</h1>
        <p className="text-slate-400">Bem-vindo(a) ao painel {stats?.clinica ? `da ${stats.clinica}` : "do Sistema"}. Aqui está o resumo das operações.</p>
      </header>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {cards.map((card, i) => (
          <div key={i} className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4 shadow-lg hover:shadow-cyan-500/5 transition-all">
            <div className={`p-4 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo Kanban */}
      <div className="mt-8 relative z-10">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Status do Kanban</h2>
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-300 w-32">Novos</span>
              <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className="bg-slate-400 h-full" style={{ width: `${Math.max(2, ((stats?.novo || 0)/(stats?.total||1))*100)}%` }} />
              </div>
              <span className="text-slate-400 font-medium text-sm">{stats?.novo || 0}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-slate-300 w-32">Em Atendimento</span>
              <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${Math.max(2, ((stats?.emAtendimento || 0)/(stats?.total||1))*100)}%` }} />
              </div>
              <span className="text-slate-400 font-medium text-sm">{stats?.emAtendimento || 0}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-slate-300 w-32">Agendados</span>
              <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${Math.max(2, ((stats?.agendado || 0)/(stats?.total||1))*100)}%` }} />
              </div>
              <span className="text-slate-400 font-medium text-sm">{stats?.agendado || 0}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
