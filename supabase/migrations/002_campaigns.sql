create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  nome text not null,
  descricao text not null default '',
  imagem_url text,
  tipo text not null default 'campanha' check (tipo in ('campanha','oneshot','playtest')),
  status text not null default 'planejamento' check (status in ('em_andamento','planejamento','concluida')),
  codigo_convite text,
  ruptura_geral integer not null default 0 check (ruptura_geral between 0 and 6),
  sessao_atual integer not null default 1 check (sessao_atual > 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.campaigns add column if not exists codigo_convite text;
create unique index if not exists campaigns_invite_code_unique on public.campaigns(codigo_convite) where codigo_convite is not null;
create index if not exists campaigns_owner_idx on public.campaigns(owner_id);
drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();

create or replace function public.generate_invite_code() returns text language plpgsql volatile set search_path = public as $$
declare code text; begin loop code := 'REINO-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12)); exit when not exists (select 1 from public.campaigns where codigo_convite = code); end loop; return code; end; $$;
update public.campaigns set codigo_convite = public.generate_invite_code() where codigo_convite is null;

create table if not exists public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('mestre','jogador','observador')),
  character_id text,
  status text not null default 'ativo' check (status in ('ativo','pendente','removido')),
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);
create index if not exists campaign_members_user_idx on public.campaign_members(user_id, campaign_id);
create index if not exists campaign_members_character_idx on public.campaign_members(character_id) where character_id is not null;

create or replace function public.is_campaign_member(p_campaign_id uuid) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from public.campaign_members where campaign_id = p_campaign_id and user_id = auth.uid() and status = 'ativo'); $$;
create or replace function public.is_campaign_master(p_campaign_id uuid) returns boolean language sql security definer stable set search_path = public as $$ select exists (select 1 from public.campaign_members where campaign_id = p_campaign_id and user_id = auth.uid() and role = 'mestre' and status = 'ativo'); $$;

create or replace function public.create_campaign(p_nome text, p_descricao text default '', p_imagem_url text default '', p_tipo text default 'campanha') returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; begin if auth.uid() is null then raise exception 'authentication required'; end if; insert into public.campaigns(owner_id,nome,descricao,imagem_url,tipo,codigo_convite) values(auth.uid(),trim(p_nome),coalesce(p_descricao,''),nullif(p_imagem_url,''),p_tipo,public.generate_invite_code()) returning id into new_id; insert into public.campaign_members(campaign_id,user_id,role) values(new_id,auth.uid(),'mestre'); return new_id; end; $$;
create or replace function public.join_campaign_by_code(p_codigo text) returns uuid language plpgsql security definer set search_path = public as $$
declare campaign uuid; begin if auth.uid() is null then raise exception 'authentication required'; select id into campaign from public.campaigns where codigo_convite = upper(trim(p_codigo)); if campaign is null then raise exception 'invalid invite code'; end if; insert into public.campaign_members(campaign_id,user_id,role,status) values(campaign,auth.uid(),'jogador','ativo') on conflict(campaign_id,user_id) do update set status='ativo', role=case when public.campaign_members.role='observador' then 'jogador' else public.campaign_members.role end; return campaign; end; $$;
create or replace function public.regenerate_campaign_invite(p_campaign_id uuid) returns text language plpgsql security definer set search_path = public as $$ declare code text; begin if not public.is_campaign_master(p_campaign_id) then raise exception 'master role required'; end if; code := public.generate_invite_code(); update public.campaigns set codigo_convite=code where id=p_campaign_id; return code; end; $$;
