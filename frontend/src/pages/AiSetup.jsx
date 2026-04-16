import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { CheckCircle, Save, X, Sparkles, BrainCircuit, Edit2 } from "lucide-react";
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

export default function AiSetup() {
  const { user, tenant, login } = useContext(AuthContext);

  const [magicForm, setMagicForm] = useState({
    nomeAgente: tenant?.bot_name || "Assistente",
    tomVoz: "Profissional e Empático",
    objetivo: "Atendimento Geral e Triagem",
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
  const [generating, setGenerating] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [magicSuccess, setMagicSuccess] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editingPromptText, setEditingPromptText] = useState("");
  const [erro, setErro] = useState("");

  const handleMagicSetup = async () => {
    if (!magicForm.resumo.trim()) {
      setErro("O campo de Resumo é obrigatório para guiar a IA.");
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
    } catch(err) {
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
    } catch(err) {
    }
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
    } catch(err) {
      setErro(err.message);
    } finally {
      setSavingPrompt(false);
    }
  };

  if (!user || !tenant) return null;

  return (
    <div className="p-8 overflow-y-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-white mb-1">Cérebro da IA</h1>
          <p className="text-slate-500 text-sm">Configure o comportamento, as regras e personalidade do agente</p>
        </div>
      </header>

      {erro && (
        <div className="p-4 rounded-xl text-rose-300 text-sm border"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
        >
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pb-8">
        
        {/* Magic Setup Card */}
        <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden" style={{ border: "1px solid rgba(16, 185, 129, 0.2)"}}>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Nome do Agente">
                    <input
                      type="text"
                      placeholder="Ex: Beatriz"
                      value={magicForm.nomeAgente}
                      onChange={(e) => setMagicForm({ ...magicForm, nomeAgente: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all border"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                    />
                  </Field>

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
                  <Field label="Endereço Completo">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="CEP"
                          maxLength={9}
                          value={magicForm.cep}
                          onChange={(e) => { setMagicForm({ ...magicForm, cep: e.target.value }); handleCepSearch(e.target.value); }}
                          className="w-1/3 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                        <input
                          type="text"
                          placeholder="Rua / Avenida"
                          value={magicForm.logradouro}
                          onChange={(e) => setMagicForm({ ...magicForm, logradouro: e.target.value })}
                          className="w-2/3 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Número"
                          value={magicForm.numero}
                          onChange={(e) => setMagicForm({ ...magicForm, numero: e.target.value })}
                          className="w-1/3 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                        <input
                          type="text"
                          placeholder="Complemento (Opcional)"
                          value={magicForm.complemento}
                          onChange={(e) => setMagicForm({ ...magicForm, complemento: e.target.value })}
                          className="w-2/3 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Bairro"
                          value={magicForm.bairro}
                          onChange={(e) => setMagicForm({ ...magicForm, bairro: e.target.value })}
                          className="w-2/5 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={magicForm.cidade}
                          onChange={(e) => setMagicForm({ ...magicForm, cidade: e.target.value })}
                          className="w-2/5 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                        <input
                          type="text"
                          placeholder="UF"
                          value={magicForm.uf}
                          onChange={(e) => setMagicForm({ ...magicForm, uf: e.target.value })}
                          className="w-1/5 rounded-xl px-3 py-3 text-[13px] text-white focus:outline-none transition-all border text-center"
                          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                        />
                      </div>
                    </div>
                  </Field>
                  <Field label="Dias e Horários de Func.">
                    <div className="flex gap-2">
                       <select
                         value={magicForm.dias}
                         onChange={(e) => setMagicForm({ ...magicForm, dias: e.target.value })}
                         className="flex-1 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all border appearance-none"
                         style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                       >
                         <option value="Segunda a Sexta" className="bg-slate-800 text-white">Seg a Sex</option>
                         <option value="Segunda a Sábado" className="bg-slate-800 text-white">Seg a Sáb</option>
                         <option value="Todos os dias" className="bg-slate-800 text-white">Todos os dias</option>
                       </select>
                       
                       <input 
                         type="time" 
                         value={magicForm.horaAbre} 
                         onChange={(e) => setMagicForm({ ...magicForm, horaAbre: e.target.value })} 
                         className="w-24 rounded-xl px-2 text-center text-sm text-white focus:outline-none transition-all border"
                         style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                       />
                       <span className="text-slate-500 self-center">às</span>
                       <input 
                         type="time" 
                         value={magicForm.horaFecha} 
                         onChange={(e) => setMagicForm({ ...magicForm, horaFecha: e.target.value })} 
                         className="w-24 rounded-xl px-2 text-center text-sm text-white focus:outline-none transition-all border"
                         style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }}
                       />
                    </div>
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
                         <CheckCircle size={14}/> Comportamento salvo com sucesso!
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
                      onClick={() => handleSavePrompt(generatedPrompt, "magic")}
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

        {/* Current Prompt Card */}
        <div className="glass rounded-2xl p-6 space-y-5 relative overflow-hidden" style={{ border: "1px solid rgba(99, 102, 241, 0.2)"}}>
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BrainCircuit size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Cérebro Atual do Agente</h2>
                <p className="text-slate-500 text-xs">Abaixo está a regra mestra exata que o seu robô obedece agora mesmo no WhatsApp.</p>
              </div>
            </div>

            {!isEditingPrompt ? (
               <div className="space-y-4">
                 <div className="w-full rounded-xl px-5 py-4 text-sm text-slate-300 border font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed shadow-inner" style={{ background: "rgba(15,23,42,0.4)", borderColor: "rgba(99,102,241,0.2)" }}>
                    {tenant.prompt_text || "Seu agente ainda não tem diretrizes claras. Utilize o Setup Mágico ou adicione manualmente."}
                 </div>
                 <button 
                  onClick={() => { setIsEditingPrompt(true); setEditingPromptText(tenant.prompt_text || ""); }} 
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-300 rounded-xl transition-all border hover:bg-indigo-500/10"
                  style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.2)" }}
                 >
                   <Edit2 size={16} /> Editar Cérebro Manualmente
                 </button>
               </div>
            ) : (
               <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                 <textarea 
                    value={editingPromptText} 
                    onChange={(e) => setEditingPromptText(e.target.value)} 
                    rows={15}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-all border font-mono leading-relaxed"
                    style={{
                      background: "rgba(15,23,42,0.6)",
                      borderColor: "rgba(99,102,241,0.4)",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(99, 102, 241, 0.7)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "rgba(99,102,241,0.4)"; }}
                 />
                 <div className="flex justify-end gap-3 pt-2">
                   <button 
                      onClick={() => setIsEditingPrompt(false)} 
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                   >
                     Cancelar Edição
                   </button>
                   <button 
                      onClick={() => handleSavePrompt(editingPromptText, "manual")} 
                      disabled={savingPrompt}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, #10b981, #0d9488)" }}
                   >
                     <Save size={16} /> 
                     {savingPrompt ? "Salvando..." : "Salvar Edição do Cérebro"}
                   </button>
                 </div>
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
