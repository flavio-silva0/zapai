-- Non-destructive upgrade. Duplicate keys abort the transaction; never merge contacts automatically.
-- NOT VALID constraints protect new writes while allowing a separate legacy-data audit.
begin;
create unique index if not exists uq_tenant_phone_number on public.tenants(phone_number_id) where phone_number_id is not null;
create unique index if not exists uq_contact_tenant_phone on public.users_whatsapp(tenant_id, telefone);
create unique index if not exists uq_contact_id_tenant on public.users_whatsapp(id, tenant_id);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='messages_patient_tenant_fk' and conrelid='public.messages'::regclass) then
    alter table public.messages add constraint messages_patient_tenant_fk
      foreign key(patient_id, tenant_id) references public.users_whatsapp(id, tenant_id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='contact_requires_tenant' and conrelid='public.users_whatsapp'::regclass) then
    alter table public.users_whatsapp add constraint contact_requires_tenant check(tenant_id is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='message_requires_tenant' and conrelid='public.messages'::regclass) then
    alter table public.messages add constraint message_requires_tenant check(tenant_id is not null) not valid;
  end if;
end $$;
create index if not exists idx_message_tenant_patient_created on public.messages(tenant_id, patient_id, created_at desc);
create index if not exists idx_contact_tenant_created on public.users_whatsapp(tenant_id, created_at desc);
commit;
-- After reconciling existing rows in staging:
-- alter table public.messages validate constraint messages_patient_tenant_fk;
-- alter table public.messages validate constraint message_requires_tenant;
-- alter table public.users_whatsapp validate constraint contact_requires_tenant;
