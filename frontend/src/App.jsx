import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { useContext } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";

// ── Páginas Públicas ──────────────────────────────────────
import LandingHome   from "./pages/LandingHome";
import LandingSobre  from "./pages/LandingSobre";
import LandingPlanos from "./pages/LandingPlanos";

// ── Auth ──────────────────────────────────────────────────
import Login    from "./pages/Login";
import Register from "./pages/Register";
import Privacy  from "./pages/Privacy";

// ── Painel (protegido) ────────────────────────────────────
import Home      from "./pages/Home";
import Chat      from "./pages/Chat";
import FullKanban from "./pages/FullKanban";
import TestSofia  from "./pages/TestSofia";
import Admin      from "./pages/Admin";
import Profile    from "./pages/Profile";

// ── Admin guard ───────────────────────────────────────────
function AdminRoute({ children }) {
  const { token, user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!token || user?.role !== "super_admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Rotas Públicas (com Navbar + Footer) ── */}
            <Route element={<PublicLayout />}>
              <Route index            element={<LandingHome />} />
              <Route path="sobre"     element={<LandingSobre />} />
              <Route path="planos"    element={<LandingPlanos />} />
              <Route path="privacidade" element={<Privacy />} />
            </Route>

            {/* ── Auth ── */}
            <Route path="login"    element={<Login />} />
            <Route path="cadastro" element={<Register />} />

            {/* ── Admin ── */}
            <Route path="admin" element={
              <AdminRoute><Admin /></AdminRoute>
            } />

            {/* ── Painel Protegido ── */}
            <Route path="painel" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index          element={<Home />} />
              <Route path="chat"    element={<Chat />} />
              <Route path="kanban"  element={<FullKanban />} />
              <Route path="test"    element={<TestSofia />} />
              <Route path="perfil"  element={<Profile />} />
            </Route>

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </AuthProvider>
  );
}
