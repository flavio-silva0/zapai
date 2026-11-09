-- ============================================================
-- ZapAI — Migration: Planos por Faixas de Leads & Provedora de Pagamentos
-- Faixas oficiais:
--   1. starter / basic -> Até 150 leads (R$ 69,90/mês)
--   2. growth          -> De 151 a 300 leads (R$ 119,90/mês)
--   3. pro             -> De 301 a 500 leads (R$ 169,90/mês)
--   4. enterprise      -> Acima de 500 leads (Personalizado)
-- ============================================================

begin;

-- 1. Atualiza constraint de planos na tabela tenants para suportar starter e growth
alter table public.tenants drop constraint if exists tenants_plan_check;
alter table public.tenants
  add constraint tenants_plan_check
  check (plan in ('basic', 'starter', 'growth', 'pro', 'enterprise'));

-- 2. Adiciona colunas de limite de leads e assinatura em tenants
alter table public.tenants add column if not exists max_leads integer;
alter table public.tenants add column if not exists billing_provider text;
alter table public.tenants add column if not exists billing_customer_id text;
alter table public.tenants add column if not exists billing_subscription_id text;
alter table public.tenants add column if not exists billing_cycle text not null default 'monthly'
  check (billing_cycle in ('monthly', 'annual'));
alter table public.tenants add column if not exists subscription_status text not null default 'trialing';
alter table public.tenants add column if not exists current_period_end timestamptz;

-- Preenche max_leads padrão para tenants existentes caso esteja nulo
update public.tenants
set max_leads = case
  when plan in ('basic', 'starter') then 150
  when plan = 'growth' then 300
  when plan = 'pro' then 500
  else null
end
where max_leads is null and plan in ('basic', 'starter', 'growth', 'pro');

-- 3. Tabela de Faturas e Transações de Assinatura (Asaas / Stripe / PIX / Cartão)
create table if not exists public.billing_invoices (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  provider          text not null default 'asaas',
  external_id       text unique,
  plan              text not null,
  billing_cycle     text not null default 'monthly' check (billing_cycle in ('monthly', 'annual')),
  payment_method    text not null default 'PIX',
  amount_brl        numeric(10, 2) not null,
  status            text not null default 'pending'
                    check (status in ('pending', 'paid', 'overdue', 'canceled', 'refunded')),
  invoice_url       text,
  pix_qr_code       text,
  pix_copy_paste    text,
  due_date          date,
  paid_at           timestamptz,
  metadata          jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_billing_invoices_tenant_id on public.billing_invoices(tenant_id);
create index if not exists idx_billing_invoices_external_id on public.billing_invoices(external_id);

-- 4. Segurança RLS para billing_invoices
alter table public.billing_invoices enable row level security;
revoke all on public.billing_invoices from public, anon, authenticated;
grant all on public.billing_invoices to service_role;

drop policy if exists "service_role full access billing_invoices" on public.billing_invoices;
create policy "service_role full access billing_invoices"
  on public.billing_invoices to service_role using (true) with check (true);

-- 5. Função RPC check_tenant_lead_capacity: verifica capacidade de leads no banco
create or replace function public.check_tenant_lead_capacity(p_tenant_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_tenant public.tenants;
  v_current_leads integer;
  v_max_leads integer;
begin
  select * into v_tenant from public.tenants where id = p_tenant_id;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'tenant_not_found');
  end if;

  select count(*)::int into v_current_leads
  from public.users_whatsapp
  where tenant_id = p_tenant_id;

  v_max_leads := coalesce(
    v_tenant.max_leads,
    case
      when v_tenant.plan in ('basic', 'starter') then 150
      when v_tenant.plan = 'growth' then 300
      when v_tenant.plan = 'pro' then 500
      else null
    end
  );

  if v_max_leads is not null and v_current_leads >= v_max_leads then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'lead_limit_reached',
      'current_leads', v_current_leads,
      'max_leads', v_max_leads,
      'plan', v_tenant.plan
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'current_leads', v_current_leads,
    'max_leads', v_max_leads,
    'plan', v_tenant.plan
  );
end;
$$;

revoke all on function public.check_tenant_lead_capacity(uuid) from public, anon, authenticated;
grant execute on function public.check_tenant_lead_capacity(uuid) to service_role;

commit;
