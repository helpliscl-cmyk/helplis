-- Profile photo storage hardening.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create or replace function public.is_profile_photo_path_allowed(object_name text)
returns boolean
language sql
stable
set search_path = public, storage
as $$
  select object_name ~ ('^' || auth.uid()::text || '/[0-9a-f-]{20,}\\.(jpg|jpeg|png|webp)$');
$$;

drop policy if exists "profile photo owners can read own folder" on storage.objects;
drop policy if exists "profile photo owners can upload own folder" on storage.objects;
drop policy if exists "profile photo owners can update own folder" on storage.objects;
drop policy if exists "profile photo owners can delete own folder" on storage.objects;
drop policy if exists "profile photo owners read" on storage.objects;
drop policy if exists "profile photo owners upload random names" on storage.objects;
drop policy if exists "profile photo owners replace" on storage.objects;
drop policy if exists "profile photo owners delete" on storage.objects;

create policy "profile photo owners read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile photo owners upload random names" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_profile_photo_path_allowed(name)
  );

create policy "profile photo owners replace" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_profile_photo_path_allowed(name)
  );

create policy "profile photo owners delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
