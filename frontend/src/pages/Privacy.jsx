import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <Shield size={22} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Política de Privacidade</h1>
              <p className="text-xs text-slate-500">ZapAI — Conexão e Confiança</p>
            </div>
          </div>
          <Link to="/login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-slate-400 text-sm">Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p className="text-slate-300 mt-4 leading-relaxed">
            A <strong className="text-white">ZapAI</strong> ("nós", "nosso" ou "plataforma") tem o compromisso de proteger a privacidade e os dados pessoais de seus usuários e dos contatos atendidos pela nossa inteligência artificial. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informações ao usar nossos serviços.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-colors">
              <h2 className="text-lg font-semibold text-white mb-3">{section.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
            </section>
          ))}
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} ZapAI. Todos os direitos reservados.</p>
          <div className="flex justify-center mt-4">
            <img src="/logo_icon_trans.png" alt="ZapAI" className="h-8 w-auto opacity-40" />
          </div>
        </footer>
      </main>
    </div>
  );
}
