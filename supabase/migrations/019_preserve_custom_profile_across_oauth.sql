-- Reinos Oníricos
-- Mantém nome/avatar escolhidos dentro do app como fonte canônica.
-- Logins OAuth (Google etc.) podem atualizar raw_user_meta_data; isso não deve
-- sobrescrever personalizações já salvas em public.profiles.

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_avatar text;
begin
  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'nome', ''),
    split_part(coalesce(new.email, 'Desvelado'), '@', 1)
  );

  profile_avatar := coalesce(
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'picture', '')
  );

  insert into public.profiles(user_id, nome, email, avatar_url)
  values(new.id, profile_name, new.email, profile_avatar)
  on conflict(user_id) do update
  set nome = coalesce(nullif(public.profiles.nome, ''), excluded.nome),
      email = coalesce(excluded.email, public.profiles.email),
      avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url),
      atualizado_em = now();

  return new;
end;
$$;

-- Recupera avatares customizados já enviados ao Storage que tenham sido
-- sobrescritos em profiles por um login OAuth posterior.
update public.profiles p
set avatar_url =
  'https://hyuvypzjlsuoatkpzcuv.supabase.co/storage/v1/object/public/profile-avatars/' ||
  o.name || '?v=' || floor(extract(epoch from o.updated_at) * 1000)::bigint::text,
    atualizado_em = now()
from storage.objects o
where o.bucket_id = 'profile-avatars'
  and split_part(o.name, '/', 1) = p.user_id::text;
