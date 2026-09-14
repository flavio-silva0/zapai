// Audit-only launcher. Does not alter application files or remote services.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {pathToFileURL}=require('url');
const {spawn}=require('child_process');
const root=path.resolve(__dirname,'../../..');
const runtime=path.join(process.env.LOCALAPPDATA,'ZapAI-audit-runtime');
const evidence=path.resolve(__dirname,'../evidence');
const stateFile=path.join(runtime,'local-secrets.json');
fs.mkdirSync(evidence,{recursive:true});
(async()=>{
 const {default:EmbeddedPostgres}=await import(pathToFileURL(path.join(runtime,'node_modules/embedded-postgres/dist/index.js')));
 const pg=new EmbeddedPostgres({databaseDir:path.join(runtime,'pgdata'),user:'postgres',password:'zapai-local-only',port:55432,persistent:true,postgresFlags:['-h','127.0.0.1'],onLog:()=>{},onError:m=>console.log(String(m).slice(0,300))});
 if(!fs.existsSync(path.join(runtime,'pgdata/PG_VERSION')))await pg.initialise();
 await pg.start();
 const client=pg.getPgClient(); await client.connect();
 const secrets=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile)): {jwt:crypto.randomBytes(48).toString('hex'),rest:crypto.randomBytes(48).toString('hex')};
 fs.writeFileSync(stateFile,JSON.stringify(secrets));
 const version=await client.query('select version()');
 if(!(await client.query("select 1 from pg_database where datname='zapai_audit_utf8'")).rowCount){
  await client.query("create database zapai_audit_utf8 template template0 encoding 'UTF8' lc_collate 'C' lc_ctype 'C'");
 }
 if(!(await client.query("select 1 from pg_database where datname='zapai_migration_probe_utf8'")).rowCount){
  await client.query("create database zapai_migration_probe_utf8 template template0 encoding 'UTF8' lc_collate 'C' lc_ctype 'C'");
  const probe=pg.getPgClient('zapai_migration_probe_utf8');await probe.connect();
  const migrationResults=[];
  for(const name of ['migration-multitenant.sql','migration-whatsapp-idempotency.sql','migration-sandbox-tables.sql']){
   try{await probe.query(fs.readFileSync(path.join(root,'scripts',name),'utf8'));migrationResults.push({name,result:'passed'});}catch(e){migrationResults.push({name,result:'failed',code:e.code,message:e.message});}
  }
  fs.writeFileSync(path.join(evidence,'migration-probe.json'),JSON.stringify(migrationResults,null,2));await probe.end();
 }
 const db=pg.getPgClient('zapai_audit_utf8');await db.connect();
 if(!(await db.query("select to_regclass('public.tenants') existing")).rows[0].existing){
  const migration=fs.readFileSync(path.join(root,'scripts/migration-multitenant.sql'),'utf8');
  await db.query(migration.slice(0,migration.indexOf('-- ── 3.')));
  await db.query(`CREATE TABLE users_whatsapp(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),telefone text NOT NULL,nome text DEFAULT 'Contato',status_kanban text DEFAULT 'Novo',is_ai_active boolean DEFAULT true,ai_memory jsonb,created_at timestamptz DEFAULT now());
  CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),patient_id uuid REFERENCES users_whatsapp(id),texto text NOT NULL,origin text NOT NULL,created_at timestamptz DEFAULT now());
  CREATE TABLE patients(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
  DO $$BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF; END$$;`);
  await db.query(migration.slice(migration.indexOf('-- ── 3.')));
  await db.query(fs.readFileSync(path.join(root,'scripts/migration-whatsapp-idempotency.sql'),'utf8'));
  await db.query(fs.readFileSync(path.join(root,'scripts/migration-sandbox-tables.sql'),'utf8'));
  await db.query(`CREATE TABLE knowledge_base(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid REFERENCES tenants(id),content text NOT NULL,embedding text,created_at timestamptz DEFAULT now());
   CREATE FUNCTION match_knowledge(query_embedding text,match_threshold double precision,match_count integer,p_tenant_id uuid) RETURNS TABLE(id uuid,content text,similarity double precision) LANGUAGE sql STABLE AS $$ SELECT id,content,1.0::double precision FROM knowledge_base WHERE tenant_id=p_tenant_id LIMIT match_count $$;
   GRANT USAGE ON SCHEMA public TO service_role; GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role; GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;`);
  const bcrypt=require(path.join(root,'node_modules/bcryptjs'));
  const hash=await bcrypt.hash('ZapAI-local-2026!',12);
  for(const [id,name,email,phone] of [['11111111-1111-4111-8111-111111111111','Empresa Demo A','demo@zapai.local','AUDIT_PHONE_A'],['22222222-2222-4222-8222-222222222222','Empresa Demo B','empresa-b@zapai.local','AUDIT_PHONE_B']]){
   await db.query("INSERT INTO tenants(id,nome,status,phone_number_id,wa_access_token,prompt_text) VALUES($1,$2,'ativo',$3,'LOCAL_MOCK_ONLY','Você é a Zap. Este ambiente é uma demonstração local com dados fictícios.')",[id,name,phone]);
   await db.query("INSERT INTO users(tenant_id,email,password_hash,nome,role) VALUES($1,$2,$3,$4,'owner')",[id,email,hash,name]);
   const p=(await db.query("INSERT INTO users_whatsapp(tenant_id,nome,telefone) VALUES($1,$2,$3) RETURNING id",[id,`Contato fictício ${name.slice(-1)}`,phone==='AUDIT_PHONE_A'?'550000000001':'550000000002'])).rows[0];
   await db.query("INSERT INTO messages(tenant_id,patient_id,texto,origin) VALUES($1,$2,'Olá! Quero conhecer o atendimento. Dado fictício da auditoria.','user')",[id,p.id]);
  }
  await db.query("INSERT INTO users(email,password_hash,nome,role) VALUES('admin@zapai.local',$1,'Admin local','super_admin')",[hash]);
 }
 const config=`db-uri = "postgresql://postgres:zapai-local-only@127.0.0.1:55432/zapai_audit_utf8"\ndb-schemas = "public"\njwt-secret = "${secrets.rest}"\nserver-host = "127.0.0.1"\nserver-port = 55433\n`;
 fs.writeFileSync(path.join(runtime,'postgrest.conf'),config);
 const rest=spawn(path.join(runtime,'postgrest/postgrest.exe'),[path.join(runtime,'postgrest.conf')],{windowsHide:true,env:{...process.env,PATH:path.join(runtime,'node_modules/@embedded-postgres/windows-x64/native/bin')+';'+process.env.PATH},stdio:['ignore','ignore','pipe']});rest.stderr.on('data',d=>console.log(String(d).slice(0,200)));
 const jwt=require(path.join(root,'node_modules/jsonwebtoken'));
 const serviceKey=jwt.sign({role:'service_role'},secrets.rest,{expiresIn:'7d'});
 const http=require('http');
 const gateway=http.createServer((req,res)=>{const upstream=http.request({hostname:'127.0.0.1',port:55433,path:req.url.replace(/^\/rest\/v1/,'')||'/',method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});upstream.on('error',()=>{res.writeHead(503);res.end('Local PostgREST unavailable')});req.pipe(upstream)}).listen(55434,'127.0.0.1');
 const backend=spawn(process.execPath,[path.join(__dirname,'local-backend.cjs')],{cwd:root,windowsHide:true,env:{...process.env,TEST_MODE:'false',USE_REAL_GEMINI:'false',SUPABASE_URL:'http://127.0.0.1:55434',SUPABASE_SERVICE_KEY:serviceKey,GEMINI_API_KEY:'LOCAL_MOCK_ONLY',JWT_SECRET:secrets.jwt,PORT:'3001',FRONTEND_URL:'http://127.0.0.1:5173',DEBOUNCE_MS:'50',DELAY_MINIMO_MS:'0',DELAY_MAXIMO_MS:'0',MS_POR_PALAVRA:'0',DELAY_ENTRE_MENSAGENS_MIN_MS:'0',DELAY_ENTRE_MENSAGENS_MAX_MS:'0'},stdio:['ignore','pipe','pipe']});
 backend.stdout.pipe(fs.createWriteStream(path.join(runtime,'backend.log'),{flags:'a'}));backend.stderr.pipe(fs.createWriteStream(path.join(runtime,'backend-error.log'),{flags:'a'}));
 fs.writeFileSync(path.join(evidence,'local-stack.json'),JSON.stringify({postgres:version.rows[0].version,ports:{postgres:55432,postgrest:55433,supabaseGateway:55434,backend:3001,frontend:5173},dataDirectory:path.join(runtime,'pgdata'),limitations:['Schema base reconstructed for demonstration; not a verified production dump','RPC uses tenant-filtered rows without vector similarity; embeddings are mocked','Gemini and Meta are locally mocked; no real sends or charges'],pids:{launcher:process.pid,postgrest:rest.pid,backend:backend.pid}},null,2));
 console.log('Local PostgreSQL + PostgREST + Express ready. Frontend: http://127.0.0.1:5173');
 const stop=async()=>{backend.kill();rest.kill();gateway.close();await db.end();await client.end();await pg.stop();process.exit(0)};process.on('SIGINT',stop);process.on('SIGTERM',stop);
})().catch(e=>{console.error(e);process.exit(1)});
