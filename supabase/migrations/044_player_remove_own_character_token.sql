-- A player may remove only their own character's visible map token.
-- Deletion cascades to the token's resources but never to a character sheet.
-- GM keeps existing, separate full map-management permissions.

create or replace function public.remove_own_character_token(
  p_token_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_token public.map_tokens;
begin
  if v_actor is null or p_token_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select t.* into v_token
    from public.map_tokens t
   where t.id = p_token_id
   for update;
  if not found then
    raise exception 'TOKEN_NOT_FOUND' using errcode = '22023';
  end if;

  if v_token.tipo <> 'personagem'
     or v_token.character_id is null
     or v_token.oculto
     or not public.can_read_map_token(v_token.campaign_id, v_token.map_id, v_token.oculto)
     or not exists (
       select 1
         from public.campaign_members cm
         join public.personagens p
           on p.id=cm.character_id
          and p.owner_user_id=cm.user_id
          and p.campaign_id=cm.campaign_id
        where cm.campaign_id=v_token.campaign_id
          and cm.user_id=v_actor
          and cm.role='jogador'
          and cm.status='ativo'
          and cm.character_id=v_token.character_id
     ) then
    raise exception 'TOKEN_NOT_OWNED' using errcode = '42501';
  end if;

  delete from public.map_tokens where id = p_token_id;
end;
$$;

revoke all on function public.remove_own_character_token(uuid)
 from public, anon, authenticated;
grant execute on function public.remove_own_character_token(uuid)
 to authenticated;
