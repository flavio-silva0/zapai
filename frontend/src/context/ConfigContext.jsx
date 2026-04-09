/**
 * ConfigContext.jsx
 * Carrega e disponibiliza as configurações de branding do backend
 * (botName, botEmoji, clinica) para todos os componentes do frontend.
 *
 * Para trocar de cliente: mude .env no backend e faça redeploy.
 * O frontend se adapta automaticamente via /api/config.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../api";

const ConfigContext = createContext({
  clinica:   "Atendimento",
  botName:   "Sofia",
  botEmoji:  "🤖",
  promptFile: "",
  loading:   true,
});

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    clinica:   "Atendimento",
    botName:   "Sofia",
    botEmoji:  "🤖",
    promptFile: "",
    loading:   true,
  });

  useEffect(() => {
    apiFetch("/api/config")
      .then((r) => r.json())
      .then((data) => setConfig({ ...data, loading: false }))
      .catch(() => setConfig((prev) => ({ ...prev, loading: false })));
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
