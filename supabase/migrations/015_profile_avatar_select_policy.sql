-- Reinos Oníricos
-- Supabase Storage upsert exige SELECT além de INSERT/UPDATE.
-- O usuário autenticado pode ler apenas o metadata do próprio avatar.

drop policy if exists "users read own profile avatar" on storage.objects;

create policy "users read own profile avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
