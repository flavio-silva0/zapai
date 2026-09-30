"use strict";
// Uses the user's existing Management API token. Never prints or exports credentials.
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
const env = { ...dotenv.parse(fs.readFileSync(envFile)), ...process.env };
const report = { date: new Date().toISOString(), applied: [], pending: [] };
async function main() {
  if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('SUPABASE_ACCESS_TOKEN ausente.');
  const projectRef = new URL(env.SUPABASE_URL).hostname.split('.')[0];
  async function management(endpoint, method = 'GET', body) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/${endpoint}`, {
      method, headers: { Authorization: 'Bearer ' + env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error(`Supabase Management: ${method} ${endpoint.split('?')[0]} retornou HTTP ${response.status}.`);
    return response.json();
  }
  const current = await management('config/auth');
  const keys = await management('api-keys?reveal=true');
  const publicKey = keys.find(k => k.name === 'anon' && k.type === 'legacy')?.api_key;
  if (!publicKey) throw new Error('Chave pública anon indisponível.');
  const role = JSON.parse(Buffer.from(publicKey.split('.')[1], 'base64url')).role;
  if (role !== 'anon') throw new Error('A chave retornada não é pública.');
  // Preserve a configured production URL; replace only the unused default localhost:3000.
  const base = env.FRONTEND_URL || (current.site_url && current.site_url !== 'http://localhost:3000' ? current.site_url : 'http://localhost:5173');
  const redirect = env.AUTH_REDIRECT_URL || new URL('/auth/confirmacao', base).href;
  const parsed = new URL(redirect);
  if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) throw new Error('URL de retorno inválida.');
  const before = await management('database/query', 'POST', { query: 'select (select count(*) from public.users)::int as users, (select count(*) from public.tenants)::int as tenants;', read_only: true });
  const sql = fs.readFileSync(path.join(root, 'scripts/migration-account-registration.sql'), 'utf8');
  await management('database/query', 'POST', { query: sql });
  report.applied.push('Migration de cadastro e permissões privadas');
  const allow = new Set((current.uri_allow_list || '').split(',').map(s => s.trim()).filter(Boolean));
  allow.add(redirect);
  if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    allow.add('http://localhost:5173/auth/confirmacao'); allow.add('http://127.0.0.1:5173/auth/confirmacao');
  }
  const { buildAuthEmail } = require('../src/utils/authEmailTemplates');
  const { ensureEmailLogo, ensureEmailFonts } = require('./lib/auth-email-assets.cjs');
  const logoUrl = await ensureEmailLogo(env);
  const font = await ensureEmailFonts(env);
  const patch = {
    site_url: new URL(base).origin, uri_allow_list: [...allow].join(','),
    external_email_enabled: true, mailer_autoconfirm: false,
    mailer_subjects_confirmation: 'Seu próximo capítulo começa aqui — confirme sua conta ZapAI',
    mailer_templates_confirmation_content: buildAuthEmail('confirmation', { logoUrl, font }),
    mailer_subjects_recovery: 'Vamos recuperar seu acesso — ZapAI',
    mailer_templates_recovery_content: buildAuthEmail('recovery', { logoUrl, font }),
  };
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    Object.assign(patch, { external_google_enabled: true, external_google_client_id: env.GOOGLE_CLIENT_ID, external_google_secret: env.GOOGLE_CLIENT_SECRET });
  } else if (!current.external_google_enabled) report.pending.push('GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET');
  const smtpFields = { SMTP_HOST: 'smtp_host', SMTP_PORT: 'smtp_port', SMTP_USER: 'smtp_user', SMTP_PASS: 'smtp_pass', SMTP_ADMIN_EMAIL: 'smtp_admin_email' };
  if (Object.keys(smtpFields).every(k => env[k])) {
    for (const [key, field] of Object.entries(smtpFields)) patch[field] = env[key];
    patch.smtp_sender_name = env.SMTP_SENDER_NAME || 'ZapAI';
  } else if (!current.smtp_host) report.pending.push('SMTP próprio para envio de e-mail a usuários externos');
  await management('config/auth', 'PATCH', patch);
  report.applied.push('Confirmação obrigatória, URLs de retorno e templates ZapAI');
  // Re-read before writing so unrelated manual .env changes are preserved.
  let contents = fs.readFileSync(envFile, 'utf8');
  for (const [key, value] of Object.entries({ SUPABASE_ANON_KEY: publicKey, AUTH_REDIRECT_URL: redirect, FRONTEND_URL: new URL(base).origin })) {
    const line = `${key}=${JSON.stringify(value)}`;
    const re = new RegExp('^\\s*' + key + '=.*$', 'm');
    contents = re.test(contents) ? contents.replace(re, () => line) : contents.replace(/\s*$/, '') + '\n' + line + '\n';
  }
  fs.writeFileSync(envFile, contents);
  report.applied.push('Chave pública e URLs salvas apenas no .env local');
  const after = await management('database/query', 'POST', { query: `select
    (select count(*) from public.users)::int as users,
    (select count(*) from public.tenants)::int as tenants,
    to_regclass('public.account_registrations') is not null as registrations_present,
    to_regclass('public.account_profiles') is not null as profiles_present,
    to_regprocedure('public.complete_account_registration(uuid,text,jsonb)') is not null as function_present,
    has_table_privilege('anon','public.users','select') as anon_users_read,
    has_table_privilege('authenticated','public.account_profiles','select') as authenticated_profiles_read,
    has_function_privilege('anon','public.complete_account_registration(uuid,text,jsonb)','execute') as anon_provision;
  `, read_only: true });
  const verified = await management('config/auth');
  report.database = { before, after };
  report.auth = { confirmEmail: verified.mailer_autoconfirm === false, googleEnabled: verified.external_google_enabled, smtpConfigured: Boolean(verified.smtp_host), siteUrl: verified.site_url, callback: redirect, callbackAllowed: (verified.uri_allow_list || '').split(',').includes(redirect) };
  if (!report.auth.confirmEmail || !report.auth.callbackAllowed || !after[0]?.function_present || after[0]?.anon_users_read || after[0]?.authenticated_profiles_read || after[0]?.anon_provision) throw new Error('A configuração foi aplicada, mas a verificação final falhou.');
  const output = path.join(root, 'docs/qa-registration/supabase-activation.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
