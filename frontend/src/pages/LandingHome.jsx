import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle, ArrowRight, Check, ChevronRight, Clock,
  Users, BookOpen, Sliders, Send, AlertCircle, Phone,
  Calendar, Scissors, Utensils, Building2, Car,
  ShoppingBag, PawPrint, Wrench, Briefcase,
  Sparkles, Smile, Ban, Zap
} from 'lucide-react';

const SEGMENTS = {
  barbearia: { name: 'Barbearia Don', attendant: 'Bia', icon: Scissors, chat: [
    { from: 'client', text: 'Oi, quero agendar um corte pra sábado' },
    { from: 'bot', text: 'Opa! Sábado temos horário às 10h, 14h e 16h. Qual prefere?' },
    { from: 'client', text: '14h tá bom' },
    { from: 'bot', text: 'Fechado! Agendei seu corte pra sábado às 14h. Até lá! ✂️' }
  ]},
  clinica: { name: 'Clínica Sorriso', attendant: 'Ana', icon: Building2, chat: [
    { from: 'client', text: 'Vocês atendem pelo convênio Amil?' },
    { from: 'bot', text: 'Atendemos sim! Quer agendar uma consulta?' },
    { from: 'client', text: 'Quero, pode ser terça?' },
    { from: 'bot', text: 'Terça temos às 9h e às 15h. Qual fica melhor pra você?' }
  ]},
  restaurante: { name: 'Cantina Roma', attendant: 'Gabi', icon: Utensils, chat: [
    { from: 'client', text: 'Vocês fazem entrega?' },
    { from: 'bot', text: 'Fazemos sim! Entregamos num raio de 5km. Quer ver o cardápio?' },
    { from: 'client', text: 'Quero! Manda aí' },
    { from: 'bot', text: 'Aqui está nosso cardápio do dia 🍝 O prato mais pedido é a lasanha artesanal!' }
  ]},
  imobiliaria: { name: 'Lar Imóveis', attendant: 'Carol', icon: Building2, chat: [
    { from: 'client', text: 'Tem apartamento de 2 quartos na zona sul?' },
    { from: 'bot', text: 'Temos 3 opções disponíveis! Qual sua faixa de valor?' },
    { from: 'client', text: 'Até 350 mil' },
    { from: 'bot', text: 'Perfeito! Vou separar as opções e te mando. Posso agendar uma visita também?' }
  ]},
  oficina: { name: 'Auto Mecânica Silva', attendant: 'Rafa', icon: Car, chat: [
    { from: 'client', text: 'Quanto custa uma troca de óleo?' },
    { from: 'bot', text: 'O valor vai de R$ 120 a R$ 180, dependendo do óleo. Qual seu carro?' },
    { from: 'client', text: 'Civic 2020' },
    { from: 'bot', text: 'Pro Civic fica R$ 150 com óleo sintético. Quer agendar? Temos vaga amanhã às 8h 🔧' }
  ]},
  loja: { name: 'Bella Moda', attendant: 'Ju', icon: ShoppingBag, chat: [
    { from: 'client', text: 'Tem vestido pra festa?' },
    { from: 'bot', text: 'Temos vários modelos novos! Você prefere longo ou curto?' },
    { from: 'client', text: 'Longo, cor escura' },
    { from: 'bot', text: 'Separei 4 opções pra você! Quer que eu mande as fotos por aqui?' }
  ]},
  petshop: { name: 'PetFeliz', attendant: 'Luna', icon: PawPrint, chat: [
    { from: 'client', text: 'Quanto custa o banho pra cachorro médio?' },
    { from: 'bot', text: 'O banho pra porte médio é R$ 60 e banho + tosa R$ 90. Quer agendar? 🐾' },
    { from: 'client', text: 'Banho + tosa, pode ser sexta' },
    { from: 'bot', text: 'Agendado! Sexta às 10h. Qual o nome do peludinho?' }
  ]},
  servicos: { name: 'TechFix Soluções', attendant: 'Léo', icon: Briefcase, chat: [
    { from: 'client', text: 'Vocês fazem manutenção de notebook?' },
    { from: 'bot', text: 'Fazemos sim! Qual o problema do seu notebook?' },
    { from: 'client', text: 'Tá muito lento e esquenta' },
    { from: 'bot', text: 'Pode ser limpeza + troca de pasta térmica. Custa a partir de R$ 120. Posso agendar uma avaliação?' }
  ]}
};

