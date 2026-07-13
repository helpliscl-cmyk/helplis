alter table if exists public.profiles
  add column if not exists critical_information text,
  add column if not exists show_display_name boolean not null default true,
  add column if not exists show_critical_information boolean not null default false;

alter table if exists public.contacts
  add column if not exists type text not null default 'PRIMARY',
  add column if not exists relationship_code text;

alter table if exists public.contacts
  drop constraint if exists contacts_type_check,
  add constraint contacts_type_check check (type in ('PRIMARY', 'SECONDARY'));

alter table if exists public.contacts
  drop constraint if exists contacts_relationship_code_check,
  add constraint contacts_relationship_code_check
    check (relationship_code is null or relationship_code in ('MOTHER', 'FATHER', 'FAMILY', 'RESPONSIBLE'));

update public.contacts
set type = case when coalesce(priority, sort_order, 1) <= 1 then 'PRIMARY' else 'SECONDARY' end
where type is null or type = 'PRIMARY';

create index if not exists contacts_type_idx on public.contacts(type);

-- The existing secure RPC remains in place. Runtime code must continue to return
-- critical information only when show_critical_information is true.
