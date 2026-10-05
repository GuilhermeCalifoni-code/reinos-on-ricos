-- Reinos Oníricos
-- Permite vincular com segurança uma ficha pessoal à campanha do próprio usuário.

create or replace function public.link_own_character_to_membership(
  p_campaign_id uuid,
  p_character_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_campaign_member(p_campaign_id) then
    raise exception 'campaign membership required';
  end if;

  update public.personagens
  set campaign_id = p_campaign_id,
      atualizado_em = now()
  where id = p_character_id
    and owner_user_id = auth.uid()
    and (campaign_id is null or campaign_id = p_campaign_id);

  if not found then
    raise exception 'character is not owned by current user or is linked to another campaign';
  end if;

  update public.campaign_members
  set character_id = p_character_id
  where campaign_id = p_campaign_id
    and user_id = auth.uid();
end;
$$;

revoke execute on function public.link_own_character_to_membership(uuid,text) from public, anon;
grant execute on function public.link_own_character_to_membership(uuid,text) to authenticated;
