-- HelPlis RLS policies for public profile and operations tables.

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
  select public.current_app_role() in ('ADMIN', 'SUPER_ADMIN');
$$;

create or replace function public.is_support()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('SUPPORT', 'ADMIN', 'SUPER_ADMIN');
$$;

create or replace function public.is_operations()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('OPERATIONS', 'ADMIN', 'SUPER_ADMIN');
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

alter table public.app_users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.devices enable row level security;
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.scan_events enable row level security;
alter table public.location_reports enable row level security;
alter table public.location_shares enable row level security;
alter table public.found_reports enable row level security;
alter table public.contact_actions enable row level security;
alter table public.notification_events enable row level security;
alter table public.support_messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.production_batches enable row level security;
alter table public.production_files enable row level security;
alter table public.supplier_uid_imports enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.physical_verifications enable row level security;
alter table public.institution_leads enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.support_tickets enable row level security;
alter table public.device_activation_attempts enable row level security;

drop policy if exists "users read own profile" on public.app_users;
create policy "users read own profile" on public.app_users
  for select using (id = auth.uid() or public.is_support());

drop policy if exists "users update own profile" on public.app_users;
create policy "users update own profile" on public.app_users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members read own organizations" on public.organizations;
create policy "members read own organizations" on public.organizations
  for select using (public.is_support() or public.is_operations() or public.is_org_member(id));

drop policy if exists "members read memberships" on public.organization_memberships;
create policy "members read memberships" on public.organization_memberships
  for select using (public.is_support() or user_id = auth.uid() or public.is_org_member(organization_id));

drop policy if exists "owners read devices" on public.devices;
create policy "owners read devices" on public.devices
  for select using (
    public.is_support()
    or public.is_operations()
    or owner_id = auth.uid()
    or public.is_org_member(organization_id)
  );

drop policy if exists "owners update devices" on public.devices;
create policy "owners update devices" on public.devices
  for update using (public.is_operations() or owner_id = auth.uid())
  with check (public.is_operations() or owner_id = auth.uid());

drop policy if exists "operations insert devices" on public.devices;
create policy "operations insert devices" on public.devices
  for insert with check (public.is_operations());

drop policy if exists "owners read profiles" on public.profiles;
create policy "owners read profiles" on public.profiles
  for select using (
    public.is_support()
    or user_id = auth.uid()
    or public.is_org_member(organization_id)
  );

drop policy if exists "owners write profiles" on public.profiles;
create policy "owners write profiles" on public.profiles
  for all using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());

drop policy if exists "owners read contacts" on public.contacts;
create policy "owners read contacts" on public.contacts
  for select using (
    public.is_support()
    or user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );

drop policy if exists "owners write contacts" on public.contacts;
create policy "owners write contacts" on public.contacts
  for all using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );

drop policy if exists "owners read scans" on public.scan_events;
create policy "owners read scans" on public.scan_events
  for select using (
    public.is_support()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

drop policy if exists "public insert scans" on public.scan_events;
create policy "public insert scans" on public.scan_events
  for insert to anon, authenticated with check (true);

drop policy if exists "owners read locations" on public.location_reports;
create policy "owners read locations" on public.location_reports
  for select using (
    public.is_support()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

drop policy if exists "public insert consented locations" on public.location_reports;
create policy "public insert consented locations" on public.location_reports
  for insert to anon, authenticated with check (consented = true);

drop policy if exists "owners read location shares" on public.location_shares;
create policy "owners read location shares" on public.location_shares
  for select using (
    public.is_support()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

drop policy if exists "public insert location shares" on public.location_shares;
create policy "public insert location shares" on public.location_shares
  for insert to anon, authenticated with check (permission_status in ('GRANTED', 'DENIED', 'UNAVAILABLE'));

drop policy if exists "owners read found reports" on public.found_reports;
create policy "owners read found reports" on public.found_reports
  for select using (
    public.is_support()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

drop policy if exists "public insert found reports" on public.found_reports;
create policy "public insert found reports" on public.found_reports
  for insert to anon, authenticated with check (true);

drop policy if exists "owners read contact actions" on public.contact_actions;
create policy "owners read contact actions" on public.contact_actions
  for select using (
    public.is_support()
    or exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

drop policy if exists "public insert contact actions" on public.contact_actions;
create policy "public insert contact actions" on public.contact_actions
  for insert to anon, authenticated with check (length(action) between 1 and 80);

drop policy if exists "owners read notifications" on public.notification_events;
create policy "owners read notifications" on public.notification_events
  for select using (public.is_support() or user_id = auth.uid());

drop policy if exists "support insert messages" on public.support_messages;
create policy "support insert messages" on public.support_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "support read messages" on public.support_messages;
create policy "support read messages" on public.support_messages
  for select using (public.is_support() or user_id = auth.uid());

drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs
  for select using (public.is_admin());

drop policy if exists "admins insert audit logs" on public.audit_logs;
create policy "admins insert audit logs" on public.audit_logs
  for insert with check (public.is_admin() or public.is_operations() or public.is_support());

drop policy if exists "operations manage production batches" on public.production_batches;
create policy "operations manage production batches" on public.production_batches
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage production files" on public.production_files;
create policy "operations manage production files" on public.production_files
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage supplier uid imports" on public.supplier_uid_imports;
create policy "operations manage supplier uid imports" on public.supplier_uid_imports
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage inventory locations" on public.inventory_locations;
create policy "operations manage inventory locations" on public.inventory_locations
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage physical verifications" on public.physical_verifications;
create policy "operations manage physical verifications" on public.physical_verifications
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage orders" on public.orders;
create policy "operations manage orders" on public.orders
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders" on public.orders
  for select using (user_id = auth.uid() or public.is_operations() or public.is_support());

drop policy if exists "operations manage order items" on public.order_items;
create policy "operations manage order items" on public.order_items
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage payments" on public.payments;
create policy "operations manage payments" on public.payments
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "operations manage shipments" on public.shipments;
create policy "operations manage shipments" on public.shipments
  for all using (public.is_operations()) with check (public.is_operations());

drop policy if exists "support manage support tickets" on public.support_tickets;
create policy "support manage support tickets" on public.support_tickets
  for all using (public.is_support()) with check (public.is_support());

drop policy if exists "users read own support tickets" on public.support_tickets;
create policy "users read own support tickets" on public.support_tickets
  for select using (user_id = auth.uid() or public.is_support());

drop policy if exists "public insert institution leads" on public.institution_leads;
create policy "public insert institution leads" on public.institution_leads
  for insert to anon, authenticated with check (true);

drop policy if exists "operations read institution leads" on public.institution_leads;
create policy "operations read institution leads" on public.institution_leads
  for select using (public.is_operations() or public.is_support());

drop policy if exists "operations manage activation attempts" on public.device_activation_attempts;
create policy "operations manage activation attempts" on public.device_activation_attempts
  for all using (public.is_operations() or public.is_support()) with check (public.is_operations() or public.is_support());
