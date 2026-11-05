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
  assert.throws(() => forcarSonharRapido(p, sv, false, dados(1, 1)));
});

test('Forçar o Sonhar: +1 Ruptura na hora, mesma DT, e o Foco é gasto de novo', () => {
  const primeira = rolarOniricoRapido(p, { usarFoco: true, condicaoAdversa: true, dificuldadeAdversario: null }, dados(5, 5)); // DT 15
  assert.equal(primeira.resultado.dt, 15);
  const quemRolou = primeira.personagemAtualizado!; // gastou 1 PF
  const f = forcarSonharRapido(quemRolou, primeira.resultado, false, dados(11, 11));
  // primeira foi Divergência (5+4=9 e 9 < 15): +2 dela, acumulado com +1 por forçar (decisão do Diogo, 05/11)
  assert.equal(primeira.resultado.resultado, 'divergencia');
  assert.equal(f.personagemAtualizado.ruptura, quemRolou.ruptura + 3);
  assert.deepEqual(f.personagemAtualizado.historicoRuptura.slice(0, 2).map((h: any) => h.motivo), ['Forçar o Sonhar', 'Teste Onírico: Divergência']);
  assert.equal(f.personagemAtualizado.focoAtual, quemRolou.focoAtual - 1); // gasta de novo (Guilherme, 05/11)
  assert.equal(f.personagemAtualizado.historicoRuptura[0].motivo, 'Forçar o Sonhar');
  assert.equal(f.resultado.dt, 15);
  assert.equal(f.resultado.totalRealidade, 15); // 11 + Mente 2 + Foco 2
  assert.equal(f.resultado.resultado, 'convergencia');
  assert.match(f.evento.content, /Forçar o Sonhar/);
});

test('Forçar o Sonhar: se a Ruptura da primeira já foi aplicada, não aplica de novo (só o +1)', () => {
  const dv = rolarOniricoRapido(p, opOn, dados(1, 1)).resultado;
  const jaAplicada = { ...p, ruptura: 2 };
  assert.equal(forcarSonharRapido(jaAplicada, dv, true, dados(1, 1)).personagemAtualizado.ruptura, 3);
  const rv = rolarOniricoRapido(p, opOn, dados(12, 1)).resultado; // Realidade vence: 0 de Ruptura
  assert.equal(forcarSonharRapido(p, rv, false, dados(1, 1)).personagemAtualizado.ruptura, 1);
});

test('Editar atributos: rascunho só é salvo dentro da regra (modo edicao_atributos)', () => {
  const ficha = readFileSync('src/components/CharacterSheet.tsx', 'utf8');
  assert.match(ficha, />Editar atributos</);
  assert.match(ficha, /problemasDeAtributos\(rascunhoAtributos\.atributos, rascunhoAtributos\.principal, personagem\.nivel\)/);
  assert.match(ficha, /if\(!rascunhoAtributos \|\| problemasRascunho\.length>0\)return;/);
  assert.match(ficha, /disabled=\{problemasRascunho\.length>0\} onClick=\{salvarEdicaoAtributos\}/);
  // Fora do modo de edição, os botões − e + dos atributos não aparecem.
  assert.match(ficha, /\{editandoAtributos\s*\? <div className="ro-sheet__stepper ro-sheet__attribute-stepper">/);
});

test('Forçar o Sonhar com Foco mas sem PF sobrando: a nova rolagem vai sem o +2', () => {
  const primeira = rolarOniricoRapido({ ...p, focoAtual: 1 }, { ...opOn, usarFoco: true }, dados(1, 1));
  const semPF = primeira.personagemAtualizado!; // 0 PF
  assert.equal(semPF.focoAtual, 0);
  const f = forcarSonharRapido(semPF, primeira.resultado, false, dados(10, 10));
  assert.equal(f.resultado.totalRealidade, 12); // 10 + Mente 2, sem Foco
  assert.equal(f.personagemAtualizado.focoAtual, 0);
});

test('Dano: atalhos pelo Nível de Perigo do livro, e clicar rola o dado de verdade', async () => {
  const { NIVEIS_DE_PERIGO, rolarDado } = await import('../src/components/DamageModal');
  assert.deepEqual(NIVEIS_DE_PERIGO.map(n => `${n.label} d${n.lados}`),
    ['Baixo d4', 'Moderado d6', 'Grave d8', 'Severo d10', 'Devastador d12', 'Onírico d20']);
  assert.equal(rolarDado(6, () => 0), 1);
  assert.equal(rolarDado(6, () => 0.9999), 6);
  for (let i = 0; i < 200; i++) { const v = rolarDado(20); assert.ok(v >= 1 && v <= 20 && Number.isInteger(v)); }
  const fonte = readFileSync('src/components/DamageModal.tsx', 'utf8');
  assert.match(fonte, /onClick=\{\(\) => rolarPerigo\(a\.label, a\.lados\)\}/);
  assert.doesNotMatch(fonte, /'Pistola'/);
});
