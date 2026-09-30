-- Run after migration-multitenant.sql. Private data is accessible only to service_role.
begin;
alter table public.users add column if not exists auth_user_id uuid unique references auth.users(id);
-- The browser receives a public Auth key. Account records still belong to the backend.
alter table public.users enable row level security;
alter table public.tenants enable row level security;
revoke all on public.users, public.tenants from public, anon, authenticated;
grant all on public.users, public.tenants to service_role;
create table if not exists public.account_registrations (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.account_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.account_registrations enable row level security;
alter table public.account_profiles enable row level security;
revoke all on public.account_registrations, public.account_profiles from public, anon, authenticated;
grant all on public.account_registrations, public.account_profiles to service_role;
create or replace function public.complete_account_registration(p_auth_id uuid, p_email text, p_profile jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid; v_tenant uuid;
begin
  -- Serialize retries for the same identity; provisioning is atomic.
  perform pg_advisory_xact_lock(hashtextextended(p_auth_id::text, 0));
  if not exists (select 1 from auth.users where id = p_auth_id and lower(email) = lower(p_email) and email_confirmed_at is not null) then
    raise exception 'Unverified identity';
  end if;
  select id into v_user from public.users where auth_user_id = p_auth_id;
  if v_user is not null then return v_user; end if;
  insert into public.tenants(nome,nicho,clinic_name,bot_name,bot_emoji,status)
  values(p_profile->>'businessName',p_profile->>'nicho',p_profile->>'businessName','ZapAI','🤖','trial') returning id into v_tenant;
  insert into public.users(tenant_id,email,nome,password_hash,role,auth_user_id)
  values(v_tenant,lower(p_email),p_profile->>'nome','supabase:' || gen_random_uuid()::text,'owner',p_auth_id) returning id into v_user;
  insert into public.account_profiles(user_id,profile) values(v_user,p_profile);
  delete from public.account_registrations where auth_user_id = p_auth_id;
  return v_user;
end;
$$;
revoke all on function public.complete_account_registration(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.complete_account_registration(uuid,text,jsonb) to service_role;
commit;
