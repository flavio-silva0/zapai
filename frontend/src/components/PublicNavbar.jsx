import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Recursos",      href: "/#demo" },
  { label: "Para quem é",   href: "/#segmentos" },
  { label: "Planos",        href: "/planos" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const isDarkHero = (pathname === "/planos" || pathname === "/sobre");
  const useDarkTheme = !scrolled && isDarkHero;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  // Fecha menu mobile em mudança de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleNavClick = (e, href) => {
    setMobileOpen(false);
    if (href.startsWith("/#")) {
      const targetId = href.replace("/#", "");
      if (pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", href);
        }
      }
    }
  };

  return (
    <header
      id="public-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1" aria-label="ZapAI Página Inicial">
          <img
            src={useDarkTheme ? "/zapai-logo-light.png" : "/zapai-logo-dark.png"}
            alt="ZapAI"
            className="h-8 w-auto object-contain transition-opacity duration-200"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Navegação Principal">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                onClick={(e) => handleNavClick(e, href)}
                aria-current={isActive ? "page" : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useDarkTheme
                    ? isActive
                      ? "text-cyan-400 font-semibold bg-slate-800/80 border border-slate-700/60"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    : isActive
                      ? "text-slate-900 font-semibold bg-slate-100 border border-slate-200/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className={`text-sm font-semibold transition-colors px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              useDarkTheme
                ? "text-slate-300 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
              useDarkTheme
                ? "bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold hover:brightness-110 shadow-cyan-500/20"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            Criar minha Zap
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2.5 rounded-lg transition ${
            useDarkTheme
              ? "text-slate-200 hover:bg-slate-800/60"
              : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          role="dialog"
          aria-label="Menu de navegação mobile"
          className="md:hidden bg-white border-b border-slate-200 shadow-xl animate-fade-up"
        >
          <div className="px-5 py-6 flex flex-col gap-2">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={(e) => handleNavClick(e, href)}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 border border-slate-200"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <div className="mt-4 pt-6 border-t border-slate-200 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-center rounded-xl border border-slate-200 text-slate-900 font-semibold hover:bg-slate-50 transition"
              >
                Entrar
              </Link>
              <Link
                to="/cadastro"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-center rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
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
