-- Apply with a database administrator in Supabase SQL Editor before enabling AI.
-- No conversation data is changed. Counts include failed provider attempts.
begin;
create table if not exists public.ai_usage (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  day date not null,
  calls integer not null default 0,
  minute timestamptz not null,
  minute_calls integer not null default 0,
  primary key (tenant_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from public, anon, authenticated;
grant all on public.ai_usage to service_role;

create or replace function public.reserve_ai_call(p_tenant_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  account public.tenants;
  daily_limit integer;
  minute_limit integer := 60;
  current_minute timestamptz := date_trunc('minute', now());
  current_day date := (now() at time zone 'UTC')::date;
  reserved integer;
begin
  select * into account from public.tenants where id = p_tenant_id;
  if not found or account.status not in ('trial', 'ativo') then return false; end if;
  if account.status = 'trial' and (account.trial_ends_at is null or account.trial_ends_at <= now()) then return false; end if;
  daily_limit := case when account.status = 'trial' then 100
    when account.plan = 'basic' then 500 when account.plan = 'pro' then 2000
    when account.plan = 'enterprise' then 5000 else 0 end;
  if daily_limit = 0 then return false; end if;
  insert into public.ai_usage(tenant_id, day, calls, minute, minute_calls)
    values(p_tenant_id, current_day, 1, current_minute, 1)
  on conflict (tenant_id, day) do update set
    calls = ai_usage.calls + 1,
    minute = current_minute,
    minute_calls = case when ai_usage.minute = current_minute then ai_usage.minute_calls + 1 else 1 end
  where ai_usage.calls < daily_limit
    and (ai_usage.minute <> current_minute or ai_usage.minute_calls < minute_limit)
  returning calls into reserved;
  return reserved is not null;
end;
$$;
revoke all on function public.reserve_ai_call(uuid) from public, anon, authenticated;
grant execute on function public.reserve_ai_call(uuid) to service_role;
commit;
