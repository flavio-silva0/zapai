import { createClient } from '@supabase/supabase-js';
import { apiFetch } from './api';
let clientPromise;
export function registrationClient() {
  return clientPromise ||= (async () => {
    const res = await apiFetch('/api/auth/config');
    const config = await res.json();
    if (!res.ok) throw new Error(config.error);
    return { client: createClient(config.url, config.key, { auth: { storage: sessionStorage, persistSession: true, autoRefreshToken: false, detectSessionInUrl: true, flowType: 'implicit' } }), redirectTo: config.redirectTo, googleEnabled: config.googleEnabled };
  })().catch(error => { clientPromise = null; throw error; });
}
export async function googleSignIn() {
  const { client, redirectTo, googleEnabled } = await registrationClient();
  if (googleEnabled === false) throw new Error('O acesso com Google ainda não está disponível. Use seu e-mail para criar a conta ou entrar.');
  const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, queryParams: { prompt: 'select_account' } } });
  if (error) throw new Error('Não foi possível entrar com Google. Tente novamente.');
}
