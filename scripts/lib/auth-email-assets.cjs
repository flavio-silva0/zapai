"use strict";
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
async function ensureEmailLogo(env) {
  const file = path.resolve(__dirname, '../../frontend/public/zapai-logo-dark.png');
  const bytes = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = 'zapai-brand-assets';
  const listed = await client.storage.listBuckets();
  if (listed.error) throw new Error('Não foi possível verificar o armazenamento da logo.');
  const existing = listed.data.find(b => b.name === bucket);
  if (!existing) {
    const created = await client.storage.createBucket(bucket, { public: true, fileSizeLimit: 1048576, allowedMimeTypes: ['image/png'] });
    if (created.error) throw new Error('Não foi possível criar o armazenamento público de branding.');
  } else if (!existing.public) throw new Error('O bucket de branding existente é privado. Nenhuma permissão foi alterada.');
  const objectPath = `email/zapai-logo-blue-${hash.slice(0, 12)}.png`;
  const uploaded = await client.storage.from(bucket).upload(objectPath, bytes, { contentType: 'image/png', cacheControl: '31536000', upsert: true });
  if (uploaded.error) throw new Error('Não foi possível publicar a logo oficial.');
  const logoUrl = client.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
  const response = await fetch(logoUrl, { signal: AbortSignal.timeout(20000) });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw new Error('A logo não está acessível publicamente.');
  const remoteHash = crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
  if (remoteHash !== hash) throw new Error('O arquivo público não corresponde à logo oficial.');
  return logoUrl;
}
async function ensureEmailFonts(env) {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  const bucket = 'zapai-brand-fonts';
  const listed = await client.storage.listBuckets();
  if (listed.error) throw new Error('Falha ao consultar fontes.');
  if (!listed.data.some(b => b.name === bucket)) {
    const created = await client.storage.createBucket(bucket, { public: true, fileSizeLimit: 1048576, allowedMimeTypes: ['font/ttf','text/css'] });
    if (created.error) throw new Error('Falha ao preparar fontes públicas.');
  }
  let css = fs.readFileSync(path.resolve(__dirname,'../../templates/auth/inter-google-fonts.css'),'utf8');
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(urls[i],{signal:AbortSignal.timeout(20000)});
    if (!res.ok) throw new Error('Falha ao obter Inter oficial.');
    const bytes = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
    const object = 'inter-' + [400,500,600,700,800][i] + '-' + hash + '.ttf';
    const up = await client.storage.from(bucket).upload(object,bytes,{contentType:'font/ttf',cacheControl:'31536000',upsert:true});
    if (up.error) throw new Error('Falha ao hospedar Inter.');
    css = css.replace(urls[i],client.storage.from(bucket).getPublicUrl(object).data.publicUrl);
  }
  const upload = await client.storage.from(bucket).upload('inter.css',Buffer.from(css),{contentType:'text/css',cacheControl:'3600',upsert:true});
  if (upload.error) throw new Error('Falha ao publicar CSS Inter.');
  return { css, url:client.storage.from(bucket).getPublicUrl('inter.css').data.publicUrl };
}
module.exports = { ensureEmailLogo, ensureEmailFonts };
