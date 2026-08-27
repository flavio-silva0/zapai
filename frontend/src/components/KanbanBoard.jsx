// Colunas do Kanban e suas cores
const COLUNAS = [
  {
    status: "Novo",
    border: "border-slate-200 dark:border-slate-800",
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  {
    status: "Em Atendimento",
    border: "border-amber-200 dark:border-amber-800/80",
    badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  {
    status: "Agendado",
    border: "border-emerald-200 dark:border-emerald-800/80",
    badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
];

function formatarHora(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function PatientCard({ patient, isSelected, onSelect }) {
  const isAiOff = !patient.is_ai_active;
  const nome = patient.nome || (patient.telefone ? `+${patient.telefone.replace("@c.us", "")}` : "Contato");

  return (
    <button
      onClick={() => onSelect(patient)}
      className={`w-full text-left p-3 rounded-xl transition-all duration-150 mb-2 cursor-pointer ${
        isSelected
          ? "bg-teal-50 dark:bg-teal-950/50 border-2 border-teal-600 dark:border-teal-500 shadow-xs"
          : "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] shadow-xs"
      }`}
    >
      {/* Nome + indicador IA */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm font-semibold truncate pr-2 ${
            isSelected ? "text-teal-950 dark:text-teal-100" : "text-[var(--text-primary)]"
          }`}
        >
          {nome}
        </span>
        <span
          title={isAiOff ? "IA Pausada" : "IA Ativa"}
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            isAiOff
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          }`}
        >
          {isAiOff ? "⏸ Pausado" : "🤖 IA"}
        </span>
      </div>

      {/* Telefone + hora */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)] truncate font-mono">
          {patient.telefone ? `+${patient.telefone.replace("@c.us", "")}` : ""}
        </span>
        <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0 ml-1">
          {formatarHora(patient.created_at)}
        </span>
      </div>
    </button>
  );
}

export default function KanbanBoard({ patients, selectedId, onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      {COLUNAS.map(({ status, border, badge, dot }) => {
        const grupo = patients.filter((p) => p.status_kanban === status);
        return (
          <div key={status}>
            {/* Cabeçalho da coluna */}
            <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${border}`}>
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {status}
              </span>
              <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-bold ${badge}`}>
                {grupo.length}
              </span>
            </div>

            {/* Cards */}
            {grupo.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-3 italic">
                Nenhum atendimento
              </p>
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
