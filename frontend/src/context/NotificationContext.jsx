import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { apiFetch } from "../api";
import { createEventStream } from "../eventStream";

const NotificationContext = createContext(null);
const defaults = { newConversation: true, newMessages: true, alerts: true };
function readState(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return { preferences: { ...defaults, ...saved.preferences }, readIds: Array.isArray(saved.readIds) ? saved.readIds : [] };
  } catch { return { preferences: defaults, readIds: [] }; }
}

export function NotificationProvider({ children }) {
  const { user, tenant } = useContext(AuthContext);
  const scope = user?.id ? `zapai:notifications:${user.id}:${tenant?.id || "admin"}` : null;
  // Remount the scoped store on membership changes so in-flight data cannot cross accounts.
  return <ScopedNotifications key={scope || "anonymous"} scope={scope}>{children}</ScopedNotifications>;
}

function ScopedNotifications({ scope, children }) {
  const [saved, setSaved] = useState(() => scope ? readState(scope) : { preferences: defaults, readIds: [] });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(scope));
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [failureAt, setFailureAt] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    if (!scope) return;
    let active = true;
    let pending = false;
    let eventTimer;
    async function refresh() {
      if (pending || !active) return;
      pending = true;
      try {
        const response = await apiFetch('/api/notifications');
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.notifications)) throw new Error(data.error || 'Não foi possível atualizar as notificações.');
        if (!active) return;
        setItems(data.notifications);
        setError("");
        setFailureAt(null);
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setFailureAt(previous => previous || new Date().toISOString());
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const stream = createEventStream();
    const onEvent = () => { clearTimeout(eventTimer); eventTimer = setTimeout(refresh, 500); };
    stream.addEventListener('new_message', onEvent);
    stream.addEventListener('patient_updated', onEvent);
    return () => {
      active = false;
      clearInterval(timer);
      clearTimeout(eventTimer);
      window.removeEventListener('focus', onFocus);
      stream.close();
    };
  }, [scope, refreshVersion]);

  useEffect(() => {
    if (!scope) return;
    try { localStorage.setItem(scope, JSON.stringify(saved)); setStorageError(""); }
    catch { setStorageError('Não foi possível salvar as preferências neste navegador.'); }
  }, [scope, saved]);

  const notifications = useMemo(() => {
    const list = items.filter(item => saved.preferences[item.type]);
    if (error && saved.preferences.alerts) list.unshift({ id: 'system:notification-feed', type: 'alerts', title: 'Falha ao atualizar notificações', text: error, created_at: failureAt });
    return list.map(item => ({ ...item, read: saved.readIds.includes(item.id) }));
  }, [items, saved, error, failureAt]);
  const markRead = useCallback(id => setSaved(prev => ({ ...prev, readIds: [...new Set([...prev.readIds, id])].slice(-1000) })), []);
  const markAllRead = () => setSaved(prev => ({ ...prev, readIds: [...new Set([...prev.readIds, ...notifications.map(item => item.id)])].slice(-1000) }));
  const updatePreference = (key, value) => {
    if (!(key in defaults)) return;
    setSaved(prev => ({ ...prev, preferences: { ...prev.preferences, [key]: Boolean(value) } }));
  };
  return <NotificationContext.Provider value={{ notifications, unreadCount: notifications.filter(item => !item.read).length,
    loading, error, storageError, preferences: saved.preferences, updatePreference, markRead, markAllRead,
    refresh: () => setRefreshVersion(version => version + 1) }}>{children}</NotificationContext.Provider>;
}

export function useNotifications() { return useContext(NotificationContext); }
