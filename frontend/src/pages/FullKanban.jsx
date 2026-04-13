import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";
import { MessageSquare, Zap } from "lucide-react";

const COLUMNS = [
  {
    status: "Novo",
    label:  "Novos",
    borderColor: "rgba(100,116,139,0.3)",
    headerGrad: "from-slate-500/10 to-transparent",
    dot: "bg-slate-400",
    dotGlow: "shadow-slate-400/50",
    dragBorder: "rgba(148,163,184,0.5)",
    dragBg: "rgba(148,163,184,0.04)",
    countColor: "text-slate-400",
    countBg: "bg-slate-400/10",
  },
  {
    status: "Em Atendimento",
    label:  "Em Atendimento",
    borderColor: "rgba(251,191,36,0.25)",
    headerGrad: "from-amber-500/10 to-transparent",
    dot: "bg-amber-400",
    dotGlow: "shadow-amber-400/50",
    dragBorder: "rgba(251,191,36,0.5)",
    dragBg: "rgba(251,191,36,0.04)",
    countColor: "text-amber-400",
    countBg: "bg-amber-400/10",
  },
  {
    status: "Agendado",
    label:  "Agendado",
    borderColor: "rgba(52,211,153,0.25)",
    headerGrad: "from-emerald-500/10 to-transparent",
    dot: "bg-emerald-400",
    dotGlow: "shadow-emerald-400/50",
    dragBorder: "rgba(52,211,153,0.5)",
    dragBg: "rgba(52,211,153,0.04)",
    countColor: "text-emerald-400",
    countBg: "bg-emerald-400/10",
  },
];

export default function FullKanban() {
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOver, setDragOver]     = useState(null);
  const navigate                    = useNavigate();

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
      fetchPatients();
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOver(null);
  };

  const handleDoubleClick = (patientId) => {
    navigate(`/painel/chat?patientId=${patientId}`);
  };

  return (
    <div className="p-8 h-full flex flex-col">

      {/* ── Header ── */}
      <header className="mb-6 shrink-0">
        <h1 className="font-display text-3xl font-black text-white mb-1">Quadro Kanban</h1>
        <p className="text-slate-500 text-sm">
          Visão completa do fluxo de atendimento ·{" "}
          <span className="text-slate-600">Arraste para mover · Duplo clique para abrir conversa</span>
        </p>
      </header>

      {/* ── Board ── */}
      <div className="flex-1 min-h-0 overflow-x-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center animate-pulse">
              <Zap size={22} className="text-indigo-400" />
            </div>
            <p className="text-slate-500 text-sm">Carregando quadro...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 h-full min-w-[800px]">
            {COLUMNS.map((col) => {
              const grupo      = patients.filter((p) => p.status_kanban === col.status);
              const isDropZone = dragOver === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDrop={(e) => handleDrop(e, col.status)}
                  onDragLeave={() => setDragOver(null)}
                  className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    border: `1px solid ${isDropZone ? col.dragBorder : col.borderColor}`,
                    background: isDropZone ? col.dragBg : "rgba(255,255,255,0.02)",
                    backdropFilter: "blur(12px)",
                    transform: isDropZone ? "scale(1.01)" : "scale(1)",
                  }}
                >
                  {/* Column header */}
                  <div className={`px-4 py-3.5 bg-gradient-to-r ${col.headerGrad} shrink-0`}
                    style={{ borderBottom: `1px solid ${col.borderColor}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shadow-sm ${col.dotGlow}`} />
                        <h3 className="font-bold text-white text-sm tracking-wide">{col.label}</h3>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countBg} ${col.countColor}`}>
                        {grupo.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-0">
                    {grupo.length === 0 ? (
                      <div
                        className="h-24 flex items-center justify-center rounded-xl border-2 border-dashed text-sm transition-colors"
                        style={{
                          borderColor: isDropZone ? col.dragBorder : "rgba(255,255,255,0.06)",
                          color: isDropZone ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                        }}
                      >
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
                            className="group rounded-xl p-4 cursor-grab active:cursor-grabbing select-none transition-all duration-150"
                            style={{
                              background: isDragging ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              opacity: isDragging ? 0.4 : 1,
                              transform: isDragging ? "scale(0.97)" : "scale(1)",
                            }}
                            onMouseEnter={(e) => {
                              if (!isDragging) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                                e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                              e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-slate-100 font-semibold text-sm truncate pr-2 group-hover:text-white transition-colors">
                                {p.nome}
                              </h4>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                  isAiOff
                                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                                    : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                }`}>
                                  {isAiOff ? "PAUSA" : "IA"}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-500 text-xs font-mono">
                              {p.telefone.replace("@c.us", "")}
                            </p>
                            <div className="flex items-center justify-between mt-2.5 pt-2"
                              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                            >
                              <p className="text-slate-600 text-[10px]">
                                {new Date(p.created_at).toLocaleString("pt-BR", {
                                  hour: "2-digit", minute: "2-digit",
                                  day: "2-digit",  month: "2-digit",
                                })}
                              </p>
                              <MessageSquare size={11} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                            </div>
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
