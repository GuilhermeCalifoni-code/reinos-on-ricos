alter table public.narrative_maps
  add column if not exists grid_size integer not null default 64;

alter table public.narrative_maps
  drop constraint if exists narrative_maps_grid_size_range;
alter table public.narrative_maps
  add constraint narrative_maps_grid_size_range check (grid_size between 24 and 160);

alter table public.map_tokens
  add column if not exists token_size numeric not null default 1,
  add column if not exists range_cells numeric not null default 0;

alter table public.map_tokens
  drop constraint if exists map_tokens_token_size_range;
alter table public.map_tokens
  add constraint map_tokens_token_size_range check (token_size between 0.5 and 4);

alter table public.map_tokens
  drop constraint if exists map_tokens_range_cells_range;
alter table public.map_tokens
  add constraint map_tokens_range_cells_range check (range_cells between 0 and 30);

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
set search_path = public
as $$
declare
  v_token public.map_tokens;
begin
  select *
  into v_token
  from public.map_tokens
  where id = p_token_id;

  if not found then
    raise exception 'TOKEN_NOT_FOUND';
  end if;

  if v_token.character_id is null or not exists (
    select 1
    from public.campaign_members cm
    where cm.campaign_id = v_token.campaign_id
      and cm.user_id = auth.uid()
      and cm.status = 'ativo'
      and cm.character_id::text = v_token.character_id
  ) then
    raise exception 'TOKEN_NOT_OWNED';
  end if;

  update public.map_tokens
  set
    x = coalesce(greatest(0, least(100, p_x)), x),
    y = coalesce(greatest(0, least(100, p_y)), y),
    token_size = coalesce(greatest(0.5, least(4, p_token_size)), token_size),
    range_cells = coalesce(greatest(0, least(30, p_range_cells)), range_cells),
    atualizado_em = now()
  where id = p_token_id
  returning * into v_token;

  return v_token;
end;
$$;

grant execute on function public.move_own_map_token(uuid, numeric, numeric, numeric, numeric) to authenticated;
