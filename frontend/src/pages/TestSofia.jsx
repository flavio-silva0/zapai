import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, User, Loader2, Clock } from "lucide-react";
import { apiFetch } from "../api";
import { useConfig } from "../context/ConfigContext";

const DEBOUNCE_TEST_MS = 3000; // 3s de espera para agrupar mensagens no teste

export default function TestSofia() {
  const { botName, botEmoji } = useConfig();
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [countdown, setCountdown] = useState(null); // segundos restantes até Sofia responder
  const bottomRef = useRef(null);
  const bufferRef = useRef([]);      // fila de mensagens pendentes
  const timerRef = useRef(null);    // timer do debounce
  const countdownIntervalRef = useRef(null);    // interval do contador visual

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, loading, countdown]);

  // Limpa os timers ao desmontar
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
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return null;
        }
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
      const res = await apiFetch("/api/test-chat", {
        method: "POST",
        body: JSON.stringify({ mensagem: textoCompleto }),
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

    // Adiciona ao buffer visual e à fila interna
    setMensagens((prev) => [...prev, { role: "user", texto }]);
    bufferRef.current.push(texto);

    // Reinicia o timer do debounce
    clearTimeout(timerRef.current);
    iniciarContagem();
    timerRef.current = setTimeout(enviarBuffer, DEBOUNCE_TEST_MS);
  };

  const resetar = async () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownIntervalRef.current);
    bufferRef.current = [];
    setCountdown(null);
    setResetting(true);
    await apiFetch("/api/test-chat/reset", { method: "POST" });
    setMensagens([]);
    setResetting(false);
  };

  // Reinicia o contador enquanto o usuário está digitando no textarea
  const handleInput = () => {
    if (!loading && bufferRef.current.length > 0) {
      clearTimeout(timerRef.current);
      clearInterval(countdownIntervalRef.current);
      iniciarContagem();
      timerRef.current = setTimeout(enviarBuffer, DEBOUNCE_TEST_MS);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot size={24} className="text-cyan-400" />
            Testar {botName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Simula o comportamento real: {botName} aguarda {DEBOUNCE_TEST_MS / 1000}s após sua última mensagem antes de responder.
          </p>
        </div>
        <button
          onClick={resetar}
          disabled={resetting || (mensagens.length === 0 && !countdown)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          {resetting ? "Limpando..." : "Limpar conversa"}
        </button>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col min-h-0">

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mensagens.length === 0 && !countdown && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
                <Bot size={28} className="text-cyan-500/60" />
              </div>
              <p className="text-sm text-center max-w-xs">
                Envie uma mensagem para começar. Você pode mandar várias seguidas — {botName} espera você parar antes de responder.
              </p>
            </div>
          )}

          {mensagens.map((msg, i) => {
            const isUser = msg.role === "user";
            const isErro = msg.role === "erro";
            return (
              <div key={i} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${isUser ? "bg-blue-500/20 text-blue-400" : isErro ? "bg-rose-500/20 text-rose-400" : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                  {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : isErro
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    : "bg-slate-700/80 text-slate-200 rounded-tl-sm border border-slate-600/30"
                  }`}>
                  {!isUser && !isErro && (
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">{botName} {botEmoji}</span>
                  )}
                  {msg.texto}
                </div>
              </div>
            );
          })}

          {/* Contador de debounce */}
          {countdown !== null && !loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Clock size={14} />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-amber-300 text-sm">
                <span>{botName} aguardando mais mensagens... responde em <strong>{countdown}s</strong></span>
              </div>
            </div>
          )}

          {/* Indicador de digitação */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-cyan-500/20 text-cyan-400">
                <Bot size={14} />
              </div>
              <div className="bg-slate-700/80 border border-slate-600/30 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                {botName} está digitando...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700/50 flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            placeholder={loading ? `Aguardando ${botName}...` : "Digite sua mensagem e pressione Enter (pode mandar várias seguidas)..."}
            rows={1}
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none transition-all"
            style={{ minHeight: "46px", maxHeight: "120px" }}
          />
          <button
            onClick={enviar}
            disabled={loading || !input.trim()}
            className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 self-end"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
