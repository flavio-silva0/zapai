import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";
import KanbanBoard from "../components/KanbanBoard";
import ChatViewer from "../components/ChatViewer";
import { MessageSquare, Zap } from "lucide-react";

export default function Chat() {
  const [patients, setPatients]               = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [searchParams]                        = useSearchParams();

  const fetchPatients = useCallback(async () => {
    try {
      const res  = await apiFetch("/api/patients");
      const data = await res.json();
      setPatients(data);
      if (selectedPatient) {
        const atualizado = data.find((p) => p.id === selectedPatient.id);
        if (atualizado) setSelectedPatient(atualizado);
      }
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPatient]);

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    if (loading || patients.length === 0) return;
    const idParam = searchParams.get("patientId");
    if (!idParam) return;
    const encontrado = patients.find((p) => String(p.id) === idParam);
    if (encontrado) setSelectedPatient(encontrado);
  }, [loading, patients, searchParams]);

  useEffect(() => {
    const es = new EventSource(apiUrl("/api/events"));
    es.addEventListener("patient_updated", () => fetchPatients());
    es.addEventListener("new_message", (e) => {
      const msg = JSON.parse(e.data);
      fetchPatients();
      window.dispatchEvent(new CustomEvent("dentistai:new_message", { detail: msg }));
    });
    es.onerror = () => console.warn("SSE desconectado. Tentando reconectar...");
    return () => es.close();
  }, [fetchPatients]);

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Inner Sidebar ── */}
      <aside
        className="w-80 flex flex-col z-10 shrink-0"
        style={{
          background: "rgba(3,8,15,0.7)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center gap-2.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <MessageSquare size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold">Contatos e Conversas</h2>
            {!loading && (
              <p className="text-slate-500 text-[10px]">{patients.length} contatos</p>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 flex items-center justify-center animate-pulse">
                <Zap size={14} className="text-indigo-400" />
              </div>
              <p className="text-slate-600 text-xs">Carregando contatos...</p>
            </div>
          ) : (
            <KanbanBoard
              patients={patients}
              selectedId={selectedPatient?.id}
              onSelect={setSelectedPatient}
            />
          )}
        </div>
      </aside>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col z-0 min-w-0" style={{ background: "rgba(6,14,26,0.5)" }}>
        {selectedPatient ? (
          <ChatViewer
            patient={selectedPatient}
            onPatientChange={(updated) => {
              setSelectedPatient(updated);
              fetchPatients();
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center">
                <MessageSquare size={36} className="text-indigo-400/40" strokeWidth={1.5} />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">Nenhuma conversa selecionada</p>
              <p className="text-slate-500 text-sm">Selecione um contato na lista ao lado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
