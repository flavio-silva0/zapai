"use strict";
const { createClient } = require('@supabase/supabase-js');
function authClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.AUTH_REDIRECT_URL) {
    throw Object.assign(new Error('Cadastro indisponível. Configure a autenticação do Supabase.'), { statusCode: 503 });
  }
  const key = process.env.SUPABASE_ANON_KEY;
  let role;
  try { role = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString()).role; } catch (_) {}
  if (key.startsWith('sb_secret_') || role === 'service_role') {
    throw Object.assign(new Error('Use apenas a chave pública anon/publishable na configuração de cadastro.'), { statusCode: 503 });
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
}
function validCPF(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  for (let n = 9; n <= 10; n++) {
    const sum = [...cpf.slice(0, n)].reduce((s, d, i) => s + Number(d) * (n + 1 - i), 0);
    if (Number(cpf[n]) !== ((sum * 10) % 11) % 10) return false;
  }
  return true;
}
function validateProfile(body) {
  const fields = ['nome', 'cpf', 'phone', 'birthDate', 'cep', 'street', 'number', 'complement', 'district', 'city', 'state', 'businessName', 'nicho'];
  const p = {};
  for (const f of fields) {
    if (body[f] !== undefined && (typeof body[f] !== 'string' || body[f].length > 180)) throw new Error('Campo inválido: ' + f);
    p[f] = (body[f] || '').trim();
  }
  if (p.nome.split(/\s+/).length < 2 || p.nome.length < 5) throw new Error('Informe seu nome completo.');
  if (!validCPF(p.cpf)) throw new Error('Informe um CPF válido.');
  p.cpf = p.cpf.replace(/\D/g, ''); p.phone = p.phone.replace(/\D/g, ''); p.cep = p.cep.replace(/\D/g, '');
  if (!/^[1-9]\d{9,10}$/.test(p.phone)) throw new Error('Informe um telefone com DDD válido.');
  const birth = new Date(p.birthDate + 'T12:00:00Z');
  const now = new Date(); const adult = new Date(now); adult.setUTCFullYear(now.getUTCFullYear() - 18);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate) || !Number.isFinite(+birth) || birth.toISOString().slice(0,10) !== p.birthDate || birth > adult || birth.getUTCFullYear() < now.getUTCFullYear() - 120) throw new Error('Informe uma data de nascimento válida. O cadastro é para maiores de 18 anos.');
  if (!/^\d{8}$/.test(p.cep) || !p.street || !p.number || !p.district || !p.city || !'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').includes(p.state)) throw new Error('Preencha o endereço completo.');
  if (p.businessName.length < 2 || !['dental','imobiliaria','saude','varejo','servicos','alimentacao','educacao','outro'].includes(p.nicho)) throw new Error('Informe sua empresa e segmento.');
  if (body.acceptPrivacy !== true) throw new Error('Leia e aceite a Política de Privacidade.');
  p.privacy_version = '2026-09-30'; p.accepted_at = new Date().toISOString();
  return p;
}
module.exports = { authClient, validCPF, validateProfile };
