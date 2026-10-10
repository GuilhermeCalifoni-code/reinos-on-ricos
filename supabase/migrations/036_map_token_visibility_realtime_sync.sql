-- Realtime change of map_tokens.oculto is protected by token SELECT RLS.
-- When a visible token becomes private, its UPDATE is correctly not delivered
-- to players. Publish a metadata-free campaign revision instead, allowing
-- clients to reload only the tokens they are authorized to read.
create table if not exists public.map_token_visibility_versions (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.map_token_visibility_versions enable row level security;
revoke all on public.map_token_visibility_versions from anon;
grant select on public.map_token_visibility_versions to authenticated;

create policy "campaign members read visibility revision"
  on public.map_token_visibility_versions for select to authenticated
  using (public.is_campaign_member(campaign_id));

create or replace function public.bump_map_token_visibility_version()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  insert into public.map_token_visibility_versions(campaign_id,revision,updated_at)
    values (new.campaign_id,1,now())
  on conflict (campaign_id) do update
    set revision=public.map_token_visibility_versions.revision+1,
        updated_at=now();
  return new;
end;
$$;

create trigger map_tokens_visibility_revision
after update of oculto on public.map_tokens
for each row
when (old.oculto is distinct from new.oculto)
execute function public.bump_map_token_visibility_version();

alter publication supabase_realtime add table public.map_token_visibility_versions;

comment on table public.map_token_visibility_versions is
  'Only campaign ID + monotonic revision; no hidden token IDs, names, positions or conditions are revealed.';
