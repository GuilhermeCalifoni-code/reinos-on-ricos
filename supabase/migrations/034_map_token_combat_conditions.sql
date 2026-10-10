-- Conditions are distinct from map_tokens.oculto (GM-only visibility gate).
-- Every token instance has independent condition badges.
alter table public.map_tokens
  add column if not exists condicoes text[] not null default '{}'::text[];

alter table public.map_tokens
  add constraint map_tokens_condicoes_validas
  check (
    cardinality(condicoes) <= 3
    and condicoes <@ array['oculto','impedido','vulneravel']::text[]
  );

comment on column public.map_tokens.condicoes is
 'Combat conditions shown on visible tactical tokens; do NOT confuse with oculto boolean (hidden from players).';

-- Players are allowed to update conditions ONLY for the Desvelado bound to
-- their own active campaign membership. A restricted RPC avoids granting
-- blanket UPDATE on map_tokens or bypassing other map permissions.
create or replace function public.set_own_map_token_conditions(
  p_token_id uuid, p_condicoes text[]
)
returns public.map_tokens
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token public.map_tokens;
  v_new text[];
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_condicoes is null
     or cardinality(p_condicoes) > 3
     or not (p_condicoes <@ array['oculto','impedido','vulneravel']::text[])
  then
    raise exception 'INVALID_CONDITIONS';
  end if;

  select * into v_token
    from public.map_tokens
    where id=p_token_id for update;
  if not found then raise exception 'TOKEN_NOT_FOUND'; end if;

  if v_token.tipo <> 'personagem' or v_token.character_id is null
     or not public.can_read_map_token(v_token.campaign_id,v_token.map_id,v_token.oculto)
     or not exists (
       select 1 from public.campaign_members cm
       where cm.campaign_id=v_token.campaign_id
         and cm.user_id=auth.uid()
         and cm.status='ativo'
         and cm.role='jogador'
         and cm.character_id::text=v_token.character_id
     )
  then
    raise exception 'TOKEN_NOT_OWNED';
  end if;

  select coalesce(array_agg(distinct c order by c),'{}'::text[]) into v_new
  from unnest(p_condicoes) c;

  update public.map_tokens
  set condicoes=v_new, atualizado_em=now()
  where id=p_token_id
  returning * into v_token;

  return v_token;
end;
$$;

revoke all on function public.set_own_map_token_conditions(uuid,text[]) from public;
grant execute on function public.set_own_map_token_conditions(uuid,text[]) to authenticated;
