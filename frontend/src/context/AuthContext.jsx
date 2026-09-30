/**
 * AuthContext.jsx — Multi-tenant
 * Armazena: token JWT, user { id, nome, email, role }, tenant { id, nome, status, ... }
 * A chave localStorage mudou de "dentistai_token" para "sofia_token" para evitar conflito.
 */
import { createContext, useState, useEffect, useContext } from "react";
import { apiFetch } from "../api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(localStorage.getItem("sofia_token"));
  const [user,    setUser]    = useState(null);
  const [tenant,  setTenant]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let active = true;

    apiFetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw Object.assign(new Error("Não foi possível validar a sessão"), { status: res.status });
        return res.json();
      })
      .then(({ user, tenant }) => {
        if (!active) return;
        setUser(user);
        setTenant(tenant);
      })
      .catch((error) => {
        if (!active || ![401, 403].includes(error.status)) return;
        setToken(null);
        setUser(null);
        setTenant(null);
        localStorage.removeItem("sofia_token");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== "sofia_token") return;
      setUser(null);
      setTenant(null);
      setLoading(Boolean(event.newValue));
      setToken(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (newToken, userData, tenantData = null) => {
    localStorage.setItem("sofia_token", newToken);
    setToken(newToken);
    setUser(userData);
    setTenant(tenantData);
  };

  const logout = () => {
    localStorage.removeItem("sofia_token");
    localStorage.removeItem("sandbox_history");
    if (tenant?.id) {
      localStorage.removeItem(`sandbox_history_${tenant.id}`);
    }
    // Remove qualquer chave residual de sandbox do navegador (TEN-002)
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sandbox_history")) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}

    setToken(null);
    setUser(null);
    setTenant(null);
  };

  const isSuperAdmin = user?.role === "super_admin";

  return (
    <AuthContext.Provider value={{ token, user, tenant, login, logout, loading, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

