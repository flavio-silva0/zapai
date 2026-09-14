import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function Privacy() {
  useEffect(() => {
    document.title = "Política de Privacidade — ZapAI";
  }, []);
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
      title: "3. Subprocessadores e Compartilhamento de Dados",
      content: `Não vendemos, alugamos ou comercializamos informações pessoais com terceiros. O compartilhamento de dados ocorre exclusivamente com subprocessadores estritamente necessários para a execução dos serviços contratados:
• Meta Platforms, Inc.: Provedor oficial da API do WhatsApp Business Cloud para recepção e transmissão de mensagens.
• Google LLC: Provedor da API comercial de inteligência artificial (Google Gemini) para geração dinâmica de respostas.
• Supabase Inc.: Provedor de infraestrutura de banco de dados PostgreSQL com isolamento lógico multi-tenant.
• Provedores de Hospedagem em Nuvem: Para execução dos servidores da aplicação e interfaces web sob conexões criptografadas.
• Autoridades Governamentais: Apenas mediante intimação, ordem judicial ou obrigação legal estrita.`
    },
    {
      title: "4. Armazenamento e Segurança",
      content: `Adotamos medidas técnicas e organizacionais rígidas para salvaguardar as informações:
• Criptografia de dados em trânsito com TLS 1.3 / HTTPS.
• Autenticação reforçada via tokens JWT com assinatura criptográfica e hashing seguro de senhas com bcrypt (custo 12).
• Isolamento lógico rigoroso entre organizações (multi-tenancy) e permissões por perfil (RBAC).
• Validação de assinaturas criptográficas (HMAC SHA-256) em webhooks de entrada.
• Monitoramento e mitigação contra injeções de prompt e vazamento de dados confidenciais.`
    },
    {
      title: "5. Retenção e Descarte de Dados",
      content: `Mantemos os dados pessoais apenas pelo tempo necessário para cumprir as finalidades do atendimento ou exigências regulatórias:
• Mensagens e Histórico de Conversas: Retidos pelo período padrão de até 90 (noventa) dias para fins de acompanhamento operacional, ou conforme estipulado no contrato de prestação de serviços com o cliente.
• Memória de Contexto do Atendente IA: Limitada a preferências operacionais e descartada mediante inatividade prolongada ou pedido de encerramento.
• Logs Técnicos e Auditoria de Segurança: Armazenados por 14 a 30 dias para segurança do sistema e anonimizados subsequentemente.
• Descarte: Os titulares podem solicitar a exclusão de seus dados a qualquer momento via canal oficial do Encarregado de Dados (DPO).`
    },
    {
      title: "6. Seus Direitos (LGPD)",
      content: `Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), os titulares de dados contam com os seguintes direitos:
• Confirmação da existência de tratamento e acesso aos dados.
• Correção de dados incompletos, inexatos ou desatualizados.
• Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.
• Revogação de consentimento e portabilidade dos dados.
• Esclarecimento sobre entidades com as quais os dados foram compartilhados.
Para exercer seus direitos, utilize o canal direto de privacidade listado na Seção 10.`
    },
    {
      title: "7. Uso de Inteligência Artificial e Não-Treinamento",
      content: `A ZapAI utiliza modelos de linguagem de ponta (como o Google Gemini) para auxiliar na automação do atendimento via WhatsApp.
• O processamento é executado por meio de interfaces de programação de aplicação (APIs) comerciais corporativas.
• Sob os termos de proteção de dados comerciais aplicáveis às APIs empresariais dos provedores, os prompts de entrada, respostas e dados de clientes NÃO são utilizados pelos provedores de modelo para treinar ou aperfeiçoar modelos fundacionais públicos.
• O sistema implementa filtros de segurança e salvaguardas para prevenir alucinações, vazamento de instruções internas e injeções de prompt maliciosas.`
    },
    {
      title: "8. Cookies e Sessão",
      content: `Utilizamos armazenamento local seguro de sessão para manter a autenticação do usuário, guardar preferências de exibição e garantir a integridade da navegação. O usuário pode gerenciar o armazenamento através das configurações do navegador.`
    },
    {
      title: "9. Alterações nesta Política",
      content: `Esta Política de Privacidade pode ser revisada periodicamente para refletir evoluções técnicas, legais ou operacionais. A data da versão mais recente estará sempre discriminada no cabeçalho.`
    },
    {
      title: "10. Contato e Encarregado de Dados (DPO)",
      content: `Para exercer qualquer direito previsto na LGPD, esclarecer dúvidas de privacidade ou solicitar exclusão de registros:
• Encarregado de Proteção de Dados (DPO): privacidade@zapai.com.br
• Atendimento Geral: contato@zapai.com.br
• Plataforma: ZapAI — Conexão, Inteligência e Confiança`
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
