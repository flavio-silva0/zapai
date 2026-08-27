import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import PublicLoginLink from "./PublicLoginLink";

const NAV_ITEMS = [
  { id: "home",          label: "Home",          href: "/" },
  { id: "como-funciona", label: "Como funciona", href: "/#como-funciona" },
  { id: "recursos",      label: "Recursos",      href: "/#recursos" },
  { id: "segmentos",     label: "Para quem é",   href: "/#segmentos" },
  { id: "planos",        label: "Planos",        href: "/planos" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  // Caso rota específica ainda use hero escuro (ex: /sobre)
  const isDarkHero = pathname === "/sobre";
  const useDarkTheme = !scrolled && isDarkHero;

  // Monitora scroll para efeito de fundo da navbar
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (pathname === "/" && window.scrollY < 120) {
        setActiveSection("home");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Tecla Escape para fechar mobile menu
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

  // Sincroniza activeSection com hash na rota raiz quando carregada com hash
  useEffect(() => {
    if (pathname === "/") {
      if (!hash) {
        setActiveSection("home");
      } else {
        const id = hash.replace(/^#/, "");
        if (id === "demo") setActiveSection("recursos");
        else if (id) setActiveSection(id);
      }
    }
  }, [pathname, hash]);

  // ScrollSpy com IntersectionObserver na rota raiz "/"
  // Apenas altera o estado visual da navbar — NÃO manipula hash continuamente para evitar loop
  useEffect(() => {
    if (pathname !== "/") return;

    const sectionIds = ["hero", "como-funciona", "recursos", "segmentos"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sectionElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Se estiver muito próximo do topo, hero é sempre o dominante
        if (window.scrollY < 120) {
          setActiveSection("home");
          return;
        }

        // Procura a seção que está visível com maior interseção
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Ordena pela maior ratio de interseção
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const currentId = visibleEntries[0].target.id;
          if (currentId === "hero") {
            setActiveSection("home");
          } else {
            setActiveSection(currentId);
          }
        }
      },
      {
        rootMargin: "-80px 0px -40% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  // Manipula clique na Logo (sempre Home / topo limpo)
  const handleLogoClick = (e) => {
    setMobileOpen(false);
    setActiveSection("home");
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      if (window.location.hash) {
        navigate("/", { replace: true });
      }
    } else {
      navigate("/");
    }
  };

  // Manipula clique nos itens da navbar usando React Router
  const handleNavClick = (e, item) => {
    setMobileOpen(false);

    // Caso Home
    if (item.id === "home") {
      e.preventDefault();
      setActiveSection("home");
      if (pathname === "/") {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        if (window.location.hash) {
          navigate("/", { replace: true });
        }
      } else {
        navigate("/");
      }
      return;
    }

    // Caso Hash link e já está na Home ("/")
    if (item.href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const targetId = item.id;
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Atualiza URL via React Router navigate sem criar loops ou descompasso
        navigate(`/#${targetId}`, { replace: true });
      }
      setActiveSection(targetId);
    }
  };

  const isItemActive = useCallback(
    (item) => {
      if (pathname === "/planos") {
        return item.id === "planos";
      }
      if (pathname === "/") {
        return activeSection === item.id;
      }
      return pathname === item.href;
    },
    [pathname, activeSection]
  );

  return (
    <header
      id="public-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-[#e8e5e0] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
        {/* Logo ZapAI -> Sempre Home / Topo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1"
          aria-label="ZapAI Página Inicial"
        >
          <img
            src={useDarkTheme ? "/zapai-logo-light.png" : "/zapai-logo-dark.png"}
            alt="ZapAI"
            className="h-8 w-auto object-contain transition-opacity duration-200"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Navegação Principal">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={(e) => handleNavClick(e, item)}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useDarkTheme
                    ? active
                      ? "text-teal-400 font-semibold bg-slate-800/80 border border-slate-700/60"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    : active
                      ? "text-[#1a1a1a] font-semibold bg-[#f0eeeb] border border-[#e8e5e0]"
                      : "text-[#555] hover:text-[#1a1a1a] hover:bg-[#f8f7f5]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <PublicLoginLink
            className={`text-sm font-semibold transition-colors px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              useDarkTheme
                ? "text-slate-300 hover:text-white"
                : "text-[#555] hover:text-[#1a1a1a]"
            }`}
          >
            Entrar
          </PublicLoginLink>

          <Link
            to="/cadastro"
            className="px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 bg-teal-600 text-white hover:bg-teal-700"
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
              : "text-[#1a1a1a] hover:bg-[#f0eeeb]"
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
          className="md:hidden bg-white border-b border-[#e8e5e0] shadow-xl animate-fade-up"
        >
          <div className="px-5 py-6 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  aria-current={active ? "page" : undefined}
                  className={`px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                    active
                      ? "bg-[#f0eeeb] text-[#1a1a1a] border border-[#e8e5e0]"
                      : "text-[#555] hover:bg-[#f8f7f5]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-4 pt-6 border-t border-[#e8e5e0] flex flex-col gap-3">
              <PublicLoginLink
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-center rounded-xl border border-[#e8e5e0] text-[#1a1a1a] font-semibold hover:bg-[#f8f7f5] transition block"
              >
                Entrar
              </PublicLoginLink>
              <Link
                to="/cadastro"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-center rounded-full bg-teal-600 text-white font-medium hover:bg-teal-700 transition"
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
