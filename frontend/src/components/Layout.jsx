import { useContext, useState, useEffect } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import {
  LayoutDashboard, MessageSquare, KanbanSquare, LogOut,
  Smartphone, FlaskConical, User, ShieldAlert, Zap, ChevronRight, BrainCircuit, DatabaseZap
} from "lucide-react";
import { apiFetch } from "../api";

export default function Layout() {
  const { user, tenant, logout } = useContext(AuthContext);

  const isSuperAdmin = user?.role === "super_admin";
  const botName  = isSuperAdmin ? "Admin" : (tenant?.bot_name || "Assistente");
  const botEmoji = tenant?.bot_emoji || "🤖";
  const clinica  = isSuperAdmin ? "Sistema Master" : (tenant?.nome || user?.nome || "Painel");

  const [sofiaNumero, setSofiaNumero] = useState(null);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setSofiaNumero(d.sofiaNumero ?? null))
      .catch(() => {});
  }, []);

  const NAV_ITEMS = [
    { to: "/painel",        icon: LayoutDashboard, label: "Visão Geral" },
    { to: "/painel/chat",   icon: MessageSquare,   label: "Mensagens" },
    { to: "/painel/kanban", icon: KanbanSquare,    label: "Kanban" },
    { to: "/painel/ia",     icon: BrainCircuit,    label: "Setup da IA" },
    { to: "/painel/treinamento", icon: DatabaseZap, label: "Base de Conhecimento" },
    { to: "/painel/test",   icon: FlaskConical,    label: `Testar ${botName}` },
    { to: "/painel/perfil", icon: User,            label: "Meu Perfil" },
  ];

  const phoneDisplay = tenant?.clinic_phone
    ? `+${tenant.clinic_phone}`
    : sofiaNumero
    ? `+${sofiaNumero}`
    : "Conectando...";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-64 min-w-[256px] flex flex-col relative z-20"
        style={{
          background: "rgba(6,14,26,0.98)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Glow top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {/* ── Logo / Header ── */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-black text-[17px] text-white tracking-tight">
              Zap<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Bot/Tenant pill */}
          <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center text-base flex-shrink-0">
              {isSuperAdmin ? "⚙️" : botEmoji}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{botName}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider truncate">
                {isSuperAdmin ? "Super Admin" : "Powered by ZapAI"}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse ml-auto" />
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-3">
            Navegação
          </p>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/painel"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white border border-indigo-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/4 border border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={13} className="text-indigo-400 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-3 pt-2">
                Admin
              </p>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                    isActive
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                      : "text-slate-500 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent"
                  }`
                }
              >
                <ShieldAlert size={17} className="text-violet-500" />
                Painel Admin
              </NavLink>
            </>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="px-3 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {/* Número conectado */}
          {!isSuperAdmin && (
            <div className="mx-0 mt-3 glass rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <Smartphone size={13} className="text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Conectado como</p>
                <p className="text-slate-300 text-xs font-mono truncate">{phoneDisplay}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-500 hover:text-rose-400 rounded-xl transition-all hover:bg-rose-500/8 border border-transparent hover:border-rose-500/15 group mt-1"
          >
            <span className="flex items-center gap-2.5">
              <LogOut size={15} className="group-hover:text-rose-400" />
              Sair do Painel
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "#060e1a" }}>
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        {/* Top gradient glow */}
        <div className="absolute top-0 right-0 w-1/2 h-64 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.06) 0%, transparent 70%)" }}
        />
        {/* Watermark */}
        <div className="absolute top-5 right-6 z-10 pointer-events-none opacity-60 mix-blend-screen">
          <img
            src="/logo_full_dark.png"
            alt="ZapAI"
            className="h-10 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        <div className="flex-1 overflow-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
