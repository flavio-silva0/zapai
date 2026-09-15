import { lazy, Suspense, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";
import DynamicFavicon from "./components/DynamicFavicon";
import { ThemeProvider } from "./context/ThemeProvider";

// ── Página Pública Principal (Eager para carregamento instantâneo) ──
import LandingHome from "./pages/LandingHome";

// ── Páginas Públicas Secundárias (Lazy) ────────────────────
const LandingSobre  = lazy(() => import("./pages/LandingSobre"));
const LandingPlanos = lazy(() => import("./pages/LandingPlanos"));
const Privacy       = lazy(() => import("./pages/Privacy"));

// ── Auth (Lazy) ───────────────────────────────────────────
const Login    = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

// ── Admin (Lazy) ──────────────────────────────────────────
const Admin = lazy(() => import("./pages/Admin"));

// ── Painel Protegido (Lazy) ───────────────────────────────
const Home         = lazy(() => import("./pages/Home"));
const Chat         = lazy(() => import("./pages/Chat"));
const FullKanban   = lazy(() => import("./pages/FullKanban"));
const TestSofia    = lazy(() => import("./pages/TestZapAi"));
const Profile      = lazy(() => import("./pages/Profile"));
const AiSetup      = lazy(() => import("./pages/AiSetup"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Channels     = lazy(() => import("./pages/Channels"));
const Analytics    = lazy(() => import("./pages/Analytics"));
const Settings     = lazy(() => import("./pages/Settings"));

// ── Fallback Discreto de Carregamento ─────────────────────
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">ZapAI · Carregando</span>
      </div>
    </div>
  );
}

// ── Admin Guard ───────────────────────────────────────────
function AdminRoute({ children }) {
  const { token, user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!token || user?.role !== "super_admin") return <Navigate to="/" replace />;
  return children;
}

// ── Escopo de Autenticação (Apenas para login, cadastro, admin e painel) ──
function AuthScope() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}

// ── Escopo do Painel (ConfigProvider apenas para o painel autenticado) ──
function PainelScope() {
  return (
    <ConfigProvider>
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <DynamicFavicon />
        <Routes>

          {/* ── Rotas Públicas (SEM AuthProvider nem ConfigProvider) ── */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingHome />} />
            <Route path="sobre" element={
              <Suspense fallback={<PageLoader />}><LandingSobre /></Suspense>
            } />
            <Route path="planos" element={
              <Suspense fallback={<PageLoader />}><LandingPlanos /></Suspense>
            } />
            <Route path="privacidade" element={
              <Suspense fallback={<PageLoader />}><Privacy /></Suspense>
            } />
          </Route>

          {/* ── Rotas Autenticadas e de Entrada (Com AuthProvider) ── */}
          <Route element={<AuthScope />}>
            <Route path="login"    element={<Login />} />
            <Route path="cadastro" element={<Register />} />

            {/* Admin */}
            <Route path="admin" element={
              <AdminRoute><Admin /></AdminRoute>
            } />

            {/* Painel Protegido (Com ConfigProvider interno) */}
            <Route path="painel" element={<PainelScope />}>
              <Route index                element={<Home />} />
              <Route path="crm"           element={<FullKanban />} />
              <Route path="kanban"        element={<FullKanban />} />
              <Route path="chat"          element={<Chat />} />
              <Route path="test"          element={<TestSofia />} />
              <Route path="perfil"        element={<Profile />} />
              <Route path="ia"            element={<AiSetup />} />
              <Route path="treinamento"   element={<KnowledgeBase />} />
              <Route path="canais"        element={<Channels />} />
              <Route path="analytics"     element={<Analytics />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
