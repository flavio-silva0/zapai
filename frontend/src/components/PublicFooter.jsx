import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

/* Inline social icons — lucide-react v1 doesn't export these */
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);


export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="public-footer" className="border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 w-fit group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Zap size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-800 text-lg text-white">
                Zap<span className="gradient-text">AI</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Automatize o atendimento do seu negócio com Inteligência Artificial via WhatsApp. Simples, poderoso e disponível 24/7.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-instagram"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
                aria-label="Instagram"
              >
                <IconInstagram />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-linkedin"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
                aria-label="LinkedIn"
              >
                <IconLinkedin />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-twitter"
                className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all"
                aria-label="Twitter / X"
              >
                <IconTwitter />
              </a>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Produto</h4>
            <ul className="space-y-3">
              {[
                { label: "Início", href: "/" },
                { label: "Planos", href: "/planos" },
                { label: "Sobre", href: "/sobre" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacidade" id="footer-privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/5511962566086?text=${encodeURIComponent("Olá gostaria de saber mais sobre a ZapAI")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="footer-contact"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {year} ZapAI. Todos os direitos reservados.
          </p>
          <p className="text-slate-600 text-xs">
            Feito com 💙 para revolucionar o atendimento
          </p>
        </div>
      </div>
    </footer>
  );
}
