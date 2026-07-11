-- HelPlis Supabase MVP schema.
-- Apply only to the confirmed HelPlis Supabase project.

create extension if not exists pgcrypto;

create type public.app_role as enum ('USER', 'ORGANIZATION_ADMIN', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN');
create type public.device_status as enum ('UNASSIGNED', 'AVAILABLE', 'RESERVED', 'ACTIVATED', 'LOST', 'FOUND', 'SUSPENDED', 'DEACTIVATED', 'REPLACED', 'DAMAGED');
create type public.profile_type as enum ('PERSON', 'CHILD', 'SENIOR', 'DEPENDENT_PERSON', 'MEDICAL_PROFILE', 'PET', 'LUGGAGE', 'OBJECT', 'ASSET', 'EMPLOYEE', 'OTHER');
create type public.product_type as enum ('WRISTBAND', 'PET_TAG', 'KEYCHAIN', 'CARD', 'STICKER', 'LUGGAGE_TAG', 'ASSET_TAG', 'OTHER');
create type public.scan_method as enum ('QR', 'NFC', 'MANUAL', 'UNKNOWN');

create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  name text not null,
  role public.app_role not null default 'USER',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null default 'OTHER',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null default 'VIEWER',
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  public_url text not null,
  nfc_uid_hash text,
  activation_code_hash text not null,
  product_type public.product_type not null default 'WRISTBAND',
  status public.device_status not null default 'AVAILABLE',
  owner_id uuid references public.app_users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  type public.profile_type not null default 'PERSON',
  display_name text not null,
  description text,
  object_description text,
  species text,
  breed text,
  color text,
  age text,
  special_instructions text,
  medical_notes text,
  allergies text,
  medications text,
  blood_type text,
  lost_message text,
  show_medical_info boolean not null default false,
  show_contact_names boolean not null default true,
  show_phone_numbers boolean not null default true,
  show_location_button boolean not null default true,
  show_whatsapp_button boolean not null default true,
  show_call_button boolean not null default true,
  is_public_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text,
  relationship text,
  phone text,
  email text,
  call_enabled boolean not null default true,
  whatsapp_enabled boolean not null default true,
  message_enabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  public_code text not null,
  method public.scan_method not null default 'UNKNOWN',
  status text not null default 'RECORDED',
  user_agent text,
  referrer text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table public.location_reports (
  id uuid primary key default gen_random_uuid(),
  scan_event_id uuid not null references public.scan_events(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  accuracy numeric(10,2),
  consented boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  event_type text not null,
  channel text not null default 'LOCAL',
  status text not null default 'QUEUED',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  created_by uuid references public.app_users(id) on delete set null,
  reference text not null,
  status text not null default 'DRAFT',
  notes text,
  created_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  public_code text not null,
  public_url text not null,
  nfc_uid_hash text,
  product_type public.product_type not null default 'WRISTBAND',
  status text not null default 'VALIDATED',
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'DRAFT',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.app_users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index devices_owner_id_idx on public.devices(owner_id);
create index devices_public_code_idx on public.devices(public_code);
create index profiles_user_id_idx on public.profiles(user_id);
create index profiles_device_id_idx on public.profiles(device_id);
create index contacts_profile_id_idx on public.contacts(profile_id);
create index scan_events_public_code_idx on public.scan_events(public_code);
create index location_reports_scan_event_id_idx on public.location_reports(scan_event_id);
create index notification_events_user_id_idx on public.notification_events(user_id);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);

alter table public.app_users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.devices enable row level security;
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.scan_events enable row level security;
alter table public.location_reports enable row level security;
alter table public.notification_events enable row level security;
alter table public.support_messages enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;
alter table public.campaigns enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.app_users where id = auth.uid()), 'USER'::public.app_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('ADMIN', 'SUPER_ADMIN', 'SUPPORT');
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'ACTIVE'
  );
$$;

create policy "users read own profile" on public.app_users
  for select using (id = auth.uid() or public.is_admin());

create policy "users update own profile" on public.app_users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "members read own organizations" on public.organizations
  for select using (public.is_admin() or public.is_org_member(id));

create policy "members read memberships" on public.organization_memberships
  for select using (public.is_admin() or user_id = auth.uid() or public.is_org_member(organization_id));

