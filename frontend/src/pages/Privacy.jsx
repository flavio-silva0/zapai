import { Shield } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      title: "1. Informações que Coletamos",
      content: `Ao utilizar a plataforma ZapAI, podemos coletar as seguintes informações:
• Dados de identificação pessoal: nome, e-mail, número de telefone.
• Dados de uso do serviço: mensagens trocadas com o assistente virtual, histórico de interações e preferências de atendimento.
• Dados técnicos: endereço IP, tipo de navegador, sistema operacional e dados de acesso.
• Dados fornecidos por integrações: informações recebidas através da API do WhatsApp Business (Meta), incluindo nome do perfil e número de telefone dos contatos.`
    },
    {
      title: "2. Como Utilizamos suas Informações",
      content: `As informações coletadas são utilizadas para:
• Fornecer, operar e manter os serviços da plataforma ZapAI.
• Processar e responder mensagens recebidas via WhatsApp utilizando inteligência artificial.
• Melhorar a qualidade do atendimento automatizado e personalizar a experiência do usuário.
• Enviar comunicações relacionadas ao serviço, como atualizações, alertas de segurança e suporte técnico.
• Cumprir obrigações legais e regulatórias aplicáveis.`
    },
    {
      title: "3. Compartilhamento de Dados",
      content: `Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas nas seguintes circunstâncias:
• Com a Meta Platforms, Inc. (Facebook/WhatsApp) para viabilizar o envio e recebimento de mensagens através da API oficial do WhatsApp Business.
• Com provedores de serviços essenciais (hospedagem, banco de dados) que atuam sob nossos acordos de confidencialidade.
• Quando exigido por lei, ordem judicial ou autoridade regulatória competente.`
    },
    {
      title: "4. Armazenamento e Segurança",
      content: `Adotamos medidas técnicas e organizacionais apropriadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
• Criptografia de dados em trânsito (HTTPS/TLS).
• Autenticação segura com tokens JWT.
• Armazenamento em servidores protegidos com acesso restrito.
• Revisão periódica de práticas de segurança.`
    },
    {
      title: "5. Retenção de Dados",
      content: `Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, salvo quando um período de retenção mais longo seja exigido ou permitido por lei. Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco.`
    },
    {
      title: "6. Seus Direitos (LGPD)",
      content: `Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
• Confirmar a existência de tratamento de seus dados pessoais.
• Acessar, corrigir ou atualizar seus dados.
• Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.
• Revogar o consentimento a qualquer momento.
• Solicitar a portabilidade dos dados.
Para exercer qualquer desses direitos, entre em contato através do e-mail indicado abaixo.`
    },
    {
      title: "7. Uso de Inteligência Artificial",
      content: `A ZapAI utiliza modelos de inteligência artificial generativa (Google Gemini) para processar e responder mensagens automaticamente. As conversas são processadas em tempo real e podem ser armazenadas para fins de histórico e melhoria do serviço. Nenhum dado é utilizado para treinar modelos de IA de terceiros.`
    },
    {
      title: "8. Cookies e Tecnologias Similares",
      content: `Utilizamos cookies e tecnologias similares para manter sua sessão ativa, lembrar suas preferências e garantir o funcionamento adequado da plataforma. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade do serviço.`
    },
    {
      title: "9. Alterações nesta Política",
      content: `Podemos atualizar esta Política de Privacidade periodicamente. Quaisquer alterações significativas serão comunicadas através da plataforma ou por e-mail. A data da última atualização será sempre indicada no topo desta página.`
    },
    {
      title: "10. Contato",
      content: `Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento dos seus dados pessoais, entre em contato conosco:
• E-mail: contato@zapai.com.br
• Plataforma: ZapAI — Conexão e Confiança`
    },
  ];

  return (
    <div className="pt-20 bg-slate-50 min-h-screen">
      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 text-center bg-white border-b border-slate-200">
        <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield size={32} className="text-cyan-700" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 mb-6">
          Política de Privacidade
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
          O compromisso da ZapAI com a segurança e a privacidade dos seus dados.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════════════ */}
      <main className="max-w-4xl mx-auto px-5 py-16">
        <div className="mb-12">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-4">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <p className="text-slate-700 text-lg leading-relaxed">
            A <strong className="text-slate-900">ZapAI</strong> ("nós", "nosso" ou "plataforma") tem o compromisso de proteger a privacidade e os dados pessoais de seus usuários e dos contatos atendidos pela nossa inteligência artificial. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações ao usar nossos serviços.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{section.title}</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
