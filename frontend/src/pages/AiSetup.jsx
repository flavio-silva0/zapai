import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle, Save, X, Sparkles, Edit2, User, MessageSquare, Target, Clock, Smile } from "lucide-react";
import { apiFetch } from "../api";

function Field({ label, hint, children }) {
  return (
    <label className="block w-full">
      <span className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-[var(--text-muted)]">
        {label}
      </span>
      {children}
      {hint && <p className="text-[11px] mt-1.5 text-[var(--text-muted)]">{hint}</p>}
    </label>
  );
}

// Slider Component with labels
function ToneSlider({ label, leftLabel, rightLabel, value, onChange, icon: Icon }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--clr-info)]/10 text-[var(--clr-info)] border border-[var(--clr-info)]/20">
          <Icon size={13} />
        </div>
        <span className="text-[12px] font-semibold text-[var(--text-primary)]">{label}</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-2 bg-[var(--border-medium)]"
        style={{
          background: `linear-gradient(to right, var(--clr-primary) ${value}%, var(--border-medium) ${value}%)`,
          outline: "none"
        }}
      />
      <div className="flex justify-between">
        <span className="text-[10px] font-medium transition-colors" style={{ color: value < 50 ? "var(--clr-primary)" : "var(--text-muted)" }}>{leftLabel}</span>
        <span className="text-[10px] font-medium transition-colors" style={{ color: value >= 50 ? "var(--clr-info)" : "var(--text-muted)" }}>{rightLabel}</span>
      </div>
    </div>
  );
}

// Agent Avatar Card
function AgentCard({ name, emoji, role, status }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-4 flex flex-col items-center gap-3 cursor-pointer transition-all hover:border-[var(--clr-primary)] hover:shadow-lg">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-[var(--clr-info)]/20 to-[var(--clr-primary)]/15 border border-[var(--clr-info)]/20">
          {emoji}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${status === "active" ? "bg-[var(--clr-success)]" : "bg-[var(--text-muted)]"} border-[var(--bg-surface)]`} />
      </div>
      <div className="text-center">
        <p className="text-[var(--text-primary)] font-bold text-sm">{name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{role}</p>
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${status === "active" ? "bg-[var(--clr-success)] text-white" : "bg-[var(--clr-warning)] text-white"}`}>
        {status === "active" ? "Ativo" : "Pausado"}
      </span>
    </div>
  );
}

