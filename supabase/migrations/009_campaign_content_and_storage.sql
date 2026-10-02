-- Fase 7.5: persistência remota da preparação de campanha e hardening do Registro Vivo.
-- Migração aditiva: não remove dados existentes.

create table if not exists public.campaign_sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  numero integer not null check (numero > 0),
  titulo text not null check (char_length(trim(titulo)) between 1 and 180),
  data_text text not null default '',
  jogadores_count integer not null default 0 check (jogadores_count >= 0),
  resumo text,
  concluida boolean not null default false,
  descricao text,
  status text not null default 'planejamento' check (status in ('planejamento','pronta','ao_vivo','concluida')),
  anotacoes_mestre text,
  cena_ids jsonb not null default '[]'::jsonb,
  npc_ids jsonb not null default '[]'::jsonb,
  local_ids jsonb not null default '[]'::jsonb,
  pista_ids jsonb not null default '[]'::jsonb,
  adversario_ids jsonb not null default '[]'::jsonb,
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  conteudo_de_cena text not null default 'ambientacao' check (conteudo_de_cena in ('ambientacao','imagem','mapa','handout')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (campaign_id, numero)
);

create table if not exists public.campaign_npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  nome text not null,
  papel text not null default '',
  conceito text not null default '',
  descricao text not null default '',
  atitude text not null default 'neutro' check (atitude in ('aliado','neutro','hostil','desconhecido')),
  localizacao text not null default '',
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_adversaries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  nome text not null,
  tipo text not null default 'pesadelo',
  nivel integer not null default 1 check (nivel between 1 and 5),
  vida integer not null default 3 check (vida >= 0),
  vida_maxima integer not null default 3 check (vida_maxima > 0),
  defesa integer not null default 12,
  resistencia integer not null default 6,
  ataque_principal text not null default '',
  descricao text not null default '',
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  nome text not null,
  tipo text not null default 'urbano',
  descricao text not null default '',
  anomalia_detectada text,
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_clues (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  titulo text not null,
  tipo text not null default 'documento',
  status text not null default 'descoberta' check (status in ('descoberta','sob_analise','resolvida')),
  descricao text not null default '',
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_lore (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  titulo text not null,
  categoria text not null default 'mundo' check (categoria in ('mundo','faccao','sonhar','regras')),
  conteudo text not null default '',
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  titulo text not null,
  conteudo text not null default '',
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_scenes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  titulo text not null,
  descricao text,
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  tipo_de_conteudo text not null default 'ambientacao' check (tipo_de_conteudo in ('ambientacao','imagem','mapa','handout')),
  imagem_url text,
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.campaign_handouts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  titulo text not null,
  descricao text,
  arquivo_url text,
  storage_path text,
  visibilidade text not null default 'mestre_privado' check (visibilidade in ('mestre_privado','compartilhado','revelado_jogadores')),
  criado_por uuid not null default auth.uid() references auth.users(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.narrative_maps add column if not exists storage_path text;

create index if not exists campaign_sessions_campaign_idx on public.campaign_sessions(campaign_id, numero);
create index if not exists campaign_npcs_campaign_idx on public.campaign_npcs(campaign_id);
create index if not exists campaign_adversaries_campaign_idx on public.campaign_adversaries(campaign_id);
create index if not exists campaign_locations_campaign_idx on public.campaign_locations(campaign_id);
create index if not exists campaign_clues_campaign_idx on public.campaign_clues(campaign_id);
create index if not exists campaign_lore_campaign_idx on public.campaign_lore(campaign_id);
create index if not exists campaign_notes_campaign_idx on public.campaign_notes(campaign_id);
create index if not exists campaign_scenes_campaign_idx on public.campaign_scenes(campaign_id);
create index if not exists campaign_handouts_campaign_idx on public.campaign_handouts(campaign_id);

do $$
declare t text;
begin
  foreach t in array array['campaign_sessions','campaign_npcs','campaign_adversaries','campaign_locations','campaign_clues','campaign_lore','campaign_notes','campaign_scenes','campaign_handouts'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.live_table_set_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.can_read_campaign_content(p_campaign_id uuid, p_visibility text)
returns boolean language sql security definer stable set search_path = public as $$
  select public.is_campaign_master(p_campaign_id)
    or (p_visibility <> 'mestre_privado' and public.is_campaign_member(p_campaign_id));
$$;

alter table public.campaign_sessions enable row level security;
alter table public.campaign_npcs enable row level security;
alter table public.campaign_adversaries enable row level security;
alter table public.campaign_locations enable row level security;
alter table public.campaign_clues enable row level security;
alter table public.campaign_lore enable row level security;
alter table public.campaign_notes enable row level security;
alter table public.campaign_scenes enable row level security;
alter table public.campaign_handouts enable row level security;

-- Sessões e notas do Mestre ficam privadas nesta etapa; demais recursos respeitam visibilidade.
create policy "masters manage sessions" on public.campaign_sessions for all using (public.is_campaign_master(campaign_id)) with check (public.is_campaign_master(campaign_id));
create policy "masters manage notes" on public.campaign_notes for all using (public.is_campaign_master(campaign_id)) with check (public.is_campaign_master(campaign_id));

do $$
declare t text;
begin
  foreach t in array array['campaign_npcs','campaign_adversaries','campaign_locations','campaign_clues','campaign_lore','campaign_scenes','campaign_handouts'] loop
    execute format('create policy "members read visible %s" on public.%I for select using (public.can_read_campaign_content(campaign_id, visibilidade))', t, t);
    execute format('create policy "masters manage %s" on public.%I for all using (public.is_campaign_master(campaign_id)) with check (public.is_campaign_master(campaign_id))', t, t);
  end loop;
end $$;

-- Donos podem excluir a própria ficha remota. Mestres continuam cobertos pela policy existente.
drop policy if exists "owners delete own characters" on public.personagens;
create policy "owners delete own characters" on public.personagens for delete using (owner_user_id = auth.uid());

-- Perfis de participantes podem ser lidos por pessoas que compartilham uma campanha ativa.
drop policy if exists "campaign co-members read profiles" on public.profiles;
create policy "campaign co-members read profiles" on public.profiles for select using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.campaign_members me
    join public.campaign_members other on other.campaign_id = me.campaign_id
    where me.user_id = auth.uid() and me.status = 'ativo'
      and other.user_id = profiles.user_id and other.status = 'ativo'
  )
);

-- O servidor, não o cliente, assina o papel/nome usado na apresentação dos eventos.
create or replace function public.stamp_session_event_metadata()
returns trigger language plpgsql security definer set search_path = public as $$
declare member_role text; display_name text;
begin
  select role into member_role from public.campaign_members
    where campaign_id = new.campaign_id and user_id = new.created_by and status = 'ativo';
  select nome into display_name from public.profiles where user_id = new.created_by;
  new.metadata = coalesce(new.metadata, '{}'::jsonb)
    - 'authorRole' - 'authorName'
    || jsonb_build_object('authorRole', coalesce(member_role,'observador'), 'authorName', coalesce(display_name,'Participante'));
  return new;
end;
$$;
drop trigger if exists session_events_stamp_metadata on public.session_events;
create trigger session_events_stamp_metadata before insert on public.session_events
for each row execute function public.stamp_session_event_metadata();

-- Bucket privado para mapas e handouts. O caminho esperado é campaigns/<campaign_uuid>/...
insert into storage.buckets (id, name, public, file_size_limit)
values ('reinos-oniricos', 'reinos-oniricos', false, 15728640)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists "campaign members read assets" on storage.objects;
drop policy if exists "campaign masters upload assets" on storage.objects;
drop policy if exists "campaign masters update assets" on storage.objects;
drop policy if exists "campaign masters delete assets" on storage.objects;

create policy "campaign members read assets" on storage.objects for select using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^campaigns/[0-9a-fA-F-]{36}/'
  and public.is_campaign_member((split_part(name,'/',2))::uuid)
);
create policy "campaign masters upload assets" on storage.objects for insert with check (
  bucket_id = 'reinos-oniricos'
  and name ~ '^campaigns/[0-9a-fA-F-]{36}/'
  and public.is_campaign_master((split_part(name,'/',2))::uuid)
);
create policy "campaign masters update assets" on storage.objects for update using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^campaigns/[0-9a-fA-F-]{36}/'
  and public.is_campaign_master((split_part(name,'/',2))::uuid)
);
create policy "campaign masters delete assets" on storage.objects for delete using (
  bucket_id = 'reinos-oniricos'
  and name ~ '^campaigns/[0-9a-fA-F-]{36}/'
  and public.is_campaign_master((split_part(name,'/',2))::uuid)
);
