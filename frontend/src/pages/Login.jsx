import { useState, useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login, token } = useContext(AuthContext);
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [erro,    setErro]    = useState("");
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-cyan-700/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo-icon.png" alt="ZapAI Logo" className="h-16 w-auto object-contain rounded-lg" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div className="hidden w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-3xl">⚡</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ZapAI</h1>
            <p className="text-slate-400 mt-1 text-sm">Acesse o painel de atendimento</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Acessando..." : "Entrar no Painel"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Não tem conta?{" "}
            <Link to="/cadastro" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
              Crie gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
