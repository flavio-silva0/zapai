import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Plus,
  Minus,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Users,
  Activity,
  Layers,
  Cpu,
  CheckCircle2,
} from "lucide-react";

const COMPARISON_ROWS = [
  {
    feature: "Números de WhatsApp",
    starter: "1 número",
    pro: "Até 3 números",
    enterprise: "Ilimitados",
  },
  {
    feature: "Volume de conversas",
    starter: "Até 500/mês",
    pro: "Ilimitadas",
    enterprise: "Ilimitadas sob medida",
  },
  {
    feature: "API Oficial Meta (Cloud API)",
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Contexto de IA & RAG",
    starter: "FAQ básico",
    pro: "Memória contínua + RAG vetorial",
    enterprise: "RAG dedicado + Custom tuning",
  },
  {
    feature: "Painel & CRM de Atendimento",
    starter: "Básico",
    pro: "Kanban CRM + Métricas ao vivo",
    enterprise: "Multi-equipes avançado",
  },
  {
    feature: "Transferência para Humano (Handoff)",
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Integração via API & Webhooks",
    starter: "—",
    pro: "Webhooks padrão",
    enterprise: "API REST + Webhooks custom",
  },
  {
    feature: "SLA de Disponibilidade",
    starter: "Melhor esforço",
    pro: "Prioritário comercial",
    enterprise: "99.9% contratual",
  },
  {
    feature: "Suporte",
    starter: "WhatsApp (horário com.)",
    pro: "Canal prioritário",
    enterprise: "Gerente dedicado (CSM)",
  },
];

const FAQS = [
  {
    q: "Preciso de cartão de crédito para criar a conta?",
    a: "Não. A criação de conta e os testes de configuração da plataforma não exigem nenhum dado de pagamento.",
  },
  {
    q: "A ZapAI usa a API Oficial do WhatsApp?",
    a: "Sim. Toda a infraestrutura roda através da API oficial da Meta (Cloud API), garantindo estabilidade e minimizando riscos de bloqueio numérico.",
  },
  {
    q: "Quando os preços comerciais definitivos serão publicados?",
    a: "Estamos concluindo a fase de homologação com clientes selecionados. Criando sua conta gratuita agora, você ganha acesso antecipado e condições diferenciadas quando a tabela de preços comerciais for aberta.",
  },
  {
    q: "Posso mudar de plano depois que os valores forem anunciados?",
    a: "Sim. A transição entre planos pode ser feita diretamente pelo painel a qualquer momento, sem interromper seus atendimentos em andamento.",
  },
  {
    q: "E se minha equipe precisar assumir uma conversa da IA?",
    a: "A qualquer momento, qualquer atendente humano pode clicar no botão 'Assumir Atendimento' no painel Kanban. A Zap pausa o atendimento automático na hora e entrega todo o histórico formatado para o operador.",
  },
];

