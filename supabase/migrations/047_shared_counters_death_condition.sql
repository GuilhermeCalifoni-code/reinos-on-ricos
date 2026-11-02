-- Playtest feedback: a GM may explicitly share counters with active campaign
-- participants; unshared counters stay private even in the REST API.
-- Players may set a "morte" condition ONLY on their own visible Desvelado token.
-- No row is deleted or modified by this migration.

alter table public.session_counters
  drop constraint if exists session_counters_gm_only_visibility;

-- Existing enum-like check session_counters_visibilidade_check already permits
-- 'compartilhado'; leave it in place.
create policy "campaign members read explicitly shared counters"
  on public.session_counters for select to authenticated
  using (
    visibilidade = 'compartilhado'
    and public.is_campaign_member(campaign_id)
  );

alter table public.map_tokens
  drop constraint if exists map_tokens_condicoes_validas;
alter table public.map_tokens
  add constraint map_tokens_condicoes_validas
  check (cardinality(condicoes) <= 4
    and condicoes <@ array['oculto','impedido','vulneravel','morte']::text[]);

create or replace function public.set_own_map_token_conditions(
  p_token_id uuid, p_condicoes text[]
)
returns public.map_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token public.map_tokens;
  v_new text[];
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if p_condicoes is null
     or cardinality(p_condicoes) > 4
     or not (p_condicoes <@ array['oculto','impedido','vulneravel','morte']::text[])
  then
    raise exception 'INVALID_CONDITIONS' using errcode = '22023';
  end if;
  select * into v_token from public.map_tokens
    where id = p_token_id for update;
  if not found then raise exception 'TOKEN_NOT_FOUND' using errcode = '22023'; end if;
  if v_token.tipo <> 'personagem'
     or v_token.character_id is null
     or not public.can_read_map_token(v_token.campaign_id, v_token.map_id, v_token.oculto)
     or not exists (
       select 1 from public.campaign_members cm
         join public.personagens p on p.id = cm.character_id
       where cm.campaign_id = v_token.campaign_id
         and cm.user_id = auth.uid()
         and cm.status = 'ativo'
         and cm.role = 'jogador'
         and cm.character_id = v_token.character_id
         and p.owner_user_id = cm.user_id
         and p.campaign_id = cm.campaign_id
     )
  then
    raise exception 'TOKEN_NOT_OWNED' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct c order by c), '{}'::text[])
    into v_new from unnest(p_condicoes) c;
  update public.map_tokens set condicoes = v_new, atualizado_em = now()
    where id = p_token_id returning * into v_token;
  return v_token;
end;
$$;

revoke all on function public.set_own_map_token_conditions(uuid,text[])
  from public, anon, authenticated;
grant execute on function public.set_own_map_token_conditions(uuid,text[])
  to authenticated;

notify pgrst, 'reload schema';
