import { useContext, useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { LayoutDashboard, MessageSquare, KanbanSquare, LogOut, Smartphone, FlaskConical } from "lucide-react";
import { apiFetch } from "../api";

export default function Layout() {
  const { user, logout } = useContext(AuthContext);
  const { botName, botEmoji, clinica } = useConfig();
  const [sofiaNumero, setSofiaNumero] = useState(null);

  useEffect(() => {
    apiFetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setSofiaNumero(d.sofiaNumero ?? null))
      .catch(() => {});
  }, []);

  const NAV_ITEMS = [
    { to: "/",       icon: LayoutDashboard, label: "Painel Geral" },
    { to: "/chat",   icon: MessageSquare,   label: "Mensagens" },
    { to: "/kanban", icon: KanbanSquare,    label: "Kanban" },
    { to: "/test",   icon: FlaskConical,    label: `Testar ${botName}` },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-200">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 min-w-[256px] border-r border-slate-700/50 bg-slate-800/40 backdrop-blur-xl flex flex-col relative z-10">

        {/* Header / Logo */}
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="text-xl">🦷</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-tight leading-tight">{botEmoji} SofiaAI</h1>
            <p className="text-xs text-cyan-400 font-medium">{clinica || user?.clinica || "Atendimento"}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border border-transparent"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          {user?.role === "super_admin" && (
            <>
              <div className="pt-4 pb-1"><div className="border-t border-slate-700/50"></div></div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "text-purple-400/70 hover:text-purple-400 hover:bg-purple-500/10 border border-transparent"
                  }`
                }
              >
                <LayoutDashboard size={18} />
                Painel Master
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/40">
          {/* Card: número real da Sofia no WhatsApp */}
          <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Smartphone size={10} /> {botName} conectada como
            </span>
            <div className="text-sm font-medium text-slate-300 truncate font-mono">
              {sofiaNumero ? `+${sofiaNumero}` : "Conectando..."}
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            Sair do Painel
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Área Principal ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-900 relative">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <Outlet />
      </main>
    </div>
  );
}
