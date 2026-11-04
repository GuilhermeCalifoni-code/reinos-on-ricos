-- 048 · Contrato da ficha v1 (CONTRATO_FICHA_v3, §7)
-- Aditiva e idempotente: pode rodar mais de uma vez sem duplicar nada.
-- NÃO apaga nem altera as colunas antigas `recursos` e `equipamentos`.
-- Aplicar só com a aprovação A3 do Guilherme, logo antes do merge/deploy do front.
-- Reversão: voltar o front e rodar supabase/scripts/048_ficha_contrato_v1_sincronizar_legado.sql.

begin;

-- 1) Backup privado (fora do alcance da API: anon/authenticated não veem este schema).
create schema if not exists ro_privado;
revoke all on schema ro_privado from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on schema ro_privado from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on schema ro_privado from authenticated'; end if;
end $$;

-- A linha inteira vai como jsonb: o backup não quebra se a tabela ganhar colunas depois.
-- Restaurar uma ficha: select * from jsonb_populate_record(null::public.personagens, dados) ...
create table if not exists ro_privado.personagens_backup_048 (
  id text primary key,
  dados jsonb not null,
  backup_em timestamptz not null default now()
);
revoke all on ro_privado.personagens_backup_048 from public;

insert into ro_privado.personagens_backup_048 (id, dados)
select p.id, to_jsonb(p) from public.personagens p
on conflict (id) do nothing;   -- rodar de novo não sobrescreve o backup original

-- 2) Colunas novas.
alter table public.personagens
  add column if not exists recursos_nivel integer not null default 1,
  add column if not exists itens_gerais jsonb not null default '[]'::jsonb,
  add column if not exists avisos_migracao jsonb not null default '[]'::jsonb,
  add column if not exists ficha_migrada_v1_em timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'personagens_recursos_nivel_1_5') then
    alter table public.personagens add constraint personagens_recursos_nivel_1_5 check (recursos_nivel between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'personagens_itens_gerais_array') then
    alter table public.personagens add constraint personagens_itens_gerais_array check (jsonb_typeof(itens_gerais) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'personagens_avisos_migracao_array') then
    alter table public.personagens add constraint personagens_avisos_migracao_array check (jsonb_typeof(avisos_migracao) = 'array');
  end if;
end $$;

-- 3) Conversão. Espelha converterRecursosLegados() de src/rules/fichaContrato.ts: manter os dois iguais.
create or replace function ro_privado.converter_ficha_048(p_recursos jsonb, p_equipamentos jsonb)
returns jsonb language plpgsql immutable as $$
declare
  v_nivel integer := 1;
  v_itens jsonb := '[]'::jsonb;
  v_avisos jsonb := '[]'::jsonb;
  v_item jsonb;
  v_indice bigint;
  v_origem text;
  v_lista jsonb;
  v_qtd_txt text;
  v_qtd numeric;
  v_id text;
begin
  foreach v_origem in array array['recursos', 'equipamentos'] loop
    v_lista := case when v_origem = 'recursos' then p_recursos else p_equipamentos end;
    if v_lista is null or jsonb_typeof(v_lista) <> 'array' then continue; end if;

    for v_item, v_indice in select e, o - 1 from jsonb_array_elements(v_lista) with ordinality as t(e, o) loop
      if jsonb_typeof(v_item) <> 'object' then continue; end if;

      v_qtd_txt := btrim(coalesce(v_item->>'quantidade', ''));
      v_qtd := case when v_qtd_txt ~ '^-?[0-9]+(\.[0-9]+)?$' then v_qtd_txt::numeric else null end;

      if v_origem = 'recursos' then
        if v_item->>'id' = 'rec-main' and v_qtd is not null and v_qtd = trunc(v_qtd) and v_qtd between 1 and 5 then
          v_nivel := v_qtd::integer;
          continue;
        end if;
        if v_item->>'id' = 'rec-1' then
          v_nivel := 1;
          if not v_avisos @> '["recursos_ajustados_p1"]'::jsonb then
            v_avisos := v_avisos || '["recursos_ajustados_p1"]'::jsonb;
          end if;
          continue;
        end if;
      end if;

      v_id := case
        when jsonb_typeof(v_item->'id') = 'string' and btrim(v_item->>'id') <> '' then v_item->>'id'
        when jsonb_typeof(v_item->'id') = 'number' then v_item->>'id'
        else v_origem || '-' || v_indice end;

      v_itens := v_itens || jsonb_build_array(jsonb_build_object(
        'id', 'legado-' || v_id,
        'nome', case when jsonb_typeof(v_item->'nome') = 'string' and btrim(v_item->>'nome') <> '' then v_item->>'nome' else 'Item' end,
        'quantidade', case when v_qtd is not null and v_qtd = trunc(v_qtd) and v_qtd > 0 then v_qtd::integer else 1 end,
        'observacoes', case
          when jsonb_typeof(v_item->'observacoes') = 'string' then v_item->>'observacoes'
          when jsonb_typeof(v_item->'descricao') = 'string' then v_item->>'descricao'
          else '' end,
        'origemLegada', v_origem,
        'dadosLegados', v_item
      ));
    end loop;
  end loop;

  return jsonb_build_object('recursos_nivel', v_nivel, 'itens_gerais', v_itens, 'avisos_migracao', v_avisos);
end $$;
revoke all on function ro_privado.converter_ficha_048(jsonb, jsonb) from public;

-- Só converte quem ainda não foi convertido: rodar de novo não duplica itens.
update public.personagens p
set recursos_nivel      = (c.r->>'recursos_nivel')::integer,
    itens_gerais        = c.r->'itens_gerais',
    avisos_migracao     = (select coalesce(jsonb_agg(distinct a), '[]'::jsonb)
                           from jsonb_array_elements(coalesce(p.avisos_migracao, '[]'::jsonb) || (c.r->'avisos_migracao')) a),
    ficha_migrada_v1_em = now()
from (select id, ro_privado.converter_ficha_048(recursos, equipamentos) as r
      from public.personagens where ficha_migrada_v1_em is null) c
where p.id = c.id;

-- 4) Daqui em diante, toda ficha nova já nasce no formato novo.
alter table public.personagens alter column ficha_migrada_v1_em set default now();

-- 5) PV inicial correto (VF18, p. 12). Só muda o padrão; não mexe em fichas existentes.
alter table public.personagens alter column vida_atual set default 4;
alter table public.personagens alter column vida_maxima set default 4;

commit;
