import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, CheckCheck, MessageSquare, UserPlus, AlertCircle, X, RefreshCw, Settings } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationBell() {
  const { notifications, unreadCount, loading, error, storageError, markRead, markAllRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const button = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button ref={button} type="button" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`} aria-expanded={open} aria-haspopup="dialog"
        onClick={() => setOpen(value => !value)} className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
        <Bell size={18} />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <section role="dialog" aria-label="Central de notificações" className="fixed top-16 left-3 right-3 lg:absolute lg:top-11 lg:left-auto lg:right-0 lg:w-[380px] z-50 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
            <div><h2 className="text-sm font-bold">Notificações</h2><p className="text-[11px] text-[var(--text-muted)]">{unreadCount} não lidas · últimos 30 dias</p></div>
            <div className="flex gap-1">
              <button type="button" onClick={refresh} aria-label="Atualizar notificações" className="p-2 hover:bg-[var(--bg-base)] rounded-lg"><RefreshCw size={15} /></button>
              <button type="button" onClick={() => { setOpen(false); button.current?.focus(); }} aria-label="Fechar notificações" className="p-2 hover:bg-[var(--bg-base)] rounded-lg"><X size={16} /></button>
            </div>
          </div>
          {error && <p role="alert" className="px-4 pt-3 text-xs text-amber-600">{error} <button type="button" onClick={refresh} className="underline">Tentar novamente</button></p>}
          {storageError && <p role="alert" className="px-4 pt-3 text-xs text-amber-600">{storageError}</p>}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && !notifications.length ? <p className="p-6 text-xs text-[var(--text-muted)]">Carregando notificações...</p> : !notifications.length ? (
              <div className="p-8 text-center"><Bell size={24} className="mx-auto mb-3 text-[var(--text-muted)]" /><p className="text-sm font-semibold">Nenhuma notificação por aqui</p><p className="text-xs text-[var(--text-muted)] mt-1">Novos contatos e mensagens recebidas aparecerão aqui conforme suas preferências.</p></div>
            ) : notifications.map(item => {
              const Icon = item.type === 'newMessages' ? MessageSquare : item.type === 'newConversation' ? UserPlus : AlertCircle;
              return <button type="button" key={item.id} onClick={() => { markRead(item.id); if (item.href) { setOpen(false); navigate(item.href); } }}
                className={`w-full flex gap-3 p-4 text-left border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] ${!item.read ? 'bg-cyan-500/5' : ''}`}>
                <Icon size={17} className="text-[var(--clr-primary)] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1"><p className="text-xs font-bold">{item.title}</p><p className="text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-wrap break-words">{item.text}</p>
                  <time className="text-[10px] text-[var(--text-muted)] mt-2 block" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></div>
                {!item.read && <span aria-label="Não lida" className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 mt-1" />}
              </button>;
            })}
          </div>
          <div className="flex justify-between gap-2 p-3">
            <button type="button" disabled={!unreadCount} onClick={markAllRead} className="text-[11px] font-semibold text-[var(--clr-primary)] flex items-center gap-1 disabled:opacity-40"><CheckCheck size={14} />Marcar todas como lidas</button>
            <button type="button" onClick={() => { setOpen(false); navigate('/painel/configuracoes?section=notifications'); }} className="text-[11px] flex items-center gap-1 text-[var(--text-muted)]"><Settings size={14} />Preferências</button>
          </div>
        </section>
      )}
    </div>
  );
}
