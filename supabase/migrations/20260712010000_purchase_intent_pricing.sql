alter table if exists public."PurchaseIntent"
  add column if not exists "region" text not null default '',
  add column if not exists "packId" integer not null default 1,
  add column if not exists "unitPrice" integer not null default 18000,
  add column if not exists "totalPrice" integer not null default 18000,
  add column if not exists "shippingPending" boolean not null default true,
  add column if not exists "origin" text;

create index if not exists "PurchaseIntent_packId_idx" on public."PurchaseIntent" ("packId");
