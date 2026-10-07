-- Reinos Oníricos — Estúdio de preparação de sessões.
-- Cada sessão passa a possuir capa e vínculos explícitos com mapas/handouts.
-- Pistas e locais ganham suporte visual para preparação e apresentação.

alter table public.campaign_sessions
  add column if not exists imagem_url text,
  add column if not exists mapa_ids jsonb not null default '[]'::jsonb,
  add column if not exists handout_ids jsonb not null default '[]'::jsonb;

alter table public.campaign_clues
  add column if not exists imagem_url text;

alter table public.campaign_locations
  add column if not exists imagem_url text;

alter table public.campaign_sessions
  drop constraint if exists campaign_sessions_mapa_ids_array;
alter table public.campaign_sessions
  add constraint campaign_sessions_mapa_ids_array
  check (jsonb_typeof(mapa_ids) = 'array');

alter table public.campaign_sessions
  drop constraint if exists campaign_sessions_handout_ids_array;
alter table public.campaign_sessions
  add constraint campaign_sessions_handout_ids_array
  check (jsonb_typeof(handout_ids) = 'array');
