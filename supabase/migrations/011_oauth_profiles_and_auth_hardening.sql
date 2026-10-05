-- Reinos Oníricos
-- OAuth profile metadata + first-pass auth hardening.
-- Applied to production project hyuvypzjlsuoatkpzcuv on 2026-10-04.

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
  set nome = coalesce(excluded.nome, public.profiles.nome),
      email = coalesce(excluded.email, public.profiles.email),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      atualizado_em = now();

  return new;
end;
$$;

update public.profiles p
set email = u.email,
    avatar_url = coalesce(
      p.avatar_url,
      nullif(u.raw_user_meta_data->>'avatar_url', ''),
      nullif(u.raw_user_meta_data->>'picture', '')
    ),
    atualizado_em = now()
from auth.users u
where p.user_id = u.id
  and (
    p.email is distinct from u.email
    or (
      p.avatar_url is null
      and coalesce(
        nullif(u.raw_user_meta_data->>'avatar_url', ''),
        nullif(u.raw_user_meta_data->>'picture', '')
      ) is not null
    )
  );

revoke execute on function public.create_profile_for_auth_user() from public, anon, authenticated;
revoke execute on function public.stamp_session_event_metadata() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.live_state_set_updated_at() from public, anon, authenticated;
revoke execute on function public.live_table_set_updated_at() from public, anon, authenticated;
revoke execute on function public.map_token_campaign_matches_map() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

revoke execute on function public.can_read_campaign_content(uuid,text) from anon;
revoke execute on function public.can_read_live_content(uuid,text) from anon;
revoke execute on function public.can_read_map_token(uuid,uuid,boolean) from anon;
revoke execute on function public.can_read_session_event(uuid,text,uuid) from anon;
revoke execute on function public.can_update_own_linked_character(uuid,text) from anon;
revoke execute on function public.create_campaign(text,text,text,text) from anon;
revoke execute on function public.is_active_campaign_member(uuid,uuid) from anon;
revoke execute on function public.is_campaign_master(uuid) from anon;
revoke execute on function public.is_campaign_master_user(uuid,uuid) from anon;
revoke execute on function public.is_campaign_member(uuid) from anon;
revoke execute on function public.is_campaign_player(uuid) from anon;
revoke execute on function public.join_campaign_by_code(text) from anon;
revoke execute on function public.link_own_character_to_membership(uuid,text) from anon;
revoke execute on function public.regenerate_campaign_invite(uuid) from anon;

alter policy "Permitir tudo em mesas" on public.mesas to authenticated;
alter policy "Permitir tudo em cenas_tensao" on public.cenas_tensao to authenticated;
alter policy "Permitir tudo em rolagens" on public.rolagens to authenticated;
