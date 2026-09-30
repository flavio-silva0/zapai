"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create table public.tenants(id uuid primary key, status text, trial_ends_at timestamptz, plan text);
      insert into tenants values ('00000000-0000-0000-0000-000000000001','ativo',null,'basic'),
      ('00000000-0000-0000-0000-000000000002','trial',now()-interval '1 day','basic');`);
    const migration = fs.readFileSync(require.resolve('../scripts/migration-ai-quotas.sql'), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // safe reapplication
    const reserve = async id => (await db.query('select reserve_ai_call($1) as ok', [id])).rows[0].ok;
    const tenant = '00000000-0000-0000-0000-000000000001';
    const attempts = await Promise.all(Array.from({ length: 65 }, () => reserve(tenant)));
    assert.equal(attempts.filter(Boolean).length, 60);
    await db.exec("update ai_usage set minute=now()-interval '2 minutes'");
    assert.equal(await reserve(tenant), true);
    await db.exec('update ai_usage set calls=500');
    assert.equal(await reserve(tenant), false);
    assert.equal(await reserve('00000000-0000-0000-0000-000000000002'), false);
    assert.equal(await reserve('00000000-0000-0000-0000-000000000003'), false);
    await db.exec('set role anon');
    await assert.rejects(reserve(tenant), /permission denied/);
    await db.exec('reset role');
    await db.exec(`alter table public.tenants add column phone_number_id text;
      create table public.users_whatsapp(id uuid primary key, tenant_id uuid, telefone text, created_at timestamptz default now());
      create table public.messages(id uuid primary key, tenant_id uuid, patient_id uuid, created_at timestamptz default now());`);
    const integrity = fs.readFileSync(require.resolve('../scripts/migration-tenant-integrity.sql'), 'utf8');
    await db.exec(integrity);
    await db.exec(integrity);
    const contact = '00000000-0000-0000-0000-000000000009';
    await db.query('insert into users_whatsapp(id,tenant_id,telefone) values($1,$2,$3)', [contact,tenant,'5511999999999']);
    await assert.rejects(db.query('insert into messages(id,tenant_id,patient_id) values($1,$2,$3)',
      [contact,'00000000-0000-0000-0000-000000000002',contact]), /foreign key/);
    await assert.rejects(db.query('insert into users_whatsapp(id,telefone) values($1,$2)',
      ['00000000-0000-0000-0000-000000000008','5511888888888']), /check constraint/);
    await db.exec('set role authenticated');
    await assert.rejects(reserve(tenant), /permission denied/);
    console.log('PostgreSQL tests passed: quotas, expiry, denied public execution, tenant FK, required tenant, repeatable migrations.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
