-- Depends on 040_assign_prepared_character.sql.
-- Resolve an exact sign-in email inside a SECURITY DEFINER function.
-- Never expose auth.users or allow searching the site's user directory.
-- NOT APPLIED: require verified backup, RPC audit and Mestre/Jogador QA.

create or replace function public.assign_prepared_character_by_email(
  p_campaign_id uuid,
  p_player_email text,
  p_character_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_player_email,'')));
  v_player_user_id uuid;
begin
  if v_actor is null or p_campaign_id is null
    or not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o Mestre da campanha pode entregar fichas.'
      using errcode = '42501';
  end if;

  if pg_catalog.length(v_email) > 254
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Informe um e-mail valido.'
      using errcode = '22023';
  end if;

  -- The address must match the player's AUTH login, not an editable
  -- profile field. Limit the lookup to ACTIVE PLAYERS of this campaign.
  select cm.user_id into v_player_user_id
  from public.campaign_members cm
  join auth.users au on au.id = cm.user_id
  where cm.campaign_id = p_campaign_id
    and cm.role = 'jogador'
    and cm.status = 'ativo'
    and pg_catalog.lower(au.email) = v_email
  limit 1;

  if v_player_user_id is null then
    -- Deliberately do not disclose if the email is registered outside
    -- the campaign. This RPC is not a public email search.
    raise exception 'Nao foi encontrado jogador ativo com esse e-mail nesta campanha. Peça que entre primeiro pelo convite.'
      using errcode = '22023';
  end if;

  -- 040 re-checks ownership, campaign, membership, quota and locking.
  -- SECURITY DEFINER does NOT alter auth.uid() (JWT identity).
  perform public.assign_prepared_character(
    p_campaign_id,
    v_player_user_id,
    p_character_id
  );
end;
$$;

revoke all on function public.assign_prepared_character_by_email(uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.assign_prepared_character_by_email(uuid,text,text)
  to authenticated;
