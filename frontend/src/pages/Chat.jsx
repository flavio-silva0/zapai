import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";
import KanbanBoard from "../components/KanbanBoard";
import ChatViewer from "../components/ChatViewer";

export default function Chat() {
  const [patients, setPatients]               = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [searchParams]                        = useSearchParams();

  // ── Busca todos os pacientes ─────────────────────────────────
  const fetchPatients = useCallback(async () => {
    try {
      const res  = await apiFetch("/api/patients");
      const data = await res.json();
      setPatients(data);

      // Mantém o paciente selecionado atualizado
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

  // ── Carrega pacientes na montagem ─────────────────────────────
  useEffect(() => {
    fetchPatients();
  }, []);

  // ── Auto-seleciona por ?patientId= vindo do Kanban ───────────
  useEffect(() => {
    if (loading || patients.length === 0) return;
    const idParam = searchParams.get("patientId");
    if (!idParam) return;
    const encontrado = patients.find((p) => String(p.id) === idParam);
    if (encontrado) setSelectedPatient(encontrado);
  }, [loading, patients, searchParams]);

  // ── SSE — atualizações em tempo real ──────────────────────────
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

      {/* ── Inner Sidebar: Lista Kanban ────────────────────────── */}
      <aside className="w-80 border-r border-slate-700/50 bg-slate-900/50 flex flex-col z-0">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-200">Pacientes e Conversas</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              Carregando pacientes...
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

      {/* ── Inner Main: Chat Viewer ────────────────────────────── */}
      <div className="flex-1 bg-slate-900 flex flex-col z-0">
        {selectedPatient ? (
          <ChatViewer
            patient={selectedPatient}
            onPatientChange={(updated) => {
              setSelectedPatient(updated);
              fetchPatients();
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500 bg-slate-900/50">
            <div className="text-6xl opacity-30 drop-shadow-xl">💬</div>
            <p className="text-sm">Selecione um paciente na lista para ver a conversa</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