const PERSONALITY_PRESETS = [
  {
    id: 'corporativo',
    label: 'Corporativo & Formal',
    icon: '👔',
    badge: 'B2B / Consultório',
    desc: 'Sem gírias, objetivo e educado',
    config: { tone: 'formal', style: 'direta', emoji: 'none', sales: 'informativo' },
  },
  {
    id: 'equilibrado',
    label: 'Clínica & Serviços',
    icon: '🤝',
    badge: 'Equilibrado & Ágil',
    desc: 'Cordial, atencioso e convida a agendar',
    config: { tone: 'natural', style: 'detalhada', emoji: 'moderado', sales: 'agendamento' },
  },
  {
    id: 'varejo',
    label: 'Barbearia & Varejo',
    icon: '💈',
    badge: 'Descontraído & Comercial',
    desc: 'Empolgado, com emojis e ofertas ativas',
    config: { tone: 'descontraido', style: 'detalhada', emoji: 'expressivo', sales: 'promocional' },
  },
];

const SIMULATOR_QUESTIONS = [
  {
    id: 'preco',
    label: 'Quanto custa o corte?',
    shortLabel: 'Preço do corte',
    icon: '✂️',
    clientText: 'Quanto custa o corte?',
  },
  {
    id: 'horario',
    label: 'Tem horário pra hoje?',
    shortLabel: 'Horário hoje',
    icon: '⏰',
    clientText: 'Tem horário disponível pra hoje?',
  },
  {
    id: 'pagamento',
    label: 'Quais formas de pagamento?',
    shortLabel: 'Formas de pagamento',
    icon: '💳',
    clientText: 'Quais as formas de pagamento aceitas?',
  },
];

