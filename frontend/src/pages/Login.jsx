import { useState, useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { apiFetch } from "../api";
import { AuthContext } from "../context/AuthContext";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen bg-[#060e1a] flex overflow-hidden relative">

      {/* ── Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/12 blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════════════
          LEFT — Ilustração / Brand
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center px-16 relative bg-grid">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 mb-16 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-black text-white">
            Zap<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Headline */}
        <h2 className="font-display text-5xl font-black text-white leading-tight text-center mb-6">
          Bem-vindo<br />
          <span className="gradient-text">de volta</span>
        </h2>
        <p className="text-slate-400 text-center text-lg max-w-sm leading-relaxed">
          Acesse seu painel e gerencie seus atendimentos com IA.
        </p>

        {/* Floating glass card — decorative */}
        <div className="mt-16 glass rounded-2xl p-6 w-72 animate-float">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Beatriz · ZapAI</p>
              <p className="text-slate-500 text-xs">Agente de IA ativo</p>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="space-y-2">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5">
              <p className="text-slate-300 text-xs">Olá! Como posso te ajudar hoje? 😊</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-2.5 ml-6">
              <p className="text-slate-400 text-xs">Quero saber os horários...</p>
            </div>
          </div>
          <p className="text-slate-600 text-xs text-right mt-3">agora mesmo</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT — Login Form
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-black text-white">
            Zap<span className="gradient-text">AI</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 id="login-title" className="font-display text-3xl font-black text-white mb-2">
              Entrar na plataforma
            </h1>
            <p className="text-slate-400 text-sm">
              Não tem conta?{" "}
              <Link to="/cadastro" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                Crie gratuitamente
              </Link>
            </p>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">

            {erro && (
              <div className="glass border-rose-500/25 p-4 rounded-xl">
                <p className="text-rose-400 text-sm">{erro}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all text-sm"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-senha"
                  type={showPwd ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/4 border border-white/8 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/6 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Acessando...
                </>
              ) : (
                <>
                  Entrar no painel
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-slate-600 text-xs">ou</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Back home */}
          <Link
            to="/"
            id="login-back-home"
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition py-3 rounded-xl hover:bg-white/4"
          >
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  );
}
