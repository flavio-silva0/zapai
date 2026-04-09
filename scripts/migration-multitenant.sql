-- ============================================================
--  SofiaAI — Migration Multi-Tenant (Fase 1)
--  Execute este arquivo no Supabase → SQL Editor
--  Ordem de execução: top → bottom
-- ============================================================

-- ── 1. TENANTS (seus clientes) ────────────────────────────────
create table if not exists tenants (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  nicho           text not null default 'geral',
  status          text not null default 'trial'
                  check (status in ('trial', 'ativo', 'pausado', 'cancelado')),

  -- Identidade do agente
  bot_name        text not null default 'Sofia',
  bot_emoji       text not null default '🤖',
  clinic_name     text,
  clinic_phone    text,

  -- Prompt da IA (texto completo, editável pelo painel)
  prompt_text     text,

  -- WhatsApp (preenchido por você no painel admin após fechar cliente)
  phone_number_id text,       -- Meta Cloud API: ID do número
  wa_access_token text,       -- Meta Cloud API: token de acesso

  -- Controle
  trial_ends_at   timestamptz not null default (now() + interval '7 days'),
  plan            text not null default 'basic'
                  check (plan in ('basic', 'pro', 'enterprise')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 2. USERS (usuários do painel, vinculados a um tenant) ─────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade,
  -- tenant_id NULL = super_admin (você)
  email         text unique not null,
  password_hash text not null,
  nome          text not null default 'Usuário',
  role          text not null default 'owner'
                check (role in ('owner', 'agent', 'viewer', 'super_admin')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── 3. ADICIONAR tenant_id NAS TABELAS EXISTENTES ────────────
-- users_whatsapp (leads/contatos do WhatsApp)
alter table users_whatsapp
  add column if not exists tenant_id uuid references tenants(id);

-- messages
alter table messages
  add column if not exists tenant_id uuid references tenants(id);

-- ── 4. ÍNDICES DE PERFORMANCE ─────────────────────────────────
create index if not exists idx_users_whatsapp_tenant_id on users_whatsapp(tenant_id);
create index if not exists idx_messages_tenant_id on messages(tenant_id);
create index if not exists idx_users_tenant_id    on users(tenant_id);
create index if not exists idx_users_email        on users(email);
create index if not exists idx_tenants_status     on tenants(status);

-- ── 5. FUNÇÃO: updated_at automático ─────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

-- ── 6. RLS — Row Level Security ───────────────────────────────
-- O isolamento real é feito no backend via tenant_id no JWT.
-- RLS aqui como camada extra de segurança.

alter table patients enable row level security;
alter table messages enable row level security;

-- Política: service_role (backend) tem acesso total
create policy "service_role bypass" on patients
  to service_role using (true) with check (true);

create policy "service_role bypass" on messages
  to service_role using (true) with check (true);

-- ── 7. VERIFICAÇÃO ────────────────────────────────────────────
-- Execute para confirmar que as tabelas foram criadas:
-- select table_name from information_schema.tables
-- where table_schema = 'public'
-- order by table_name;
