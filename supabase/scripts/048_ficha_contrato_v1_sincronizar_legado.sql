-- 048 · Script de REVERSÃO (não é migração automática: rodar à mão, só se o front voltar para a versão antiga).
-- Copia o formato novo (recursos_nivel + itens_gerais) de volta para `recursos` e `equipamentos`,
-- que é o que o front antigo lê. Não apaga as colunas novas: dá para reaplicar o front novo depois.
-- O front antigo lê só recursos[0].quantidade e equipamentos {id, nome, descricao}.

begin;

update public.personagens p
set recursos = jsonb_build_array(jsonb_build_object(
      'id', 'rec-main',
      'nome', 'Nível ' || p.recursos_nivel || ' (' || (array['Escasso','Limitado','Estável','Confortável','Abundante'])[p.recursos_nivel] || ')',
      'descricao', (array['Escasso','Limitado','Estável','Confortável','Abundante'])[p.recursos_nivel],
      'quantidade', p.recursos_nivel)),
    equipamentos = coalesce((
      select jsonb_agg(jsonb_build_object(
               -- item que veio do legado volta com o id original
               'id', coalesce(i->'dadosLegados'->>'id', i->>'id'),
               'nome', (i->>'nome') || case when coalesce((i->>'quantidade')::int, 1) > 1 then ' ×' || (i->>'quantidade') else '' end,
               'descricao', coalesce(i->>'observacoes', ''))
             order by o)
      from jsonb_array_elements(p.itens_gerais) with ordinality as t(i, o)), '[]'::jsonb)
where p.ficha_migrada_v1_em is not null;

commit;
