import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";

const NAV_LINKS = [
  { label: "Início",   href: "/" },
  { label: "Sobre",    href: "/sobre" },
  { label: "Planos",   href: "/planos" },
];

export default function PublicNavbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <header
      id="public-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#060e1a]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" id="nav-logo" className="flex items-center gap-2.5 group" aria-label="ZapAI">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-800 text-lg text-white tracking-tight">
            Zap<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              id={`nav-link-${label.toLowerCase()}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === href
                  ? "text-white bg-white/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Desktop CTAs ── */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            id="nav-login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Login
          </Link>
          <Link
            to="/cadastro"
            id="nav-cta"
            className="btn-primary text-sm py-2.5 px-5"
          >
            Começar grátis
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          id="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${
        mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="bg-[#060e1a]/95 backdrop-blur-xl border-t border-white/5 px-5 pb-5 pt-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname === href
                  ? "text-white bg-white/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/login"   className="btn-outline text-sm py-3 text-center">Login</Link>
            <Link to="/cadastro" className="btn-primary text-sm py-3 text-center">Começar grátis</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
