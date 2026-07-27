import { useState, useRef, useEffect, useContext } from "react";
import { Send, Trash2, Bot, User, Loader2, Clock, Zap } from "lucide-react";
import { apiFetch } from "../api";
import { useConfig } from "../context/ConfigContext";
import { AuthContext } from "../context/AuthContext";

const DEBOUNCE_TEST_MS = 3000;

export default function TestZapAi() {
  const [mensagens,  setMensagens]  = useState(() => {
    try {
      const salvas = localStorage.getItem("sandbox_history");
      return salvas ? JSON.parse(salvas) : [];
    } catch {
      return [];
    }
  });
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [resetting,  setResetting]  = useState(false);
  const [countdown,  setCountdown]  = useState(null);
  
  // Pegamos o tenant atual para injetar o prompt do sandbox
  const { token, tenant } = useContext(AuthContext);
  
  const displayBotName = tenant?.bot_name || "Assistente";
  const displayBotEmoji = tenant?.bot_emoji || "🤖";

  const bottomRef           = useRef(null);
  const bufferRef           = useRef([]);
  const timerRef            = useRef(null);
  const countdownIntervalRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, loading, countdown]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sandbox_history", JSON.stringify(mensagens));
  }, [mensagens]);

  const iniciarContagem = () => {
    clearInterval(countdownIntervalRef.current);
    setCountdown(Math.ceil(DEBOUNCE_TEST_MS / 1000));
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownIntervalRef.current); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const enviarBuffer = async () => {
    clearInterval(countdownIntervalRef.current);
    setCountdown(null);
    const buffer = [...bufferRef.current];
    bufferRef.current = [];
    if (buffer.length === 0) return;
    const textoCompleto = buffer.join("\n");
    setLoading(true);
    try {
      // Isolar o histórico oficial removendo as mensagens que estão sendo processadas AGORA (trailing users)
      let mensagensAnteriores = [...mensagens];
      while (mensagensAnteriores.length > 0 && mensagensAnteriores[mensagensAnteriores.length - 1].role === "user") {
        mensagensAnteriores.pop();
      }

      // O Gemini exige alternância estrita (user -> model -> user -> model).
      // Vamos compactar mensagens seguidas do mesmo role.
      const historicoAnterior = [];
      let lastRole = null;

      mensagensAnteriores.filter(m => m.role !== "erro").forEach(m => {
        const currentRole = m.role === "ai" ? "model" : "user";
        if (currentRole === lastRole) {
          historicoAnterior[historicoAnterior.length - 1].parts[0].text += "\n" + m.texto;
        } else {
          historicoAnterior.push({ role: currentRole, parts: [{ text: m.texto }] });
          lastRole = currentRole;
        }
      });

      const res  = await apiFetch("/api/admin/sandbox/chat", { 
         method: "POST",
         headers: { Authorization: `Bearer ${token}` },
         body: JSON.stringify({ 
           prompt_text: tenant?.prompt_text || "Você é a assistente virtual.",
           mensagemUsuario: textoCompleto,
           historicoAnterior
         }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMensagens((prev) => [...prev, { role: "ai", texto: data.resposta }]);
    } catch (err) {
      setMensagens((prev) => [...prev, { role: "erro", texto: `Erro: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const enviar = () => {
    const texto = input.trim();
    if (!texto || loading) return;
    setInput("");
    setMensagens((prev) => [...prev, { role: "user", texto }]);
    bufferRef.current.push(texto);
    clearTimeout(timerRef.current);
    iniciarContagem();
    timerRef.current = setTimeout(enviarBuffer, DEBOUNCE_TEST_MS);
  };

  const resetar = () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownIntervalRef.current);
    bufferRef.current = [];
    setCountdown(null);
    setMensagens([]);
    localStorage.removeItem("sandbox_history");
  };

  const handleInput = () => {
    if (!loading && bufferRef.current.length > 0) {
      clearTimeout(timerRef.current);
      clearInterval(countdownIntervalRef.current);
      iniciarContagem();
      timerRef.current = setTimeout(enviarBuffer, DEBOUNCE_TEST_MS);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)] flex items-center justify-center shadow-lg">
              <Bot size={16} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-black text-[var(--text-primary)]">
              Testar {displayBotName}
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm ml-10">
            Simulação real · {displayBotName} aguarda {DEBOUNCE_TEST_MS / 1000}s após sua última mensagem
          </p>
        </div>
        <button
          onClick={resetar}
          disabled={resetting || (mensagens.length === 0 && !countdown)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--clr-danger)] bg-[var(--clr-danger)]/5 border border-[var(--clr-danger)]/20 rounded-xl transition-all disabled:opacity-30 hover:bg-[var(--clr-danger)]/10"
        >
          <Trash2 size={14} />
          {resetting ? "Limpando..." : "Limpar conversa"}
        </button>
      </div>

      {/* ── Chat Box ── */}
      <div className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl overflow-hidden flex flex-col min-h-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mensagens.length === 0 && !countdown && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[var(--clr-primary)]/5 border border-[var(--clr-primary)]/10 flex items-center justify-center">
                  <Bot size={36} className="text-[var(--clr-primary)]/40" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--clr-success)] flex items-center justify-center text-[10px] text-white">
                    ✓
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[var(--text-primary)] font-semibold mb-1">{displayBotName} está pronta!</p>
                <p className="text-[var(--text-muted)] text-sm max-w-xs">
                  Envie uma mensagem para simular o atendimento. Você pode mandar várias seguidas.
                </p>
              </div>
            </div>
          )}

          {mensagens.map((msg, i) => {
            const isUser = msg.role === "user";
            const isErro = msg.role === "erro";
            return (
              <div key={i} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                  isUser
                    ? "bg-[var(--clr-primary)]/20 text-[var(--clr-primary)]"
                    : isErro
                    ? "bg-[var(--clr-danger)]/20 text-[var(--clr-danger)]"
                    : "bg-[var(--clr-info)]/20 text-[var(--clr-info)]"
                }`}>
                  {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)] text-white rounded-2xl rounded-tr-sm shadow-md"
                    : isErro
                    ? "text-[var(--clr-danger)] bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-2xl rounded-tl-sm"
                    : "bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm"
                }`}>
                  {!isUser && !isErro && (
                    <span className="text-[10px] font-bold text-[var(--clr-info)] uppercase tracking-wider block mb-1">
                      {displayBotName} {displayBotEmoji}
                    </span>
                  )}
                  {msg.texto}
                </div>
              </div>
            );
          })}

          {/* Countdown indicator */}
          {countdown !== null && !loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-[var(--clr-warning)]/20 text-[var(--clr-warning)]">
                <Clock size={14} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-[var(--clr-warning)] bg-[var(--clr-warning)]/10 border border-[var(--clr-warning)]/20 text-sm">
                {displayBotName} aguardando mais mensagens... responde em <strong>{countdown}s</strong>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-[var(--clr-info)]/20 text-[var(--clr-info)]">
                <Bot size={14} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-[var(--text-muted)] bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[var(--clr-info)]" />
                {displayBotName} está digitando...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-3 shrink-0 border-t border-[var(--border-subtle)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            placeholder={loading ? `Aguardando ${displayBotName}...` : "Digite sua mensagem e pressione Enter..."}
            rows={1}
            className="flex-1 input-premium resize-none"
            style={{
              minHeight: "46px",
              maxHeight: "120px",
            }}
          />
          <button
            onClick={enviar}
            disabled={loading || !input.trim()}
            className="w-11 h-11 shrink-0 rounded-xl text-white flex items-center justify-center transition-all self-end disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            onMouseEnter={(e) => { if (!loading && input.trim()) e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
