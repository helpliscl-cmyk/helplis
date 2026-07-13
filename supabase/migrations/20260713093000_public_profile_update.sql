-- HelPlis public profile update.
-- Idempotent migration for the existing Supabase MVP schema.

create extension if not exists pgcrypto;

alter type public.app_role add value if not exists 'OPERATIONS';

alter table if exists public.devices
  add column if not exists profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists activation_code_encrypted text,
  add column if not exists activation_attempts integer not null default 0,
  add column if not exists activation_blocked_until timestamptz,
  add column if not exists activation_code_used_at timestamptz;

create index if not exists devices_profile_id_idx on public.devices(profile_id);

alter table if exists public.profiles
  add column if not exists alias text,
  add column if not exists photo_url text,
  add column if not exists headline text,
  add column if not exists help_message text,
  add column if not exists status_message text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists approximate_age integer,
  add column if not exists birth_year integer,
  add column if not exists gender_optional text,
  add column if not exists communication_notes text,
  add column if not exists mobility_notes text,
  add column if not exists sensory_notes text,
  add column if not exists cognitive_notes text,
  add column if not exists medical_conditions text,
  add column if not exists medical_instructions text,
  add column if not exists emergency_instructions text,
  add column if not exists organ_donor_optional boolean,
  add column if not exists health_provider_optional text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists commune text,
  add column if not exists general_area text,
  add column if not exists exact_address text,
  add column if not exists pet_name text,
  add column if not exists sex text,
  add column if not exists sterilized_optional boolean,
  add column if not exists veterinary_notes text,
  add column if not exists microchip_number_optional text,
  add column if not exists pet_behavior_notes text,
  add column if not exists object_name text,
  add column if not exists object_category text,
  add column if not exists brand text,
  add column if not exists model text,
  add column if not exists return_instructions text,
  add column if not exists reward_message text,
  add column if not exists preferred_language text not null default 'es',
  add column if not exists show_photo boolean not null default true,
  add column if not exists show_full_name boolean not null default false,
  add column if not exists show_alias boolean not null default true,
  add column if not exists show_approximate_age boolean not null default false,
  add column if not exists show_blood_type boolean not null default false,
  add column if not exists show_allergies boolean not null default false,
  add column if not exists show_medical_conditions boolean not null default false,
  add column if not exists show_medications boolean not null default false,
  add column if not exists show_medical_instructions boolean not null default false,
  add column if not exists show_communication_notes boolean not null default false,
  add column if not exists show_mobility_notes boolean not null default false,
  add column if not exists show_sensory_notes boolean not null default false,
  add column if not exists show_general_area boolean not null default false,
  add column if not exists show_exact_address boolean not null default false,
  add column if not exists show_message_button boolean not null default true,
  add column if not exists allow_call boolean not null default true,
  add column if not exists allow_whatsapp boolean not null default true,
  add column if not exists allow_message boolean not null default true,
  add column if not exists allow_location_sharing boolean not null default true,
  add column if not exists allow_found_report boolean not null default true;

alter table if exists public.profiles
  alter column show_phone_numbers set default false;

update public.profiles
set show_phone_numbers = false
where show_phone_numbers = true;

alter table if exists public.contacts
  add column if not exists availability_notes text,
  add column if not exists priority integer not null default 1,
  add column if not exists is_visible boolean not null default true;

alter table if exists public.scan_events
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists location_accuracy numeric(10,2),
  add column if not exists location_permission boolean not null default false,
  add column if not exists location_shared_at timestamptz,
  add column if not exists device_type text,
  add column if not exists browser text,
  add column if not exists operating_system text,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists session_id text;

