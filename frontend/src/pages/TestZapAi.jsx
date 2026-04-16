import { useState, useRef, useEffect, useContext } from "react";
import { Send, Trash2, Bot, User, Loader2, Clock, Zap } from "lucide-react";
import { apiFetch } from "../api";
import { useConfig } from "../context/ConfigContext";
import { AuthContext } from "../context/AuthContext";

const DEBOUNCE_TEST_MS = 3000;

export default function TestSofia() {
  const { botName, botEmoji } = useConfig();
  const [mensagens,  setMensagens]  = useState([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [resetting,  setResetting]  = useState(false);
  const [countdown,  setCountdown]  = useState(null);
  
  // Pegamos o tenant atual para injetar o prompt do sandbox
  const { tenant } = useConfig();
  const { token } = useContext(AuthContext);
  
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
      // Prepara o historico do frontend para o formato Gemini
      const historicoAnterior = mensagens
        .filter(m => m.role !== "erro")
        .map(m => ({
           role: m.role === "sofia" ? "model" : "user",
           parts: [{ text: m.texto }]
        }));

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
      setMensagens((prev) => [...prev, { role: "sofia", texto: data.resposta }]);
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot size={16} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-black text-white">
              Testar {botName}
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-10">
            Simulação real · {botName} aguarda {DEBOUNCE_TEST_MS / 1000}s após sua última mensagem
          </p>
        </div>
        <button
          onClick={resetar}
          disabled={resetting || (mensagens.length === 0 && !countdown)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-400 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.15)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
        >
          <Trash2 size={14} />
          {resetting ? "Limpando..." : "Limpar conversa"}
        </button>
      </div>

      {/* ── Chat Box ── */}
      <div className="flex-1 glass rounded-2xl overflow-hidden flex flex-col min-h-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mensagens.length === 0 && !countdown && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center">
                  <Bot size={36} className="text-cyan-400/40" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">{botName} está pronto!</p>
                <p className="text-slate-500 text-sm max-w-xs">
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
                    ? "bg-indigo-500/20 text-indigo-400"
                    : isErro
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-cyan-500/20 text-cyan-400"
                }`}>
                  {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20"
                    : isErro
                    ? "text-rose-300 rounded-tl-sm border"
                    : "rounded-tl-sm border"
                }`}
                  style={!isUser ? {
                    background: isErro ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                    borderColor: isErro ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)",
                  } : {}}
                >
                  {!isUser && !isErro && (
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      {botName} {botEmoji}
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
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Clock size={14} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-amber-300 text-sm border"
                style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }}
              >
                {botName} aguardando mais mensagens... responde em <strong>{countdown}s</strong>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-cyan-500/20 text-cyan-400">
                <Bot size={14} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-slate-400 text-sm flex items-center gap-2 border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <Loader2 size={14} className="animate-spin text-cyan-400" />
                {botName} está digitando...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            placeholder={loading ? `Aguardando ${botName}...` : "Digite sua mensagem e pressione Enter..."}
            rows={1}
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-all border"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.07)",
              minHeight: "46px",
              maxHeight: "120px",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.4)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
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
