-- Fase 7.6: fichas estruturadas de NPCs e adversários.
-- Migração aditiva e compatível com os registros existentes.

alter table public.campaign_npcs
  add column if not exists nivel_ameaca integer not null default 0 check (nivel_ameaca >= 0),
  add column if not exists vida integer not null default 1 check (vida >= 0),
  add column if not exists resistencia integer not null default 0,
  add column if not exists dificuldade integer not null default 10 check (dificuldade >= 0),
  add column if not exists deslocamento text not null default 'Próximo',
  add column if not exists habilidades jsonb not null default '[]'::jsonb check (jsonb_typeof(habilidades) = 'array');

alter table public.campaign_adversaries
  add column if not exists origem text,
  add column if not exists natureza text,
  add column if not exists perturbacao text,
  add column if not exists deslocamento text not null default 'Próximo',
  add column if not exists habilidades jsonb not null default '[]'::jsonb check (jsonb_typeof(habilidades) = 'array');

-- Preserva o ataque textual legado como uma Ação quando a ficha ainda não possui habilidades.
update public.campaign_adversaries
set habilidades = jsonb_build_array(
  jsonb_build_object(
    'id', 'legacy-' || id::text,
    'tipo', 'acao',
    'nome', 'Ataque principal',
    'descricao', ataque_principal
  )
)
where coalesce(jsonb_array_length(habilidades), 0) = 0
  and nullif(trim(ataque_principal), '') is not null;

comment on column public.campaign_npcs.nivel_ameaca is 'NA da ficha simplificada de NPC.';
comment on column public.campaign_npcs.dificuldade is 'Dif da ficha simplificada de NPC.';
comment on column public.campaign_npcs.habilidades is 'Lista ordenada de passivas, ações e reações; teste vinculado opcional.';
comment on column public.campaign_adversaries.defesa is 'Campo legado usado como Dif na ficha editorial de adversários.';
comment on column public.campaign_adversaries.habilidades is 'Lista ordenada de passivas, ações e reações; teste vinculado opcional.';