export default function LandingHome() {
  const navigate = useNavigate();
  const [personality, setPersonality] = useState({
    tone: 'natural',
    style: 'detalhada',
    emoji: 'moderado',
    sales: 'agendamento',
  });
  const [activeQuestion, setActiveQuestion] = useState('preco');
  const [activeSegment, setActiveSegment] = useState('barbearia');
  
  useEffect(() => {
    document.title = "ZapAI — Sua atendente digital no WhatsApp";
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const getComputedResponse = () => {
    const { tone, style, emoji, sales } = personality;
    const q = activeQuestion;

    let greeting = "";
    let mainBody = "";
    let cta = "";

    if (q === 'preco') {
      if (tone === 'formal') {
        greeting = style === 'direta' ? "Olá." : "Olá, tudo bem? É um prazer atender você.";
        mainBody = style === 'direta'
          ? "O corte masculino custa R$ 45,00 e o feminino R$ 65,00."
          : "Nossos serviços de corte estão tabelados em R$ 45,00 para o modelo masculino e R$ 65,00 para o feminino, incluindo lavagem, produtos profissionais e finalização completa.";
      } else if (tone === 'natural') {
        greeting = style === 'direta' ? "Olá!" : "Oi! Tudo bem? Prazer falar com você!";
        mainBody = style === 'direta'
          ? "O corte masculino é R$ 45 e o feminino R$ 65."
          : "Aqui o corte masculino é R$ 45 e o feminino R$ 65, já com lavagem e finalização inclusas para o seu conforto.";
      } else {
        greeting = style === 'direta' ? "Opa, e aí!" : "E aí, beleza pura? Que bom te ver por aqui!";
        mainBody = style === 'direta'
          ? "O corte masculino sai por R$ 45 e o feminino R$ 65."
          : "Aqui na casa o corte masculino tá R$ 45 e o feminino R$ 65, com aquela lavagem caprichada e finalização no estilo!";
      }

      if (sales === 'informativo') {
        cta = tone === 'formal'
          ? "Permanecemos à disposição para eventuais esclarecimentos."
          : tone === 'natural'
            ? "Se precisar de mais alguma informação, estou por aqui!"
            : "Qualquer dúvida só me dar um toque!";
      } else if (sales === 'agendamento') {
        cta = tone === 'formal'
          ? "Deseja verificar as datas e horários disponíveis em nossa agenda desta semana?"
          : tone === 'natural'
            ? "Posso agendar um horário pra você? Temos vagas para hoje e amanhã."
            : "Bora agendar seu horário? Tenho umas vagas ótimas pra hoje e amanhã!";
      } else {
        cta = tone === 'formal'
          ? "Dispomos hoje de condição especial: pacote corte e barba por R$ 55,00. Deseja garantir sua reserva com desconto?"
          : tone === 'natural'
            ? "Aproveitando, hoje temos combo especial: corte + barba por apenas R$ 55! Quer que eu garanta sua vaga?"
            : "E se liga: hoje tá rolando combo corte + barba por só R$ 55! Bora aproveitar antes que acabem os horários?";
      }
    } else if (q === 'horario') {
      if (tone === 'formal') {
        greeting = style === 'direta' ? "Olá." : "Olá, tudo bem? Seja bem-vindo(a).";
        mainBody = style === 'direta'
          ? "Dispomos de horários hoje às 16h30 e às 18h00."
          : "Verificamos disponibilidade em nossa agenda de hoje nos horários das 16h30 e 18h00 com nossos profissionais especialistas.";
      } else if (tone === 'natural') {
        greeting = style === 'direta' ? "Olá!" : "Oi! Tudo bem por aí?";
        mainBody = style === 'direta'
          ? "Temos sim, vagas hoje às 16h30 e às 18h."
          : "Temos sim! Para hoje ainda sobraram duas ótimas opções: às 16h30 e às 18h.";
      } else {
        greeting = style === 'direta' ? "Opa, e aí!" : "E aí, beleza? Deu sorte no dia!";
        mainBody = style === 'direta'
          ? "Tem sim, sobrou horário às 16h30 e às 18h."
          : "Acabaram de liberar duas vagas pra hoje: uma às 16h30 e outra às 18h pra você dar aquele trato no visual.";
      }

      if (sales === 'informativo') {
        cta = tone === 'formal'
          ? "Ficamos no aguardo de sua manifestação."
          : tone === 'natural'
            ? "Se algum desses der certo pra você, só me avisar!"
            : "Se algum encaixar na sua rotina, só me dar o toque!";
      } else if (sales === 'agendamento') {
        cta = tone === 'formal'
          ? "Qual desses períodos melhor contempla sua conveniência para confirmação?"
          : tone === 'natural'
            ? "Qual dos dois horários fica melhor pra você? Já deixo marcado agora."
            : "Qual desses você quer que eu já trave agora no seu nome?";
      } else {
        cta = tone === 'formal'
          ? "Ao confirmar o atendimento das 18h00, disponibilizamos cortesia exclusiva em hidratação capilar."
          : tone === 'natural'
            ? "Dica: agendando para as 18h, preparamos uma bebida cortesia para você relaxar enquanto é atendido!"
            : "Se colar no horário das 18h, a primeira gelada artesanal ou café expresso é por nossa conta!";
      }
    } else {
      if (tone === 'formal') {
        greeting = style === 'direta' ? "Olá." : "Olá, agradecemos o contato.";
        mainBody = style === 'direta'
          ? "Aceitamos cartões de crédito, débito, transferência via PIX e dinheiro."
          : "Aceitamos as principais modalidades: cartões de crédito em até 3x, débito, transferência instantânea via PIX e dinheiro em espécie na recepção.";
      } else if (tone === 'natural') {
        greeting = style === 'direta' ? "Olá!" : "Oi! Tudo bem?";
        mainBody = style === 'direta'
          ? "Aceitamos PIX, cartões de crédito, débito e dinheiro."
          : "Aceitamos várias opções: PIX, cartão de crédito, cartão de débito e dinheiro. Super prático e sem taxas adicionais!";
      } else {
        greeting = style === 'direta' ? "E aí!" : "Opa, e aí! Super fácil por aqui:";
        mainBody = style === 'direta'
          ? "Aceitamos PIX, cartão de crédito, débito e dinheiro."
          : "Aceitamos PIX na hora, qualquer cartão de crédito ou débito e dinheiro vivo. Você escolhe o que for mais fácil!";
      }

      if (sales === 'informativo') {
        cta = tone === 'formal'
          ? "Permanecemos à disposição."
          : tone === 'natural'
            ? "Qualquer dúvida estou por aqui!"
            : "Facilidade total! Qualquer coisa só chamar.";
      } else if (sales === 'agendamento') {
        cta = tone === 'formal'
          ? "Podemos prosseguir com o agendamento do seu serviço?"
          : tone === 'natural'
            ? "Quer aproveitar e já deixar seu horário reservado?"
            : "Bora já garantir sua cadeira? Qual dia fica melhor pra você?";
      } else {
        cta = tone === 'formal'
          ? "Informamos que pagamentos via PIX possuem 5% de desconto promocional em serviços combinados."
          : tone === 'natural'
            ? "Aliás, pagando via PIX você ainda ganha 5% de desconto imediato no combo com barba!"
            : "E pagando no PIX ainda rola aquele desconto camarada de 5% no combo, fechou?";
      }
    }

    let fullMessage = `${greeting} ${mainBody} ${cta}`.trim();

    // Modulação de Emojis
    if (emoji === 'none') {
      fullMessage = fullMessage.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
    } else if (emoji === 'moderado') {
      const em = tone === 'formal' ? ' 😊' : tone === 'natural' ? ' 😊 ✂️' : ' ✌️ 😄';
      fullMessage = `${fullMessage}${em}`;
    } else {
      const emPrefix = tone === 'formal' ? '✨ ' : tone === 'natural' ? '✨ ✂️ ' : '🔥 💈 ';
      const emSuffix = sales === 'promocional' ? ' 🔥🚀' : ' ✂️👊';
      fullMessage = `${emPrefix}${fullMessage}${emSuffix}`;
    }

    return fullMessage;
  };

  const activeSegmentData = SEGMENTS[activeSegment];

  return (
    <div className="landing">
      {/* SECTION 1: HERO */}
      <section id="hero" className="relative pt-28 lg:pt-40 pb-20 lg:pb-28 bg-[#FAFAF8]">
        <div 
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-6xl mx-auto px-5 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-[1.08] tracking-tight">
              Seu WhatsApp atendido.<br/>Mesmo quando você não está.
            </h1>
            <p className="text-lg lg:text-xl text-[#555] max-w-xl leading-relaxed mt-6">
              Ensine como sua empresa funciona, escolha como ela deve falar e deixe a Zap atender seus clientes, organizar oportunidades e te chamar quando precisar.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                to="/cadastro" 
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-full font-medium hover:bg-teal-700 transition-colors"
              >
                Criar minha atendente <ArrowRight size={20} />
              </Link>
              <a 
                href="#como-funciona" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  navigate("/#como-funciona", { replace: true });
                }}
                className="inline-flex items-center gap-2 bg-white border border-[#e8e5e0] text-[#1a1a1a] px-6 py-3 rounded-full font-medium hover:bg-[#f8f7f5] transition-colors"
              >
                Ver como funciona
              </a>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e8e5e0] overflow-hidden w-full">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg">
                  B
                </div>
                <div>
                  <div className="font-semibold text-sm">Bia · Barbearia Don</div>
                  <div className="text-xs opacity-80">Atendente</div>
                </div>
              </div>
              <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[220px] flex flex-col">
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-start">
                  Oi, vocês abrem sábado?
                </div>
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-end">
                  Abrimos sim, das 9h às 18h! Quer que eu veja um horário pra você? ✂️
                </div>
              </div>
              <div className="text-xs text-[#888] px-4 py-3 bg-[#f8f7f5] border-t border-[#e8e5e0]">
                Bia aprendeu essa informação com os dados cadastrados pela empresa.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM/BENEFIT STRIP */}
      <section className="py-16 lg:py-20 bg-white border-y border-[#e8e5e0]">
        <div 
          className="max-w-5xl mx-auto px-5 text-center opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <h2 className="text-2xl lg:text-4xl font-bold text-[#1a1a1a] max-w-3xl mx-auto">
            Você não precisa parar tudo para responder 'quanto custa?'
          </h2>
          <p className="text-lg text-[#666] mt-4 max-w-2xl mx-auto">
            Enquanto você atende, corta, cozinha, conserta ou vende, a Zap cuida do WhatsApp. Sem perder cliente, sem deixar ninguém esperando.
          </p>
        </div>
      </section>

      {/* SECTION 3: MEET YOUR ATTENDANT */}
      <section id="recursos" className="py-20 lg:py-28 bg-[#FAFAF8] scroll-mt-24">
        <div 
          className="max-w-6xl mx-auto px-5 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="flex-1">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a]">
              Conheça sua atendente
            </h2>
            <p className="text-lg text-[#555] mt-4 max-w-lg leading-relaxed">
              A Zap conversa com seus clientes como alguém da sua equipe faria. Responde dúvidas, coleta informações, identifica oportunidades e sabe quando chamar você.
            </p>
          </div>
          
          <div className="flex-1 w-full">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e8e5e0] overflow-hidden max-w-md mx-auto w-full">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg">
                  B
                </div>
                <div>
                  <div className="font-semibold text-sm">Bia · Clínica Sorriso</div>
                  <div className="text-xs opacity-80">Atendente</div>
                </div>
              </div>
              <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[300px] flex flex-col">
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-start">
                  Boa tarde! Vocês atendem pelo plano Amil?
                </div>
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-end">
                  Boa tarde! Atendemos sim 😊 Você gostaria de agendar uma consulta?
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-start">
                  Quero sim, pode ser quinta-feira?
                </div>
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-end">
                  Quinta temos horário às 14h e às 16h30. Qual fica melhor pra você?
                </div>
                <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-start">
                  14h tá ótimo
                </div>
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-end">
                  Perfeito! Agendado para quinta às 14h. Vou te mandar uma confirmação amanhã, tá? 📋
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: PERSONALITY CUSTOMIZATION */}
      <section className="py-20 lg:py-28 bg-white border-y border-[#e8e5e0]">
        <div 
          className="max-w-6xl mx-auto px-5 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a]">
              Faça ela falar como sua empresa.
            </h2>
            <p className="text-lg text-[#666] mt-4 max-w-2xl mx-auto">
              Cada negócio tem um jeito. Escolha o tom ideal ou personalize em 1 clique.
            </p>
          </div>

          {/* Quick Presets Bar */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles size={16} className="text-teal-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#666]">
                Perfis Prontos Recomendados
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PERSONALITY_PRESETS.map((p) => {
                const isActive =
                  personality.tone === p.config.tone &&
                  personality.style === p.config.style &&
                  personality.emoji === p.config.emoji &&
                  personality.sales === p.config.sales;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPersonality(p.config)}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                      isActive
                        ? 'bg-teal-50 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-[#fcfbf9] border-[#e8e5e0] hover:border-teal-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{p.icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-teal-600 text-white' : 'bg-[#ece9e4] text-[#666]'
                      }`}>
                        {p.badge}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isActive ? 'text-teal-900' : 'text-[#1a1a1a]'}`}>
                      {p.label}
                    </span>
                    <span className="text-[11px] text-[#777] leading-tight">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex flex-col lg:flex-row items-stretch gap-10 lg:gap-14">
            {/* Controls Panel */}
            <div className="flex-1 w-full bg-[#f8f7f5] rounded-2xl p-6 lg:p-7 border border-[#e8e5e0] flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#777]">
                    Ajuste Fino da Atendente
                  </span>
                  <span className="text-[11px] text-teal-700 bg-teal-100/60 px-2.5 py-0.5 rounded-full font-medium">
                    Clique para mudar
                  </span>
                </div>

                {/* 1. Tom de Voz */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#444] flex items-center justify-between">
                    <span>Tom de Voz</span>
                    <span className="text-[11px] text-teal-700 font-bold">
                      {personality.tone === 'formal' ? '👔 Formal' : personality.tone === 'natural' ? '🤝 Natural' : '😄 Descontraído'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'formal', label: 'Formal', icon: '👔' },
                      { key: 'natural', label: 'Natural', icon: '🤝' },
                      { key: 'descontraido', label: 'Descontraído', icon: '😄' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setPersonality(prev => ({ ...prev, tone: opt.key }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          personality.tone === opt.key
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-[#555] border-[#dedad5] hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Estilo de Resposta */}
                <div className="space-y-2 mt-5">
                  <div className="text-xs font-semibold text-[#444] flex items-center justify-between">
                    <span>Tamanho da Resposta</span>
                    <span className="text-[11px] text-teal-700 font-bold">
                      {personality.style === 'direta' ? '⚡ Curta & Direta' : '💬 Detalhada & Amigável'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'direta', label: 'Curta & Direta', icon: '⚡' },
                      { key: 'detalhada', label: 'Detalhada & Acolhedora', icon: '💬' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setPersonality(prev => ({ ...prev, style: opt.key }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          personality.style === opt.key
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-[#555] border-[#dedad5] hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Emojis */}
                <div className="space-y-2 mt-5">
                  <div className="text-xs font-semibold text-[#444] flex items-center justify-between">
                    <span>Uso de Emojis</span>
                    <span className="text-[11px] text-teal-700 font-bold">
                      {personality.emoji === 'none' ? '🚫 Sem Emojis' : personality.emoji === 'moderado' ? '😊 Moderados' : '✨ Expressivos'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'none', label: 'Sem emojis', icon: '🚫' },
                      { key: 'moderado', label: 'Moderados', icon: '😊' },
                      { key: 'expressivo', label: 'Expressivos', icon: '✨' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setPersonality(prev => ({ ...prev, emoji: opt.key }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          personality.emoji === opt.key
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-[#555] border-[#dedad5] hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Postura Comercial */}
                <div className="space-y-2 mt-5">
                  <div className="text-xs font-semibold text-[#444] flex items-center justify-between">
                    <span>Postura Comercial</span>
                    <span className="text-[11px] text-teal-700 font-bold">
                      {personality.sales === 'informativo' ? 'ℹ️ Apenas Informar' : personality.sales === 'agendamento' ? '📅 Convidar p/ Agendar' : '🚀 Super Oferta'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'informativo', label: 'Informativa', icon: 'ℹ️' },
                      { key: 'agendamento', label: 'Agendamento', icon: '📅' },
                      { key: 'promocional', label: 'Super Oferta', icon: '🚀' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setPersonality(prev => ({ ...prev, sales: opt.key }))}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          personality.sales === opt.key
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-[#555] border-[#dedad5] hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#e8e5e0] flex items-center justify-between text-xs text-[#777]">
                <span>Cada clique altera a resposta ao lado</span>
                <span className="font-semibold text-teal-700">100% interativo</span>
              </div>
            </div>

            {/* WhatsApp Simulator Panel */}
            <div className="flex-1 w-full flex flex-col justify-center">
              {/* Question Switcher */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-[#666] mb-2 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-teal-600" />
                  Simule uma dúvida do cliente:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SIMULATOR_QUESTIONS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestion(q.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all flex items-center gap-1.5 ${
                        activeQuestion === q.id
                          ? 'bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-sm'
                          : 'bg-white text-[#555] border-[#dedad5] hover:bg-[#f8f7f5]'
                      }`}
                    >
                      <span>{q.icon}</span>
                      <span>{q.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-[#e8e5e0] overflow-hidden w-full max-w-md mx-auto">
                {/* WhatsApp header */}
                <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 border border-emerald-400/40 flex items-center justify-center font-bold text-sm text-white shadow-inner">
                      B
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none text-white">Bia • Atendente ZapAI</p>
                      <p className="text-[11px] text-teal-200 mt-1">● Online agora</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-400/25 text-emerald-100 border border-emerald-300/30 px-2 py-0.5 rounded-full">
                    Tempo Real
                  </span>
                </div>

                {/* WhatsApp Chat Body */}
                <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[260px] flex flex-col justify-center">
                  {/* Client message */}
                  <div className="bg-white rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] self-start flex flex-col">
                    <span>
                      {SIMULATOR_QUESTIONS.find(q => q.id === activeQuestion)?.clientText || "Quanto custa o corte?"}
                    </span>
                    <span className="text-[10px] text-gray-400 self-end mt-1">14:31</span>
                  </div>

                  {/* Bot response message */}
                  <div 
                    key={`${activeQuestion}-${personality.tone}-${personality.style}-${personality.emoji}-${personality.sales}`}
                    className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[92%] self-end leading-relaxed transition-all animate-fade-in flex flex-col"
                  >
                    <span>{getComputedResponse()}</span>
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-black/5">
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-600/10 px-1.5 py-0.5 rounded">
                          {personality.tone}
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-600/10 px-1.5 py-0.5 rounded">
                          {personality.style}
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-600/10 px-1.5 py-0.5 rounded">
                          {personality.sales}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-900/60 font-medium whitespace-nowrap">
                        14:32 ✓✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: LEARNING */}
      <section className="py-20 lg:py-28 bg-[#FAFAF8]">
        <div 
          className="max-w-6xl mx-auto px-5 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="flex-1">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] leading-tight">
              Ela não vem engessada.<br/>Ela aprende com você.
            </h2>
            <p className="text-lg text-[#555] mt-4 max-w-xl">
              Ensine como se estivesse treinando um funcionário novo. A Zap guarda e usa nos próximos atendimentos.
            </p>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-[#e8e5e0] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="bg-[#1a1a1a] text-white rounded-xl px-4 py-3 text-sm self-end max-w-[85%]">
                  Bia, quando perguntarem se tem estacionamento, fala que temos convênio com o estacionamento da frente.
                </div>
                <div className="bg-[#f8f7f5] border border-[#e8e5e0] text-[#1a1a1a] rounded-xl px-4 py-3 text-sm self-start max-w-[85%] whitespace-pre-line">
                  Aprendi ✓{'\n'}Vou usar essa informação nos próximos atendimentos.
                </div>
              </div>
              <div className="bg-white border border-[#e8e5e0] rounded-xl px-5 py-3 inline-flex items-center gap-2 shadow-sm self-start">
                <BookOpen size={18} className="text-teal-600" />
                <span className="text-sm font-medium text-[#1a1a1a]">34 coisas aprendidas sobre seu negócio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: HOW IT WORKS */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-white border-y border-[#e8e5e0] scroll-mt-24">
        <div 
          className="max-w-5xl mx-auto px-5 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a]">
              Como funciona
            </h2>
            <p className="text-lg text-[#666] mt-4">
              Quatro passos. Sem complicação.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">1</div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mt-4">Ensine</h3>
              <p className="text-[#666] mt-2 text-sm leading-relaxed">
                Mostre seu site, catálogo, cardápio ou documentos. A Zap absorve tudo.
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">2</div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mt-4">Dê personalidade</h3>
              <p className="text-[#666] mt-2 text-sm leading-relaxed">
                Escolha como ela fala e até onde pode ir sozinha.
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">3</div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mt-4">Ela trabalha</h3>
              <p className="text-[#666] mt-2 text-sm leading-relaxed">
                A Zap atende, aprende sobre seus clientes e chama você quando precisa.
              </p>
            </div>
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">4</div>
              <h3 className="text-xl font-bold text-[#1a1a1a] mt-4">Você acompanha</h3>
              <p className="text-[#666] mt-2 text-sm leading-relaxed">
                Veja o que ela resolveu, o que aprendeu e onde existem oportunidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: RESULTS */}
      <section className="py-20 lg:py-28 bg-[#FAFAF8]">
        <div 
          className="max-w-5xl mx-auto px-5 text-center opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] leading-tight">
            Você estava trabalhando.<br/>A Zap também.
          </h2>
          <p className="text-lg text-[#666] mt-4 max-w-2xl mx-auto">
            Enquanto você foca no que importa, a Zap segura a barra no WhatsApp.
          </p>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-[#e8e5e0] p-6 text-center shadow-sm">
              <div className="text-3xl lg:text-4xl font-bold text-teal-600">18</div>
              <div className="text-sm text-[#666] mt-1">clientes atendidos</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5e0] p-6 text-center shadow-sm">
              <div className="text-3xl lg:text-4xl font-bold text-teal-600">4</div>
              <div className="text-sm text-[#666] mt-1">oportunidades encontradas</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5e0] p-6 text-center shadow-sm">
              <div className="text-3xl lg:text-4xl font-bold text-teal-600">2</div>
              <div className="text-sm text-[#666] mt-1">conversas precisam de você</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5e0] p-6 text-center shadow-sm">
              <div className="text-3xl lg:text-4xl font-bold text-teal-600">3</div>
              <div className="text-sm text-[#666] mt-1">clientes para retomar amanhã</div>
            </div>
          </div>
          <p className="text-xs text-[#999] mt-6 italic">
            Dados ilustrativos de uma sessão de demonstração.
          </p>
        </div>
      </section>

      {/* SECTION 8: ANY BUSINESS */}
      <section id="segmentos" className="py-20 lg:py-28 bg-white border-y border-[#e8e5e0] scroll-mt-24">
        <div 
          className="max-w-6xl mx-auto px-5 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a]">
              Do seu jeito, seja qual for seu negócio.
            </h2>
            <p className="text-lg text-[#666] mt-4 max-w-2xl mx-auto">
              A mesma Zap se adapta ao contexto de cada empresa.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {Object.keys(SEGMENTS).map(key => {
              const Icon = SEGMENTS[key].icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSegment(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all flex items-center gap-2 ${
                    activeSegment === key 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-[#f0eeeb] text-[#555] hover:bg-[#e8e5e0]'
                  }`}
                >
                  <Icon size={16} />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              )
            })}
          </div>

          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-lg border border-[#e8e5e0] overflow-hidden max-w-md mx-auto w-full transition-all duration-300">
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg">
                  {activeSegmentData.attendant.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{activeSegmentData.attendant} · {activeSegmentData.name}</div>
                  <div className="text-xs opacity-80">Atendente</div>
                </div>
              </div>
              <div className="bg-[#ECE5DD] p-4 space-y-3 min-h-[250px] flex flex-col">
                {activeSegmentData.chat.map((msg, idx) => (
                  <div 
                    key={`${activeSegment}-${idx}`}
                    className={`rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] shadow-sm max-w-[85%] animate-[fadeIn_0.3s_ease-in-out] ${
                      msg.from === 'client'
                        ? 'bg-white rounded-tl-sm self-start'
                        : 'bg-[#DCF8C6] rounded-tr-sm self-end'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: HUMAN WHEN NEEDED */}
      <section className="py-20 lg:py-28 bg-[#FAFAF8]">
        <div 
          className="max-w-6xl mx-auto px-5 opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <div className="text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] leading-tight">
              Humana quando precisa. Ela sabe a hora de te chamar.
            </h2>
            <p className="text-lg text-[#666] mt-4 max-w-2xl mx-auto">
              A Zap não tenta resolver aquilo que não deveria. Quando a conversa precisa de alguém da equipe, ela entrega o contexto completo.
            </p>
          </div>

          <div className="mt-12 flex flex-col lg:flex-row gap-8">
            <div className="bg-white rounded-2xl border border-[#e8e5e0] p-6 flex-1 shadow-sm">
              <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">
                O que a Zap identifica
              </div>
              <div className="bg-white border border-[#e8e5e0] rounded-xl px-4 py-3 text-sm text-[#1a1a1a] shadow-sm w-full mb-6 relative">
                <div className="absolute -top-3 -left-2 w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs font-bold border-2 border-white">B</div>
                Acho que o Lucas precisa entrar nessa conversa. O cliente quer fechar o plano anual, mas pediu uma condição especial.
              </div>
              <div className="flex items-center gap-2 text-sm text-[#666]">
                <AlertCircle size={16} className="text-amber-500" />
                <span>A Zap pausou o atendimento e avisou o Lucas</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5e0] p-6 flex-1 shadow-sm">
              <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">
                O que o Lucas recebe
              </div>
              <div className="bg-[#f8f7f5] rounded-xl p-4 border border-[#e8e5e0] flex flex-col gap-2">
                <div className="font-semibold text-[#1a1a1a] flex items-center gap-2">
                  📱 Nova conversa pra você
                </div>
                <div className="text-sm text-[#444]">
                  <span className="font-medium text-[#1a1a1a]">Cliente:</span> Roberto Mendes
                </div>
                <div className="text-sm text-[#444]">
                  <span className="font-medium text-[#1a1a1a]">Contexto:</span> Quer fechar plano anual, pediu condição especial. Já recebeu tabela de preços.
                </div>
                <div className="text-sm text-[#444]">
                  <span className="font-medium text-[#1a1a1a]">Histórico:</span> 12 mensagens
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FINAL CTA */}
      <section className="py-20 lg:py-28 bg-white">
        <div 
          className="max-w-3xl mx-auto px-5 text-center opacity-0 translate-y-6 transition-all duration-700"
          data-animate
        >
          <h2 className="text-3xl lg:text-5xl font-bold text-[#1a1a1a] leading-tight">
            Seu WhatsApp não precisa depender de você estar online.
          </h2>
          <p className="text-lg text-[#666] mt-4">
            Crie sua atendente em minutos. Sem precisar entender de tecnologia.
          </p>
          <div className="mt-8 flex flex-col items-center">
            <Link 
              to="/cadastro" 
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-4 rounded-full font-medium hover:bg-teal-700 transition-colors text-lg"
            >
              Criar minha atendente <ArrowRight size={20} />
            </Link>
            <p className="text-sm text-[#999] mt-4">
              Sem cartão de crédito. Comece em 5 minutos.
            </p>
          </div>
        </div>
      </section>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
