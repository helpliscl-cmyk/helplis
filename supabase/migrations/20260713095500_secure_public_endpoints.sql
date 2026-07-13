-- Secure public endpoint helpers.

create table if not exists public.public_rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.public_rate_limits enable row level security;

drop policy if exists "service role manages public rate limits" on public.public_rate_limits;
create policy "service role manages public rate limits" on public.public_rate_limits
  for all using (false) with check (false);

create or replace function public.bump_public_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.public_rate_limits;
begin
  if p_key is null or length(p_key) < 3 then
    return false;
  end if;

  insert into public.public_rate_limits(key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (key) do update
  set count = case
        when public.public_rate_limits.reset_at <= v_now then 1
        else public.public_rate_limits.count + 1
      end,
      reset_at = case
        when public.public_rate_limits.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds)
        else public.public_rate_limits.reset_at
      end,
      updated_at = v_now
  returning * into v_row;

  return v_row.count <= p_limit;
end;
$$;

create or replace function public.activate_device(p_public_code text, p_activation_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices;
begin
  if p_public_code is null or p_activation_code is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_device
  from public.devices
  where public_code = upper(trim(p_public_code))
    and deleted_at is null
  limit 1;

  if not found or v_device.status not in ('AVAILABLE', 'UNASSIGNED', 'RESERVED') then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Activation code verification stays in the server layer because hashes/envelopes
  -- are implementation-specific. This RPC is intentionally neutral and non-enumerating.
  return jsonb_build_object('ok', false, 'reason', 'server_verification_required');
exception when others then
  return jsonb_build_object('ok', false, 'reason', 'invalid');
end;
$$;

grant execute on function public.bump_public_rate_limit(text, integer, integer) to service_role;
grant execute on function public.activate_device(text, text) to anon, authenticated;
