"use strict";
Object.assign(process.env, {
  NODE_ENV: 'test', TEST_MODE: 'true', USE_REAL_GEMINI: 'false', JWT_SECRET: 'isolated-regression-test-secret',
  SUPABASE_URL: 'http://localhost/mock', SUPABASE_SERVICE_KEY: 'mock', GEMINI_API_KEY: 'mock',
  META_APP_SECRET: '', DEBOUNCE_MS: '10', DELAY_MINIMO_MS: '0', DELAY_MAXIMO_MS: '0',
  DELAY_ENTRE_MENSAGENS_MIN_MS: '0', DELAY_ENTRE_MENSAGENS_MAX_MS: '0',
});
const assert = require('node:assert/strict');
const db = require('../src/mocks/supabaseMock');
const { criarToken, credentialVersion, validateSession } = require('../src/middleware/authMiddleware');
const { quotaModel } = require('../src/utils/aiQuota');
const { app } = require('../src/index');

(async () => {
  const { data: user } = await db.from('users').select('*').eq('id', 1).single();
  const original = { ...user };
  const token = criarToken({ userId: 1, tenantId: 1, role: 'owner', credentialVersion: credentialVersion(user.password_hash) });
  assert.equal((await validateSession(token)).tenantId, 1);
  await db.from('users').update({ role: 'viewer' }).eq('id', 1);
  assert.equal((await validateSession(token)).role, 'viewer');
  await db.from('users').update({ is_active: false }).eq('id', 1);
  await assert.rejects(validateSession(token));
  await db.from('users').update({ ...original, password_hash: 'changed' }).eq('id', 1);
  await assert.rejects(validateSession(token));
  await db.from('users').update({ ...original, tenant_id: null }).eq('id', 1);
  await assert.rejects(validateSession(token));
  await db.from('users').update(original).eq('id', 1);

  let calls = 0;
  const provider = { getGenerativeModel: () => ({
    generateContent: async () => ++calls,
    embedContent: async () => ++calls,
    startChat: () => ({ sendMessage: async () => ++calls }),
  }) };
  const rpc = db.rpc;
  try {
    db.rpc = async () => ({ data: false });
    const model = quotaModel(provider, 1, {});
    await assert.rejects(model.generateContent('x'), { statusCode: 429 });
    await assert.rejects(model.embedContent('x'), { statusCode: 429 });
    await assert.rejects(model.startChat().sendMessage('x'), { statusCode: 429 });
    assert.equal(calls, 0);
    db.rpc = async () => ({ error: { message: 'database unavailable' } });
    await assert.rejects(model.generateContent('x'), { statusCode: 503 });
    assert.equal(calls, 0);
    db.rpc = async () => ({ data: true });
    await model.generateContent('x');
    assert.equal(calls, 1);
  } finally { db.rpc = rpc; }

  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, options = {}) => fetch(base + path, options);
  try {
    assert.equal((await request('/api/events')).status, 401);
    assert.equal((await request('/api/events?token=' + token)).status, 401);
    assert.equal((await request('/api/admin/seed', { method: 'POST' })).status, 404);
    const evil = await request('/health', { headers: { Origin: 'https://zapai-attacker.vercel.app' } });
    assert.equal(evil.headers.get('access-control-allow-origin'), null);
    assert.equal(evil.headers.get('x-content-type-options'), 'nosniff');
    assert.equal((await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: {}, password: 'abc' }) })).status, 400);
    await db.from('users').update({ role: 'viewer' }).eq('id', 1);
    assert.equal((await request('/api/patients', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ telefone: '123' }) })).status, 403);
    await db.from('users').update(original).eq('id', 1);
    // Insights must use the existing tenant schema and distinguish DB failures from absent contacts.
    await db.from('users_whatsapp').insert({ id: 23, tenant_id: 1, nome: 'Insights test', ai_memory: { interesse: 'Consulta' } });
    const originalFrom = db.from;
    const insightsOptions = { method: 'POST', headers: { Authorization: `Bearer ${token}` } };
    try {
      db.from = function (table) {
        const query = originalFrom.call(this, table);
        if (table === 'users_whatsapp') {
          const select = query.select;
          query.select = function (columns) {
            assert.equal(columns.includes('segmento'), false, 'tenants has nicho, not segmento');
            return select.call(this, columns);
          };
        }
        return query;
      };
      const insights = await request('/api/patients/23/ai-insights', insightsOptions);
      assert.equal(insights.status, 200);
      const analysis = await insights.json();
      assert.ok(analysis.summary);
      assert.equal(analysis.key_points.length, 3);
      assert.equal(analysis.next_steps.length, 5);
      assert.equal(analysis.schema_version, 2);
      assert.ok(analysis.sentiment_reason);
      assert.ok(analysis.closing_reason);
      assert.equal((await request('/api/patients/999999/ai-insights', insightsOptions)).status, 404);
      await db.from('users_whatsapp').insert({ id: 24, tenant_id: 2, nome: 'Private insights' });
      assert.equal((await request('/api/patients/24/ai-insights', insightsOptions)).status, 404);
      db.from = function (table) {
        const query = originalFrom.call(this, table);
        if (table === 'users_whatsapp') {
          const select = query.select;
          query.select = function (columns) {
            const builder = select.call(this, columns);
            builder.maybeSingle = async () => ({ data: null, error: { code: '42703' } });
            return builder;
          };
        }
        return query;
      };
      const unavailable = await request('/api/patients/23/ai-insights', insightsOptions);
      assert.equal(unavailable.status, 500);
      assert.match((await unavailable.json()).error, /consultar o contato/);
    } finally { db.from = originalFrom; }
    process.env.TEST_MODE = 'false';
    assert.equal((await request('/webhook/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 503);
    process.env.TEST_MODE = 'true';
    const message = (id, from) => ({ id, from, type: 'text', text: { body: 'Olá' } });
    const batch = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'TEST_PHONE_ID' },
      messages: [message('batch-1', '5511988888888'), message('batch-2', '5511977777777')],
    } }] }] };
    assert.equal((await request('/webhook/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch) })).status, 200);
    await new Promise(resolve => setTimeout(resolve, 100));
    const { data: incoming } = await db.from('messages').select('*').eq('origin', 'user');
    assert.equal(incoming.length, 2, 'Every message in the webhook batch must be recorded');

    // A cannot read B, and a B event must not arrive on A's stream.
    await db.from('users_whatsapp').insert({ id: 999, telefone: '5511966666666', tenant_id: 2, nome: 'B only' });
    const list = await request('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).some(patient => patient.tenant_id === 2), false);
    const abort = new AbortController();
    const response = await request('/api/events', { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal });
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    await reader.read(); // connected event
    await db.from('users').insert({ id: 2, tenant_id: 2, role: 'owner', is_active: true, password_hash: 'b' });
    await db.from('tenants').insert({ id: 2, status: 'ativo' });
    const tokenB = criarToken({ userId: 2, tenantId: 2, credentialVersion: credentialVersion('b') });
    const createB = await request('/api/patients', { method: 'POST', headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ telefone: '11955555555', nome: 'Private B' }) });
    assert.equal(createB.status, 201);
    const nextEvent = reader.read();
    const event = await Promise.race([nextEvent, new Promise(resolve => setTimeout(() => resolve(null), 80))]);
    assert.equal(event, null, 'A must not receive B events');
    abort.abort();
    await nextEvent.catch(() => {});
    for (let i = 0; i < 15; i++) await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal((await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 429);
    console.log('Security regressions passed: session revocation, tenant, RBAC, HMAC, CORS, quota fail-closed, rate limit.');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
