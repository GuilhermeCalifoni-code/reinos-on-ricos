-- Critical VTT hotfix: preserve omitted fields when players change ONLY size/range/position.
-- PostgreSQL LEAST/GREATEST skip NULL arguments; COALESCE around these expressions
-- changes NULL parameters into LIMIT values (x/y=100, token_size=4, range=30).
-- CASE tests original parameters BEFORE clamping, so omitted values stay unchanged.
-- Preserve all character ownership, active campaign membership and map visibility checks.
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
     set x = case when p_x is null then x else greatest(0, least(100, p_x)) end,
         y = case when p_y is null then y else greatest(0, least(100, p_y)) end,
         token_size = case when p_token_size is null then token_size
                           else greatest(0.5, least(4, p_token_size)) end,
         range_cells = case when p_range_cells is null then range_cells
                            else greatest(0, least(30, p_range_cells)) end,
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


-- Refresh PostgREST's cached RPC definition without touching token data.
notify pgrst, 'reload schema';
