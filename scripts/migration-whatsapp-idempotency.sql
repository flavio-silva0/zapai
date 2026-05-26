-- ============================================================
-- ZapAI - WhatsApp webhook idempotency
-- Execute no Supabase SQL Editor antes/depois do deploy.
-- O backend funciona sem esta tabela, mas com ela a idempotencia
-- fica persistente entre retries, restarts e multiplas instancias.
-- ============================================================

create table if not exists whatsapp_message_processing (
  id uuid primary key default gen_random_uuid(),
  whatsapp_message_id text not null unique,
  tenant_id uuid references tenants(id) on delete cascade,
  patient_id text,
  phone_number_id text,
  from_phone text,
  status text not null default 'received'
    check (status in ('received', 'processing', 'answered', 'failed')),
  last_error text,
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_message_processing_tenant_id
  on whatsapp_message_processing(tenant_id);

create index if not exists idx_whatsapp_message_processing_status
  on whatsapp_message_processing(status);

alter table whatsapp_message_processing enable row level security;

drop policy if exists "service_role bypass" on whatsapp_message_processing;
create policy "service_role bypass" on whatsapp_message_processing
  to service_role using (true) with check (true);
