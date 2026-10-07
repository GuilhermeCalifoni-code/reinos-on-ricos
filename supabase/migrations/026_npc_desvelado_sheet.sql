-- Reinos Oníricos — NPCs Desvelados e ficha expandida.
-- NPCs comuns continuam leves; NPCs Desvelados recebem recursos próprios
-- sem serem confundidos com fichas pessoais de jogadores.

alter table public.campaign_npcs
  add column if not exists is_desvelado boolean not null default false,
  add column if not exists vida_maxima integer not null default 1,
  add column if not exists foco integer not null default 0,
  add column if not exists foco_maximo integer not null default 0,
  add column if not exists ruptura integer not null default 0,
  add column if not exists defesa integer not null default 10;

alter table public.campaign_npcs
  drop constraint if exists campaign_npcs_ruptura_range;
alter table public.campaign_npcs
  add constraint campaign_npcs_ruptura_range check (ruptura between 0 and 6);

alter table public.campaign_npcs
  drop constraint if exists campaign_npcs_vida_maxima_positive;
alter table public.campaign_npcs
  add constraint campaign_npcs_vida_maxima_positive check (vida_maxima >= 1);

alter table public.campaign_npcs
  drop constraint if exists campaign_npcs_foco_nonnegative;
alter table public.campaign_npcs
  add constraint campaign_npcs_foco_nonnegative check (foco >= 0 and foco_maximo >= 0);
