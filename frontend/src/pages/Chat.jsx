import { useState, useEffect, useCallback, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";
import { AuthContext } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import KanbanBoard from "../components/KanbanBoard";
import ChatViewer from "../components/ChatViewer";
import { MessageSquare, Zap } from "lucide-react";

export default function Chat() {
  const { tenant, user } = useContext(AuthContext);
  const config = useConfig();
  const isSuperAdmin = user?.role === "super_admin";

  const botName = isSuperAdmin
    ? "Admin"
    : (tenant?.bot_name || tenant?.botName || config?.botName || "Assistente");
  const botEmoji = isSuperAdmin
    ? "⚙️"
    : (tenant?.bot_emoji || tenant?.botEmoji || config?.botEmoji || "🤖");

  const [patients, setPatients]               = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [searchParams]                        = useSearchParams();

  const fetchPatients = useCallback(async () => {
    try {
      const res  = await apiFetch("/api/patients");
      const data = await res.json();
      setPatients(data);
      setSelectedPatient((prev) => {
        if (!prev) return null;
        const atualizado = data.find((p) => p.id === prev.id);
        return atualizado || prev;
      });
    } catch (err) {
      console.error("Erro ao buscar pacientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    if (loading || patients.length === 0) return;
    const idParam = searchParams.get("patientId");
    if (!idParam) return;
    const encontrado = patients.find((p) => String(p.id) === idParam);
    if (encontrado) setSelectedPatient(encontrado);
  }, [loading, patients, searchParams]);

  useEffect(() => {
    const es = new EventSource(apiUrl("/api/events"));
    const onPatientUpdated = () => fetchPatients();
    const onNewMessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        fetchPatients();
        window.dispatchEvent(new CustomEvent("dentistai:new_message", { detail: msg }));
      } catch (err) {
        console.error("Erro ao processar mensagem SSE:", err);
      }
    };

    es.addEventListener("patient_updated", onPatientUpdated);
    es.addEventListener("new_message", onNewMessage);
    es.onerror = () => console.warn("SSE desconectado. Aguardando reconexão...");

    return () => {
      es.removeEventListener("patient_updated", onPatientUpdated);
      es.removeEventListener("new_message", onNewMessage);
      es.close();
    };
  }, [fetchPatients]);

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg-base)]">

      {/* ── Inner Sidebar (Contatos) ── */}
      <aside className="w-80 flex flex-col z-10 shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-medium)]">
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-[var(--border-medium)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 flex items-center justify-center shrink-0">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Contatos e Conversas</h2>
              {!loading && (
                <p className="text-[var(--text-muted)] text-[11px] font-medium">{patients.length} contatos</p>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 bg-[var(--bg-base)]/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center animate-pulse">
                <Zap size={15} className="text-teal-600" />
              </div>
              <p className="text-[var(--text-muted)] text-xs">Carregando contatos...</p>
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
      <div className="flex-1 flex flex-col z-0 min-w-0 bg-[var(--bg-base)]">
        {selectedPatient ? (
          <ChatViewer
            patient={selectedPatient}
            botName={botName}
            botEmoji={botEmoji}
            onPatientChange={(updated) => {
              setSelectedPatient(updated);
              fetchPatients();
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
              <MessageSquare size={32} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-[var(--text-primary)] font-bold text-base mb-1">Nenhuma conversa selecionada</p>
              <p className="text-[var(--text-secondary)] text-xs">Selecione um contato na lista ao lado para ver o histórico</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
