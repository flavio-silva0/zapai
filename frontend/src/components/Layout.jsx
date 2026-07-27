import { useContext, useState, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  LayoutDashboard, MessageSquare, LogOut,
  Smartphone, User, ShieldAlert, ChevronRight,
  Settings, TrendingUp, Users, Plug, BookOpen,
  Menu, X, Zap, Sparkles, Bell, Search
} from "lucide-react";
import { apiFetch } from "../api";
import ThemeToggle from "./ThemeToggle";

export default function Layout() {
  const { user, tenant, logout } = useContext(AuthContext);
  const location = useLocation();

  const isSuperAdmin = user?.role === "super_admin";
  const botName  = isSuperAdmin ? "Admin" : (tenant?.bot_name || "Assistente");
  const botEmoji = tenant?.bot_emoji || "✨";
  const clinica  = isSuperAdmin ? "Sistema Master" : (tenant?.nome || user?.nome || "Painel");

  const [sofiaNumero, setSofiaNumero] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setSofiaNumero(d.sofiaNumero ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const NAV_GROUPS = [
    {
      label: "Principal",
      items: [
        { to: "/painel",          icon: LayoutDashboard, label: "Visão Geral",      desc: "Métricas e conversas" },
        { to: "/painel/chat",     icon: MessageSquare,   label: "Mensagens",         desc: "Inbox de atendimentos" },
      ]
    },
    {
      label: "Atendimento",
      items: [
        { to: "/painel/ia",       icon: Sparkles,        label: "Personalidade",     desc: "Configure o atendente" },
        { to: "/painel/treinamento", icon: BookOpen,     label: "Base de Conhecimento", desc: "FAQs e documentos" },
        { to: "/painel/canais",   icon: Plug,            label: "Canais & Integrações", desc: "WhatsApp e outros" },
      ]
    },
    {
      label: "Resultados",
      items: [
        { to: "/painel/analytics", icon: TrendingUp,     label: "Análise & Relatórios", desc: "Performance de conversão" },
        { to: "/painel/perfil",    icon: User,           label: "Meu Perfil",        desc: "Conta e preferências" },
        { to: "/painel/configuracoes", icon: Settings,   label: "Configurações",     desc: "Sistema e integrações" },
      ]
    }
  ];

  const phoneDisplay = tenant?.clinic_phone
    ? `+${tenant.clinic_phone}`
    : sofiaNumero
    ? `+${sofiaNumero}`
    : "Conectando...";

  const isConnected = !!(tenant?.clinic_phone || sofiaNumero);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">

      {/* ── Overlay Mobile ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 w-64 min-w-[256px] flex flex-col z-50 transition-transform duration-300 ease-in-out bg-[var(--bg-surface)] border-r border-[var(--border-medium)]`}
      >
        {/* Top gradient accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--clr-primary)] to-[var(--clr-info)]" />

        {/* ── Logo ── */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--border-medium)]">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200"
                  style={{ background: "linear-gradient(135deg, var(--clr-primary), var(--clr-info))" }}>
                  <Zap size={16} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--clr-success)] border-2 border-[var(--sidebar-bg)] animate-pulse" />
              </div>
              <span className="font-display font-black text-[18px] text-[var(--text-primary)] tracking-tight">
                Zap<span style={{ color: "var(--clr-primary)" }}>AI</span>
              </span>
            </Link>

            <button
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
              onClick={() => setIsMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tenant pill */}
          <div className="mt-4 rounded-xl px-3 py-2.5 flex items-center gap-2.5 bg-[var(--bg-surface-active)]/50 border border-[var(--border-medium)]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] border border-[var(--clr-primary)]/20">
              {isSuperAdmin ? "⚙️" : botEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--text-primary)] text-[13px] font-semibold truncate leading-tight">{botName}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider truncate text-[var(--clr-primary)]">
                {isSuperAdmin ? "Super Admin" : clinica}
              </p>
            </div>
            <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? "bg-[var(--clr-success)] animate-pulse" : "bg-[var(--text-muted)]"}`} />
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5 text-[var(--text-muted)]">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label: itemLabel }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/painel"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 group border ${
                        isActive
                          ? "bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] border-[var(--clr-primary)]/20 font-bold"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border-transparent"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          className={`shrink-0 transition-colors ${isActive ? "text-[var(--clr-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`}
                        />
                        <span className="flex-1 truncate">{itemLabel}</span>
                        {isActive && <ChevronRight size={12} className="text-[var(--clr-primary)] shrink-0" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Admin link */}
          {isSuperAdmin && (
            <div>
              <div className="h-px bg-[var(--border-subtle)] my-4 w-full" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3 mb-1.5">Admin</p>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 border ${
                    isActive
                      ? "bg-[var(--clr-danger)]/15 text-[var(--clr-danger)] border-[var(--clr-danger)]/25 font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/10 border-transparent"
                  }`
                }
              >
                <ShieldAlert size={16} className="text-[var(--clr-danger)] shrink-0" />
                Painel Admin
              </NavLink>
            </div>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="px-3 pb-4 space-y-2 border-t border-[var(--sidebar-border)] pt-4">
          {/* WhatsApp status */}
          {!isSuperAdmin && (
            <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2.5 border transition-colors ${isConnected ? "bg-[var(--clr-success)]/10 border-[var(--clr-success)]/20" : "bg-[var(--bg-surface-hover)] border-[var(--border-subtle)]"}`}>
              <div className="relative shrink-0">
                <Smartphone size={13} className={isConnected ? "text-[var(--clr-success)]" : "text-[var(--text-muted)]"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">WhatsApp</p>
                <p className={`text-[12px] font-mono truncate ${isConnected ? "text-[var(--clr-success)]" : "text-[var(--text-secondary)]"}`}>
                  {phoneDisplay}
                </p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isConnected ? "bg-[var(--clr-success)] text-white" : "bg-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                {isConnected ? "Ativo" : "Offline"}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] rounded-xl transition-all border border-transparent hover:border-[var(--clr-danger)]/15 hover:bg-[var(--clr-danger)]/10 group mt-1 text-[var(--text-secondary)]"
          >
            <LogOut size={14} className="group-hover:text-[var(--clr-danger)] transition-colors" />
            <span className="group-hover:text-[var(--clr-danger)] transition-colors">Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[var(--bg-base)] min-h-0 min-w-0">

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-3.5 relative z-20 bg-[var(--bg-surface)] border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)] flex items-center justify-center">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-[17px] text-[var(--text-primary)] tracking-tight">
              Zap<span style={{ color: "var(--clr-primary)" }}>AI</span>
            </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all">
            <Menu size={19} />
          </button>
        </div>

        {/* Background decorations */}
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-2/3 h-96 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(124,58,237,0.05) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 left-0 w-1/2 h-64 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at bottom left, rgba(0,212,255,0.04) 0%, transparent 65%)" }} />

        <div className="flex-1 flex flex-col relative z-10 w-full max-w-full min-h-0">
          {/* ── Desktop Header ── */}
          <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-40">
            <div className="flex items-center gap-4 flex-1">
              {/* Optional: Add search bar here later */}
              <div className="relative w-64 max-w-md hidden xl:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar atendimentos..." 
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-medium)] rounded-lg pl-9 pr-4 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--clr-primary)] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--clr-danger)] animate-pulse" />
              </button>
              
              <div className="w-px h-6 bg-[var(--border-medium)] mx-1" />
              
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] border border-[var(--clr-primary)]/20 flex items-center justify-center font-bold text-sm">
                  {user?.nome?.charAt(0) || "U"}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-[var(--bg-base)]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
