import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { apiFetch } from "../api";
import { AuthContext } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";

const STATUS_OPTIONS = ["Novo", "Em Atendimento", "Agendado"];

// Estilos por origem da mensagem com contraste ideal e estética WhatsApp/ZapAI
const BUBBLE_STYLES = {
  user: "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 shadow-xs self-start rounded-tl-none",
  bot: "bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 border border-[#c1e8ba] dark:border-transparent shadow-xs self-end rounded-tr-none",
  human: "bg-teal-100 dark:bg-teal-900/60 text-teal-950 dark:text-teal-100 border border-teal-200 dark:border-teal-700/80 shadow-xs self-end rounded-tr-none",
};

const ORIGIN_LABEL = (name, emoji) => ({
  user: null,
  bot: `${name} ${emoji}`,
  human: "Recepção 👤",
});

function formatarDataHora(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

function formatarDataSeparador(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";

  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";

  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function MessageBubble({ msg, botName, botEmoji }) {
  const label = ORIGIN_LABEL(botName, botEmoji)[msg.origin];
  const isRight = msg.origin !== "user";

  return (
    <div className={`flex flex-col max-w-[80%] gap-1 ${isRight ? "self-end items-end" : "self-start items-start"}`}>
      {label && (
        <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 px-1">
          {label}
        </span>
      )}
      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${BUBBLE_STYLES[msg.origin]}`}>
        {msg.texto}
      </div>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1 font-medium">
        {formatarDataHora(msg.created_at)}
      </span>
    </div>
  );
}

export default function ChatViewer({
  patient,
  onPatientChange,
  botName: propBotName,
  botEmoji: propBotEmoji,
}) {
  const { tenant, user } = useContext(AuthContext) || {};
  const config = useConfig();
  const isSuperAdmin = user?.role === "super_admin";

  const resolvedBotName =
    propBotName ||
    (isSuperAdmin
      ? "Admin"
      : tenant?.bot_name || tenant?.botName || config?.botName || "Assistente");
  const resolvedBotEmoji =
    propBotEmoji ||
    (isSuperAdmin
      ? "⚙️"
      : tenant?.bot_emoji || tenant?.botEmoji || config?.botEmoji || "🤖");

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);

  // ── Busca mensagens do paciente ──────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/patients/${patient.id}/messages`);
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
  }, [patient.id, fetchMessages]);

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
      const res = await apiFetch(`/api/patients/${patient.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status_kanban }),
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
      const res = await apiFetch(`/api/patients/${patient.id}/ai-status`, {
        method: "PUT",
        body: JSON.stringify({ is_ai_active: !patient.is_ai_active }),
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
        method: "POST",
        body: JSON.stringify({ texto }),
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
    <div className="flex flex-col h-full bg-[var(--bg-base)]">

      {/* ── Cabeçalho do chat ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-medium)] bg-[var(--bg-surface)] flex-shrink-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-xs">
          {patient.nome.charAt(0).toUpperCase()}
        </div>

        {/* Info do paciente */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[var(--text-primary)] font-bold text-sm leading-none truncate">
            {patient.nome}
          </h2>
          <p className="text-[var(--text-muted)] text-xs mt-1 truncate font-mono">
            {patient.telefone.replace("@c.us", "")}
          </p>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Select de status Kanban */}
          <select
            value={patient.status_kanban}
            onChange={handleStatusChange}
            className="bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs border border-[var(--border-medium)] rounded-lg px-2.5 py-1.5
                       hover:border-[var(--border-strong)] focus:outline-none focus:border-teal-600 cursor-pointer transition shadow-xs font-medium"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Toggle IA */}
          <button
            onClick={handleAiToggle}
            title={aiAtivo ? "Pausar IA" : "Ativar IA"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs
              ${aiAtivo
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100/80"
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${aiAtivo ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            {aiAtivo ? "IA Ativa" : "IA Pausada"}
          </button>
        </div>
      </div>

      {/* ── Área de mensagens ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3.5 bg-[#f0f2f5] dark:bg-[#0b141a]">
        {loadingMsgs ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]">
            <span className="text-4xl">💬</span>
            <p className="text-sm font-medium">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const msgDate = new Date(msg.created_at).toDateString();
            const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
            const showDateSeparator = !prevMsg || msgDate !== prevDate;

            return (
              <div key={msg.id} className="flex flex-col gap-3.5">
                {showDateSeparator && (
                  <div className="flex justify-center my-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 px-3 py-1 rounded-full shadow-xs">
                      {formatarDataSeparador(msg.created_at)}
                    </span>
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  botName={resolvedBotName}
                  botEmoji={resolvedBotEmoji}
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Aviso quando IA está pausada ──────────────────────── */}
      {!aiAtivo && (
        <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800/60 flex items-center gap-2">
          <span className="text-amber-600 text-xs">⚠️</span>
          <p className="text-amber-800 dark:text-amber-200 text-xs font-medium">
            IA pausada — você está assumindo o atendimento. As mensagens enviadas abaixo aparecerão no WhatsApp.
          </p>
        </div>
      )}

      {/* ── Input de envio manual ─────────────────────────────── */}
      <div className="px-4 py-3.5 border-t border-[var(--border-medium)] bg-[var(--bg-surface)] flex gap-2 flex-shrink-0">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={aiAtivo ? "Digite para enviar como recepção humana..." : "Digite sua resposta..."}
          rows={1}
          className="flex-1 bg-[var(--bg-base)] text-[var(--text-primary)] text-sm border border-[var(--border-medium)] rounded-xl
                     px-4 py-2.5 resize-none focus:outline-none focus:border-teal-600
                     placeholder:text-[var(--text-muted)] transition max-h-28"
          style={{ height: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 dark:disabled:bg-slate-800
                     disabled:text-slate-400 text-white rounded-xl font-semibold text-sm
                     transition-all flex-shrink-0 self-end shadow-xs cursor-pointer disabled:cursor-not-allowed"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>

    </div>
  );
}
