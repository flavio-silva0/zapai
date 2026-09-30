"use strict";
const router = require('express').Router();
const db = require('../utils/database')();
const { authClient, validateProfile } = require('../utils/registration');
const { criarToken, credentialVersion } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/requestProtection');
router.use(['/session', '/resend', '/recover', '/reset-password'], rateLimit({ limit: 15, windowMs: 15 * 60000 }));
router.get('/config', async (req, res) => {
  try {
    authClient();
    const settingsResponse = await fetch(process.env.SUPABASE_URL + '/auth/v1/settings', {
      headers: { apikey: process.env.SUPABASE_ANON_KEY }, signal: AbortSignal.timeout(8000),
    });
    if (!settingsResponse.ok) throw new Error('Auth settings unavailable');
    const settings = await settingsResponse.json();
    res.json({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY, redirectTo: process.env.AUTH_REDIRECT_URL, googleEnabled: settings.external?.google === true });
  }
  catch (_) { res.status(503).json({ error: 'Cadastro com Google e confirmação por e-mail aguardam configuração.' }); }
});
router.post('/register', async (req, res) => {
  let profile;
  try { profile = validateProfile(req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
  const { email, password } = req.body;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ error: 'Informe um e-mail válido e uma senha com pelo menos 10 caracteres, letras e números.' });
  try {
    // Check the private storage before sending an email or creating an identity.
    const probe = await db.from('account_registrations').select('auth_user_id').limit(1);
    if (probe.error) throw new Error('storage unavailable');
    const { data: existing, error: lookupError } = await db.from('users').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (lookupError) throw new Error('storage unavailable');
    if (existing) return res.status(409).json({ error: 'Este e-mail já possui uma conta. Faça login.' });
    const { data, error } = await authClient().auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: process.env.AUTH_REDIRECT_URL, data: { full_name: profile.nome } } });
    if (error) return res.status(400).json({ error: 'Não foi possível enviar a confirmação. Tente novamente em alguns minutos.' });
    if (data.user?.id && data.user.identities?.length) {
      // Ignore duplicates so an unverified re-registration cannot overwrite personal data.
      const saved = await db.from('account_registrations').upsert({ auth_user_id: data.user.id, profile }, { onConflict: 'auth_user_id', ignoreDuplicates: true });
      if (saved.error) throw new Error('storage unavailable');
    }
    res.status(202).json({ requiresConfirmation: true, message: 'Confira seu e-mail para confirmar a conta. Se já estiver cadastrado, faça login ou recupere a senha.' });
  } catch (_) { res.status(503).json({ error: 'Cadastro temporariamente indisponível. Verifique a configuração da autenticação e do banco.' }); }
});
router.post('/session', async (req, res) => {
  const accessToken = req.body.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length > 10000) return res.status(401).json({ error: 'Sessão inválida.' });
  try {
    const { data, error } = await authClient().auth.getUser(accessToken);
    const identity = data.user;
    if (error || !identity?.email_confirmed_at || !identity.email) return res.status(401).json({ error: 'Confirme seu e-mail antes de continuar.' });
    let { data: user, error: lookupError } = await db.from('users').select('*').eq('auth_user_id', identity.id).maybeSingle();
    if (lookupError) throw new Error('storage unavailable');
    if (!user) {
      const pending = await db.from('account_registrations').select('profile').eq('auth_user_id', identity.id).maybeSingle();
      if (pending.error) throw new Error('storage unavailable');
      let profile = pending.data?.profile;
      if (!profile && !req.body.profile) return res.json({ needsProfile: true, email: identity.email, nome: identity.user_metadata?.full_name || '' });
      if (!profile) { try { profile = validateProfile(req.body.profile); } catch (e) { return res.status(400).json({ error: e.message }); } }
      const result = await db.rpc('complete_account_registration', { p_auth_id: identity.id, p_email: identity.email.toLowerCase(), p_profile: profile });
      if (result.error) {
        if (result.error.code === '23505') return res.status(409).json({ error: 'Este e-mail já possui uma conta. Entre pelo método original.' });
        throw new Error('provision unavailable');
      }
      const loaded = await db.from('users').select('*').eq('auth_user_id', identity.id).single();
      if (loaded.error) throw new Error('storage unavailable');
      user = loaded.data;
    }
    if (!user.is_active) return res.status(403).json({ error: 'Conta desativada.' });
    const tenantResult = await db.from('tenants').select('id,nome,status,bot_name,bot_emoji,trial_ends_at').eq('id', user.tenant_id).single();
    const tenant = tenantResult.data;
    if (tenantResult.error || !tenant || ['pausado','cancelado'].includes(tenant.status)) return res.status(403).json({ error: 'Conta indisponível.' });
    const token = criarToken({ userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role, credentialVersion: credentialVersion(user.password_hash) });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role }, tenant });
  } catch (_) { res.status(503).json({ error: 'Não foi possível concluir o cadastro. Tente novamente.' }); }
});
router.post('/reset-password', async (req, res) => {
  const { accessToken, password } = req.body;
  if (typeof accessToken !== 'string' || accessToken.length > 10000 || typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ error: 'Sessão ou senha inválida.' });
  try {
    const { data, error } = await authClient().auth.getUser(accessToken);
    if (error || !data.user?.email_confirmed_at) return res.status(401).json({ error: 'Link inválido ou expirado.' });
    const current = await db.from('users').select('id').eq('auth_user_id', data.user.id).maybeSingle();
    if (current.error || !current.data) return res.status(400).json({ error: 'Esta conta usa o método de acesso original. Contate o suporte.' });
    // Rotate first: if the provider update fails, old application sessions remain revoked.
    const rotated = await db.from('users').update({ password_hash: 'supabase:' + require('crypto').randomUUID() }).eq('id', current.data.id);
    if (rotated.error) throw new Error('storage unavailable');
    const updated = await db.auth.admin.updateUserById(data.user.id, { password });
    if (updated.error) throw new Error('provider unavailable');
    res.json({ success: true });
  } catch (_) { res.status(503).json({ error: 'Não foi possível alterar a senha. Tente novamente.' }); }
});
for (const path of ['/resend', '/recover']) router.post(path, async (req, res) => {
  const email = req.body.email;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Informe um e-mail válido.' });
  try {
    const auth = authClient().auth;
    const result = path === '/resend' ? await auth.resend({ type: 'signup', email, options: { emailRedirectTo: process.env.AUTH_REDIRECT_URL } }) : await auth.resetPasswordForEmail(email, { redirectTo: process.env.AUTH_REDIRECT_URL });
    if (result.error) return res.status(429).json({ error: 'Não foi possível enviar agora. Aguarde alguns minutos e tente novamente.' });
    res.json({ message: 'Se houver uma conta elegível, você receberá um link por e-mail.' });
  } catch (_) { res.status(503).json({ error: 'Envio de e-mail indisponível.' }); }
});
module.exports = router;
