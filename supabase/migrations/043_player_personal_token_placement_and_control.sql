-- Let an active Player place only their linked Desvelado on a map
-- that is already visible to campaign members.
-- Master token creation and hidden maps remain exclusive to the Master.
create or replace function public.place_own_character_token(
  p_map_id uuid
)
returns public.map_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign_id uuid;
  v_character_id text;
  v_name text;
  v_image_url text;
  v_existing public.map_tokens;
  v_created public.map_tokens;
begin
  if v_user_id is null or p_map_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select m.campaign_id into v_campaign_id
    from public.narrative_maps m
   where m.id = p_map_id
     and m.visibilidade <> 'mestre_privado';
  if not found then
    raise exception 'MAP_NOT_VISIBLE' using errcode = '42501';
  end if;

  -- Lock membership so the character cannot be switched while placing it.
  select cm.character_id into v_character_id
    from public.campaign_members cm
   where cm.campaign_id = v_campaign_id
     and cm.user_id = v_user_id
     and cm.role = 'jogador'
     and cm.status = 'ativo'
   for update;

  if not found or nullif(v_character_id, '') is null then
    raise exception 'LINK_YOUR_CHARACTER_FIRST' using errcode = '42501';
  end if;

  select p.nome, p.imagem_url into v_name, v_image_url
    from public.personagens p
   where p.id = v_character_id
     and p.owner_user_id = v_user_id
     and p.campaign_id = v_campaign_id;
  if not found then
    raise exception 'CHARACTER_NOT_OWNED_OR_LINKED' using errcode = '42501';
  end if;

  select * into v_existing
    from public.map_tokens t
   where t.map_id = p_map_id
     and t.campaign_id = v_campaign_id
     and t.tipo = 'personagem'
     and t.character_id = v_character_id
   order by t.criado_em asc
   limit 1;

  if found then
    -- Never leak hidden tokens to players, even if they belong to the sheet.
    if v_existing.oculto or not public.can_read_map_token(
        v_existing.campaign_id, v_existing.map_id, v_existing.oculto) then
      raise exception 'TOKEN_HIDDEN_BY_MASTER' using errcode = '42501';
    end if;
    return v_existing;
  end if;

  insert into public.map_tokens(
    map_id, campaign_id, tipo, character_id, nome, imagem_url,
    cor, x, y, token_size, range_cells, area_radius_cells, oculto, criado_por
  )
  values (
    p_map_id, v_campaign_id, 'personagem', v_character_id, v_name,
    v_image_url, '#c8a568', 50, 50, 1, 0, 0, false, v_user_id
  )
  returning * into v_created;

  return v_created;
end;
$$;
revoke all on function public.place_own_character_token(uuid)
  from public, anon, authenticated;
grant execute on function public.place_own_character_token(uuid) to authenticated;

-- Tighten the existing movement RPC to the same membership and visibility rules:
-- a player cannot resize or move adversaries, hidden tokens, or tokens from
-- a private map, and anonymous callers cannot invoke the RPC.
create or replace function public.move_own_map_token(
  p_token_id uuid,
  p_x numeric default null,
  p_y numeric default null,
  p_token_size numeric default null,
  p_range_cells numeric default null
)
returns public.map_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.map_tokens;
begin
  if auth.uid() is null or p_token_id is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select * into v_token
    from public.map_tokens
   where id = p_token_id
   for update;
  if not found then
    raise exception 'TOKEN_NOT_FOUND' using errcode = '22023';
  end if;

  if v_token.tipo <> 'personagem'
    or v_token.character_id is null
    or not public.can_read_map_token(
      v_token.campaign_id,v_token.map_id,v_token.oculto
    )
    or not exists (
      select 1 from public.campaign_members cm
      join public.personagens p
        on p.id=cm.character_id
       and p.owner_user_id=cm.user_id
       and p.campaign_id=cm.campaign_id
      where cm.campaign_id=v_token.campaign_id
        and cm.user_id=auth.uid()
        and cm.role='jogador'
        and cm.status='ativo'
        and cm.character_id=v_token.character_id
    )
  then
    raise exception 'TOKEN_NOT_OWNED' using errcode = '42501';
  end if;

  update public.map_tokens
     set x = coalesce(pg_catalog.greatest(0, pg_catalog.least(100, p_x)), x),
         y = coalesce(pg_catalog.greatest(0, pg_catalog.least(100, p_y)), y),
         token_size = coalesce(pg_catalog.greatest(0.5, pg_catalog.least(4, p_token_size)), token_size),
         range_cells = coalesce(pg_catalog.greatest(0, pg_catalog.least(30, p_range_cells)), range_cells),
         atualizado_em = now()
   where id=p_token_id
   returning * into v_token;
  return v_token;
end;
$$;
revoke all on function public.move_own_map_token(uuid,numeric,numeric,numeric,numeric)
  from public, anon, authenticated;
grant execute on function public.move_own_map_token(uuid,numeric,numeric,numeric,numeric)
  to authenticated;
