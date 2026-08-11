import { Link } from "react-router-dom";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a1a1a] text-[#aaa] pt-16 pb-12 font-body">
      <div className="max-w-6xl mx-auto px-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
        {/* Brand */}
        <div className="lg:col-span-4 flex flex-col items-start">
          <Link to="/" className="inline-block mb-4" aria-label="ZapAI Início">
            <img
              src="/zapai-logo-light.png"
              alt="ZapAI Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <p className="text-sm leading-relaxed max-w-xs">
            Sua atendente digital no WhatsApp. Responde, organiza e te chama quando precisa.
          </p>
        </div>

        {/* Produto */}
        <div className="lg:col-span-3">
          <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/#como-funciona" className="hover:text-white transition-colors">Como funciona</Link></li>
            <li><Link to="/#recursos" className="hover:text-white transition-colors">Recursos</Link></li>
            <li><Link to="/planos" className="hover:text-white transition-colors">Planos</Link></li>
          </ul>
        </div>

        {/* Institucional */}
        <div className="lg:col-span-3">
          <h4 className="text-white font-semibold text-sm mb-4">Institucional</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre a ZapAI</Link></li>
            <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
            <li><a href="mailto:contato@zapai.com.br" className="hover:text-white transition-colors">Contato</a></li>
          </ul>
        </div>

        {/* Acesso */}
        <div className="lg:col-span-2">
          <h4 className="text-white font-semibold text-sm mb-4">Acesso</h4>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="px-4 py-2.5 text-center rounded-lg border border-[#444] text-white text-sm font-medium hover:bg-[#333] transition"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="px-4 py-2.5 text-center rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-5 border-t border-[#333] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <p>© {currentYear} ZapAI. Todos os direitos reservados.</p>
        <div className="flex gap-6">
          <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <a href="mailto:contato@zapai.com.br" className="hover:text-white transition-colors">Contato</a>
        </div>
      </div>
    </footer>
  );
}
