import test from 'node:test';
import assert from 'node:assert/strict';
import { getFullCompendiumRule } from '../src/rules/compendiumFullRules';
import { DISTANCIAS_REINOS_ONIRICOS } from '../src/rules/rulesData';
import { executarTesteMundano, resolverMovimentoMorte } from '../src/rules/rulesEngine';

test('Movimento de Morte VF10: Sonhar vence dá 1 PV e +1 Ruptura; Realidade vence estabiliza sem PV', () => {
  let index = 0;
  const sonhar = resolverMovimentoMorte(() => [1, 20][index++]);
  assert.equal(sonhar.recuperaVida, 1);
  assert.equal(sonhar.recebeRuptura, 1);
  assert.equal(sonhar.ficaConsciente, true);
  index = 0;
  const realidade = resolverMovimentoMorte(() => [20, 1][index++]);
  assert.equal(realidade.recuperaVida, 0);
  assert.equal(realidade.ficaConsciente, false);
  assert.equal(realidade.morre, false);
});

test('Distâncias do livro: muito próximo 1,5–3m, próximo 3–9m e longe 9–15m', () => {
  assert.match(DISTANCIAS_REINOS_ONIRICOS.muito_proxima.descricao, /1,5 a 3 m/);
  assert.match(DISTANCIAS_REINOS_ONIRICOS.proxima.descricao, /3 a 9 m/);
  assert.match(DISTANCIAS_REINOS_ONIRICOS.longe.descricao, /9 a 15 m/);
});

test('O Compêndio não impõe dano contínuo automático a cada rodada', () => {
  const text = getFullCompendiumRule('dano')?.sections.flatMap(s=>s.paragraphs||[]).join(' ') || '';
  assert.match(text, /não repita automaticamente/i);
  assert.doesNotMatch(text, /repetem o mesmo dado ao fim de cada Rodada/i);
});

test('Teste Reflexo não é defesa universal contra manifestação Onírica realizada', () => {
  const text = getFullCompendiumRule('teste-reflexo')?.sections.flatMap(s=>s.paragraphs||[]).join(' ') || '';
  assert.match(text, /não é uma segunda resistência contra o Sonhar/i);
});

test('Consulta de Movimento de Morte corresponde à regra +1 Ruptura', () => {
  const text = JSON.stringify(getFullCompendiumRule('movimento-morte'));
  assert.match(text, /Recupere 1 PV e \+1 Ruptura/);
});

