import { useState, useEffect, useRef, useCallback } from "react";
import { apiFetch } from "../api";

const STATUS_OPTIONS = ["Novo", "Em Atendimento", "Agendado"];

// Estilos por origem da mensagem
const BUBBLE_STYLES = {
  user  : "bg-slate-700 text-slate-100 self-start rounded-tl-none",
  bot   : "bg-blue-600 text-white self-end rounded-tr-none",
  human : "bg-emerald-700 text-white self-end rounded-tr-none",
};

const ORIGIN_LABEL = (botName, botEmoji) => ({
  user  : null,
  bot   : `${botName} ${botEmoji}`,
  human : "Recepção 👤",
});

function formatarHorario(isoString) {
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit",
  });
}

function MessageBubble({ msg, botName, botEmoji }) {
  const label = ORIGIN_LABEL(botName, botEmoji)[msg.origin];
  const isRight = msg.origin !== "user";

  return (
    <div className={`flex flex-col max-w-[75%] gap-1 ${isRight ? "self-end items-end" : "self-start items-start"}`}>
      {label && (
        <span className="text-xs text-slate-400 px-1">{label}</span>
      )}
      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${BUBBLE_STYLES[msg.origin]}`}>
        {msg.texto}
      </div>
      <span className="text-xs text-slate-500 px-1">
        {formatarHorario(msg.created_at)}
      </span>
    </div>
  );
}

export default function ChatViewer({ patient, onPatientChange, botName = "Sofia", botEmoji = "🤖" }) {
  const [messages, setMessages]   = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending]     = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);

  // ── Busca mensagens do paciente ──────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res  = await apiFetch(`/api/patients/${patient.id}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [patient.id]);

  useEffect(() => {
    setLoadingMsgs(true);
    setMessages([]);
    fetchMessages();
  }, [patient.id]);

  // Escuta o evento global disparado pelo App quando chega nova mensagem via SSE
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.patient_id === patient.id) {
        fetchMessages();
      }
    };
    window.addEventListener("dentistai:new_message", handler);
    return () => window.removeEventListener("dentistai:new_message", handler);
  }, [patient.id, fetchMessages]);

  // Scroll automático para o final quando chegam mensagens novas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Mudar status do Kanban ────────────────────────────────────
  const handleStatusChange = async (e) => {
    const status_kanban = e.target.value;
    try {
      const res  = await apiFetch(`/api/patients/${patient.id}/status`, {
        method : "PUT",
        body   : JSON.stringify({ status_kanban }),
      });
      const data = await res.json();
      onPatientChange(data);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // ── Toggle IA ────────────────────────────────────────────────
  const handleAiToggle = async () => {
    try {
      const res  = await apiFetch(`/api/patients/${patient.id}/ai-status`, {
        method : "PUT",
        body   : JSON.stringify({ is_ai_active: !patient.is_ai_active }),
      });
      const data = await res.json();
      onPatientChange(data);
    } catch (err) {
      console.error("Erro ao alternar IA:", err);
    }
  };

  // ── Enviar mensagem manual ────────────────────────────────────
  const handleSend = async () => {
    const texto = inputText.trim();
    if (!texto || sending) return;

    setSending(true);
    setInputText("");

    try {
      await apiFetch(`/api/patients/${patient.id}/send`, {
        method : "POST",
        body   : JSON.stringify({ texto }),
      });
      await fetchMessages();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      setInputText(texto); // Restaura o texto em caso de erro
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const aiAtivo = patient.is_ai_active;

  return (
    <div className="flex flex-col h-full">

      {/* ── Cabeçalho do chat ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg flex-shrink-0">
          {patient.nome.charAt(0).toUpperCase()}
        </div>

        {/* Info do paciente */}
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-sm leading-none truncate">{patient.nome}</h2>
          <p className="text-slate-400 text-xs mt-0.5 truncate">{patient.telefone.replace("@c.us", "")}</p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Select de status Kanban */}
          <select
            value={patient.status_kanban}
            onChange={handleStatusChange}
            className="bg-slate-800 text-slate-200 text-xs border border-slate-600 rounded-lg px-2.5 py-1.5
                       hover:border-slate-500 focus:outline-none focus:border-cyan-500 cursor-pointer transition"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Toggle IA */}
          <button
            onClick={handleAiToggle}
            title={aiAtivo ? "Pausar IA" : "Ativar IA"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
              ${aiAtivo
                ? "bg-emerald-900/40 border-emerald-600 text-emerald-300 hover:bg-emerald-900/70"
                : "bg-red-900/40 border-red-600 text-red-300 hover:bg-red-900/70"
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${aiAtivo ? "bg-emerald-400" : "bg-red-400"}`} />
            {aiAtivo ? "IA Ativa" : "IA Pausada"}
          </button>
        </div>
      </div>

      {/* ── Área de mensagens ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {loadingMsgs ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600">
            <span className="text-4xl">💬</span>
            <p className="text-sm">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} botName={botName} botEmoji={botEmoji} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Aviso quando IA está pausada ──────────────────────── */}
      {!aiAtivo && (
        <div className="px-5 py-2 bg-amber-900/30 border-t border-amber-700/50 flex items-center gap-2">
          <span className="text-amber-400 text-xs">⚠️</span>
          <p className="text-amber-300 text-xs">
            IA pausada — você está assumindo o atendimento. As mensagens enviadas abaixo aparecerão no WhatsApp.
          </p>
        </div>
      )}

      {/* ── Input de envio manual ─────────────────────────────── */}
      <div className="px-4 py-3.5 border-t border-slate-700 bg-slate-900 flex gap-2 flex-shrink-0">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={aiAtivo ? "Digite para enviar como recepção humana..." : "Digite sua resposta..."}
          rows={1}
          className="flex-1 bg-slate-800 text-slate-100 text-sm border border-slate-600 rounded-xl
                     px-4 py-2.5 resize-none focus:outline-none focus:border-cyan-500
                     placeholder:text-slate-500 transition max-h-28"
          style={{ height: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700
                     disabled:text-slate-500 text-white rounded-xl font-semibold text-sm
                     transition-all flex-shrink-0 self-end"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>

    </div>
  );
}
