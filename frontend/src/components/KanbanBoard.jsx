// Colunas do Kanban e suas cores
const COLUNAS = [
  { status: "Novo",            cor: "border-slate-500",  badge: "bg-slate-700 text-slate-200",  dot: "bg-slate-400"  },
  { status: "Em Atendimento",  cor: "border-amber-500",  badge: "bg-amber-900/50 text-amber-300", dot: "bg-amber-400" },
  { status: "Agendado",        cor: "border-emerald-500", badge: "bg-emerald-900/50 text-emerald-300", dot: "bg-emerald-400" },
];

function formatarHora(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function PatientCard({ patient, isSelected, onSelect }) {
  const isAiOff = !patient.is_ai_active;

  return (
    <button
      onClick={() => onSelect(patient)}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-150 mb-2 group
        ${isSelected
          ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          : "border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800"
        }`}
    >
      {/* Nome + indicador IA */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-white truncate pr-2">
          {patient.nome}
        </span>
        <span
          title={isAiOff ? "IA Pausada" : "IA Ativa"}
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0
            ${isAiOff ? "bg-red-900/60 text-red-300" : "bg-emerald-900/40 text-emerald-400"}`}
        >
          {isAiOff ? "⏸ Pausado" : "🤖 IA"}
        </span>
      </div>

      {/* Telefone + hora */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 truncate">
          {patient.telefone.replace("@c.us", "")}
        </span>
        <span className="text-xs text-slate-600 flex-shrink-0 ml-1">
          {formatarHora(patient.created_at)}
        </span>
      </div>
    </button>
  );
}

export default function KanbanBoard({ patients, selectedId, onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      {COLUNAS.map(({ status, cor, badge, dot }) => {
        const grupo = patients.filter((p) => p.status_kanban === status);
        return (
          <div key={status}>
            {/* Cabeçalho da coluna */}
            <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${cor} border-opacity-50`}>
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {status}
              </span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>
                {grupo.length}
              </span>
            </div>

            {/* Cards */}
            {grupo.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-3 italic">Nenhum paciente</p>
            ) : (
              grupo.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  isSelected={p.id === selectedId}
                  onSelect={onSelect}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