create table if not exists public.contact_actions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.devices(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  scan_event_id uuid references public.scan_events(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.location_shares (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  scan_event_id uuid references public.scan_events(id) on delete set null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  accuracy numeric(10,2),
  consented boolean not null default false,
  permission_status text not null default 'GRANTED',
  result text not null default 'RECORDED',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.found_reports (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  scan_event_id uuid references public.scan_events(id) on delete set null,
  reporter_name text,
  reporter_phone text,
  message text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  accuracy numeric(10,2),
  consented_location boolean not null default false,
  status text not null default 'RECEIVED',
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists contact_actions_device_id_idx on public.contact_actions(device_id);
create index if not exists contact_actions_profile_id_idx on public.contact_actions(profile_id);
create index if not exists contact_actions_scan_event_id_idx on public.contact_actions(scan_event_id);
create index if not exists contact_actions_action_idx on public.contact_actions(action);
create index if not exists location_shares_device_id_idx on public.location_shares(device_id);
create index if not exists location_shares_profile_id_idx on public.location_shares(profile_id);
create index if not exists location_shares_scan_event_id_idx on public.location_shares(scan_event_id);
create index if not exists found_reports_device_id_idx on public.found_reports(device_id);
create index if not exists found_reports_profile_id_idx on public.found_reports(profile_id);
create index if not exists found_reports_scan_event_id_idx on public.found_reports(scan_event_id);

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
  v_visible_name text;
begin
  if p_public_code is null or upper(trim(p_public_code)) !~ '^[A-Z0-9]{4,12}$' then
    return jsonb_build_object('status', 'INVALID_CODE');
  end if;

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
  where (device_id = v_device.id or id = v_device.profile_id)
    and is_public_enabled = true
    and deleted_at is null
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('status', 'UNAVAILABLE', 'publicCode', v_device.public_code);
  end if;

  v_visible_name := case
    when v_profile.type = 'PET' then coalesce(v_profile.pet_name, v_profile.alias, v_profile.display_name)
    when v_profile.type in ('LUGGAGE', 'OBJECT', 'ASSET') then coalesce(v_profile.object_name, v_profile.alias, v_profile.display_name)
    when v_profile.show_full_name then trim(coalesce(v_profile.first_name, '') || ' ' || coalesce(v_profile.last_name, ''))
    when v_profile.show_alias and v_profile.alias is not null then v_profile.alias
    else coalesce(v_profile.first_name, v_profile.display_name)
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'name', case when v_profile.show_contact_names then c.name else null end,
    'relationship', case when v_profile.show_contact_names then c.relationship else null end,
    'availabilityNotes', c.availability_notes,
    'phone', case when v_profile.show_phone_numbers then c.phone else null end,
    'phoneForAction', case when (v_profile.allow_call or v_profile.allow_whatsapp or v_profile.allow_message) then c.phone else null end,
    'callEnabled', c.call_enabled and v_profile.show_call_button and v_profile.allow_call,
    'whatsappEnabled', c.whatsapp_enabled and v_profile.show_whatsapp_button and v_profile.allow_whatsapp,
    'messageEnabled', c.message_enabled and v_profile.show_message_button and v_profile.allow_message,
    'priority', coalesce(c.priority, c.sort_order + 1)
  ) order by coalesce(c.priority, c.sort_order + 1), c.created_at), '[]'::jsonb)
  into v_contacts
  from public.contacts c
  where c.profile_id = v_profile.id
    and c.is_visible = true;

  return jsonb_build_object(
    'status', v_device.status,
    'publicCode', v_device.public_code,
    'productType', v_device.product_type,
    'profile', jsonb_build_object(
      'type', v_profile.type,
      'displayName', nullif(v_visible_name, ''),
      'alias', case when v_profile.show_alias then v_profile.alias else null end,
      'photoUrl', case when v_profile.show_photo then v_profile.photo_url else null end,
      'headline', v_profile.headline,
      'helpMessage', coalesce(v_profile.help_message, v_profile.special_instructions),
      'description', v_profile.description,
      'statusMessage', v_profile.status_message,
      'bloodType', case when v_profile.show_blood_type then v_profile.blood_type else null end,
      'allergies', case when v_profile.show_allergies then v_profile.allergies else null end,
      'medicalConditions', case when v_profile.show_medical_conditions then v_profile.medical_conditions else null end,
      'medications', case when v_profile.show_medications then v_profile.medications else null end,
      'medicalInstructions', case when v_profile.show_medical_instructions then v_profile.medical_instructions else null end,
      'communicationNotes', case when v_profile.show_communication_notes then v_profile.communication_notes else null end,
      'mobilityNotes', case when v_profile.show_mobility_notes then v_profile.mobility_notes else null end,
      'sensoryNotes', case when v_profile.show_sensory_notes then v_profile.sensory_notes else null end,
      'age', case when v_profile.show_approximate_age then v_profile.approximate_age else null end,
      'commune', case when v_profile.show_general_area then v_profile.commune else null end,
      'generalArea', case when v_profile.show_general_area then v_profile.general_area else null end,
      'exactAddress', case when v_profile.show_exact_address then v_profile.exact_address else null end,
      'species', case when v_profile.type = 'PET' then v_profile.species else null end,
      'breed', case when v_profile.type = 'PET' then v_profile.breed else null end,
      'color', v_profile.color,
      'veterinaryNotes', case when v_profile.type = 'PET' then v_profile.veterinary_notes else null end,
      'petBehaviorNotes', case when v_profile.type = 'PET' then v_profile.pet_behavior_notes else null end,
      'objectDescription', case when v_profile.type in ('LUGGAGE', 'OBJECT', 'ASSET') then coalesce(v_profile.object_description, v_profile.description) else null end,
      'rewardMessage', v_profile.reward_message,
      'returnInstructions', case when v_profile.type in ('LUGGAGE', 'OBJECT', 'ASSET') then v_profile.return_instructions else null end,
      'lostMessage', v_profile.lost_message,
      'showLocationButton', v_profile.show_location_button and v_profile.allow_location_sharing,
      'allowFoundReport', v_profile.allow_found_report
    ),
    'contacts', v_contacts
  );
end;
$$;

create or replace function public.register_scan(p_public_code text, p_metadata jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices;
  v_profile_id uuid;
  v_scan_id uuid;
begin
  select * into v_device
  from public.devices
  where public_code = upper(trim(coalesce(p_public_code, '')))
    and deleted_at is null;

  if not found or v_device.status not in ('ACTIVATED', 'LOST', 'FOUND') then
    return jsonb_build_object('ok', false, 'status', 'UNAVAILABLE');
  end if;

  select id into v_profile_id
  from public.profiles
  where (device_id = v_device.id or id = v_device.profile_id)
    and deleted_at is null
  order by created_at desc
  limit 1;

  insert into public.scan_events(device_id, profile_id, public_code, method, user_agent, referrer, ip_hash, status)
  values (
    v_device.id,
    v_profile_id,
    v_device.public_code,
    coalesce((p_metadata->>'method')::public.scan_method, 'UNKNOWN'::public.scan_method),
    p_metadata->>'userAgent',
    p_metadata->>'referrer',
    p_metadata->>'ipHash',
    'RECORDED'
  )
  returning id into v_scan_id;

  return jsonb_build_object('ok', true, 'scanId', v_scan_id);
exception when others then
  return jsonb_build_object('ok', false, 'status', 'UNAVAILABLE');
end;
$$;

create or replace function public.share_location(p_scan_id uuid, p_coordinates jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scan public.scan_events;
begin
  select * into v_scan from public.scan_events where id = p_scan_id;
  if not found then
    return jsonb_build_object('ok', false);
  end if;

  insert into public.location_shares(device_id, profile_id, scan_event_id, latitude, longitude, accuracy, consented, permission_status, result)
  values (
    v_scan.device_id,
    v_scan.profile_id,
    v_scan.id,
    (p_coordinates->>'latitude')::numeric,
    (p_coordinates->>'longitude')::numeric,
    nullif(p_coordinates->>'accuracy', '')::numeric,
    coalesce((p_coordinates->>'consented')::boolean, true),
    coalesce(p_coordinates->>'permissionStatus', 'GRANTED'),
    'RECORDED'
  );

  update public.scan_events
  set latitude = (p_coordinates->>'latitude')::numeric,
      longitude = (p_coordinates->>'longitude')::numeric,
      location_accuracy = nullif(p_coordinates->>'accuracy', '')::numeric,
      location_permission = coalesce((p_coordinates->>'consented')::boolean, true),
      location_shared_at = now()
  where id = v_scan.id;

  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', false);
end;
$$;

create or replace function public.report_found(p_public_code text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices;
  v_profile_id uuid;
begin
  select * into v_device
  from public.devices
  where public_code = upper(trim(coalesce(p_public_code, '')))
    and deleted_at is null;

  if not found then
    return jsonb_build_object('ok', true);
  end if;

  select id into v_profile_id
  from public.profiles
  where (device_id = v_device.id or id = v_device.profile_id)
  order by created_at desc
  limit 1;

  insert into public.found_reports(device_id, profile_id, scan_event_id, reporter_name, reporter_phone, message, latitude, longitude, accuracy, consented_location)
  values (
    v_device.id,
    v_profile_id,
    nullif(p_payload->>'scanId', '')::uuid,
    nullif(left(coalesce(p_payload->>'reporterName', ''), 120), ''),
    nullif(left(coalesce(p_payload->>'reporterPhone', ''), 32), ''),
    nullif(left(coalesce(p_payload->>'message', ''), 700), ''),
    nullif(p_payload->>'latitude', '')::numeric,
    nullif(p_payload->>'longitude', '')::numeric,
    nullif(p_payload->>'accuracy', '')::numeric,
    coalesce((p_payload->>'consentedLocation')::boolean, false)
  );

  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.contact_action(p_public_code text, p_action_type text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices;
begin
  select * into v_device from public.devices where public_code = upper(trim(coalesce(p_public_code, '')));
  if found then
    insert into public.contact_actions(device_id, profile_id, action)
    values (v_device.id, v_device.profile_id, left(coalesce(p_action_type, 'UNKNOWN'), 80));
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.resolve_public_profile(text) to anon, authenticated;
grant execute on function public.register_scan(text, jsonb) to anon, authenticated;
grant execute on function public.share_location(uuid, jsonb) to anon, authenticated;
grant execute on function public.report_found(text, jsonb) to anon, authenticated;
grant execute on function public.contact_action(text, text) to anon, authenticated;
