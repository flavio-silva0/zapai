import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Início",   href: "/" },
  { label: "Como Funciona", href: "/sobre" },
  { label: "Planos",   href: "/planos" },
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

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Is this page using a dark hero header at top?
  const isDarkHero = pathname === "/" || pathname === "/sobre" || pathname === "/planos";
  const isTransparent = !scrolled && isDarkHero && !mobileOpen;

  return (
    <header
      id="public-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isTransparent
          ? "bg-slate-900/80 backdrop-blur-md border-b border-white/10"
          : "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-5 h-20 flex items-center justify-between">
        
        {/* ── Logo ── */}
        <Link to="/" id="nav-logo" className="flex items-center gap-2" aria-label="ZapAI Página Inicial">
          <img 
            src={isTransparent ? "/zapai-logo-light.png" : "/zapai-logo-dark.png"} 
            alt="ZapAI" 
            className="h-9 w-auto object-contain transition-opacity duration-200" 
          />
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação Principal">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  active
                    ? isTransparent
                      ? "text-white bg-white/15"
                      : "text-slate-900 bg-slate-100"
                    : isTransparent
                      ? "text-slate-300 hover:text-white hover:bg-white/10"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop CTAs ── */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className={`text-sm font-bold transition ${
              isTransparent 
                ? "text-slate-200 hover:text-white" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Acessar painel
          </Link>
          <Link
            to="/cadastro"
            className={`btn-primary ${
              isTransparent
                ? "bg-white text-slate-900 hover:bg-slate-100 border-transparent shadow-md"
                : ""
            }`}
          >
            Criar conta
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2.5 rounded-lg transition ${
            isTransparent ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-label={mobileOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ── Mobile Menu Dropdown ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-xl animate-fade-up">
          <div className="px-5 py-6 flex flex-col gap-2">
            {NAV_LINKS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={() => {
                    setMobileOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-4 py-3 rounded-lg text-base font-bold transition-all ${
                    active
                      ? "text-slate-900 bg-slate-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <div className="mt-4 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <Link 
                to="/login" 
                onClick={() => setMobileOpen(false)} 
                className="btn-outline w-full justify-center h-12 text-base"
              >
                Acessar painel
              </Link>
              <Link 
                to="/cadastro" 
                onClick={() => setMobileOpen(false)} 
                className="btn-primary w-full justify-center h-12 text-base"
              >
                Criar conta gratuita
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
