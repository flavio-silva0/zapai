import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Plus,
  Minus,
  ArrowRight,
  Shield,
  Zap,
  ExternalLink,
  Cpu,
  CheckCircle2,
} from "lucide-react";
import PublicEyebrow from "../components/PublicEyebrow";

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
    <div className="font-body selection:bg-teal-100 selection:text-teal-900 bg-[#FAFAF8] text-[#1a1a1a]">
      {/* ══════════════════════════════════════════════════════
          HERO — Alinhado com a Landing Page (Clara, Humana, Editorial)
      ══════════════════════════════════════════════════════ */}
      <section className="relative pt-28 lg:pt-40 pb-20 lg:pb-28 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-5 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Lado Esquerdo: Mensagem e Posicionamento */}
          <div className="flex-1 text-left">
            <PublicEyebrow className="mb-6">
              Planos & Escala
            </PublicEyebrow>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-[1.08] tracking-tight">
              Infraestrutura desenhada para crescer com sua empresa.
            </h1>

            <p className="text-lg lg:text-xl text-[#555] mt-6 max-w-xl leading-relaxed">
              Da primeira triagem com inteligência artificial à operação multi-canal com CRM integrado. Sem taxas ocultas por mensagem.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/cadastro"
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-full font-medium hover:bg-teal-700 transition-colors"
              >
                Criar conta gratuita <ArrowRight size={20} />
              </Link>
              <a
                href="#estrutura-planos"
                className="inline-flex items-center gap-2 bg-white border border-[#e8e5e0] text-[#1a1a1a] px-6 py-3 rounded-full font-medium hover:bg-[#f8f7f5] transition-colors"
              >
                Ver comparativo
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-[#666]">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-teal-600" />
                <span>API Oficial Meta</span>
              </div>
              <span className="text-[#ccc]">·</span>
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-teal-600" />
                <span>Multi-Tenant Isolado</span>
              </div>
              <span className="text-[#ccc]">·</span>
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-teal-600" />
                <span>Handoff Humano Imediato</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Representação do Sistema Integrado (Card de Operação) */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e8e5e0] overflow-hidden w-full">
              <div className="bg-[#1a1a1a] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold tracking-wider uppercase">
                    Console da Operação
                  </span>
                </div>
                <span className="text-[11px] font-medium text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/80">
                  Ativo
                </span>
              </div>

              <div className="p-5 space-y-3.5 text-xs text-[#1a1a1a]">
                <div className="flex justify-between items-center py-1.5 border-b border-[#e8e5e0]">
                  <span className="text-[#666] uppercase text-[10px] font-semibold">Canal Primário</span>
                  <span className="font-semibold text-[#1a1a1a]">WhatsApp Cloud API</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#e8e5e0]">
                  <span className="text-[#666] uppercase text-[10px] font-semibold">Motor de IA</span>
                  <span className="font-semibold text-[#1a1a1a]">ZapAI Context + RAG</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#e8e5e0]">
                  <span className="text-[#666] uppercase text-[10px] font-semibold">Controle de Fila</span>
                  <span className="font-semibold text-[#1a1a1a]">Kanban CRM ao Vivo</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#666] uppercase text-[10px] font-semibold">Isolamento</span>
                  <span className="text-teal-700 font-semibold">100% Criptografado</span>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[#f8f7f5] border-t border-[#e8e5e0]">
                <div className="flex justify-between text-[11px] text-[#666] mb-1.5 font-medium">
                  <span>Capacidade Operacional</span>
                  <span className="text-teal-700 font-semibold">Elástica</span>
                </div>
                <div className="w-full bg-[#e8e5e0] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full w-[78%] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ESTRUTURA DE PLANOS (Bento Grid Assimétrico — 7 / 5 / 12)
      ══════════════════════════════════════════════════════ */}
      <section id="estrutura-planos" className="py-20 lg:py-28 px-5 bg-white border-y border-[#e8e5e0] scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <PublicEyebrow className="mb-3">
              Estrutura de Planos
            </PublicEyebrow>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] tracking-tight">
              Previsibilidade para sua operação
            </h2>
            <p className="text-lg text-[#666] mt-4">
              Crie sua conta gratuitamente para testar toda a plataforma. Os valores comerciais definitivos serão anunciados em breve.
            </p>
          </div>

          {/* Grid Bento de 12 Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ── PROFISSIONAL (7 / 12) — PLANO CENTRAL DA OPERAÇÃO ── */}
            <div className="col-span-12 lg:col-span-7 bg-white text-[#1a1a1a] rounded-2xl border-2 border-teal-600 p-7 lg:p-9 shadow-lg relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                    Plano Central da Operação
                  </div>
                  <span className="text-xs font-medium text-[#666] uppercase">
                    Mais recomendado
                  </span>
                </div>

                <h3 className="text-2xl lg:text-3xl font-bold text-[#1a1a1a] tracking-tight">
                  Profissional
                </h3>
                <p className="text-sm text-[#555] mt-2 leading-relaxed max-w-xl">
                  Para empresas com fluxo constante de clientes que precisam de inteligência contextual, múltiplos números de atendimento e CRM operacional.
                </p>

                {/* Preço Comercial Oficial */}
                <div className="my-6 pt-5 border-t border-[#e8e5e0] flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a]">
                    Em breve
                  </span>
                  <span className="text-xs text-teal-700 font-semibold uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    Teste gratuito liberado
                  </span>
                </div>
                <p className="text-xs text-[#888] -mt-3 mb-6">
                  Valores comerciais em definição. Cadastre-se sem compromisso e explore todos os recursos.
                </p>

                {/* Sub-módulos Bento Internos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
                  <div className="bg-[#f8f7f5] border border-[#e8e5e0] rounded-xl p-3.5">
                    <div className="text-[10px] uppercase text-teal-700 font-bold mb-1">
                      Capacidade
                    </div>
                    <div className="text-xs text-[#1a1a1a] font-semibold">
                      Até 3 números
                    </div>
                    <div className="text-[11px] text-[#666] mt-1">
                      Conversas ilimitadas
                    </div>
                  </div>

                  <div className="bg-[#f8f7f5] border border-[#e8e5e0] rounded-xl p-3.5">
                    <div className="text-[10px] uppercase text-teal-700 font-bold mb-1">
                      Inteligência
                    </div>
                    <div className="text-xs text-[#1a1a1a] font-semibold">
                      RAG Vetorial
                    </div>
                    <div className="text-[11px] text-[#666] mt-1">
                      Memória contínua
                    </div>
                  </div>

                  <div className="bg-[#f8f7f5] border border-[#e8e5e0] rounded-xl p-3.5">
                    <div className="text-[10px] uppercase text-teal-700 font-bold mb-1">
                      Controle
                    </div>
                    <div className="text-xs text-[#1a1a1a] font-semibold">
                      Kanban + CRM
                    </div>
                    <div className="text-[11px] text-[#666] mt-1">
                      Handoff humano fluido
                    </div>
                  </div>
                </div>

                {/* Destaques do Plano */}
                <div className="space-y-2.5 text-xs text-[#555]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    <span>Treinamento da atendente com documentos e perguntas frequentes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    <span>Relatórios de tempo de resposta e taxa de resolução</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                    <span>Suporte prioritário via canal direto</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e8e5e0]">
                <Link
                  to="/cadastro"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all"
                >
                  Criar conta gratuita e testar
                  <ArrowRight size={17} />
                </Link>
                <p className="text-center text-xs text-[#888] mt-2.5">
                  Sem cartão de crédito · Ativação imediata
                </p>
              </div>
            </div>

            {/* ── STARTER (5 / 12) — ENTRADA LEVE ── */}
            <div className="col-span-12 lg:col-span-5 bg-white text-[#1a1a1a] rounded-2xl border border-[#e8e5e0] p-7 lg:p-9 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0eeeb] border border-[#e8e5e0] text-[#555] text-xs font-semibold uppercase tracking-wider mb-4">
                  Entrada
                </div>

                <h3 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">
                  Starter
                </h3>
                <p className="text-sm text-[#555] mt-2 leading-relaxed">
                  Para autônomos e pequenos negócios que estão organizando o primeiro canal de atendimento digital.
                </p>

                <div className="my-6 pt-5 border-t border-[#e8e5e0] flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-extrabold text-[#1a1a1a]">
                    Em breve
                  </span>
                  <span className="text-xs text-[#666] uppercase tracking-wider bg-[#f0eeeb] px-2 py-0.5 rounded-full font-medium">
                    Lançamento
                  </span>
                </div>
                <p className="text-xs text-[#888] -mt-3 mb-6">
                  Formato acessível para negócios em estágio inicial.
                </p>

                {/* Lista de Recursos Starter */}
                <div className="space-y-3 text-xs text-[#555]">
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

              <div className="mt-8 pt-6 border-t border-[#e8e5e0]">
                <Link
                  to="/cadastro"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm bg-white border border-[#e8e5e0] text-[#1a1a1a] hover:bg-[#f8f7f5] transition-all"
                >
                  Criar conta gratuita
                  <ArrowRight size={16} />
                </Link>
                <p className="text-center text-xs text-[#888] mt-2.5">
                  Comece os testes sem custos
                </p>
              </div>
            </div>

            {/* ── ENTERPRISE (12 / 12) — HORIZONTAL CONSULTIVO ── */}
            <div className="col-span-12 bg-[#1a1a1a] text-white rounded-2xl border border-[#333] p-7 lg:p-9 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a2a2a] border border-[#444] text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Corporativo & Personalizado
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    Enterprise
                  </h3>
                  <p className="text-sm text-[#aaa] mt-2 max-w-2xl leading-relaxed">
                    Arquitetura dedicada para operações de alto volume, múltiplos departamentos, integrações personalizadas com CRM/ERP e requisitos contratuais de SLA.
                  </p>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">Sob consulta</span>
                    <span className="text-xs text-[#888]">· Projeto sob medida</span>
                  </div>
                </div>

                <div className="w-full lg:w-96 space-y-4 shrink-0">
                  <div className="grid grid-cols-2 gap-2.5 text-xs text-[#ddd]">
                    <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-teal-400" />
                      <span>Números ilimitados</span>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-teal-400" />
                      <span>SLA 99.9% formal</span>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-teal-400" />
                      <span>API REST + Hooks</span>
                    </div>
                    <div className="bg-[#2a2a2a] border border-[#444] rounded-lg p-2.5 flex items-center gap-2">
                      <Check size={14} className="text-teal-400" />
                      <span>Gerente CSM direto</span>
                    </div>
                  </div>

                  <a
                    href="mailto:contato@zapai.com.br"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm border border-[#555] text-white hover:bg-[#2a2a2a] transition-all"
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
      <section className="py-20 lg:py-28 px-5 bg-[#FAFAF8] border-b border-[#e8e5e0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <PublicEyebrow className="mb-3">
              Matriz de Capacidade
            </PublicEyebrow>
            <h2 className="text-2xl lg:text-4xl font-bold text-[#1a1a1a] tracking-tight">
              Comparativo técnico direto
            </h2>
            <p className="text-base text-[#666] mt-2">
              Visão objetiva dos recursos suportados em cada perfil de operação.
            </p>
          </div>

          <div className="border border-[#e8e5e0] rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-5">Recurso</th>
                    <th className="py-4 px-4 text-center">Starter</th>
                    <th className="py-4 px-4 text-center text-teal-300 bg-[#252525]">
                      Profissional
                    </th>
                    <th className="py-4 px-4 text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e5e0]">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-[#f8f7f5]"}
                    >
                      <td className="py-3.5 px-5 font-medium text-[#1a1a1a] text-xs sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#555] text-xs sm:text-sm">
                        {typeof row.starter === "boolean" ? (
                          <Check size={16} className="text-teal-600 mx-auto" />
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-[#1a1a1a] text-xs sm:text-sm bg-teal-50/40">
                        {typeof row.pro === "boolean" ? (
                          <Check size={16} className="text-teal-700 mx-auto font-bold" />
                        ) : (
                          row.pro
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-[#555] text-xs sm:text-sm">
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
          FAQ (2 Colunas Desktop — Contexto + Accordions)
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-5 bg-white border-b border-[#e8e5e0]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Coluna Esquerda: Contexto e Suporte */}
          <div className="lg:col-span-5 text-left">
            <PublicEyebrow className="mb-3">
              Dúvidas Frequentes
            </PublicEyebrow>
            <h2 className="text-2xl lg:text-4xl font-bold text-[#1a1a1a] tracking-tight">
              Perguntas frequentes sobre planos e contratação
            </h2>
            <p className="text-base text-[#666] mt-3 leading-relaxed">
              Tudo o que você precisa saber sobre como testar, contratar e integrar a atendente oficial com a Meta Cloud API.
            </p>

            <div className="mt-8 bg-[#f8f7f5] border border-[#e8e5e0] rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-[#1a1a1a] mb-1">
                Ficou com alguma dúvida específica?
              </div>
              <p className="text-xs text-[#666] mb-4 leading-relaxed">
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
                      ? "bg-white border-teal-600/50 shadow-sm"
                      : "bg-white border-[#e8e5e0] hover:border-[#ccc]"
                  }`}
                >
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-2xl"
                  >
                    <span className="font-bold text-[#1a1a1a] text-sm sm:text-base pr-4">
                      {q}
                    </span>
                    <span className="p-1 rounded-lg text-[#666] shrink-0">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-5 pb-5 text-[#555] text-sm leading-relaxed border-t border-[#e8e5e0] pt-3 animate-fade-up"
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
          CTA FINAL — Alinhado com a Landing Page
      ══════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-5 bg-[#FAFAF8] text-[#1a1a1a] text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto">
          <PublicEyebrow className="mb-6">
            Pronto para começar
          </PublicEyebrow>

          <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] tracking-tight leading-tight">
            Seu WhatsApp não precisa depender de você estar online.
          </h2>

          <p className="text-[#666] text-base sm:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Configure sua atendente digital em poucos minutos e comece a atender sem deixar nenhum cliente sem resposta.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium text-base bg-teal-600 text-white hover:bg-teal-700 shadow-md transition-all"
            >
              Criar minha atendente gratuita
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/#recursos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium text-base border border-[#e8e5e0] text-[#1a1a1a] bg-white hover:bg-[#f8f7f5] transition-all"
            >
              Ver demonstração
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 mt-8 text-xs text-[#666] border border-[#e8e5e0] bg-white px-4 py-2 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SISTEMA OPERACIONAL · API OFICIAL META CLOUD ATIVA
          </div>
        </div>
      </section>
    </div>
  );
}
