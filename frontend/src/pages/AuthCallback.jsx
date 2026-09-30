import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrationClient } from '../registrationAuth';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate(); const { login } = useAuth();
  const started = useRef(false); const [error, setError] = useState('');
  const [recovery, setRecovery] = useState(false); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecovery = hash.get('type') === 'recovery';
    (async () => {
      const { client } = await registrationClient();
      const { data, error: sessionError } = await client.auth.getSession();
      window.history.replaceState({}, '', '/auth/confirmacao');
      if (sessionError || !data.session || hash.has('error')) throw new Error('Link inválido ou expirado. Solicite um novo e-mail de confirmação.');
      if (isRecovery) { setRecovery(true); return; }
      const res = await apiFetch('/api/auth/session', { method: 'POST', body: JSON.stringify({ accessToken: data.session.access_token }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      if (result.needsProfile) { navigate('/cadastro?completar=1', { replace: true }); return; }
      login(result.token, result.user, result.tenant);
      await client.auth.signOut({ scope: 'local' });
      navigate('/painel', { replace: true });
    })().catch(e => setError(e.message));
  }, [navigate, login]);
  async function reset(e) {
    e.preventDefault();
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password) || password !== confirm) { setError('Use 10 caracteres, letras e números, e confirme a mesma senha.'); return; }
    setBusy(true); setError('');
    try {
      const { client } = await registrationClient();
      const { data } = await client.auth.getSession();
      const result = await apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ accessToken: data.session?.access_token, password }) });
      if (!result.ok) throw new Error((await result.json()).error);
      await client.auth.signOut({ scope: 'local' });
      navigate('/login', { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center p-6"><div className="w-full max-w-md space-y-5"><h1 className="text-2xl font-bold">{recovery ? 'Crie sua nova senha' : error ? 'Confirmação da conta' : 'Confirmando sua conta…'}</h1>{error && <p role="alert" className="text-rose-500">{error}</p>}{recovery && <form onSubmit={reset} className="space-y-4"><label className="block">Nova senha<input required type="password" autoComplete="new-password" className="input-premium mt-2" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block">Confirme a senha<input required type="password" autoComplete="new-password" className="input-premium mt-2" value={confirm} onChange={e => setConfirm(e.target.value)} /></label><button disabled={busy} className="btn-primary w-full">{busy ? 'Salvando…' : 'Salvar senha'}</button></form>}<Link className="text-cyan-600 block" to="/cadastro">Voltar ao cadastro / reenviar confirmação</Link></div></main>;
}
