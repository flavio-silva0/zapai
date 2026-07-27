import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api";
import { Rocket, Zap } from "lucide-react";

const NICHOS = [
  { value: "geral",         label: "Selecione o segmento do seu negócio" },
  { value: "dental",        label: "Clínica Odontológica" },
  { value: "imobiliaria",   label: "Imobiliária / Corretores" },
  { value: "saude",         label: "Saúde / Estética / Psicologia" },
  { value: "varejo",        label: "Varejo / E-commerce" },
  { value: "servicos",      label: "Prestação de Serviços (TI, Contabilidade)" },
  { value: "alimentacao",   label: "Restaurante / Delivery" },
  { value: "educacao",      label: "Educação / Cursos" },
  { value: "outro",         label: "Outro segmento" },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [form, setForm] = useState({
    nome: "", email: "", password: "",
    businessName: "", nicho: "geral",
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validarStep1 = () => {
    if (!form.nome.trim() || !form.email.trim() || !form.password) {
      return "Preencha todos os campos obrigatórios.";
    }
    if (!form.email.includes("@")) return "Insira um e-mail válido.";
    if (form.password.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
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
    if (!form.businessName.trim()) { setError("O nome do negócio é obrigatório."); return; }
    if (form.nicho === "geral") { setError("Selecione um segmento válido."); return; }
    
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
          botName:      "ZapAI", // Defaults to standard, configurable later
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar conta."); return; }

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

          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Crie sua conta</h1>
          <p className="text-slate-600 mb-10 text-sm">
            Sem cartão de crédito necessário para iniciar.
          </p>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); avancarStep(); } : handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <label htmlFor="reg-nome" className="block text-sm font-bold text-slate-900 mb-1.5">Seu nome completo</label>
                  <input
                    id="reg-nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    value={form.nome}
                    onChange={update("nome")}
                    placeholder="João Silva"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-bold text-slate-900 mb-1.5">E-mail corporativo</label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="voce@empresa.com.br"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-bold text-slate-900 mb-1.5">Senha de acesso</label>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={update("password")}
                    placeholder="Mínimo 8 caracteres"
                    className="input-premium"
                  />
                </div>
                <button type="submit" className="btn-primary w-full mt-4 h-12">
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <label htmlFor="reg-business" className="block text-sm font-bold text-slate-900 mb-1.5">Nome da Empresa</label>
                  <input
                    id="reg-business"
                    name="businessName"
                    type="text"
                    autoComplete="organization"
                    value={form.businessName}
                    onChange={update("businessName")}
                    placeholder="Ex: Clínica Sorriso"
                    className="input-premium"
                  />
                </div>
                <div>
                  <label htmlFor="reg-nicho" className="block text-sm font-bold text-slate-900 mb-1.5">Segmento Principal</label>
                  <select
                    id="reg-nicho"
                    name="nicho"
                    value={form.nicho}
                    onChange={update("nicho")}
                    className="input-premium text-slate-700 cursor-pointer"
                  >
                    {NICHOS.map((n) => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 h-12">
                    Voltar
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-[2] h-12">
                    {loading ? "Criando ambiente..." : "Finalizar cadastro"}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 text-center text-sm text-slate-600">
            Já possui uma conta?{" "}
            <Link to="/login" className="font-bold text-slate-900 hover:underline">
              Fazer login
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
            <Rocket size={32} />
          </div>
          
          <h2 className="text-3xl font-black text-white leading-tight mb-6 tracking-tight">
            Implantação rápida e sem atrito.
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 mt-1 border border-slate-700">1</div>
              <div>
                <p className="font-bold text-white text-sm mb-1">Crie sua conta</p>
                <p className="text-slate-400 text-sm">Estrutura baseada no tamanho e segmento da sua operação.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 mt-1 border border-slate-700">2</div>
              <div>
                <p className="font-bold text-white text-sm mb-1">Conecte seu WhatsApp</p>
                <p className="text-slate-400 text-sm">Leitura de QR Code simples e uso de infraestrutura homologada pelo Meta.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 mt-1 border border-slate-700">3</div>
              <div>
                <p className="font-bold text-white text-sm mb-1">Operação ativa</p>
                <p className="text-slate-400 text-sm">A automação já começa a trabalhar filtrando clientes e coletando dados antes do seu time agir.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
