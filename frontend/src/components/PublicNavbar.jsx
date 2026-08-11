import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Recursos",      href: "/#recursos" },
  { label: "Para quem é",   href: "/#segmentos" },
  { label: "Planos",        href: "/planos" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      id="public-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#e8e5e0] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="ZapAI Página Inicial">
          <img
            src="/zapai-logo-dark.png"
            alt="ZapAI"
            className="h-8 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação Principal">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#555] hover:text-[#1a1a1a] hover:bg-[#f0eeeb] transition-all"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-[#555] hover:text-[#1a1a1a] transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-semibold hover:bg-[#333] transition-all"
          >
            Criar minha Zap
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2.5 rounded-lg text-[#555] hover:bg-[#f0eeeb] transition"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#e8e5e0] shadow-xl animate-fade-up">
          <div className="px-5 py-6 flex flex-col gap-2">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-semibold text-[#555] hover:bg-[#f0eeeb] transition-all"
              >
                {label}
              </Link>
            ))}
            <div className="mt-4 pt-6 border-t border-[#e8e5e0] flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-center rounded-xl border border-[#e8e5e0] text-[#1a1a1a] font-semibold hover:bg-[#f0eeeb] transition"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-center rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#333] transition"
              >
                Criar minha Zap
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
