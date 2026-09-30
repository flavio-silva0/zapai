"use strict";
// Real Supabase validation, with a generated disposable account. No email is sent.
require('dotenv').config({ quiet: true });
process.env.TEST_MODE = 'false';
require('express-async-errors');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const db = require('../src/utils/database')();
const { authClient, validateProfile } = require('../src/utils/registration');
const report = { date: new Date().toISOString(), checks: [], emailSent: false };
let createdId, server;
const password = 'Qa9!' + crypto.randomBytes(24).toString('hex');
const email = `qa-zapai-${crypto.randomUUID()}@example.com`;
async function main() {
  const publicClient = authClient();
  const anonDb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  for (const table of ['users','tenants','account_registrations','account_profiles']) {
    const result = await anonDb.from(table).select('*').limit(1);
    assert.ok(result.error, 'Anonymous read unexpectedly allowed: ' + table);
  }
  report.checks.push('Chave pública não lê usuários, empresas ou dados pessoais');
  const invalidRpc = await anonDb.rpc('complete_account_registration', { p_auth_id: crypto.randomUUID(), p_email: email, p_profile: {} });
  assert.ok(invalidRpc.error);
  report.checks.push('Chave pública não executa provisionamento');
  const app = express(); app.use(express.json()); app.use('/api/auth', require('../src/routes/auth'));
  app.use((err, req, res, next) => res.status(500).json({ error: 'Falha na verificação.' }));
  server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const request = async (endpoint, body, token) => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/auth${endpoint}`, {
      method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
    });
    return { status: res.status, data: await res.json() };
  };
  const config = await request('/config'); assert.equal(config.status, 200);
  assert.equal(config.data.key, process.env.SUPABASE_ANON_KEY);
  assert.notEqual(config.data.key, process.env.SUPABASE_SERVICE_KEY);
  assert.equal((await request('/session', { accessToken: 'invalid' })).status, 401);
  report.checks.push('Configuração entrega somente chave pública; token inválido é recusado');
  const generated = await db.auth.admin.generateLink({ type: 'signup', email, password, options: { redirectTo: process.env.AUTH_REDIRECT_URL } });
  if (generated.error) throw new Error('Falha ao criar link administrativo de teste: ' + generated.error.code);
  assert.equal(generated.data.user.email, email); createdId = generated.data.user.id;
  assert.ok(!generated.data.user.email_confirmed_at);
  const before = await publicClient.auth.signInWithPassword({ email, password });
  assert.ok(before.error); assert.equal(before.data.session, null);
  report.checks.push('Supabase recusa login antes da confirmação de e-mail');
  const profile = validateProfile({ nome: 'Pessoa QA Temporária', cpf: '52998224725', birthDate: '1990-01-01', phone: '11999999999', cep: '01001000', street: 'Endereço QA Temporário', number: '1', district: 'Centro', city: 'São Paulo', state: 'SP', businessName: 'Empresa QA Temporária', nicho: 'servicos', acceptPrivacy: true });
  const pending = await db.from('account_registrations').insert({ auth_user_id: createdId, profile });
  assert.equal(pending.error, null);
  const verified = await publicClient.auth.verifyOtp({ token_hash: generated.data.properties.hashed_token, type: 'signup' });
  assert.equal(verified.error, null); assert.ok(verified.data.user.email_confirmed_at);
  const accessToken = verified.data.session.access_token;
  report.checks.push('Link de confirmação real validado pelo Supabase sem envio de mensagem');
  const completed = await request('/session', { accessToken });
  assert.equal(completed.status, 200); assert.ok(completed.data.token);
  assert.equal(completed.data.user.role, 'owner'); assert.equal(completed.data.user.email, email);
  const again = await request('/session', { accessToken });
  assert.equal(again.data.user.id, completed.data.user.id);
  const me = await request('/me', null, completed.data.token); assert.equal(me.status, 200);
  assert.equal(me.data.user.id, completed.data.user.id);
  const stored = await db.from('account_profiles').select('profile').eq('user_id', me.data.user.id).single();
  assert.equal(stored.error, null); assert.equal(stored.data.profile.cpf, profile.cpf);
  const remaining = await db.from('account_registrations').select('auth_user_id').eq('auth_user_id', createdId);
  assert.equal(remaining.data.length, 0);
  report.checks.push('Empresa, usuário e perfil criados uma vez; dados pendentes removidos; JWT validado em /me');
  const login = await request('/login', { email, password }); assert.equal(login.status, 200); assert.ok(login.data.token);
  report.checks.push('Login posterior por e-mail e senha validado no backend real');
}
(async () => {
  try { await main(); report.success = true; }
  catch (e) { report.success = false; report.error = e instanceof assert.AssertionError ? 'Uma asserção da verificação real falhou: ' + e.message : e.message; process.exitCode = 1; }
  finally {
    if (server) await new Promise(r => server.close(r));
    if (createdId) {
      const own = await db.from('users').select('id,tenant_id,email').eq('auth_user_id', createdId).maybeSingle();
      let failed = Boolean(own.error);
      if (own.data) {
        if (own.data.email !== email) throw new Error('Identidade de limpeza divergente.');
        const removed = await db.from('users').delete().eq('id', own.data.id); failed ||= Boolean(removed.error);
        if (!removed.error && own.data.tenant_id) failed ||= Boolean((await db.from('tenants').delete().eq('id', own.data.tenant_id)).error);
      }
      if (!failed) failed = Boolean((await db.auth.admin.deleteUser(createdId)).error);
      report.disposableAccountRemoved = !failed;
      if (failed) { report.success = false; process.exitCode = 1; }
    }
    const output = path.resolve(__dirname, '../docs/qa-registration/supabase-real-verification.json');
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  }
})().catch(() => { console.error('Falha na verificação ou limpeza. Consulte os registros privados do servidor.'); process.exitCode = 1; });
