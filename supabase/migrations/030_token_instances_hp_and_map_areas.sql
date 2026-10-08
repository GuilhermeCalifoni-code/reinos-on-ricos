-- Tokens visíveis continuam contendo somente informações que o Jogador pode conhecer.
-- PV de cada cópia são PRIVADOS ao Mestre, mesmo que o token seja revelado.
alter table public.map_tokens
  add column if not exists area_radius_cells integer not null default 0;
alter table public.map_tokens
  add constraint map_tokens_area_radius_valid
  check (area_radius_cells between 0 and 30);

comment on column public.map_tokens.area_radius_cells is
  'Raio persistente de círculo de área de efeito em células do mapa, visível com o token.';

create table if not exists public.map_token_resources (
  token_id uuid primary key references public.map_tokens(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  hp_current integer not null check (hp_current >= 0),
  hp_max integer not null check (hp_max >= 1 and hp_max <= 99999),
  constraint map_token_resource_health check (hp_current <= hp_max),
  updated_at timestamptz not null default now()
);
create index if not exists map_token_resources_campaign_idx on public.map_token_resources(campaign_id);
alter table public.map_token_resources enable row level security;

create policy "masters read token resources" on public.map_token_resources
for select to authenticated using (public.is_campaign_master(campaign_id));

create policy "masters insert token resources" on public.map_token_resources
for insert to authenticated with check (
  public.is_campaign_master(campaign_id)
  and exists(select 1 from public.map_tokens t
    where t.id=token_id and t.campaign_id=campaign_id)
);

create policy "masters update token resources" on public.map_token_resources
for update to authenticated using (public.is_campaign_master(campaign_id))
with check (
  public.is_campaign_master(campaign_id)
  and exists(select 1 from public.map_tokens t
    where t.id=token_id and t.campaign_id=campaign_id)
);

grant select,insert,update on public.map_token_resources to authenticated;
-- Nunca adicionar DELETE para authenticated: remoção em cascata com o token é suficiente.
-- Realtime usa o RLS da tabela: jogadores não recebem PV privados.
alter publication supabase_realtime add table public.map_token_resources;
