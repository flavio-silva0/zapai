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

  if (token) return <Navigate to="/painel" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res  = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Credenciais inválidas.");
      login(data.token, data.user, data.tenant);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-body bg-white">
      
      {/* ══════════════════════════════════════════════════════
          ESQUERDA — FORMULÁRIO (Branco)
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="w-full max-w-sm mx-auto">
          <Link to="/" className="inline-block mb-10">
            <img 
              src="/zapai-logo-dark.png" 
              alt="ZapAI Logo" 
              className="h-9 w-auto object-contain" 
            />
          </Link>

          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Entrar</h1>
          <p className="text-slate-600 mb-8 text-sm">
            Bem-vindo de volta ao painel de atendimento.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm font-medium flex gap-2 items-center">
                <Lock size={16} />
                {erro}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-slate-900 mb-1.5">E-mail de acesso</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
                className="input-premium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-bold text-slate-900">Senha</label>
                <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition">
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
                  className="input-premium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 h-12"
            >
              {loading ? "Autenticando..." : "Acessar Plataforma"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            Não tem uma conta?{" "}
            <Link to="/cadastro" className="font-bold text-slate-900 hover:underline">
              Crie agora
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DIREITA — COMUNICAÇÃO INSTITUCIONAL (Grafite)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 bg-slate-900 text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="max-w-md mx-auto relative z-10">
          <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-400 mb-8 border border-slate-700">
            <UserCheck size={32} />
          </div>
          
          <h2 className="text-3xl font-black text-white leading-tight mb-6 tracking-tight">
            Seu atendimento sob controle.
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-2 border-slate-700 pl-4">
              <p className="font-bold text-white text-sm mb-1">Métricas que importam</p>
              <p className="text-slate-400 text-sm">Acompanhe tempo de resposta, volume de atendimentos e resolução em primeira chamada (FCR).</p>
            </div>
            <div className="border-l-2 border-slate-700 pl-4">
              <p className="font-bold text-white text-sm mb-1">Garantia de Qualidade</p>
              <p className="text-slate-400 text-sm">Visualize o histórico de qualquer atendimento da sua equipe e da inteligência artificial.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
