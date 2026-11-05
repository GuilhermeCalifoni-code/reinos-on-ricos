import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DT_MUNDANA, forcarSonharRapido, podeForcarSonhar, rolarMundanoRapido, rolarOniricoRapido, RESULTADO_ONIRICO_ROTULO } from '../src/rules/rolagemRapida';

const dados = (...v: number[]) => { let i = 0; return () => v[i++]; };
const p: any = { id: 'p', nome: 'Helena', nivel: 1, atributos: { corpo: 0, mente: 2, vontade: 3, vinculo: -1 }, atributoPrincipal: 'mente', focoAtual: 2, ruptura: 0 };
const opOn = { usarFoco: false, condicaoAdversa: false, dificuldadeAdversario: null };

test('Rápida Onírica usa o Atributo Principal (Mente +2), não o maior (Vontade +3)', () => {
  const f = rolarOniricoRapido(p, opOn, dados(11, 9));
  assert.equal(f.resultado.atributo, 'mente');
  assert.equal(f.resultado.totalRealidade, 13);
  assert.equal(f.resultado.resultado, 'realidade_vence');
  assert.equal(f.personagemAtualizado, null);
});

test('Rápida Onírica: Foco dá +2 nos dois dados e gasta 1 PF', () => {
  const f = rolarOniricoRapido(p, { ...opOn, usarFoco: true }, dados(9, 9));
  assert.equal(f.resultado.totalRealidade, 13);
  assert.equal(f.resultado.totalSonhar, 13);
  assert.equal(f.personagemAtualizado?.focoAtual, 1);
});

test('Rápida Onírica: sem Foco disponível não soma nem gasta', () => {
  const f = rolarOniricoRapido({ ...p, focoAtual: 0 }, { ...opOn, usarFoco: true }, dados(9, 9));
  assert.equal(f.resultado.totalRealidade, 11);
  assert.equal(f.personagemAtualizado, null);
});

test('Rápida Onírica: condição adversa (+2) e Dificuldade do Adversário (vale a maior)', () => {
  assert.equal(rolarOniricoRapido(p, { ...opOn, condicaoAdversa: true }, dados(1, 1)).resultado.dt, 15);
  assert.equal(rolarOniricoRapido(p, { ...opOn, dificuldadeAdversario: 17 }, dados(1, 1)).resultado.dt, 17);
  assert.equal(rolarOniricoRapido(p, { ...opOn, dificuldadeAdversario: 10 }, dados(1, 1)).resultado.dt, 13);
});

test('Rápida Onírica gera o mesmo registro da mesa que o rolador completo', () => {
  const f = rolarOniricoRapido(p, opOn, dados(12, 4));
  assert.equal(f.evento.type, 'roll');
  assert.equal(f.evento.characterId, 'p');
  assert.match(f.evento.content, /^Helena · mente: Realidade 12 \(14\) · Sonhar 4 \(6\) vs DT 13 — realidade_vence\.$/);
  assert.equal((f.evento.metadata as any).roll.kind, 'onirico');
});

test('Rápida Mundana usa o atributo escolhido, Foco gasta 1 PF e registra na mesa', () => {
  const f = rolarMundanoRapido(p, 'vontade', { dt: 12, modoRolagem: 'normal', usarFoco: true, modificador: 0 });
  assert.equal(f.resultado.atributo, 'vontade');
  assert.equal(f.resultado.valorAtributo, 3);
  assert.equal(f.resultado.focoUtilizado, true);
  assert.equal(f.personagemAtualizado?.focoAtual, 1);
  assert.equal((f.evento.metadata as any).roll.kind, 'mundano');
});

test('Rótulos dos quatro resultados', () => {
  assert.deepEqual(Object.values(RESULTADO_ONIRICO_ROTULO), ['Convergência', 'Realidade vence', 'Sonhar vence', 'Divergência']);
});

test('A ficha usa a rolagem rápida e não embute mais o rolador completo', () => {
  const ficha = readFileSync('src/components/CharacterSheet.tsx', 'utf8');
  assert.match(ficha, /<RolagemRapida /);
  assert.doesNotMatch(ficha, /<DiceRoller /);
  assert.match(ficha, /pedirRolagem\(\{modo:'mundano',atributo:key,rolarDireto:true\}\)/);
});

// ---------------- Rolagens por tipo (VF18, p. 30 e Regras Avançadas) ----------------

test('Tabela de DT Mundana do livro: 8 Trivial a 20 Extraordinário', () => {
  assert.deepEqual(DT_MUNDANA.map(d => `${d.dt} ${d.rotulo}`),
    ['8 Trivial', '10 Fácil', '12 Comum', '14 Desafiador', '16 Difícil', '18 Muito Difícil', '20 Extraordinário']);
});

test('Mundano com Vantagem usa o maior de 2d20; com Desvantagem, o menor', () => {
  for (let i = 0; i < 30; i++) {
    const v = rolarMundanoRapido(p, 'corpo', { dt: 12, modoRolagem: 'vantagem', usarFoco: false, modificador: 0 }).resultado;
    assert.equal(v.dadosRolados.length, 2); assert.equal(v.dadoBruto, Math.max(...v.dadosRolados));
    const d = rolarMundanoRapido(p, 'corpo', { dt: 12, modoRolagem: 'desvantagem', usarFoco: false, modificador: 0 }).resultado;
    assert.equal(d.dadosRolados.length, 2); assert.equal(d.dadoBruto, Math.min(...d.dadosRolados));
  }
});

test('Forçar o Sonhar só depois de fracasso (Realidade vence ou Divergência)', () => {
  const rv = rolarOniricoRapido(p, opOn, dados(12, 1)).resultado; // 14 / 3
  const dv = rolarOniricoRapido(p, opOn, dados(1, 1)).resultado;
  const sv = rolarOniricoRapido(p, opOn, dados(1, 12)).resultado;
  const cv = rolarOniricoRapido(p, opOn, dados(12, 12)).resultado;
  assert.deepEqual([rv, dv, sv, cv].map(podeForcarSonhar), [true, true, false, false]);
  assert.throws(() => forcarSonharRapido(p, sv, dados(1, 1)));
});

test('Forçar o Sonhar: +1 Ruptura na hora, mesma DT e mesmo Foco sem gastar PF de novo', () => {
  const primeira = rolarOniricoRapido(p, { usarFoco: true, condicaoAdversa: true, dificuldadeAdversario: null }, dados(5, 5)); // DT 15
  assert.equal(primeira.resultado.dt, 15);
  const quemRolou = primeira.personagemAtualizado!; // gastou 1 PF
  const f = forcarSonharRapido(quemRolou, primeira.resultado, dados(11, 11));
  assert.equal(f.personagemAtualizado.ruptura, quemRolou.ruptura + 1);
  assert.equal(f.personagemAtualizado.focoAtual, quemRolou.focoAtual);
  assert.equal(f.personagemAtualizado.historicoRuptura[0].motivo, 'Forçar o Sonhar');
  assert.equal(f.resultado.dt, 15);
  assert.equal(f.resultado.totalRealidade, 15); // 11 + Mente 2 + Foco 2
  assert.equal(f.resultado.resultado, 'convergencia');
  assert.match(f.evento.content, /Forçar o Sonhar/);
});
