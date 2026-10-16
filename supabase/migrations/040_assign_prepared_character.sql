-- Feature: GM prepares a Desvelado and delivers ownership to an active player.
-- DO NOT APPLY before an external backup and tests with two authenticated users.
-- A single SECURITY DEFINER transaction validates ownership, campaign and quotas.

create or replace function public.assign_prepared_character(
  p_campaign_id uuid,
  p_player_user_id uuid,
  p_character_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous text;
  v_quota integer;
  v_owned integer;
begin
  if v_actor is null or p_campaign_id is null or p_player_user_id is null
    or nullif(btrim(coalesce(p_character_id,'')), '') is null
    or not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o Mestre da campanha pode entregar fichas.'
      using errcode = '42501';
  end if;
  if p_player_user_id = v_actor then
    raise exception 'Escolha um jogador diferente do Mestre.'
      using errcode = '22023';
  end if;

  -- Serialize transfers to a given user so two concurrent GMs cannot
  -- accidentally consume the same final character slot.
  perform pg_catalog.pg_advisory_xact_lock(54217, pg_catalog.hashtext(p_player_user_id::text));

  select cm.character_id into v_previous
  from public.campaign_members cm
  where cm.campaign_id = p_campaign_id
    and cm.user_id = p_player_user_id
    and cm.status = 'ativo'
    and cm.role = 'jogador'
  for update;
  if not found then
    raise exception 'O jogador deve entrar na campanha antes de receber a ficha.'
      using errcode = '22023';
  end if;

  -- Only the GM's own sheet can be handed over. Another campaign's
  -- sheets and a different player's sheets are never eligible.
  perform 1
  from public.personagens pj
  where pj.id = p_character_id
    and pj.owner_user_id = v_actor
    and (pj.campaign_id is null or pj.campaign_id = p_campaign_id)
  for update;
  if not found then
    raise exception 'A ficha deve pertencer ao Mestre e estar livre para esta campanha.'
      using errcode = '42501';
  end if;
  if exists (
    select 1 from public.campaign_members cm
    where cm.character_id = p_character_id
      and (cm.campaign_id <> p_campaign_id or cm.user_id <> v_actor)
  ) then
    raise exception 'Essa ficha ja esta vinculada a outro participante.'
      using errcode = '22023';
  end if;

  -- A handoff must respect the recipient's storage quota as well.
  v_quota := public.community_limit_for_user(p_player_user_id, 'characters');
  select count(*)::integer into v_owned
    from public.personagens pj where pj.owner_user_id = p_player_user_id;
  if v_owned >= v_quota then
    raise exception 'O jogador atingiu o limite de % fichas do seu nivel.', v_quota
      using errcode = '22023';
  end if;

  -- Transfer is atomic: preserve the player's previous character as a
  -- personal character, don't delete it, and remove the GM's former link.
  if v_previous is not null then
    update public.personagens
       set campaign_id = null, atualizado_em = now()
     where id = v_previous
       and owner_user_id = p_player_user_id
       and campaign_id = p_campaign_id;
  end if;

  update public.campaign_members
     set character_id = null
   where campaign_id = p_campaign_id
     and user_id = v_actor
     and character_id = p_character_id;

  update public.personagens
     set owner_user_id = p_player_user_id,
         campaign_id = p_campaign_id,
         atualizado_em = now()
   where id = p_character_id
     and owner_user_id = v_actor;

  update public.campaign_members
     set character_id = p_character_id
   where campaign_id = p_campaign_id
     and user_id = p_player_user_id
     and role = 'jogador' and status = 'ativo';
end;
$$;

revoke all on function public.assign_prepared_character(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.assign_prepared_character(uuid,uuid,text) to authenticated;
