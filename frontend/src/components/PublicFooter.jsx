import { Link } from "react-router-dom";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 font-body border-t border-slate-800">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
        
        {/* Coluna 1: Brand */}
        <div className="lg:col-span-4 flex flex-col items-start">
          <Link to="/" className="inline-block mb-4" aria-label="ZapAI Início">
            <img 
              src="/zapai-logo-light.png" 
              alt="ZapAI Logo" 
              className="h-9 w-auto object-contain" 
            />
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Central inteligente de atendimento para o WhatsApp. Responde dúvidas, organiza solicitações e realiza hand-off perfeito para sua equipe humana.
          </p>
        </div>

        {/* Coluna 2: Produto */}
        <div className="lg:col-span-3">
          <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Plataforma</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/sobre" className="hover:text-cyan-400 transition-colors">Como Funciona</Link>
            </li>
            <li>
              <Link to="/planos" className="hover:text-cyan-400 transition-colors">Planos e Recursos</Link>
            </li>
            <li>
              <a href="/#demo" className="hover:text-cyan-400 transition-colors">Demonstração Interativa</a>
            </li>
          </ul>
        </div>

        {/* Coluna 3: Institucional & Privacidade */}
        <div className="lg:col-span-3">
          <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Institucional</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/sobre" className="hover:text-cyan-400 transition-colors">Sobre a ZapAI</Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-cyan-400 transition-colors">Política de Privacidade</Link>
            </li>
            <li>
              <a href="mailto:contato@zapai.com.br" className="hover:text-cyan-400 transition-colors">Contato Comercial</a>
            </li>
          </ul>
        </div>

        {/* Coluna 4: Acesso */}
        <div className="lg:col-span-2">
          <h4 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Acesso</h4>
          <div className="flex flex-col gap-3">
            <Link 
              to="/login" 
              className="btn-outline border-slate-700 text-white hover:bg-slate-800 text-xs py-2.5 justify-center"
            >
              Acessar Painel
            </Link>
            <Link 
              to="/cadastro" 
              className="btn-primary bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2.5 justify-center border-none"
            >
              Criar Conta
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-[1400px] mx-auto px-5 lg:px-10 border-t border-slate-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© {currentYear} ZapAI. Todos os direitos reservados.</p>
        <p className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Infraestrutura Oficial WhatsApp Meta Cloud API.
        </p>
      </div>
    </footer>
  );
}
