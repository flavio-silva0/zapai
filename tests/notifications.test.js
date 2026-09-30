"use strict";
Object.assign(process.env, { TEST_MODE: 'true', NODE_ENV: 'test', JWT_SECRET: 'isolated-notifications-test-secret' });
const assert = require('node:assert/strict');
const express = require('express');
const db = require('../src/mocks/supabaseMock');
const { criarToken, credentialVersion } = require('../src/middleware/authMiddleware');
const { router, buildNotifications } = require('../src/routes/notifications');

(async () => {
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 40 * 86400000).toISOString();
  const feed = buildNotifications([
    { id: 1, patient_id: 1, tenant_id: 1, origin: 'user', texto: '<script>alert(1)</script>', created_at: now },
    { id: 2, patient_id: 1, tenant_id: 1, origin: 'assistant', created_at: now },
    { id: 3, patient_id: 1, tenant_id: 1, origin: 'user', created_at: old },
  ], [{ id: 1, tenant_id: 1, nome: 'Cliente A', created_at: now }]);
  assert.deepEqual(feed.map(n => n.id).sort(), ['contact:1', 'message:1']);
  assert.equal(feed.find(n => n.type === 'newMessages').title, 'Mensagem de Cliente A');
  assert.ok(feed.find(n => n.type === 'newMessages').href.includes('patientId=1'));
  const { data: user } = await db.from('users').select('*').eq('id', 1).single();
  const token = criarToken({ userId: user.id, tenantId: 1, credentialVersion: credentialVersion(user.password_hash) });
  db.reset();
  db.users_whatsapp.push({ id: 1, tenant_id: 1, nome: 'Cliente A', created_at: now }, { id: 2, tenant_id: 2, nome: 'Cliente B', created_at: now });
  db.messages.push({ id: 1, patient_id: 1, tenant_id: 1, origin: 'user', texto: 'Mensagem A', created_at: now }, { id: 2, patient_id: 2, tenant_id: 2, origin: 'user', texto: 'Segredo B', created_at: now });
  const app = express();
  app.use('/api/notifications', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/notifications`;
  try {
    assert.equal((await fetch(url)).status, 401);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const data = await response.json();
    assert.equal(data.notifications.length, 2);
    assert.ok(!JSON.stringify(data).includes('Segredo B'));
    assert.ok(!JSON.stringify(data).includes('Cliente B'));
    // Resolve contact names outside the latest 100 contacts without broadening tenant scope.
    for (let i = 0; i < 101; i++) db.users_whatsapp.push({ id: 100 + i, tenant_id: 1, nome: 'Recente', created_at: new Date(Date.now() + i).toISOString() });
    const resolved = await (await fetch(url, { headers: { Authorization: `Bearer ${token}` } })).json();
    assert.equal(resolved.notifications.find(n => n.id === 'message:1').title, 'Mensagem de Cliente A');
    const originalFrom = db.from;
    db.from = table => table === 'messages' ? { select: () => { const builder = { eq: () => builder, order: () => builder, limit: async () => ({ error: {} }) }; return builder; } } : originalFrom(table);
    try { assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${token}` } })).status, 503); }
    finally { db.from = originalFrom; }
    console.log('PASS: authenticated notifications, tenant isolation, inbound only, 30-day window, contact lookup, DB errors.');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exit(1); });
