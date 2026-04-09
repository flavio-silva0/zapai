import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";

const COLUMNS = [
  { status: "Novo",           border: "border-slate-500",   bg: "bg-slate-800/60",   dot: "bg-slate-400",   drag: "border-slate-400" },
  { status: "Em Atendimento", border: "border-amber-500",   bg: "bg-amber-900/20",   dot: "bg-amber-400",   drag: "border-amber-400" },
  { status: "Agendado",       border: "border-emerald-500", bg: "bg-emerald-900/20", dot: "bg-emerald-400", drag: "border-emerald-400" },
];

export default function FullKanban() {
  const [patients, setPatients]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [draggingId, setDraggingId] = useState(null);  // id do card arrastado
  const [dragOver, setDragOver]   = useState(null);    // status da coluna em hover
  const navigate                  = useNavigate();

  const fetchPatients = async () => {
    try {
      const res  = await apiFetch("/api/patients");
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    const es = new EventSource(apiUrl("/api/events"));
    es.addEventListener("patient_updated", fetchPatients);
    es.addEventListener("new_message",     fetchPatients);
    return () => es.close();
  }, []);

  // ── Drag handlers ────────────────────────────────────────────
  const handleDragStart = (e, patientId) => {
    setDraggingId(patientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  };

  const handleDrop = async (e, novoStatus) => {
    e.preventDefault();
    setDragOver(null);
    if (!draggingId) return;

    const paciente = patients.find((p) => p.id === draggingId);
    if (!paciente || paciente.status_kanban === novoStatus) {
      setDraggingId(null);
      return;
    }

    // Optimistic update — UI reflete antes da API responder
    setPatients((prev) =>
      prev.map((p) => p.id === draggingId ? { ...p, status_kanban: novoStatus } : p)
    );
    setDraggingId(null);

    try {
      await apiFetch(`/api/patients/${draggingId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status_kanban: novoStatus }),
      });
    } catch {
      fetchPatients(); // reverte em caso de erro
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOver(null);
  };

  // ── Duplo clique → abre conversa ─────────────────────────────
  const handleDoubleClick = (patientId) => {
    navigate(`/chat?patientId=${patientId}`);
  };

  return (
    <div className="p-8 h-full flex flex-col relative z-10">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-white mb-1">Quadro Kanban</h1>
        <p className="text-slate-400 text-sm">
          Visão completa do fluxo de atendimento. <span className="text-slate-500">Arraste para mover · Duplo clique para abrir conversa</span>
        </p>
      </header>

      <div className="flex-1 overflow-x-auto min-h-0 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            Carregando quadro...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 h-full min-w-[900px]">
            {COLUMNS.map(({ status, border, bg, dot, drag }) => {
              const grupo      = patients.filter((p) => p.status_kanban === status);
              const isDropZone = dragOver === status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragLeave={() => setDragOver(null)}
                  className={`flex flex-col rounded-xl border transition-all duration-150 overflow-hidden
                    ${isDropZone
                      ? `${drag} bg-white/5 scale-[1.01] shadow-lg shadow-white/5`
                      : `${border} ${bg} border-opacity-30`}`}
                >
                  {/* Header da coluna */}
                  <div className={`p-4 border-b ${border} border-opacity-30 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      <h3 className="font-semibold text-slate-200 uppercase tracking-wide text-sm">{status}</h3>
                    </div>
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-md">
                      {grupo.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3">
                    {grupo.length === 0 ? (
                      <div className={`h-20 flex items-center justify-center rounded-lg border-2 border-dashed text-slate-600 text-sm transition-colors
                        ${isDropZone ? "border-slate-400 text-slate-400" : "border-slate-700"}`}>
                        {isDropZone ? "Solte aqui" : "Vazio"}
                      </div>
                    ) : (
                      grupo.map((p) => {
                        const isAiOff  = !p.is_ai_active;
                        const isDragging = draggingId === p.id;
                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            onDragEnd={handleDragEnd}
                            onDoubleClick={() => handleDoubleClick(p.id)}
                            title="Arraste para mover · Duplo clique para abrir conversa"
                            className={`bg-slate-800 border border-slate-700/60 p-4 rounded-xl shadow-md cursor-grab active:cursor-grabbing
                              transition-all duration-150 select-none
                              hover:border-slate-500 hover:shadow-lg hover:-translate-y-0.5
                              ${isDragging ? "opacity-40 scale-95" : "opacity-100"}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-slate-100 font-medium truncate pr-2">{p.nome}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 font-bold ${isAiOff ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                                {isAiOff ? "PAUSA" : "IA"}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs font-mono">{p.telefone.replace("@c.us", "")}</p>
                            <p className="text-slate-500 text-[10px] mt-2">
                              {new Date(p.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
