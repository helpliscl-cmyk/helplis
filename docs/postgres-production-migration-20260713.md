# HelPlis Production PostgreSQL Migration Audit

Date: 2026-07-13

## Scope

- Project: `ndzcpzjkseugqffyeslr`
- Production domain: `https://helplis.cl`
- Official production database: Supabase PostgreSQL
- Production auth provider: Supabase Auth

## Vercel Environment Changes

Only environment variable names and target environments were recorded before changing values.

Configured in Production, Preview, and Development:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_PROVIDER`
- `ALLOW_DEMO_MODE`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_PROFILE_BUCKET`

`DATABASE_URL` uses the Supabase/Supavisor transaction pooler. `DIRECT_URL` uses the Supabase direct PostgreSQL host for migration-capable connections.

## Remote Database Preflight

Before applying the Prisma production schema:

- Existing Supabase Auth tables existed.
- Existing Supabase Storage tables existed.
- Existing public Supabase snake_case tables existed with zero rows in sampled business tables.
- Prisma CamelCase application tables did not exist.
- `_prisma_migrations` did not exist.
- `auth.users` count was `0`.
- `profile-photos` bucket existed and was private.
- No SAMPLE batch was persisted.

No `db reset`, destructive `db push`, or seed was executed.

## Schema Application

Applied a generated PostgreSQL SQL script from `prisma/schema.production.prisma`:

- `DROP`: none
- `TRUNCATE`: none
- `DELETE FROM`: none
- Applied statements: `300`
- Applied through the Supabase pooler because the direct database host was not reachable from the local machine.
- No demo seed was run.

After application:

- Prisma application tables exist.
- `User`: `1`
- `Device`: `0`
- `Profile`: `0`
- `Batch`: `0`
- `ProductionFile`: `0`
- `AuditLog`: `0`
- Persisted SAMPLE batches: `0`

## Auth

- `admin@helplis.cl` exists in Supabase Auth.
- Internal `User` row is linked to the Supabase Auth user id.
- Role: `SUPER_ADMIN`
- Status: `ACTIVE`
- Demo internal users: `0`

## RLS And Storage

- Public schema policies detected: `45`
- Storage policies detected: `4`
- `profile-photos` bucket: private (`public = false`)
- Profile photo storage policies:
  - `profile photo owners delete`
  - `profile photo owners read`
  - `profile photo owners replace`
  - `profile photo owners upload random names`

## Safety Changes

- Production runtime blocks SQLite/demo database URLs.
- Production runtime requires PostgreSQL.
- Demo mode is blocked when `VERCEL_ENV=production` or `NEXT_PUBLIC_APP_URL=https://helplis.cl`.
- Demo users are blocked from production writes.
- SAMPLE confirmation is blocked for demo/test/SQLite runtime.
- Vercel build no longer copies or seeds `prisma/vercel-demo.db`.
- Vercel build no longer runs production `db push` automatically; schema changes must be applied deliberately before deployment.

