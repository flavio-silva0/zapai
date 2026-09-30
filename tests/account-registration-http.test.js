"use strict";
const assert = require('node:assert/strict');
const express = require('express');
process.env.JWT_SECRET ||= 'registration-test-secret';
const helper = require('../src/utils/registration');
const profile = { nome:'Pessoa Teste', cpf:'52998224725', phone:'11999999999', birthDate:'1990-01-01', cep:'01001000', street:'Praça Teste', number:'1', district:'Centro', city:'São Paulo', state:'SP', businessName:'Empresa Teste', nicho:'servicos', acceptPrivacy:true };
const tables = { users:[], account_registrations:[], tenants:[] };
let provisions = 0, providerReads = 0;
const identity = { id:'verified-identity', email:'test@example.com', email_confirmed_at:'2026-09-30', user_metadata:{ full_name:'Pessoa Teste' } };
helper.authClient = () => ({ auth: {
  getUser: async token => { providerReads++; return token === 'verified' ? { data:{user:identity}, error:null } : { data:{user:{...identity,email_confirmed_at:null}}, error:null }; },
  signUp: async () => ({ data:{user:{ id:identity.id,identities:[{}] }},error:null }),
} });
const db = {
  from(table) {
    const filters = []; let patch;
    const execute = () => {
      const matches = tables[table].filter(row => filters.every(([k,v]) => row[k] === v));
      if (patch) matches.forEach(row => Object.assign(row,patch));
      return { data:matches, error:null };
    };
    const q = { select:()=>q, eq:(k,v)=>{filters.push([k,v]);return q;}, limit:()=>q,
      update:data=>{patch=data;return q;},
      upsert:async data=>{if(!tables[table].some(r=>r.auth_user_id===data.auth_user_id))tables[table].push(data);return {error:null};},
      maybeSingle:async()=>({ data:execute().data[0] || null,error:null }), single:async()=>({ data:execute().data[0] || null,error:null }),
      then:(resolve,reject)=>Promise.resolve(execute()).then(resolve,reject) };
    return q;
  },
  rpc: async (_name,args) => {
    assert.equal(args.p_auth_id,identity.id); assert.equal(args.p_email,identity.email);
    assert.equal(args.p_profile.role,undefined); provisions++;
    tables.users.push({id:'user',auth_user_id:identity.id,tenant_id:'tenant',email:identity.email,nome:profile.nome,role:'owner',is_active:true,password_hash:'private-version'});
    tables.tenants.push({id:'tenant',status:'trial'});return {data:'user',error:null};
  },
};
require.cache[require.resolve('../src/utils/database')] = { id:require.resolve('../src/utils/database'), filename:require.resolve('../src/utils/database'), loaded:true, exports:()=>db };
const app = express(); app.use(express.json()); app.use('/api/auth', require('../src/routes/registration'));
(async () => {
  const server = app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
  const post = async (path,body) => { const res=await fetch(`http://127.0.0.1:${server.address().port}/api/auth${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return { status:res.status,body:await res.json() }; };
  try {
    assert.equal((await post('/session',{accessToken:'unconfirmed',profile})).status,401);
    assert.equal(provisions,0);
    const need = await post('/session',{accessToken:'verified'});
    assert.equal(need.body.needsProfile,true);assert.equal(need.body.token,undefined);
    assert.equal((await post('/session',{accessToken:'verified',profile:{...profile,cpf:'11111111111'}})).status,400);
    const signup = await post('/register',{...profile,email:identity.email,password:'Password123!'});
    assert.equal(signup.status,202);assert.equal(signup.body.token,undefined);
    assert.equal(tables.account_registrations[0].profile.cpf,profile.cpf);
    const session = await post('/session',{accessToken:'verified',role:'super_admin',tenantId:'attacker'});
    assert.equal(session.status,200);assert.equal(session.body.user.role,'owner');assert.equal(session.body.tenant.id,'tenant');assert.ok(session.body.token);
    assert.equal(session.body.user.cpf,undefined);
    await post('/session',{accessToken:'verified'});assert.equal(provisions,1);
    tables.users[0].is_active=false;assert.equal((await post('/session',{accessToken:'verified'})).status,403);
    assert.ok(providerReads >= 6);
    console.log('Account HTTP passed: unconfirmed tokens denied, incomplete profiles denied, no signup session, verified server identity, role spoofing denied, retries and inactive users. Provider and storage simulated.');
  } finally { await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
