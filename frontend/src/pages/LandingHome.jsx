import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  MessageSquare, Zap, Clock, Search, User, 
  CheckCircle2, Tags, Activity, 
  MessageCircle, ShieldCheck
} from "lucide-react";

export default function LandingHome() {
  const [activeTab, setActiveTab] = useState("vendas");

  const USE_CASES = {
    vendas: {
      title: "Vendas e Comercial",
      desc: "Capture intenção de compra instantaneamente, qualificando leads 24h por dia e passando o contexto mastigado para o vendedor fechar o negócio.",
      metrics: ["Conversão Agilizada", "Zero Leads Perdidos"],
      chat: { name: "Marcos Lead", status: "Aguardando Vendedor", msg: "Quero saber o preço do plano anual.", ai: "Marcos, nosso plano anual sai por R$ 990. Para avançarmos, posso confirmar seu CNPJ?", tag: "Intenção de Compra" }
    },
    suporte: {
      title: "Suporte ao Cliente",
      desc: "Desafogue o time técnico resolvendo dúvidas operacionais, status de pedido e envio de faturas automaticamente via documentação.",
      metrics: ["FCR Aumentado", "Fila Reduzida em 70%"],
      chat: { name: "Cliente Ativo", status: "Resolvido", msg: "Onde baixo minha segunda via?", ai: "Aqui está o link direto para a segunda via da sua fatura deste mês. Posso ajudar em mais algo?", tag: "Dúvida Simples" }
    },
    agendamento: {
      title: "Clínicas e Agendamentos",
      desc: "Filtre dúvidas sobre convênios e horários antes de acionar a recepção. Coleta completa de dados do paciente.",
      metrics: ["Agendamento Fluido", "Recepcionista Focada"],
      chat: { name: "Paciente Novo", status: "Em Atendimento Humano", msg: "Vocês atendem Bradesco Saúde?", ai: "Sim, atendemos! Para agilizar seu agendamento, por favor, me envie a foto da sua carteirinha.", tag: "Convênio Confirmado" }
    }
  };

  return (
    <div className="font-body bg-slate-50 text-slate-900 selection:bg-cyan-100 selection:text-cyan-900 overflow-x-clip">
      
      {/* ══════════════════════════════════════════════════════
          HERO (Multicamadas, Orbital, Ecossistema)
      ══════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-28 lg:pt-36 pb-20 lg:pb-28 bg-slate-900 border-b border-slate-800 scroll-mt-24">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="max-w-[1400px] mx-auto px-5 lg:px-10 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left Text Block */}
          <div className="flex-1 text-center lg:text-left z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[11px] uppercase font-bold text-cyan-400 tracking-wider mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Sua operação centralizada
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] font-black text-white leading-[1.08] tracking-tight mb-6 animate-fade-up delay-100">
              Transforme conversas no WhatsApp em atendimentos bem resolvidos.
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed mb-8 animate-fade-up delay-200">
              A ZapAI responde dúvidas, coleta informações, organiza solicitações e chama sua equipe humana apenas quando o cliente realmente precisa.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 animate-fade-up delay-300">
              <Link to="/cadastro" className="btn-primary h-12 px-8 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold border-none shadow-lg shadow-cyan-500/10">
                Conhecer a ZapAI
              </Link>
              <a href="#demo" className="btn-outline h-12 px-8 border-slate-700 text-white hover:bg-slate-800">
                Ver a plataforma
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 opacity-80 animate-fade-up delay-300">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" /> Transição Humana Fluida
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <CheckCircle2 size={16} className="text-cyan-400" /> WhatsApp API Oficial
              </div>
            </div>
          </div>

          {/* Right Product Ecosystem */}
          <div className="flex-[1.2] relative w-full max-w-[620px] lg:max-w-none animate-fade-up delay-400">
            
            {/* Main Panel */}
            <div className="w-full bg-[#0B101A] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-[460px] ring-1 ring-white/10">
              {/* UI Header */}
              <div className="h-11 bg-[#111724] border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Atendimento: Cliente #4029</div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado
                </div>
              </div>

              {/* UI Body */}
              <div className="flex-1 flex flex-col md:flex-row bg-[#0B101A]">
                {/* Chat Column */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-800 p-4 sm:p-5 flex flex-col justify-end">
                  <div className="space-y-4">
                    <div className="self-start bg-[#1C2333] border border-slate-700 text-slate-200 text-xs p-3 rounded-xl rounded-tl-none w-5/6">
                      Gostaria de fechar o plano anual para minha clínica.
                    </div>
                    <div className="self-end bg-cyan-950/40 border border-cyan-800/60 text-cyan-50 text-xs p-3 rounded-xl rounded-tr-none w-5/6 ml-auto relative">
                      <span className="absolute -top-4 right-0 text-[8px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        <Zap size={8} /> ZapAI Auto
                      </span>
                      Excelente escolha! Vou acionar o consultor para enviar o link de pagamento.
                    </div>
                    {/* Status Divider */}
                    <div className="flex items-center gap-2 my-2 opacity-60">
                      <div className="h-px bg-slate-700 flex-1" />
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Transferido para Atendente</span>
                      <div className="h-px bg-slate-700 flex-1" />
                    </div>
                    <div className="self-end bg-slate-800 border border-slate-700 text-white text-xs p-3 rounded-xl rounded-tr-none w-5/6 ml-auto relative mt-3">
                       <span className="absolute -top-4 right-0 text-[8px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <User size={8} /> Vendedor Assumiu
                      </span>
                      Olá! Aqui é o Marcos. Link gerado com sucesso: pag.me/anual.
                    </div>
                  </div>
                </div>

                {/* Context Column */}
                <div className="w-full md:w-52 bg-[#111724] p-4 flex flex-col justify-between shrink-0">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Resumo Automático</div>
                    <div className="bg-[#1C2333] border border-slate-700 rounded-lg p-2.5 mb-4 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Intenção</span>
                        <span className="font-bold text-cyan-400">Venda</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Plano</span>
                        <span className="font-bold text-white">Anual</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Segmento</span>
                        <span className="font-bold text-slate-300">Saúde</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Status da Conversa</div>
                    <div className="w-full py-2 bg-slate-800 border border-slate-700 rounded text-center text-[10px] font-bold text-slate-200">
                      Em Atendimento Humano
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orbiting Element 1: Tag Extraction */}
            <div className="absolute -right-4 -top-6 z-20 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl hidden xl:flex flex-col animate-fade-up delay-700">
               <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                 <Zap size={10}/> Dado Coletado
               </span>
               <span className="text-xs font-bold text-white border-l-2 border-cyan-400 pl-2">Segmento: Odonto</span>
            </div>

            {/* Orbiting Element 2: Human Notification */}
            <div className="absolute -left-6 -bottom-5 z-20 bg-white border border-slate-200 rounded-lg p-3 shadow-xl hidden xl:flex items-center gap-3 animate-fade-up delay-1000">
               <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white"><User size={13}/></div>
               <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alerta Equipe</span>
                 <span className="text-xs font-bold text-slate-900">Vendedor Assumiu</span>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAIXA DE CONTEXTO (Lifecycle Flow)
      ══════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="bg-[#f8fafc] border-b border-slate-200 py-16 scroll-mt-24">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="text-center mb-10 lg:hidden">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">O Fluxo da Mensagem</h2>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative">
            {/* Desktop Connective Line */}
            <div className="hidden lg:block absolute top-1/2 left-[5%] right-[5%] h-[2px] bg-slate-200 -z-10" />

            {[
              { label: "1. Entrada", icon: <MessageSquare size={16} />, text: "Cliente envia mensagem" },
              { label: "2. Triagem AI", icon: <Activity size={16} />, text: "Motivo e dados lidos" },
              { label: "3. Automação", icon: <Zap size={16} />, text: "Resolução ou coleta" },
              { label: "4. Organização", icon: <Tags size={16} />, text: "Contexto catalogado" },
              { label: "5. Hand-off", icon: <User size={16} />, text: "Humano assume chat" }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 bg-[#f8fafc] px-4 w-full lg:w-auto">
                <div className="w-12 h-12 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center text-slate-700 relative z-10">
                  {step.icon}
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100 mb-1">
                    {step.label}
                  </div>
                  <div className="text-sm font-bold text-slate-800">{step.text}</div>
                </div>
                {/* Mobile Connective Arrow */}
                {idx < 4 && (
                  <div className="lg:hidden h-6 w-[2px] bg-slate-200 mt-1 flex items-center justify-center relative">
                    <div className="absolute -bottom-1 w-2 h-2 border-b-2 border-r-2 border-slate-300 rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROBLEMAS (Visual e Editorial Misto)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
              Seu WhatsApp recebe mensagens.<br/>Sua operação precisa acompanhar.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl font-medium">
              Vendas perdidas de madrugada, atendentes copiando e colando PDFs, clientes irritados repetindo a mesma história. O atendimento manual no WhatsApp é insustentável em escala.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Problema 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="mb-6 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
                  <Clock size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Mensagens Fora do Horário</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  O cliente decide comprar às 21h. Se ninguém responde, ele procura o concorrente antes de você abrir no dia seguinte.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                <div className="bg-white border border-slate-200 text-xs p-2.5 rounded-lg self-start shadow-sm text-slate-700">
                  Qual o valor do orçamento?
                </div>
                <div className="text-[10px] text-slate-400 font-bold self-end uppercase">Visto ontem às 21:14 • Sem resposta</div>
              </div>
            </div>

            {/* Problema 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="mb-6 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
                  <MessageCircle size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Dúvidas Repetitivas</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sua equipe qualificada gasta horas copiando e colando horários, endereços e PDFs que a automação responderia instantaneamente.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                <div className="bg-white border border-slate-200 text-xs p-2 rounded-lg self-start text-slate-700">Vocês abrem sábado?</div>
                <div className="bg-white border border-slate-200 text-xs p-2 rounded-lg self-start text-slate-700">Aonde fica a loja?</div>
              </div>
            </div>

            {/* Problema 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:col-span-2 lg:col-span-1">
              <div className="mb-6 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
                  <Search size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Falta de Contexto</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Quando o vendedor finalmente assume o chat, ele não sabe o que o cliente quer e precisa perguntar tudo novamente.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-2">
                <div className="bg-slate-800 text-white text-xs p-2 rounded-lg self-end">
                  Olá, em que posso ajudar?
                </div>
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2 rounded-lg self-start font-bold">
                  Eu já expliquei tudo pro robô!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          VISÃO COMPLETA (Bento Grid Sem Bugs de Posicionamento)
      ══════════════════════════════════════════════════════ */}
      <section id="demo" className="py-20 lg:py-28 bg-slate-900 border-b border-slate-800 text-white scroll-mt-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-14 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-[1.1] text-white">
                Uma plataforma estruturada.<br/>Zero confusão.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 font-normal">
                Desenvolvemos uma interface que a sua equipe aprende a usar em 5 minutos.
              </p>
            </div>
            <Link to="/cadastro" className="btn-primary bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold border-none shrink-0">
              Acessar Painel Agora
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Bloco 1: Inbox (sem absolute collision!) */}
            <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block mb-2">Centralização</span>
                <h3 className="font-bold text-xl mb-2 text-white">Caixa de Entrada Única</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Filtre por equipe, por etiqueta de intenção ou por status de atendimento (Aguardando humano, IA operando).
                </p>
              </div>

              <div className="bg-[#0f172a] border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="font-bold text-xs sm:text-sm text-white">Orçamentos Pendentes</div>
                  <div className="w-6 h-6 rounded bg-rose-500 text-white text-xs font-bold flex items-center justify-center">12</div>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="font-bold text-xs sm:text-sm text-white">Suporte Técnico</div>
                  <div className="w-6 h-6 rounded bg-slate-600 text-white text-xs font-bold flex items-center justify-center">4</div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Contexto Gerado */}
            <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block mb-2">Inteligência</span>
                <h3 className="font-bold text-xl mb-2 text-white">Contexto Gerado</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  A IA analisa as mensagens anteriores e entrega um resumo objetivo para o vendedor.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block mb-2">Resumo Automático</span>
                <p className="text-xs text-slate-200 leading-relaxed font-mono">
                  &gt; Cliente procura plano PRO.<br/>
                  &gt; Dados da clínica coletados.<br/>
                  &gt; Aguardando envio de orçamento.
                </p>
              </div>
            </div>

            {/* Bloco 3: Transferência Clicável */}
            <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block mb-2">Controle Total</span>
                <h3 className="font-bold text-xl mb-2 text-white">Transferência Clicável</h3>
                <p className="text-slate-300 text-sm max-w-sm leading-relaxed">
                  Com 1 clique, o atendente pausa a automação e assume o controle do WhatsApp instantaneamente.
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg">
                <User size={24} />
              </div>
            </div>

            {/* Bloco 4: Etiquetas Automáticas */}
            <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block mb-2">Organização</span>
                <h3 className="font-bold text-xl mb-2 text-white">Etiquetas Automáticas</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  A plataforma categoriza cada conversa por intenção assim que o cliente entra em contato.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold">Venda Quente</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold">Dúvida Fatura</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">Agendamento</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CASOS DE USO INTERATIVOS (Abas)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Especialista no seu segmento
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              A ZapAI adapta o fluxo de perguntas e respostas para a necessidade do seu modelo de negócio.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            
            {/* Tabs Controller */}
            <div className="w-full lg:w-1/3 flex flex-col gap-3">
              {Object.keys(USE_CASES).map((key) => {
                const isSelected = activeTab === key;
                return (
                  <button 
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`text-left p-6 rounded-xl border transition-all ${
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <h3 className={`font-bold text-lg mb-1.5 ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {USE_CASES[key].title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {USE_CASES[key].desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Tab Visual Result */}
            <div className="w-full lg:w-2/3 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[360px]">
              
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Demonstração ao Vivo</div>
                <div className="flex flex-wrap gap-2">
                  {USE_CASES[activeTab].metrics.map((m, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chat Simulation Area */}
              <div className="w-full bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
                <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{USE_CASES[activeTab].chat.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{USE_CASES[activeTab].chat.status}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded text-[10px] font-bold uppercase">
                    {USE_CASES[activeTab].chat.tag}
                  </span>
                </div>
                
                <div className="p-4 sm:p-5 flex flex-col gap-4 bg-white">
                  <div className="bg-slate-100 border border-slate-200 text-slate-800 text-xs sm:text-sm p-3 rounded-xl rounded-tl-none self-start max-w-[90%] sm:max-w-[80%]">
                    {USE_CASES[activeTab].chat.msg}
                  </div>
                  <div className="bg-slate-900 text-white text-xs sm:text-sm p-3 rounded-xl rounded-tr-none self-end max-w-[90%] sm:max-w-[80%] relative">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
                      <Zap size={8} /> Resposta ZapAI
                    </span>
                    {USE_CASES[activeTab].chat.ai}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUST & FINAL CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white text-center border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-5">
          
          <div className="flex items-center justify-center gap-3 mb-8">
             <ShieldCheck size={32} className="text-cyan-600" />
             <div className="text-left">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Garantia B2B</div>
               <div className="text-sm font-bold text-slate-900">Infraestrutura Oficial WhatsApp Meta API</div>
             </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Seu cliente já está no WhatsApp.<br/>Sua empresa precisa estar pronta.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            Abandone os gargalos manuais. Implemente hoje a central de atendimento inteligente da ZapAI.
          </p>
          
          <div className="flex justify-center">
            <Link to="/cadastro" className="btn-primary px-10 py-4 text-base sm:text-lg w-full sm:w-auto shadow-xl">
              Conversar sobre meu atendimento
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
