-- VF5: persistência das Condições dos Desvelados.
-- Migração aditiva e idempotente. Não remove dados existentes.

alter table public.personagens
  add column if not exists condicoes jsonb not null
  default '{"oculto":false,"impedido":false,"vulneravel":false}'::jsonb;

update public.personagens
set condicoes = '{"oculto":false,"impedido":false,"vulneravel":false}'::jsonb
where condicoes is null
   or jsonb_typeof(condicoes) <> 'object';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'personagens_condicoes_object'
  ) then
    alter table public.personagens
      add constraint personagens_condicoes_object
      check (jsonb_typeof(condicoes) = 'object');
  end if;
end $$;

comment on column public.personagens.condicoes is
'Condições persistentes do Desvelado: oculto, impedido e vulneravel.';
