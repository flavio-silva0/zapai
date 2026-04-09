/**
 * AuthContext.jsx — Multi-tenant
 * Armazena: token JWT, user { id, nome, email, role }, tenant { id, nome, status, ... }
 * A chave localStorage mudou de "dentistai_token" para "sofia_token" para evitar conflito.
 */
import { createContext, useState, useEffect } from "react";
import { apiFetch } from "../api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(localStorage.getItem("sofia_token"));
  const [user,    setUser]    = useState(null);
  const [tenant,  setTenant]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    apiFetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Token inválido");
        return res.json();
      })
      .then(({ user, tenant }) => {
        setUser(user);
        setTenant(tenant);
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem("sofia_token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = (newToken, userData, tenantData = null) => {
    localStorage.setItem("sofia_token", newToken);
    setToken(newToken);
    setUser(userData);
    setTenant(tenantData);
  };

  const logout = () => {
    localStorage.removeItem("sofia_token");
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