export default function LandingPlanos() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "Planos & Escala — ZapAI";
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="font-body selection:bg-cyan-100 selection:text-cyan-900">
      {/* ══════════════════════════════════════════════════════
          HERO — Escuro com Console de Capacidade (DESIGN.md)
      ══════════════════════════════════════════════════════ */}
      <section className="pt-28 lg:pt-36 pb-20 lg:pb-24 px-5 bg-slate-950 border-b border-slate-800 text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Lado Esquerdo: Mensagem e Posicionamento */}
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/70 text-cyan-400 text-[11px] font-mono uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              PLANOS & ESCALA
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
              Infraestrutura de atendimento desenhada para crescer com sua empresa.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 mt-5 max-w-xl leading-relaxed">
              Da primeira triagem com inteligência artificial à operação multi-canal com CRM integrado. Sem taxas ocultas por mensagem.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-cyan-400" />
                <span>API Oficial Meta</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-cyan-400" />
                <span>Multi-Tenant Isolado</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-cyan-400" />
                <span>Handoff Humano Imediato</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Representação de Software Real (Console de Capacidade) */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
                    CONSOLE DA OPERAÇÃO
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  ATIVO
                </span>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 uppercase text-[10px]">Canal Primário</span>
                  <span className="text-slate-200 font-semibold">WhatsApp Cloud API</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 uppercase text-[10px]">Motor de IA</span>
                  <span className="text-slate-200 font-semibold">ZapAI Context + RAG</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 uppercase text-[10px]">Controle de Fila</span>
                  <span className="text-slate-200 font-semibold">Kanban CRM em Tempo Real</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400 uppercase text-[10px]">Isolamento</span>
                  <span className="text-emerald-400 font-semibold">100% Criptografado</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                  <span>CAPACIDADE OPERACIONAL</span>
                  <span className="text-cyan-400">ELÁSTICA</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full w-[78%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BENTO PRICING (12 Colunas Assimétricas — DESIGN.md)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-[#FAFAF8] border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-mono uppercase tracking-widest mb-3">
              ESTRUTURA DE PLANOS
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Previsibilidade para sua operação
            </h2>
            <p className="text-base text-slate-600 mt-3">
              Crie sua conta gratuitamente para testar toda a plataforma. Os valores comerciais definitivos serão anunciados em breve.
            </p>
          </div>

          {/* Grid Bento de 12 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ── PROFISSIONAL (7 / 12) — PLANO CENTRAL DA OPERAÇÃO ── */}
            <div className="col-span-12 lg:col-span-7 bg-slate-900 text-white rounded-2xl border border-slate-700/80 p-7 lg:p-9 shadow-xl relative flex flex-col justify-between overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-mono uppercase tracking-widest font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    PLANO CENTRAL DA OPERAÇÃO
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Mais recomendado
                  </span>
                </div>

                <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Profissional
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-xl">
                  Para empresas com fluxo constante de clientes que precisam de inteligência contextual, múltiplos números de atendimento e CRM operacional.
                </p>

                {/* Preço Comercial Oficial */}
                <div className="my-6 pt-5 border-t border-slate-800 flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    Em breve
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono uppercase tracking-wider bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/80 font-semibold">
                    Teste gratuito liberado
                  </span>
                </div>
                <p className="text-xs text-slate-400 -mt-3 mb-6">
                  Valores comerciais em definição. Cadastre-se sem compromisso e explore todos os recursos.
                </p>

                {/* Sub-módulos Bento Internos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
                  <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                      Capacidade
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">
                      Até 3 números
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Conversas ilimitadas
                    </div>
                  </div>

                  <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                      Inteligência
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">
                      RAG Vetorial
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Memória contínua
                    </div>
                  </div>

                  <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5">
                    <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold mb-1">
                      Controle
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">
                      Kanban + CRM
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Handoff humano fluido
                    </div>
                  </div>
                </div>

                {/* Destaques do Plano */}
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                    <span>Treinamento da atendente com documentos e perguntas frequentes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                    <span>Relatórios de tempo de resposta e taxa de resolução</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                    <span>Suporte prioritário via canal direto</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                <Link
                  to="/cadastro"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Criar conta gratuita e testar
                  <ArrowRight size={17} />
                </Link>
                <p className="text-center text-[11px] font-mono text-slate-400 mt-2.5">
                  Sem cartão de crédito · Ativação imediata
                </p>
              </div>
            </div>

            {/* ── STARTER (5 / 12) — ENTRADA LEVE ── */}
            <div className="col-span-12 lg:col-span-5 bg-white text-slate-900 rounded-2xl border border-slate-200/90 p-7 lg:p-9 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono uppercase tracking-widest font-bold mb-4">
                  ENTRADA
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Starter
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Para autônomos e pequenos negócios que estão organizando o primeiro canal de atendimento digital.
                </p>

                <div className="my-6 pt-5 border-t border-slate-100 flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-black text-slate-900">
                    Em breve
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded font-medium">
                    Lançamento
                  </span>
                </div>
                <p className="text-xs text-slate-500 -mt-3 mb-6">
                  Formato acessível para negócios em estágio inicial.
                </p>

                {/* Lista de Recursos Starter */}
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <span>1 número de WhatsApp oficial (Meta Cloud API)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <span>Até 500 conversas por mês</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <span>Triagem automática e respostas baseadas em FAQ</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <span>Painel operacional básico com histórico</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <span>Suporte via WhatsApp em horário comercial</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Link
                  to="/cadastro"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm border border-slate-300 text-slate-800 hover:bg-slate-50 transition-all"
                >
                  Criar conta gratuita
                  <ArrowRight size={16} />
                </Link>
                <p className="text-center text-[11px] font-mono text-slate-400 mt-2.5">
                  Comece os testes sem custos
                </p>
              </div>
            </div>

            {/* ── ENTERPRISE (12 / 12) — HORIZONTAL CONSULTIVO ── */}
            <div className="col-span-12 bg-slate-950 text-white rounded-2xl border border-slate-800 p-7 lg:p-9 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-[10px] font-mono uppercase tracking-widest font-bold mb-3">
                    CORPORATIVO & PERSONALIZADO
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                    Enterprise
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                    Arquitetura dedicada para operações de alto volume, múltiplos departamentos, integrações personalizadas com CRM/ERP e requisitos contratuais de SLA.
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">Sob consulta</span>
                    <span className="text-xs text-slate-400 font-mono">· Projeto sob medida</span>
                  </div>
                </div>

                <div className="w-full lg:w-96 space-y-4 shrink-0">
                  <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono text-slate-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-cyan-400" />
                      <span>Números ilimitados</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-cyan-400" />
                      <span>SLA 99.9% formal</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-cyan-400" />
                      <span>API REST + Hooks</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-cyan-400" />
                      <span>Gerente CSM direto</span>
                    </div>
                  </div>

                  <a
                    href="mailto:contato@zapai.com.br"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-white hover:bg-slate-900 transition-all"
                  >
                    Falar com consultor
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          COMPARAÇÃO TÉCNICA DIRETA (Compacta & Responsiva)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-white border-b border-[#e8e5e0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono uppercase tracking-widest mb-3">
              MATRIZ DE CAPACIDADE
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Comparativo técnico direto
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Visão objetiva dos recursos suportados em cada perfil de operação.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-xs uppercase tracking-wider">
                    <th className="py-4 px-5 font-bold">Recurso</th>
                    <th className="py-4 px-4 font-bold text-center">Starter</th>
                    <th className="py-4 px-4 font-bold text-center text-cyan-400 bg-slate-800">
                      Profissional
                    </th>
                    <th className="py-4 px-4 font-bold text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="py-3.5 px-5 font-medium text-slate-800 text-xs sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 text-xs sm:text-sm">
                        {typeof row.starter === "boolean" ? (
                          <Check size={16} className="text-teal-600 mx-auto" />
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-900 text-xs sm:text-sm bg-cyan-50/30">
                        {typeof row.pro === "boolean" ? (
                          <Check size={16} className="text-cyan-600 mx-auto font-bold" />
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 text-xs sm:text-sm">
                        {typeof row.enterprise === "boolean" ? (
                          <Check size={16} className="text-teal-600 mx-auto" />
                        ) : (
                          row.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ REESTRUTURADA (2 Colunas Desktop — DESIGN.md)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-[#FAFAF8] border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Coluna Esquerda: Contexto e Suporte */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-mono uppercase tracking-widest mb-3">
              DÚVIDAS FREQUENTES
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Perguntas frequentes sobre planos e contratação
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Tudo o que você precisa saber sobre como testar, contratar e integrar a atendente oficial com a Meta Cloud API.
            </p>

            <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-900 mb-1">
                Ficou com alguma dúvida específica?
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Nosso time operacional pode ajudar a definir o melhor fluxo para o seu segmento.
              </p>
              <a
                href="mailto:contato@zapai.com.br"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                Falar com a equipe ZapAI
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Coluna Direita: Accordions Acessíveis */}
          <div className="lg:col-span-7 space-y-3.5">
            {FAQS.map(({ q, a }, i) => {
              const isOpen = openFaq === i;
              const buttonId = `faq-btn-${i}`;
              const panelId = `faq-panel-${i}`;
              return (
                <div
                  key={i}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "bg-white border-slate-300 shadow-sm"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-2xl"
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">
                      {q}
                    </span>
                    <span className="p-1 rounded-lg text-slate-500 shrink-0">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3 animate-fade-up"
                    >
                      {a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL — Console de Fechamento Integrado
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-24 px-5 bg-slate-950 text-white text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-[10px] font-mono uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            PRONTO PARA COMEÇAR
          </div>

          <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Seu WhatsApp não precisa depender de você estar online.
          </h2>

          <p className="text-slate-400 text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Configure sua atendente digital em poucos minutos e comece a atender sem deixar nenhum cliente sem resposta.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all"
            >
              Criar minha atendente gratuita
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-900 transition-all"
            >
              Ver demonstração
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 mt-8 text-[11px] font-mono text-slate-400 border border-slate-800/80 bg-slate-900/60 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SISTEMA OPERACIONAL · API OFICIAL META CLOUD ATIVA
          </div>
        </div>
      </section>
    </div>
  );
}
