"use strict";
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { ensureEmailLogo, ensureEmailFonts } = require('./lib/auth-email-assets.cjs');
const { buildAuthEmail } = require('../src/utils/authEmailTemplates');
const root = path.resolve(__dirname, '..');
const env = { ...dotenv.parse(fs.readFileSync(path.join(root, '.env'))), ...process.env };
(async () => {
  if (!env.SUPABASE_ACCESS_TOKEN) throw new Error('Token de gerenciamento ausente.');
  const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
  const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
  async function config(method = 'GET', body) {
    const r = await fetch(endpoint, { method, headers: { Authorization: 'Bearer ' + env.SUPABASE_ACCESS_TOKEN, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error('Supabase: atualização de templates retornou HTTP ' + r.status);
    return r.json();
  }
  const previous = await config();
  const logoUrl = await ensureEmailLogo(env);
  const font = await ensureEmailFonts(env);
  const patch = {
    mailer_subjects_confirmation: 'Seu próximo capítulo começa aqui — confirme sua conta ZapAI',
    mailer_templates_confirmation_content: buildAuthEmail('confirmation', { logoUrl, font }),
    mailer_subjects_recovery: 'Vamos recuperar seu acesso — ZapAI',
    mailer_templates_recovery_content: buildAuthEmail('recovery', { logoUrl, font }),
  };
  const out = path.join(root, 'templates/auth'); fs.mkdirSync(out, { recursive: true });
  for (const kind of ['confirmation', 'recovery']) {
    const html = patch[`mailer_templates_${kind}_content`];
    if (Buffer.byteLength(html) >= 90000 || !html.includes('href="{{ .ConfirmationURL }}"') || /<script|data:image|localhost/i.test(html)) throw new Error('Template inválido.');
    fs.writeFileSync(path.join(out, kind + '.html'), html);
    fs.writeFileSync(path.join(out, kind + '-preview.html'), html.replaceAll('{{ .ConfirmationURL }}', 'https://example.com/confirmar?token=PREVIA-SEM-VALIDADE'));
  }
  const qaDir = path.join(root, 'docs/qa-registration'); fs.mkdirSync(qaDir, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(':', '-');
  fs.writeFileSync(path.join(qaDir, 'email-template-backup-' + stamp + '.json'), JSON.stringify(Object.fromEntries(Object.keys(patch).map(k => [k, previous[k]])), null, 2));
  await config('PATCH', patch);
  const current = await config();
  if (!Object.entries(patch).every(([k, v]) => current[k] === v)) throw new Error('O Supabase não retornou os templates esperados.');
  for (const key of ['site_url','uri_allow_list','mailer_autoconfirm','external_google_enabled']) {
    if (current[key] !== previous[key]) throw new Error('Uma configuração fora dos templates foi alterada.');
  }
  const report = { date: new Date().toISOString(), updated: ['confirmation','recovery'], logoUrl, officialLogoVerified: true, remoteTemplatesVerified: true, unrelatedAuthSettingsPreserved: true, emailSent: false, sizes: Object.fromEntries(['confirmation','recovery'].map(k => [k, Buffer.byteLength(patch[`mailer_templates_${k}_content`])])) };
  fs.writeFileSync(path.join(qaDir, 'email-design-deployment.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
