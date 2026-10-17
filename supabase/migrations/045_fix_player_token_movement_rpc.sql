-- Hotfix for player movement RPC failure observed in Supabase edge logs (HTTP 404).
-- Remove invalid pg_catalog qualification of SQL greatest/least expressions:
-- SQL expressions LEAST/GREATEST must not be schema-qualified (SQLSTATE 42883).
-- Preserve the exact existing ownership, campaign and map-visibility checks.
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
     set x = coalesce(greatest(0, least(100, p_x)), x),
         y = coalesce(greatest(0, least(100, p_y)), y),
         token_size = coalesce(greatest(0.5, least(4, p_token_size)), token_size),
         range_cells = coalesce(greatest(0, least(30, p_range_cells)), range_cells),
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

-- Notify PostgREST: functions created/replaced while clients were active may
-- be absent from its schema cache, returning HTTP 404 / PGRST202.
notify pgrst, 'reload schema';
