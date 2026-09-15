import { useState, useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import { AuthContext } from "../context/AuthContext";
import { Eye, EyeOff, Lock, UserCheck } from "lucide-react";

export default function Login() {
  const { login, token } = useContext(AuthContext);
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [slowNotice, setSlowNotice] = useState(false);

  if (token) return <Navigate to="/painel" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErro("");
    setLoading(true);
    setSlowNotice(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const slowTimer = setTimeout(() => setSlowNotice(true), 3500);

    try {
      const res  = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: senha }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Credenciais inválidas.");
      login(data.token, data.user, data.tenant);
    } catch (err) {
      if (err.name === "AbortError") {
        setErro("O servidor demorou para responder. Por favor, tente novamente em alguns instantes.");
      } else {
        setErro(err.message || "Erro ao conectar com o servidor.");
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowNotice(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-body bg-[var(--bg-base)] text-[var(--text-primary)]">
      
      {/* ══════════════════════════════════════════════════════
          ESQUERDA — FORMULÁRIO
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]">
        <div className="w-full max-w-sm mx-auto">
          <Link to="/" className="inline-block mb-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg">
            <img 
              src="/zapai-logo-dark.png" 
              alt="ZapAI Logo" 
              className="h-14 md:h-16 w-auto object-contain block dark:hidden" 
            />
            <img 
              src="/zapai-logo-light.png" 
              alt="ZapAI Logo" 
              className="h-14 md:h-16 w-auto object-contain hidden dark:block" 
            />
          </Link>

          <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">Entrar</h1>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">
            Bem-vindo de volta ao painel de atendimento.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-4 rounded-xl text-sm font-medium flex gap-2 items-center">
                <Lock size={16} />
                {erro}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-[var(--text-primary)] mb-1.5">
                E-mail de acesso
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="input-premium focus:!border-teal-600 focus:!ring-teal-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-bold text-[var(--text-primary)]">
                  Senha
                </label>
                <button type="button" className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline transition">
                  Esqueci a senha
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="input-premium pr-12 focus:!border-teal-600 focus:!ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 h-12 rounded-xl font-medium text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {loading ? "Autenticando..." : "Acessar Plataforma"}
            </button>

            {slowNotice && (
              <p className="text-xs text-amber-500 dark:text-amber-400 text-center animate-pulse pt-2 flex items-center justify-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Inicializando servidor seguro... Por favor, aguarde.
              </p>
            )}
          </form>

          <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Não tem uma conta?{" "}
            <Link to="/cadastro" className="font-bold text-teal-600 hover:text-teal-700 hover:underline">
              Crie agora
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DIREITA — COMUNICAÇÃO INSTITUCIONAL (Identidade ZapAI)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 bg-[#1a1a1a] text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="max-w-md mx-auto relative z-10">
          <div className="w-16 h-16 bg-[#2a2a2a] rounded-2xl flex items-center justify-center text-teal-400 mb-8 border border-[#333] shadow-md">
            <UserCheck size={32} />
          </div>
          
          <h2 className="text-3xl font-black text-white leading-tight mb-6 tracking-tight">
            Seu atendimento sob controle.
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-2 border-teal-600/60 pl-4">
              <p className="font-bold text-white text-sm mb-1">Métricas que importam</p>
              <p className="text-[#aaa] text-sm leading-relaxed">
                Acompanhe tempo de resposta, volume de atendimentos e resolução em primeira chamada (FCR).
              </p>
            </div>
            <div className="border-l-2 border-teal-600/60 pl-4">
              <p className="font-bold text-white text-sm mb-1">Garantia de Qualidade</p>
              <p className="text-[#aaa] text-sm leading-relaxed">
                Visualize o histórico de qualquer atendimento da sua equipe e da inteligência artificial.
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
