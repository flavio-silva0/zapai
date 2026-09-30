"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const { validCPF, validateProfile } = require('../src/utils/registration');
const profile = { nome: 'Pessoa Teste', cpf: '529.982.247-25', phone: '(11) 99999-9999', birthDate: '1990-01-01', cep: '01001-000', street: 'Praça Teste', number: '1', district: 'Centro', city: 'São Paulo', state: 'SP', businessName: 'Empresa Teste', nicho: 'servicos', acceptPrivacy: true };
(async () => {
  assert.equal(validCPF(profile.cpf), true);
  for (const cpf of ['11111111111', '12345678901', '', '52998224724']) assert.equal(validCPF(cpf), false);
  for (const patch of [{ cpf: 'invalid' }, { acceptPrivacy: false }, { birthDate: '2020-01-01' }, { birthDate: '1990-02-31' }, { phone: '1234' }, { state: 'XX' }, { cep: '1234' }, { nome: 'Pessoa' }, { street: {} }]) assert.throws(() => validateProfile({ ...profile, ...patch }));
  const validated = validateProfile(profile);
  assert.equal(validated.cpf, '52998224725');
  assert.equal(validated.privacy_version, '2026-09-30');
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;
      create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create table public.tenants(id uuid primary key default gen_random_uuid(),nome text,nicho text,clinic_name text,bot_name text,bot_emoji text,status text);
      create table public.users(id uuid primary key default gen_random_uuid(),tenant_id uuid references tenants(id),email text unique,nome text,password_hash text,role text);
      insert into auth.users values ('00000000-0000-0000-0000-000000000001','test@example.com',now()), ('00000000-0000-0000-0000-000000000002','pending@example.com',null), ('00000000-0000-0000-0000-000000000003','test@example.com',now());`);
    const migration = fs.readFileSync(require.resolve('../scripts/migration-account-registration.sql'), 'utf8');
    await db.exec(migration); await db.exec(migration);
    const complete = async (id, email) => (await db.query('select complete_account_registration($1,$2,$3) as id', [id, email, validated])).rows[0].id;
    const id = '00000000-0000-0000-0000-000000000001';
    await assert.rejects(complete('00000000-0000-0000-0000-000000000002','pending@example.com'), /Unverified/);
    await assert.rejects(complete(id, 'spoof@example.com'), /Unverified/);
    const first = await complete(id,'test@example.com');
    assert.equal(await complete(id,'test@example.com'), first);
    await assert.rejects(complete('00000000-0000-0000-0000-000000000003','test@example.com'), /unique/);
    assert.equal((await db.query('select count(*)::int as n from tenants')).rows[0].n, 1);
    assert.equal((await db.query('select count(*)::int as n from account_profiles')).rows[0].n, 1);
    for (const role of ['anon','authenticated']) {
      await db.exec('set role ' + role);
      await assert.rejects(complete(id,'test@example.com'), /permission denied/);
      await assert.rejects(db.query('select * from account_profiles'), /permission denied/);
      await assert.rejects(db.query('select * from account_registrations'), /permission denied/);
      await assert.rejects(db.query('select * from users'), /permission denied/);
      await assert.rejects(db.query('select * from tenants'), /permission denied/);
      await db.exec('reset role');
    }
    console.log('Account registration passed: CPF, fields, privacy, confirmed identity, atomic rollback, idempotency and private data permissions.');
  } finally { await db.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
