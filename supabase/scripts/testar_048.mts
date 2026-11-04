// Rodar: npm run test:migracao (também roda no CI)
// Testa a migração 048 num Postgres local (PGlite) e compara o SQL com o conversor TS.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { converterRecursosLegados } from '../../src/rules/fichaContrato.ts';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const db = new PGlite();
const q = async (sql: string, p: any[] = []) => (await db.query(sql, p)).rows as any[];

await db.exec(`
create role anon; create role authenticated;
create table public.personagens (
  id text primary key, nome text not null, nivel integer not null default 1,
  atributos jsonb not null default '{}'::jsonb, atributo_principal text not null default 'mente',
  vida_atual integer not null default 3, vida_maxima integer not null default 3,
  equipamentos jsonb not null default '[]'::jsonb, recursos jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);`);

// Formatos reais vistos no banco (auditoria do ChatGPT) + casos de borda.
const casos: Record<string, { recursos: any; equipamentos: any }> = {
  rec1:        { recursos: [{ id: 'rec-1', nome: 'Recursos Estáveis', quantidade: 3, descricao: 'Nível 3 (Estável)' }], equipamentos: [{ id: 'eq-1', nome: 'Lanterna', descricao: 'Pilhas fracas' }] },
  recMain1:    { recursos: [{ id: 'rec-main', nome: 'Nível 1 (Escasso)', descricao: 'Escasso', quantidade: 1 }], equipamentos: [] },
  recMain4:    { recursos: [{ id: 'rec-main', nome: 'Nível 4 (Confortável)', descricao: 'Confortável', quantidade: 4 }], equipamentos: [{ id: 'eq-a', nome: 'Faca', descricao: '' }, { id: 'eq-b', nome: 'Corda', descricao: '10 m' }] },
  vazio:       { recursos: [], equipamentos: [] },
  itemReal:    { recursos: [{ id: 'x', nome: 'Chave do porão', quantidade: '2', descricao: 'enferrujada' }], equipamentos: [] },
  semId:       { recursos: [], equipamentos: [{ nome: '  ', descricao: 5 }, 'lixo', { id: 7, nome: 'Moeda', quantidade: 0 }] },
  recMainRuim: { recursos: [{ id: 'rec-main', nome: 'Nível 9', quantidade: 9 }], equipamentos: [] },
  naoArray:    { recursos: { id: 'rec-main' } as any, equipamentos: null as any },
};

for (const [id, c] of Object.entries(casos)) {
  await q(`insert into public.personagens (id, nome, recursos, equipamentos) values ($1, $1, $2::jsonb, coalesce($3::jsonb, '[]'::jsonb))`,
    [id, JSON.stringify(c.recursos), c.equipamentos === null ? null : JSON.stringify(c.equipamentos)]);
}
const antes = await q(`select id, recursos, equipamentos from public.personagens order by id`);

const migracao = readFileSync(`${REPO}/supabase/migrations/048_ficha_contrato_v1.sql`, 'utf8');
await db.exec(migracao);
const depois1 = await q(`select id, recursos_nivel, itens_gerais, avisos_migracao, ficha_migrada_v1_em is not null as migrada from public.personagens order by id`);

// 1) SQL == TS, ficha por ficha
for (const linha of depois1) {
  const c = casos[linha.id];
  const ts = converterRecursosLegados(c.recursos, c.equipamentos ?? []);
  assert.equal(linha.recursos_nivel, ts.recursosNivel, `nivel ${linha.id}`);
  assert.deepEqual(linha.itens_gerais, JSON.parse(JSON.stringify(ts.itensGerais)), `itens ${linha.id}`);
  assert.deepEqual(linha.avisos_migracao, ts.avisosMigracao, `avisos ${linha.id}`);
  assert.equal(linha.migrada, true);
}
console.log('OK SQL igual ao TS em', depois1.length, 'fichas');

// 2) colunas antigas intactas
assert.deepEqual(await q(`select id, recursos, equipamentos from public.personagens order by id`), antes);
console.log('OK recursos/equipamentos intactos');

// 3) idempotência: rodar de novo não muda nada nem duplica backup
await q(`update public.personagens set itens_gerais = itens_gerais || '[{"id":"novo","nome":"Item novo","quantidade":1,"observacoes":""}]'::jsonb where id = 'vazio'`);
await db.exec(migracao);
const depois2 = await q(`select id, recursos_nivel, itens_gerais, avisos_migracao from public.personagens order by id`);
assert.equal(depois2.find(r => r.id === 'vazio').itens_gerais.length, 1, 'edição pós-migração preservada');
assert.deepEqual(depois2.filter(r => r.id !== 'vazio'), depois1.filter(r => r.id !== 'vazio').map(({ migrada, ...r }) => r));
assert.equal((await q(`select count(*)::int n from ro_privado.personagens_backup_048`))[0].n, Object.keys(casos).length);
console.log('OK segunda execução não duplica nada');

// 4) backup completo e restaurável
const [b] = await q(`select (jsonb_populate_record(null::public.personagens, dados)).recursos from ro_privado.personagens_backup_048 where id = 'rec1'`);
assert.deepEqual(b.recursos, casos.rec1.recursos);
console.log('OK backup restaurável');

// 5) ficha nova: já nasce migrada, Recursos 1, PV 4
await q(`insert into public.personagens (id, nome) values ('nova', 'Nova')`);
const [nova] = await q(`select recursos_nivel, itens_gerais, ficha_migrada_v1_em is not null as migrada, vida_atual, vida_maxima from public.personagens where id = 'nova'`);
assert.deepEqual(nova, { recursos_nivel: 1, itens_gerais: [], migrada: true, vida_atual: 4, vida_maxima: 4 });
console.log('OK ficha nova');

// 6) constraints
await assert.rejects(q(`update public.personagens set recursos_nivel = 6 where id = 'nova'`));
await assert.rejects(q(`update public.personagens set itens_gerais = '{}'::jsonb where id = 'nova'`));
console.log('OK constraints');

// 7) API não enxerga o backup
const priv = await q(`select has_schema_privilege('anon','ro_privado','usage') a, has_schema_privilege('authenticated','ro_privado','usage') b`);
assert.deepEqual(priv[0], { a: false, b: false });
console.log('OK ro_privado fechado para anon/authenticated');

// 8) conferências que o ChatGPT vai rodar em produção
const [conf] = await q(`select
  count(*) filter (where ficha_migrada_v1_em is null)::int nao_migradas,
  count(*) filter (where recursos_nivel not between 1 and 5)::int nivel_invalido,
  coalesce(sum(jsonb_array_length(itens_gerais)),0)::int total_itens_gerais,
  (select count(*)::int from ro_privado.personagens_backup_048) fichas_no_backup
  from public.personagens`);
console.log('conferência:', conf);

// 9) reversão
await db.exec(readFileSync(`${REPO}/supabase/scripts/048_ficha_contrato_v1_sincronizar_legado.sql`, 'utf8'));
const [r4] = await q(`select recursos, equipamentos from public.personagens where id = 'recMain4'`);
assert.equal(r4.recursos[0].quantidade, 4);
assert.deepEqual(r4.equipamentos, casos.recMain4.equipamentos.map((e: any) => ({ id: e.id, nome: e.nome, descricao: e.descricao })));
const [ir] = await q(`select equipamentos from public.personagens where id = 'itemReal'`);
assert.deepEqual(ir.equipamentos, [{ id: 'x', nome: 'Chave do porão ×2', descricao: 'enferrujada' }]);
console.log('OK reversão devolve o formato que o front antigo lê');
console.log('\nTUDO OK');
