import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { User, Building, Phone, CheckCircle, Edit2, Save, X, Shield, Sparkles } from "lucide-react";
import { apiFetch } from "../api";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function StaticValue({ children, mono = false }) {
  return (
    <div
      className={`w-full rounded-xl px-4 py-3 text-slate-200 text-sm border ${mono ? "font-mono" : ""}`}
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      {children}
    </div>
  );
}

function EditInput({ type = "text", value, onChange, placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all border"
      style={{
        background: "rgba(255,255,255,0.05)",
        borderColor: "rgba(99,102,241,0.3)",
      }}
      onFocus={(e)  => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
      onBlur={(e)   => { e.target.style.borderColor = "rgba(99,102,241,0.3)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

export default function Profile() {
  const { user, tenant, login } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [erro,      setErro]      = useState("");

  const [formData, setFormData] = useState({
    nome: "", email: "", tenant_nome: "", clinic_phone: "", bot_name: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome:         user.nome       || "",
        email:        user.email      || "",
        tenant_nome:  tenant?.nome    || "",
        clinic_phone: tenant?.clinic_phone || "",
        bot_name:     tenant?.bot_name || "",
      });
    }
  }, [user, tenant, isEditing]);

  const [magicForm, setMagicForm] = useState({
    tomVoz: "Profissional e Empático",
    objetivo: "Atendimento Geral e Triagem",
    endereco: "",
    horarios: "",
    resumo: ""
  });
  const [generating, setGenerating] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [magicSuccess, setMagicSuccess] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleMagicSetup = async () => {
    if (!magicForm.resumo.trim()) {
      setErro("O campo de Resumo é obrigatório para guiar a IA.");
      return;
    }
    setGenerating(true);
    setErro("");
    setMagicSuccess(false);
    try {
      const res = await apiFetch("/api/admin/magic-setup", {
        method: "POST",
        body: JSON.stringify({ formSetup: magicForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setGeneratedPrompt(data.promptGerado);
      setIsReviewing(true);
    } catch(err) {
      setErro(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    setErro("");
    try {
      const res = await apiFetch("/api/admin/magic-setup/save", {
        method: "PUT",
        body: JSON.stringify({ prompt_text: generatedPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMagicSuccess(true);
      setIsReviewing(false);
      setTimeout(() => setMagicSuccess(false), 5000);
    } catch(err) {
      setErro(err.message);
    } finally {
      setSavingPrompt(false);
    }
  };

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setErro("");
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar");
      }
      const updatedUser   = { ...user,   nome: formData.nome, email: formData.email };
      const updatedTenant = tenant
        ? { ...tenant, nome: formData.tenant_nome, clinic_phone: formData.clinic_phone, bot_name: formData.bot_name }
        : null;
      const token = localStorage.getItem("sofia_token");
      login(token, updatedUser, updatedTenant);
      setIsEditing(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }));

  const roleBadge = user.role === "super_admin"
    ? { label: "Super Admin", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)", text: "#a78bfa" }
    : { label: user.role,     bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#818cf8" };

  return (
    <div className="p-8 overflow-y-auto space-y-6">

      {/* ── Header ── */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-white mb-1">Meu Perfil</h1>
          <p className="text-slate-500 text-sm">Suas informações de login e configurações do negócio</p>
        </div>
        {!isEditing ? (
          <button
            id="profile-edit-btn"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-300 rounded-xl transition-all border"
            style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.25)" }}
          >
            <Edit2 size={14} />
            Editar informações
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-400 rounded-xl transition-all border"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <X size={14} />
              Cancelar
            </button>
            <button
              id="profile-save-btn"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 btn-primary"
            >
              <Save size={14} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </header>

      {/* Error */}
      {erro && (
        <div className="p-4 rounded-xl text-rose-300 text-sm border"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
        >
          {erro}
        </div>
      )}

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">

        {/* User Card */}
        <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <User size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Informações de Login</h2>
              <p className="text-slate-500 text-xs">Seus dados de acesso à plataforma</p>
            </div>
          </div>

          <Field label="Nome">
            {isEditing
              ? <EditInput value={formData.nome}  onChange={f("nome")} />
              : <StaticValue>{user.nome}</StaticValue>
            }
          </Field>

          <Field label="E-mail">
            {isEditing
              ? <EditInput type="email" value={formData.email} onChange={f("email")} />
              : (
                <div className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-slate-200 text-sm border"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {user.email}
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <CheckCircle size={10} /> Verificado
                  </span>
                </div>
              )
            }
          </Field>

          <Field label="Nível de Acesso">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border"
              style={{ background: roleBadge.bg, borderColor: roleBadge.border, color: roleBadge.text }}
            >
              <Shield size={13} />
              {roleBadge.label.toUpperCase()}
            </div>
          </Field>
        </div>

        {/* Business Card */}
        {tenant && (
          <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Building size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Meu Negócio</h2>
                <p className="text-slate-500 text-xs">Configurações do seu espaço no ZapAI</p>
              </div>
            </div>

            <Field label="Empresa / Sistema">
              {isEditing
                ? <EditInput value={formData.tenant_nome} onChange={f("tenant_nome")} />
                : <p className="font-bold text-white text-xl">{tenant.nome}</p>
              }
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Agente Inteligente">
                {isEditing
                  ? <EditInput value={formData.bot_name} onChange={f("bot_name")} />
                  : (
                    <div className="rounded-xl px-4 py-3 text-slate-200 text-sm border flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-lg">{tenant.bot_emoji}</span>
                      <span className="font-semibold">{tenant.bot_name}</span>
                    </div>
                  )
                }
              </Field>

              <Field label="Telefone">
                {isEditing
                  ? <EditInput value={formData.clinic_phone} onChange={f("clinic_phone")} placeholder="5511..." mono />
                  : (
                    <div className="rounded-xl px-4 py-3 text-slate-200 text-sm border flex items-center gap-2"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                    >
                      <Phone size={13} className="text-cyan-400 shrink-0" />
                      <span className="font-mono">{tenant.clinic_phone || "—"}</span>
                    </div>
                  )
                }
              </Field>
            </div>

            {/* Status bar */}
            <div className="rounded-xl px-4 py-3 border flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Status da Conta</p>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                  <CheckCircle size={13} /> {tenant.status?.toUpperCase()}
                </p>
              </div>
              {tenant.trial_ends_at && tenant.status === "trial" && (
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Trial expira</p>
                  <p className="text-amber-400 text-sm font-semibold">
                    {new Date(tenant.trial_ends_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Magic Setup Card */}
        {tenant && (
          <div className="glass rounded-2xl p-6 lg:col-span-2 space-y-5 relative overflow-hidden" style={{ border: "1px solid rgba(16, 185, 129, 0.2)"}}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Setup Mágico da IA</h2>
                <p className="text-slate-500 text-xs">Descreva seu negócio e a IA criará a mente do agente para você.</p>
              </div>
            </div>

            {!isReviewing ? (
              <div className="space-y-5">
                <p className="text-sm text-slate-300">
                  Preencha os campos estruturados abaixo. A IA usará esses dados para gerar a personalidade e as regras ideais para o seu atendimento no WhatsApp.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tom de Voz do Agente">
                    <select
                      value={magicForm.tomVoz}
                      onChange={(e) => setMagicForm({ ...magicForm, tomVoz: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all border appearance-none"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                    >
                      <option value="Profissional e Empático" className="bg-slate-800 text-white">Profissional e Empático (Saúde/Clínicas)</option>
                      <option value="Profissional e Corporativo" className="bg-slate-800 text-white">Profissional e Corporativo (B2B/Consultoria)</option>
                      <option value="Descontraído e Ágil" className="bg-slate-800 text-white">Descontraído e Ágil (Varejo/Fast Food)</option>
                      <option value="Acolhedor e Amigável" className="bg-slate-800 text-white">Acolhedor e Amigável (Estética/Petshops)</option>
                      <option value="Direto e Objetivo" className="bg-slate-800 text-white">Direto e Objetivo (Logística/Suporte Técnico)</option>
                      <option value="Sofisticado e Premium" className="bg-slate-800 text-white">Sofisticado e Premium (Luxo/Elegância)</option>
                      <option value="Entusiástico e Vendedor" className="bg-slate-800 text-white">Entusiástico e Vendedor (Infoprodutos/Lançamentos)</option>
                      <option value="Jovem e Antenado" className="bg-slate-800 text-white">Jovem e Antenado (Moda/Criatividade)</option>
                      <option value="Educativo e Paciente" className="bg-slate-800 text-white">Educativo e Paciente (Escolas/Professores)</option>
                      <option value="Divertido e Engraçado" className="bg-slate-800 text-white">Divertido e Engraçado (Entretenimento/Eventos)</option>
                    </select>
                  </Field>

                  <Field label="Objetivo Principal do Agente">
                    <select
                      value={magicForm.objetivo}
                      onChange={(e) => setMagicForm({ ...magicForm, objetivo: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all border appearance-none"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                    >
                      <option value="Atendimento Geral e Triagem" className="bg-slate-800 text-white">Atendimento Geral e Triagem</option>
                      <option value="Agendar Horários e Consultas" className="bg-slate-800 text-white">Agendar Horários e Consultas</option>
                      <option value="Qualificar Leads" className="bg-slate-800 text-white">Qualificar Leads (Coletar Dados)</option>
                      <option value="Anotar Pedidos (Vendas)" className="bg-slate-800 text-white">Anotar Pedidos (Delivery/Lojas)</option>
                      <option value="Suporte Tecnico" className="bg-slate-800 text-white">Suporte Técnico e Resolução de Dúvidas</option>
                      <option value="Fechar Vendas" className="bg-slate-800 text-white">Fechar Vendas (Foco em Conversão)</option>
                      <option value="Pesquisa de Satisfacao" className="bg-slate-800 text-white">Pós-Venda e Pesquisa de Satisfação</option>
                      <option value="Envio de Catalogos" className="bg-slate-800 text-white">Envio de Catálogos e Portfólios</option>
                      <option value="Recuperacao Vendas" className="bg-slate-800 text-white">Recuperação de Vendas e Cobrança</option>
                      <option value="Captacao Matriculas" className="bg-slate-800 text-white">Captação de Inscrições/Matrículas</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Endereço Dinâmico (Se Houver)">
                    <EditInput 
                      value={magicForm.endereco} 
                      onChange={(e) => setMagicForm({ ...magicForm, endereco: e.target.value })} 
                      placeholder="Av. Paulista, 1000 - SP" 
                    />
                  </Field>
                  <Field label="Dias e Horários de Func.">
                    <EditInput 
                      value={magicForm.horarios} 
                      onChange={(e) => setMagicForm({ ...magicForm, horarios: e.target.value })} 
                      placeholder="Seg a Sex, das 08h às 18h" 
                    />
                  </Field>
                </div>

                <Field label="Resumo do Negócio e Serviços (O que vendemos, preços principais)">
                  <textarea
                    value={magicForm.resumo}
                    onChange={(e) => setMagicForm({ ...magicForm, resumo: e.target.value })}
                    placeholder="Ex: Fazemos clareamento dental (R$500), Limpeza (R$150). Exija sempre o agendamento prévio. Não aceitamos convênio médico."
                    rows={4}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-all border"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(16, 185, 129, 0.4)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  />
                </Field>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {magicSuccess && (
                       <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                         <CheckCircle size={14}/> Comportamento do Agente salvo com sucesso!
                       </span>
                    )}
                  </div>
                  <button
                    onClick={handleMagicSetup}
                    disabled={generating || !magicForm.resumo.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
                  >
                    <Sparkles size={16} />
                    {generating ? "Processando Mágica..." : "Sintetizar Nova IA"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                  <p className="text-indigo-200 text-sm font-medium">Revisão do Prompt: Este é o comportamento gerado pela IA. Leia, edite livremente se desejar, e confirme para aplicá-lo ao seu agente.</p>
                  <button onClick={() => setIsReviewing(false)} className="text-indigo-300 hover:text-white px-2 py-1 text-sm"><X size={16}/></button>
                </div>
                <textarea
                    value={generatedPrompt}
                    onChange={(e) => setGeneratedPrompt(e.target.value)}
                    rows={12}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-all border font-mono"
                    style={{
                      background: "rgba(15,23,42,0.6)",
                      borderColor: "rgba(99,102,241,0.3)",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(99, 102, 241, 0.6)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "rgba(99,102,241,0.3)"; }}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsReviewing(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                    >
                      Voltar ao Formulário
                    </button>
                    <button
                      onClick={handleSavePrompt}
                      disabled={savingPrompt}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
                    >
                      <Save size={16} />
                      {savingPrompt ? "Salvando..." : "Salvar Comportamento Definitivo"}
                    </button>
                  </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
