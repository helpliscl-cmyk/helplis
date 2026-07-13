-- HelPlis operations tables for Supabase.

create table if not exists public.production_batches (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  supplier_contact text,
  supplier_reference text,
  supplier_quote_reference text,
  internal_reference text not null unique,
  product_model text,
  product_type public.product_type not null default 'WRISTBAND',
  color text,
  chip_type text,
  domain text not null default 'https://helplis.cl',
  production_mode text not null default 'DEMO',
  quantity integer not null,
  received_quantity integer not null default 0,
  production_date timestamptz,
  sent_to_supplier_at timestamptz,
  production_started_at timestamptz,
  production_completed_at timestamptz,
  shipped_at timestamptz,
  received_at timestamptz,
  verified_at timestamptz,
  shipping_method text,
  status text not null default 'DRAFT',
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.production_batches(id) on delete cascade,
  type text not null,
  filename text not null,
  storage_path text not null,
  checksum text not null,
  generated_at timestamptz not null default now(),
  generated_by uuid references public.app_users(id) on delete set null,
  version integer not null default 1,
  status text not null default 'GENERATED',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.supplier_uid_imports (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.production_batches(id) on delete cascade,
  filename text not null,
  status text not null default 'DRAFT',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  imported_rows integer not null default 0,
  error_report_path text,
  mapping jsonb not null default '{}'::jsonb,
  preview jsonb not null default '[]'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  warehouse text,
  shelf text,
  box text,
  position text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.devices
  add column if not exists production_batch_id uuid references public.production_batches(id) on delete set null,
  add column if not exists inventory_location_id uuid references public.inventory_locations(id) on delete set null,
  add column if not exists production_status text not null default 'DRAFT',
  add column if not exists verification_status text not null default 'PENDING',
  add column if not exists inventory_status text not null default 'IN_PRODUCTION',
  add column if not exists internal_sequence integer,
  add column if not exists qr_content text,
  add column if not exists nfc_content text,
  add column if not exists reserved_at timestamptz,
  add column if not exists sold_at timestamptz,
  add column if not exists packed_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create table if not exists public.physical_verifications (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  batch_id uuid references public.production_batches(id) on delete set null,
  qr_expected text not null,
  qr_observed text,
  nfc_expected text not null,
  nfc_observed text,
  nfc_uid_expected_hash text,
  nfc_uid_observed_hash text,
  qr_status text not null default 'PENDING',
  nfc_status text not null default 'PENDING',
  uid_status text not null default 'PENDING',
  physical_status text not null default 'PENDING',
  overall_status text not null default 'PENDING',
  notes text,
  photo_url text,
  verified_by uuid references public.app_users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  institution_name text not null,
  type text not null,
  region text not null,
  comuna text not null,
  contact_name text not null,
  contact_role text,
  phone text not null,
  email text not null,
  estimated_quantity integer not null,
  estimated_date timestamptz,
  interest text not null,
  notes text,
  status text not null default 'NEW',
  landing_slug text,
  institutional_code text,
  discount_percentage numeric(5,2) not null default 0,
  commission_percentage numeric(5,2) not null default 0,
  metrics jsonb not null default '{}'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  lead_id uuid,
  user_id uuid references public.app_users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  region text not null,
  comuna text not null,
  address text,
  address_notes text,
  pack text not null,
  quantity integer not null,
  unit_price integer not null,
  subtotal integer not null,
  shipping_cost integer not null default 0,
  total integer not null,
  payment_status text not null default 'PENDING',
  fulfillment_status text not null default 'NEW',
  source text,
  notes text,
  tracking_number text,
  carrier text,
  paid_at timestamptz,
  packed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  product_type public.product_type not null default 'WRISTBAND',
  unit_price integer not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'MANUAL',
  method text not null default 'TRANSFER',
  amount integer not null,
  currency text not null default 'CLP',
  status text not null default 'PENDING',
  external_reference text,
  proof_url text,
  reported_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'MANUAL',
  carrier text,
  service text,
  tracking_number text,
  cost integer not null default 0,
  status text not null default 'DRAFT',
  shipped_at timestamptz,
  estimated_delivery_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  batch_id uuid references public.production_batches(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  category text not null default 'OTHER',
  status text not null default 'OPEN',
  priority text not null default 'NORMAL',
  subject text not null,
  description text not null,
  assigned_to uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.device_activation_attempts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  status text not null default 'PENDING',
  attempt_count integer not null default 0,
  ip_hash text,
  user_agent text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

create index if not exists production_batches_status_idx on public.production_batches(status);
create index if not exists production_files_batch_id_idx on public.production_files(batch_id);
create index if not exists supplier_uid_imports_batch_id_idx on public.supplier_uid_imports(batch_id);
create index if not exists physical_verifications_device_id_idx on public.physical_verifications(device_id);
create index if not exists inventory_locations_name_idx on public.inventory_locations(name);
create index if not exists institution_leads_status_idx on public.institution_leads(status);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists orders_fulfillment_status_idx on public.orders(fulfillment_status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists shipments_order_id_idx on public.shipments(order_id);
create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists device_activation_attempts_device_id_idx on public.device_activation_attempts(device_id);