create policy "owners read devices" on public.devices
  for select using (public.is_admin() or owner_id = auth.uid() or public.is_org_member(organization_id));

create policy "owners update devices" on public.devices
  for update using (public.is_admin() or owner_id = auth.uid()) with check (public.is_admin() or owner_id = auth.uid());

create policy "owners read profiles" on public.profiles
  for select using (public.is_admin() or user_id = auth.uid() or public.is_org_member(organization_id));

create policy "owners write profiles" on public.profiles
  for all using (public.is_admin() or user_id = auth.uid()) with check (public.is_admin() or user_id = auth.uid());

create policy "owners read contacts" on public.contacts
  for select using (public.is_admin() or user_id = auth.uid());

create policy "owners write contacts" on public.contacts
  for all using (public.is_admin() or user_id = auth.uid()) with check (public.is_admin() or user_id = auth.uid());

create policy "owners read scans" on public.scan_events
  for select using (
    public.is_admin()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

create policy "public insert scans" on public.scan_events
  for insert with check (true);

create policy "owners read locations" on public.location_reports
  for select using (
    public.is_admin()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

create policy "public insert consented locations" on public.location_reports
  for insert with check (consented = true);

create policy "owners read notifications" on public.notification_events
  for select using (public.is_admin() or user_id = auth.uid());

create policy "support insert messages" on public.support_messages
  for insert with check (true);

create policy "support read messages" on public.support_messages
  for select using (public.is_admin() or user_id = auth.uid());

create policy "org read import batches" on public.import_batches
  for select using (public.is_admin() or public.is_org_member(organization_id) or created_by = auth.uid());

create policy "org read import rows" on public.import_rows
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.import_batches b
      where b.id = batch_id and (b.created_by = auth.uid() or public.is_org_member(b.organization_id))
    )
  );

create policy "org read campaigns" on public.campaigns
  for select using (public.is_admin() or public.is_org_member(organization_id));

create policy "admins read audit logs" on public.audit_logs
  for select using (public.is_admin());

create or replace function public.resolve_public_profile(p_public_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices;
  v_profile public.profiles;
  v_contacts jsonb;
begin
  select * into v_device
  from public.devices
  where public_code = upper(trim(p_public_code))
    and deleted_at is null;

  if not found then
    return jsonb_build_object('status', 'INVALID_CODE');
  end if;

  if v_device.status not in ('ACTIVATED', 'LOST', 'FOUND') then
    return jsonb_build_object('status', 'NOT_ACTIVATED', 'publicCode', v_device.public_code);
  end if;

  select * into v_profile
  from public.profiles
  where device_id = v_device.id
    and is_public_enabled = true
    and deleted_at is null
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('status', 'UNAVAILABLE', 'publicCode', v_device.public_code);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', case when v_profile.show_contact_names then c.name else null end,
    'relationship', c.relationship,
    'phone', case when v_profile.show_phone_numbers then c.phone else null end,
    'callEnabled', c.call_enabled and v_profile.show_call_button,
    'whatsappEnabled', c.whatsapp_enabled and v_profile.show_whatsapp_button
  ) order by c.sort_order), '[]'::jsonb)
  into v_contacts
  from public.contacts c
  where c.profile_id = v_profile.id;

  return jsonb_build_object(
    'status', v_device.status,
    'publicCode', v_device.public_code,
    'productType', v_device.product_type,
    'profile', jsonb_build_object(
      'type', v_profile.type,
      'displayName', v_profile.display_name,
      'description', v_profile.description,
      'objectDescription', v_profile.object_description,
      'species', v_profile.species,
      'breed', v_profile.breed,
      'color', v_profile.color,
      'age', v_profile.age,
      'specialInstructions', v_profile.special_instructions,
      'medicalNotes', case when v_profile.show_medical_info then v_profile.medical_notes else null end,
      'allergies', case when v_profile.show_medical_info then v_profile.allergies else null end,
      'medications', case when v_profile.show_medical_info then v_profile.medications else null end,
      'bloodType', case when v_profile.show_medical_info then v_profile.blood_type else null end,
      'lostMessage', v_profile.lost_message,
      'showLocationButton', v_profile.show_location_button
    ),
    'contacts', v_contacts
  );
end;
$$;

grant execute on function public.resolve_public_profile(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "profile photo owners can read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profile photo owners can upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profile photo owners can update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profile photo owners can delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
