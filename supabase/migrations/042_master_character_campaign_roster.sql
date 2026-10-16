-- Add and remove GM-owned prepared sheets from a campaign without
-- placing them in the GM's single campaign_members.character_id slot.
-- Does NOT change character quotas, ownership, any player's sheet or resources.
-- Requires authenticated active campaign Master; no open global-user access.

create or replace function public.manage_master_character_roster(
  p_campaign_id uuid,
  p_character_id text,
  p_attach boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_current_campaign uuid;
begin
  if v_actor is null or p_campaign_id is null
    or nullif(pg_catalog.btrim(coalesce(p_character_id,'')), '') is null
    or p_attach is null
    or not public.is_campaign_master(p_campaign_id) then
    raise exception 'Somente o Mestre ativo pode preparar personagens nesta campanha.'
      using errcode = '42501';
  end if;

  -- Serialize modifications with transfers of the same sheet.
  select pj.campaign_id into v_current_campaign
    from public.personagens pj
   where pj.id = p_character_id and pj.owner_user_id = v_actor
   for update;
  if not found then
    raise exception 'A ficha deve pertencer ao Mestre.'
      using errcode = '42501';
  end if;

  if p_attach and v_current_campaign is not null and v_current_campaign <> p_campaign_id then
    raise exception 'Essa ficha ja pertence a outra campanha.'
      using errcode = '22023';
  end if;
  if not p_attach and v_current_campaign is distinct from p_campaign_id then
    raise exception 'A ficha nao esta nesta campanha.'
      using errcode = '22023';
  end if;

  -- Never detach/steal a player's character. The original Master may
  -- release their OWN obsolete single-character membership link.
  if exists (
    select 1
      from public.campaign_members cm
     where cm.character_id = p_character_id
       and not (
         cm.campaign_id = p_campaign_id and
         cm.user_id = v_actor and
         cm.role = 'mestre' and cm.status = 'ativo'
       )
  ) then
    raise exception 'Essa ficha esta atribuida a outro participante.'
      using errcode = '22023';
  end if;

  update public.campaign_members cm
     set character_id = null
   where cm.campaign_id = p_campaign_id
     and cm.user_id = v_actor and cm.role = 'mestre'
     and cm.status = 'ativo' and cm.character_id = p_character_id;

  update public.personagens pj
     set campaign_id = case when p_attach then p_campaign_id else null end,
         atualizado_em = now()
   where pj.id = p_character_id and pj.owner_user_id = v_actor;
  if not found then
    raise exception 'A ficha nao pode ser atualizada.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.manage_master_character_roster(uuid,text,boolean)
 from public, anon, authenticated;
grant execute on function public.manage_master_character_roster(uuid,text,boolean)
 to authenticated;
