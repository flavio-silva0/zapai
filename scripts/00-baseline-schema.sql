-- ============================================================
-- ZapAI — Baseline Schema Completo e Reproduzível
-- Resolve DB-001, DB-002, DB-003 da Auditoria de Prontidão
-- Execute este script no Supabase SQL Editor para inicializar
-- ou recriar a infraestrutura completa de banco de dados.
-- ============================================================

-- ── 1. EXTENSÕES ─────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ── 2. TABELA: TENANTS (Organizações / Assinantes) ───────────
create table if not exists tenants (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  nicho           text not null default 'geral',
  status          text not null default 'trial'
                  check (status in ('trial', 'ativo', 'pausado', 'cancelado')),

  -- Identidade e personalização do Atendente IA
  bot_name        text not null default 'Sofia',
  bot_emoji       text not null default '🤖',
  clinic_name     text,
  clinic_phone    text,
  is_ai_active    boolean not null default true,

  -- Prompt compilado / instruções do sistema
  prompt_text     text,

  -- Meta Cloud API WhatsApp
  phone_number_id text unique,        -- DB-003: Unicidade de número oficial Meta
  wa_access_token text,               -- Token permanente de acesso

  -- Assinatura e ciclo de vida
  trial_ends_at   timestamptz not null default (now() + interval '7 days'),
  plan            text not null default 'basic'
                  check (plan in ('basic', 'pro', 'enterprise')),
  is_sandbox      boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 3. TABELA: USERS (Usuários e Operadores do Painel) ───────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade,
  email         text unique not null,
  password_hash text not null,
  nome          text not null default 'Usuário',
  role          text not null default 'owner'
                check (role in ('owner', 'agent', 'viewer', 'super_admin')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── 4. TABELA: USERS_WHATSAPP (Leads e Contatos de Atendimento)
create table if not exists users_whatsapp (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade,
  telefone      text not null,
  nome          text default 'Contato',
  status_kanban text default 'Novo',
  is_ai_active  boolean default true,
  ai_memory     jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  -- DB-003: Impede duplicações de contato dentro do mesmo tenant
  constraint uq_users_whatsapp_tenant_telefone unique (tenant_id, telefone)
);

-- Compatibilidade com legado: alias/view se necessário
create index if not exists idx_users_whatsapp_tenant_id on users_whatsapp(tenant_id);
create index if not exists idx_users_whatsapp_telefone on users_whatsapp(telefone);
create index if not exists idx_users_whatsapp_tenant_telefone on users_whatsapp(tenant_id, telefone);

-- ── 5. TABELA: MESSAGES (Mensagens trocadas) ─────────────────
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  patient_id  uuid references users_whatsapp(id) on delete cascade,
  texto       text not null,
  origin      text not null check (origin in ('user', 'bot', 'human')),
  created_at  timestamptz default now()
);

create index if not exists idx_messages_tenant_id on messages(tenant_id);
create index if not exists idx_messages_patient_id on messages(patient_id);
create index if not exists idx_messages_created_at on messages(created_at);

-- ── 6. TABELA: KNOWLEDGE_BASE (Base Vetorial RAG) ────────────
create table if not exists knowledge_base (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  content     text not null,
  embedding   vector(768),
  created_at  timestamptz default now()
);

create index if not exists idx_knowledge_base_tenant_id on knowledge_base(tenant_id);

-- ── 7. TABELA: WHATSAPP_MESSAGE_PROCESSING (Idempotência Webhook)
create table if not exists whatsapp_message_processing (
  id                    uuid primary key default gen_random_uuid(),
  whatsapp_message_id   text not null unique,
  tenant_id             uuid references tenants(id) on delete cascade,
  patient_id            text,
  phone_number_id       text,
  from_phone            text,
  status                text not null default 'received'
                        check (status in ('received', 'processing', 'answered', 'failed')),
  last_error            text,
  received_at           timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_whatsapp_message_processing_tenant_id on whatsapp_message_processing(tenant_id);
create index if not exists idx_whatsapp_message_processing_status on whatsapp_message_processing(status);

-- ── 8. TABELAS SANDBOX (Isolamento para Testes de IA) ─────────
create table if not exists users_whatsapp_sandbox (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade,
  telefone      text not null,
  nome          text default 'Contato',
  status_kanban text default 'Novo',
  is_ai_active  boolean default true,
  ai_memory     jsonb,
  created_at    timestamptz default now(),
  constraint uq_users_whatsapp_sandbox_tenant_tel unique (tenant_id, telefone)
);

create index if not exists idx_users_whatsapp_sandbox_tenant on users_whatsapp_sandbox(tenant_id);

create table if not exists messages_sandbox (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  patient_id  uuid references users_whatsapp_sandbox(id) on delete cascade,
  texto       text not null,
  origin      text not null,
  created_at  timestamptz default now()
);

create index if not exists idx_messages_sandbox_tenant on messages_sandbox(tenant_id);

create table if not exists whatsapp_message_processing_sandbox (
  id                    uuid primary key default gen_random_uuid(),
  whatsapp_message_id   text not null unique,
  tenant_id             uuid references tenants(id) on delete cascade,
  patient_id            text,
  phone_number_id       text,
  from_phone            text,
  status                text not null default 'received'
                        check (status in ('received', 'processing', 'answered', 'failed')),
  last_error            text,
  received_at           timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── 9. FUNÇÕES E TRIGGERS ────────────────────────────────────

-- Atualização automática de updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenants_updated_at on tenants;
create trigger trg_tenants_updated_at
  before update on tenants
  for each row execute function update_updated_at_column();

drop trigger if exists trg_users_whatsapp_updated_at on users_whatsapp;
create trigger trg_users_whatsapp_updated_at
  before update on users_whatsapp
  for each row execute function update_updated_at_column();

drop trigger if exists trg_whatsapp_message_processing_updated_at on whatsapp_message_processing;
create trigger trg_whatsapp_message_processing_updated_at
  before update on whatsapp_message_processing
  for each row execute function update_updated_at_column();

-- RPC match_knowledge para busca vetorial RAG
create or replace function match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_tenant_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
set search_path = public
as $$
  select
    knowledge_base.id,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where knowledge_base.tenant_id = p_tenant_id
    and 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;

-- ── 10. SEGURANÇA: ROW LEVEL SECURITY (DB-002) ───────────────
-- Habilita RLS em todas as tabelas
alter table tenants enable row level security;
alter table users enable row level security;
alter table users_whatsapp enable row level security;
alter table messages enable row level security;
alter table knowledge_base enable row level security;
alter table whatsapp_message_processing enable row level security;
alter table users_whatsapp_sandbox enable row level security;
alter table messages_sandbox enable row level security;
alter table whatsapp_message_processing_sandbox enable row level security;

-- Revoga acesso público/anônimo direto via PostgREST
revoke all on tenants from anon, authenticated;
revoke all on users from anon, authenticated;
revoke all on users_whatsapp from anon, authenticated;
revoke all on messages from anon, authenticated;
revoke all on knowledge_base from anon, authenticated;
revoke all on whatsapp_message_processing from anon, authenticated;
revoke all on users_whatsapp_sandbox from anon, authenticated;
revoke all on messages_sandbox from anon, authenticated;
revoke all on whatsapp_message_processing_sandbox from anon, authenticated;

-- Permite operação irrestrita via service_role utilizada pelo backend
drop policy if exists "service_role full access tenants" on tenants;
create policy "service_role full access tenants" on tenants to service_role using (true) with check (true);

drop policy if exists "service_role full access users" on users;
create policy "service_role full access users" on users to service_role using (true) with check (true);

drop policy if exists "service_role full access users_whatsapp" on users_whatsapp;
create policy "service_role full access users_whatsapp" on users_whatsapp to service_role using (true) with check (true);

drop policy if exists "service_role full access messages" on messages;
create policy "service_role full access messages" on messages to service_role using (true) with check (true);

drop policy if exists "service_role full access knowledge_base" on knowledge_base;
create policy "service_role full access knowledge_base" on knowledge_base to service_role using (true) with check (true);

drop policy if exists "service_role full access whatsapp_message_processing" on whatsapp_message_processing;
create policy "service_role full access whatsapp_message_processing" on whatsapp_message_processing to service_role using (true) with check (true);

drop policy if exists "service_role full access users_whatsapp_sandbox" on users_whatsapp_sandbox;
create policy "service_role full access users_whatsapp_sandbox" on users_whatsapp_sandbox to service_role using (true) with check (true);

drop policy if exists "service_role full access messages_sandbox" on messages_sandbox;
create policy "service_role full access messages_sandbox" on messages_sandbox to service_role using (true) with check (true);

drop policy if exists "service_role full access whatsapp_message_processing_sandbox" on whatsapp_message_processing_sandbox;
create policy "service_role full access whatsapp_message_processing_sandbox" on whatsapp_message_processing_sandbox to service_role using (true) with check (true);
