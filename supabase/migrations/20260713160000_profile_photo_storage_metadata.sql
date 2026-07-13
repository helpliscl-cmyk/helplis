-- Profile photo storage metadata and owner/profile-scoped private paths.

alter table public.profiles
  add column if not exists photo_storage_path text,
  add column if not exists photo_mime_type text,
  add column if not exists photo_width integer,
  add column if not exists photo_height integer,
  add column if not exists photo_size_bytes integer,
  add column if not exists photo_updated_at timestamptz;

create or replace function public.is_profile_photo_path_allowed(object_name text)
returns boolean
language sql
stable
set search_path = public, storage
as $$
  select object_name ~ ('^users/' || auth.uid()::text || '/profiles/[0-9a-zA-Z_-]{8,}/[0-9a-f-]{20,}\.webp$');
$$;

drop policy if exists "profile photo owners read" on storage.objects;
drop policy if exists "profile photo owners upload random names" on storage.objects;
drop policy if exists "profile photo owners replace" on storage.objects;
drop policy if exists "profile photo owners delete" on storage.objects;

create policy "profile photo owners read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "profile photo owners upload random names" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_profile_photo_path_allowed(name)
  );

create policy "profile photo owners replace" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.is_profile_photo_path_allowed(name)
  );

create policy "profile photo owners delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
