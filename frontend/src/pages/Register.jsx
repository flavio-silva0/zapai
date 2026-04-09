import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api";

const NICHOS = [
  { value: "dental",        label: "🦷 Clínica Odontológica" },
  { value: "imobiliaria",   label: "🏠 Imobiliária" },
  { value: "academia",      label: "💪 Academia / Fitness" },
  { value: "petshop",       label: "🐾 Petshop / Veterinária" },
  { value: "restaurante",   label: "🍽️ Restaurante / Bar" },
  { value: "salao",         label: "💇 Salão de Beleza / Barbearia" },
  { value: "psicologia",    label: "🧠 Psicologia / Saúde Mental" },
  { value: "veterinaria",   label: "🐶 Clínica Veterinária" },
  { value: "estetica",      label: "✨ Clínica Estética" },
  { value: "contabilidade", label: "📊 Escritório de Contabilidade" },
  { value: "educacao",      label: "🎓 Escola / Cursos" },
  { value: "ti",            label: "💻 Empresa de TI / Suporte" },
  { value: "eventos",       label: "🎊 Eventos / Cerimonial" },
  { value: "construcao",    label: "🏗️ Construtora / Reformas" },
  { value: "geral",         label: "🤖 Outro negócio" },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1); // 1 = dados pessoais, 2 = dados do negócio
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [form, setForm] = useState({
    nome: "", email: "", password: "", confirmPassword: "",
    businessName: "", nicho: "geral", botName: "Sofia",
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validarStep1 = () => {
    if (!form.nome.trim() || !form.email.trim() || !form.password) {
      return "Preencha todos os campos.";
    }
    if (!form.email.includes("@")) return "E-mail inválido.";
    if (form.password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (form.password !== form.confirmPassword) return "As senhas não coincidem.";
    return null;
  };

  const avancarStep = () => {
    const err = validarStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) { setError("Informe o nome do negócio."); return; }
    setLoading(true);
    setError("");

    try {
      const res  = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email:        form.email,
          password:     form.password,
          nome:         form.nome,
          businessName: form.businessName,
          nicho:        form.nicho,
          botName:      form.botName || "Sofia",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar conta."); return; }

      // Salva token e redireciona para o painel
      localStorage.setItem("token", data.token);
      localStorage.setItem("tenant", JSON.stringify(data.tenant));
      localStorage.setItem("user",   JSON.stringify(data.user));
      navigate("/");
    } catch {
      setError("Erro de conexão. Verifique o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fundo animado */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700 px-8 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-lg">
                🤖
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">SofiaAI</h1>
                <p className="text-xs text-cyan-400">Crie sua conta gratuita</p>
              </div>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mt-5">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${step >= s ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                    {s}
                  </div>
                  <span className={`text-xs transition-colors ${step >= s ? "text-slate-200" : "text-slate-500"}`}>
                    {s === 1 ? "Seus dados" : "Seu negócio"}
                  </span>
                  {s < 2 && <div className={`flex-1 h-px ${step > s ? "bg-cyan-500" : "bg-slate-700"}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); avancarStep(); } : handleSubmit}
              className="space-y-4">

              {error && (
                <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Step 1 — Dados pessoais */}
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Seu nome
                    </label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={update("nome")}
                      placeholder="João Silva"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      E-mail de acesso
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      placeholder="voce@email.com"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={update("password")}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Confirmar senha
                    </label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={update("confirmPassword")}
                      placeholder="Repita a senha"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all mt-2"
                  >
                    Continuar →
                  </button>
                </>
              )}

              {/* Step 2 — Dados do negócio */}
              {step === 2 && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Nome do negócio
                    </label>
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={update("businessName")}
                      placeholder="Ex: Clínica OdontoSorriso"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Segmento do negócio
                    </label>
                    <select
                      value={form.nicho}
                      onChange={update("nicho")}
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition cursor-pointer"
                    >
                      {NICHOS.map((n) => (
                        <option key={n.value} value={n.value}>{n.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Nome da atendente IA
                    </label>
                    <input
                      type="text"
                      value={form.botName}
                      onChange={update("botName")}
                      placeholder="Sofia"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>

                  {/* Trial info */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 text-sm text-cyan-300">
                    🎉 Você terá <strong>7 dias grátis</strong> para testar. Sem cartão de crédito necessário.
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold text-sm transition"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white rounded-xl font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      {loading ? "Criando..." : "Criar conta grátis 🚀"}
                    </button>
                  </div>
                </>
              )}
            </form>

            <p className="text-center text-sm text-slate-500 mt-5">
              Já tem conta?{" "}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          SofiaAI · Atendimento inteligente 24/7
        </p>
      </div>
    </div>
  );
}
