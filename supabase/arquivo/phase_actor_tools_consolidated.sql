-- Fichas operacionais de NPCs e adversários.
-- Migração aditiva: preserva todos os registros existentes.

alter table public.campaign_npcs
  add column if not exists nivel_ameaca integer not null default 0 check (nivel_ameaca between 0 and 5),
  add column if not exists vida integer not null default 1 check (vida >= 0),
  add column if not exists resistencia integer not null default 0 check (resistencia >= 0),
  add column if not exists dificuldade integer not null default 10 check (dificuldade > 0),
  add column if not exists deslocamento text not null default 'Próximo',
  add column if not exists habilidades jsonb not null default '[]'::jsonb;

alter table public.campaign_adversaries
  add column if not exists dificuldade integer not null default 10 check (dificuldade > 0),
  add column if not exists deslocamento text not null default 'Próximo',
  add column if not exists habilidades jsonb not null default '[]'::jsonb;

-- Garante que o campo de habilidades sempre seja uma lista JSON.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaign_npcs_habilidades_array'
  ) then
    alter table public.campaign_npcs
      add constraint campaign_npcs_habilidades_array
      check (jsonb_typeof(habilidades) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'campaign_adversaries_habilidades_array'
  ) then
    alter table public.campaign_adversaries
      add constraint campaign_adversaries_habilidades_array
      check (jsonb_typeof(habilidades) = 'array');
  end if;
end $$;

-- Compatibilidade: adversários antigos continuam utilizáveis.
-- Quando ainda não há dificuldade explícita, aproveita a Defesa existente.
update public.campaign_adversaries
set dificuldade = defesa
where dificuldade = 10
  and defesa is not null
  and defesa <> 10;

comment on column public.campaign_npcs.nivel_ameaca is 'NA do NPC conforme ficha simples do livro.';
comment on column public.campaign_npcs.dificuldade is 'Dificuldade padrão do NPC para testes associados às habilidades.';
comment on column public.campaign_npcs.habilidades is 'Lista de passivas, ações e reações. Ações/reações podem apontar para Teste Mundano ou Reflexo.';
comment on column public.campaign_adversaries.dificuldade is 'Dif do adversário.';
comment on column public.campaign_adversaries.habilidades is 'Lista de passivas, ações e reações do adversário.';