export default function AiSetup() {
  const { user, tenant, login } = useContext(AuthContext);

  const [magicForm, setMagicForm] = useState({
    nomeAgente: tenant?.bot_name || "Assistente",
    tomVoz: "Profissional e Empático",
    objetivo: "BDR/SDR",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    dias: "Segunda a Sexta",
    horaAbre: "08:00",
    horaFecha: "18:00",
    resumo: ""
  });

  // Personality sliders
  const [sliders, setSliders] = useState({ formality: 65, empathy: 80, objectivity: 55 });

  const [generating, setGenerating] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [magicSuccess, setMagicSuccess] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editingPromptText, setEditingPromptText] = useState("");
  const [erro, setErro] = useState("");
  const [activeSection, setActiveSection] = useState("personality"); // personality | knowledge

  const handleMagicSetup = async () => {
    if (!magicForm.resumo.trim()) {
      setErro("O campo de Resumo do Negócio é obrigatório.");
      return;
    }
    setGenerating(true);
    setErro("");
    setMagicSuccess(false);

    let finalEndereco = "";
    if (magicForm.logradouro) {
      finalEndereco = `${magicForm.logradouro}, ${magicForm.numero || "S/N"}`;
      if (magicForm.complemento) finalEndereco += ` (${magicForm.complemento})`;
      finalEndereco += ` - ${magicForm.bairro}, ${magicForm.cidade}/${magicForm.uf}, ${magicForm.cep}`;
    }

    const fullForm = {
      ...magicForm,
      endereco: finalEndereco,
      horarios: `${magicForm.dias}, das ${magicForm.horaAbre} às ${magicForm.horaFecha}`
    };

    try {
      const res = await apiFetch("/api/admin/magic-setup", {
        method: "POST",
        body: JSON.stringify({ formSetup: fullForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedPrompt(data.promptGerado);
      setIsReviewing(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCepSearch = async (cepStr) => {
    const limpo = cepStr.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setMagicForm(prev => ({
          ...prev,
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
          numero: ""
        }));
      }
    } catch (err) {}
  };

  const handleSavePrompt = async (textToSave, mode = "magic") => {
    setSavingPrompt(true);
    setErro("");
    try {
      const payload = { prompt_text: textToSave };
      if (mode === "magic" && magicForm.nomeAgente) {
        payload.bot_name = magicForm.nomeAgente.trim();
      }
      const res = await apiFetch("/api/admin/magic-setup/save", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedTenant = {
        ...tenant,
        prompt_text: textToSave,
        ...(mode === "magic" && magicForm.nomeAgente ? { bot_name: magicForm.nomeAgente.trim() } : {})
      };
      const token = localStorage.getItem("sofia_token");
      login(token, user, updatedTenant);

      if (mode === "magic") {
        setIsReviewing(false);
        setMagicSuccess(true);
        setTimeout(() => setMagicSuccess(false), 5000);
      } else {
        setIsEditingPrompt(false);
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setSavingPrompt(false);
    }
  };

  if (!user || !tenant) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[var(--clr-primary)] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--clr-primary)]">
            Gerenciamento de Atendentes
          </span>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
          Atendentes & Personalidade
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Configure a personalidade, tom de voz e comportamento do seu atendente virtual
        </p>
      </header>

      {/* Error */}
      {erro && (
        <div className="p-4 rounded-xl text-sm border flex items-center gap-2 bg-[var(--clr-danger)]/10 border-[var(--clr-danger)]/20 text-[var(--clr-danger)]">
          <X size={14} className="shrink-0" />
          {erro}
        </div>
      )}

      {/* ── Agent Cards (Visual) ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Seus Atendentes Virtuais
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AgentCard name={tenant?.bot_name || "Assistente"} emoji={tenant?.bot_emoji || "✨"} role="Atendente Principal" status="active" />
          <div className="bg-[var(--bg-surface)] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-[var(--clr-primary)] border border-dashed border-[var(--border-strong)]"
            style={{ minHeight: 160 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--clr-info)]/10 border border-dashed border-[var(--clr-info)]/30 text-[var(--clr-info)]">
              <span className="text-xl">+</span>
            </div>
            <p className="text-[11px] font-semibold text-center text-[var(--text-muted)]">Novo Atendente</p>
          </div>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[var(--bg-surface-active)] border border-[var(--border-subtle)] w-full sm:w-fit">
        {[
          { id: "personality", label: "Personalidade & Tom de Voz" },
          { id: "setup", label: "Configuração por IA" },
          { id: "prompt", label: "Diretrizes Avançadas" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 text-[12px] font-semibold rounded-lg transition-all whitespace-nowrap ${activeSection === tab.id ? "bg-[var(--clr-primary)] text-white shadow-md" : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Personality Sliders ── */}
      {activeSection === "personality" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-scale">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[var(--clr-info)] to-[var(--clr-primary)]">
                <User size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-[var(--text-primary)] font-bold text-base">Personalidade do Atendente</h2>
                <p className="text-[11px] text-[var(--text-muted)]">Ajuste o perfil de comunicação</p>
              </div>
            </div>

            <ToneSlider label="Formalidade" leftLabel="Descontraído" rightLabel="Formal" value={sliders.formality} onChange={v => setSliders(s => ({ ...s, formality: v }))} icon={MessageSquare} />
            <ToneSlider label="Empatia" leftLabel="Objetivo" rightLabel="Empático" value={sliders.empathy} onChange={v => setSliders(s => ({ ...s, empathy: v }))} icon={Smile} />
            <ToneSlider label="Objetividade" leftLabel="Detalhado" rightLabel="Direto" value={sliders.objectivity} onChange={v => setSliders(s => ({ ...s, objectivity: v }))} icon={Target} />

            <div className="pt-2">
              <Field label="Objetivo Principal">
                <select
                  value={magicForm.objetivo}
                  onChange={e => setMagicForm({ ...magicForm, objetivo: e.target.value })}
                  className="input-premium appearance-none bg-[var(--bg-surface-active)]"
                  >
                  <option value="Atendimento Geral e Triagem" className="bg-[var(--bg-surface)]">Atendimento Geral e Triagem</option>
                  <option value="Agendar Horários e Consultas" className="bg-[var(--bg-surface)]">Agendar Horários e Consultas</option>
                  <option value="BDR/SDR" className="bg-[var(--bg-surface)]">Qualificar Leads e Agendar Reuniões</option>
                  <option value="Anotar Pedidos (Vendas)" className="bg-[var(--bg-surface)]">Anotar Pedidos (Delivery/Lojas)</option>
                  <option value="Suporte Tecnico" className="bg-[var(--bg-surface)]">Suporte Técnico e Resolução</option>
                  <option value="Fechar Vendas" className="bg-[var(--bg-surface)]">Fechar Vendas (Foco em Conversão)</option>
                  <option value="Pesquisa de Satisfacao" className="bg-[var(--bg-surface)]">Pós-Venda e Pesquisa de Satisfação</option>
                </select>
              </Field>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Field label="Nome do Atendente">
                <input
                  type="text"
                  placeholder="Ex: Beatriz"
                  value={magicForm.nomeAgente}
                  onChange={e => setMagicForm({ ...magicForm, nomeAgente: e.target.value })}
                  className="input-premium"
                />
              </Field>
            </div>

            {magicSuccess && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-sm font-semibold bg-[var(--clr-success)]/10 border border-[var(--clr-success)]/20 text-[var(--clr-success)]">
                <CheckCircle size={15} />
                Personalidade salva com sucesso!
              </div>
            )}

            <button
              onClick={() => setActiveSection("setup")}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <Sparkles size={15} />
              Configurar com Inteligência Artificial
            </button>
          </div>

          {/* Preview card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 flex flex-col">
            <h3 className="text-[var(--text-primary)] font-bold text-sm mb-4">Pré-visualização do Atendente</h3>

            <div className="flex-1 rounded-xl p-4 space-y-3 overflow-hidden bg-[var(--bg-surface-active)] border border-[var(--border-subtle)]">
              {/* WhatsApp preview header */}
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-gradient-to-br from-[var(--clr-info)]/30 to-[var(--clr-primary)]/20">
                  {tenant?.bot_emoji || "✨"}
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-semibold text-[12px]">{magicForm.nomeAgente}</p>
                  <p className="text-[10px] text-[var(--clr-success)]">● Online agora</p>
                </div>
              </div>

              {/* Sample messages */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] text-[var(--text-primary)]">
                  {sliders.formality > 50
                    ? `Olá! Sou ${magicForm.nomeAgente}, como posso auxiliá-lo hoje?`
                    : `Oi! Tudo bem? 😊 Sou ${magicForm.nomeAgente}, em que posso ajudar?`}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-[12px] text-white bg-[var(--clr-primary)] shadow-sm">
                  Quero saber o preço dos planos
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] bg-[var(--bg-surface-hover)] border border-[var(--border-medium)] text-[var(--text-primary)]">
                  {sliders.objectivity > 50
                    ? "Claro! Temos planos a partir de R$99/mês."
                    : "Com prazer! Deixa eu te apresentar todas as opções disponíveis para você..."}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-[var(--bg-surface-hover)] rounded-xl py-2 px-1">
                <p className="text-[var(--text-primary)] font-black text-sm font-display">{sliders.formality}%</p>
                <p className="text-[9px] text-[var(--text-muted)]">Formalidade</p>
              </div>
              <div className="bg-[var(--bg-surface-hover)] rounded-xl py-2 px-1">
                <p className="text-[var(--text-primary)] font-black text-sm font-display">{sliders.empathy}%</p>
                <p className="text-[9px] text-[var(--text-muted)]">Empatia</p>
              </div>
              <div className="bg-[var(--bg-surface-hover)] rounded-xl py-2 px-1">
                <p className="text-[var(--text-primary)] font-black text-sm font-display">{sliders.objectivity}%</p>
                <p className="text-[9px] text-[var(--text-muted)]">Objetividade</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Magic Setup ── */}
      {activeSection === "setup" && (
        <div className="bg-[var(--bg-surface)] border border-[var(--clr-success)]/30 rounded-2xl p-6 space-y-5 animate-fade-scale">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #06d6a0, #22d3ee)", boxShadow: "0 0 20px rgba(6,214,160,0.3)" }}>
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-base">Configuração Inteligente</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Descreva seu negócio e a IA criará a personalidade ideal para seu atendente
              </p>
            </div>
          </div>

          {!isReviewing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Nome do Atendente">
                  <input type="text" placeholder="Ex: Beatriz" value={magicForm.nomeAgente}
                    onChange={e => setMagicForm({ ...magicForm, nomeAgente: e.target.value })}
                    className="input-premium" />
                </Field>
                <Field label="Tom de Voz">
                  <select value={magicForm.tomVoz} onChange={e => setMagicForm({ ...magicForm, tomVoz: e.target.value })}
                    className="input-premium appearance-none">
                    <option className="bg-[var(--bg-surface)]">Profissional e Empático</option>
                    <option className="bg-[var(--bg-surface)]">Profissional e Corporativo</option>
                    <option className="bg-[var(--bg-surface)]">Descontraído e Ágil</option>
                    <option className="bg-[var(--bg-surface)]">Acolhedor e Amigável</option>
                    <option className="bg-[var(--bg-surface)]">Direto e Objetivo</option>
                    <option className="bg-[var(--bg-surface)]">Sofisticado e Premium</option>
                    <option className="bg-[var(--bg-surface)]">Entusiástico e Vendedor</option>
                  </select>
                </Field>
                <Field label="Objetivo Principal">
                  <select value={magicForm.objetivo} onChange={e => setMagicForm({ ...magicForm, objetivo: e.target.value })}
                    className="input-premium appearance-none">
                    <option className="bg-[var(--bg-surface)]">Atendimento Geral e Triagem</option>
                    <option className="bg-[var(--bg-surface)]">Agendar Horários e Consultas</option>
                    <option value="BDR/SDR" className="bg-[var(--bg-surface)]">BDR/SDR (Qualificar e Agendar)</option>
                    <option className="bg-[var(--bg-surface)]">Anotar Pedidos (Vendas)</option>
                    <option className="bg-[var(--bg-surface)]">Suporte Técnico</option>
                    <option className="bg-[var(--bg-surface)]">Fechar Vendas</option>
                    <option className="bg-[var(--bg-surface)]">Pesquisa de Satisfação</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Endereço do Negócio">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="CEP" maxLength={9} value={magicForm.cep}
                        onChange={e => { setMagicForm({ ...magicForm, cep: e.target.value }); handleCepSearch(e.target.value); }}
                        className="input-premium w-1/3" />
                      <input type="text" placeholder="Rua / Avenida" value={magicForm.logradouro}
                        onChange={e => setMagicForm({ ...magicForm, logradouro: e.target.value })}
                        className="input-premium w-2/3" />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Número" value={magicForm.numero}
                        onChange={e => setMagicForm({ ...magicForm, numero: e.target.value })}
                        className="input-premium w-1/3" />
                      <input type="text" placeholder="Complemento" value={magicForm.complemento}
                        onChange={e => setMagicForm({ ...magicForm, complemento: e.target.value })}
                        className="input-premium w-2/3" />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Cidade" value={magicForm.cidade}
                        onChange={e => setMagicForm({ ...magicForm, cidade: e.target.value })}
                        className="input-premium flex-1" />
                      <input type="text" placeholder="UF" value={magicForm.uf}
                        onChange={e => setMagicForm({ ...magicForm, uf: e.target.value })}
                        className="input-premium w-16 text-center" />
                    </div>
                  </div>
                </Field>

                <Field label="Horário de Funcionamento">
                  <div className="space-y-2">
                    <select value={magicForm.dias} onChange={e => setMagicForm({ ...magicForm, dias: e.target.value })}
                      className="input-premium appearance-none">
                      <option className="bg-[var(--bg-surface)]">Segunda a Sexta</option>
                      <option className="bg-[var(--bg-surface)]">Segunda a Sábado</option>
                      <option className="bg-[var(--bg-surface)]">Todos os dias</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="shrink-0 text-[var(--text-muted)]" />
                      <input type="time" value={magicForm.horaAbre}
                        onChange={e => setMagicForm({ ...magicForm, horaAbre: e.target.value })}
                        className="input-premium" />
                      <span className="text-sm text-[var(--text-muted)]">às</span>
                      <input type="time" value={magicForm.horaFecha}
                        onChange={e => setMagicForm({ ...magicForm, horaFecha: e.target.value })}
                        className="input-premium" />
                    </div>
                  </div>
                </Field>
              </div>

              <Field label="Resumo do Negócio e Serviços *" hint="Descreva o que você vende, preços principais, diferenciais e regras importantes">
                <textarea
                  value={magicForm.resumo}
                  onChange={e => setMagicForm({ ...magicForm, resumo: e.target.value })}
                  placeholder="Ex: Somos uma clínica odontológica. Realizamos clareamento dental (R$500), limpeza (R$150). Exigimos agendamento prévio. Não aceitamos convênio. Nosso diferencial é o atendimento humanizado..."
                  rows={4}
                  className="input-premium resize-y min-h-[100px]"
                />
              </Field>

              <div className="flex justify-end">
                <button
                  onClick={handleMagicSetup}
                  disabled={generating || !magicForm.resumo.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #06d6a0, #22d3ee)" }}>
                  <Sparkles size={16} />
                  {generating ? "Gerando Personalidade..." : "Sintetizar Personalidade"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-scale">
              <div className="p-4 rounded-xl flex items-start justify-between gap-3 bg-[var(--clr-primary)]/10 border border-[var(--clr-primary)]/20">
                <p className="text-[13px] text-[var(--clr-primary)] font-medium">
                  ✨ Revise a personalidade gerada abaixo. Edite se necessário e confirme para aplicar ao seu atendente.
                </p>
                <button onClick={() => setIsReviewing(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={generatedPrompt}
                onChange={e => setGeneratedPrompt(e.target.value)}
                rows={12}
                className="input-premium resize-y min-h-[200px] font-mono text-[12px] leading-relaxed"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsReviewing(false)} className="btn-ghost">Voltar</button>
                <button
                  onClick={() => handleSavePrompt(generatedPrompt, "magic")}
                  disabled={savingPrompt}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  <Save size={15} />
                  {savingPrompt ? "Salvando..." : "Aplicar Personalidade"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Advanced Prompt ── */}
      {activeSection === "prompt" && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 space-y-4 animate-fade-scale">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-primary-hover)]">
              <Edit2 size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-base">Diretrizes Avançadas</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Estas são as regras mestras que seu atendente segue em todas as conversas
              </p>
            </div>
          </div>

          {!isEditingPrompt ? (
            <div className="space-y-3">
              <div className="w-full rounded-xl px-5 py-4 text-[12px] border font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed bg-[var(--bg-surface-active)] border-[var(--border-medium)] text-[var(--text-secondary)]">
                {tenant.prompt_text || "Seu atendente ainda não possui diretrizes definidas.\n\nUtilize a aba 'Configuração por IA' para gerar automaticamente ou edite manualmente."}
              </div>
              <button
                onClick={() => { setIsEditingPrompt(true); setEditingPromptText(tenant.prompt_text || ""); }}
                className="btn-outline flex items-center gap-2 text-sm">
                <Edit2 size={14} />
                Editar Diretrizes Manualmente
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-scale">
              <textarea
                value={editingPromptText}
                onChange={e => setEditingPromptText(e.target.value)}
                rows={15}
                className="input-premium resize-y min-h-[200px] font-mono text-[12px] leading-relaxed"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsEditingPrompt(false)} className="btn-ghost">Cancelar</button>
                <button
                  onClick={() => handleSavePrompt(editingPromptText, "manual")}
                  disabled={savingPrompt}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  <Save size={15} />
                  {savingPrompt ? "Salvando..." : "Salvar Diretrizes"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
