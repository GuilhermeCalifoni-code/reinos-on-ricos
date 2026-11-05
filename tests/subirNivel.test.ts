import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarSubidaDeNivel, eventoSubidaDeNivel, ganhosDoNivel, pendenciasDaSubida } from '../src/rules/subirNivel';

const base: any = {
  id: 'p', nome: 'Clara', nivel: 1, atributoPrincipal: 'mente',
  atributos: { corpo: 0, mente: 2, vontade: 1, vinculo: -1 },
  vidaMaxima: 4, vidaAtual: 2, focoMaximo: 4, focoAtual: 1, protecaoOniricaMaxima: 2, protecaoOniricaAtual: 2,
  resistencia: 6, defesa: 8, dominios: { consciencia: 2, espaco: 0, fluxo: 2, substancia: 1, vida: 0 }, anotacoesGerais: ''
};

test('Ganhos pela Tabela de Progressão do livro (p. 16)', () => {
  assert.deepEqual(ganhosDoNivel(2), { nivel: 2, vida: 0, foco: 1, pontosDeSonhar: 2, atributo: 0, dominioMaximo: 3 });
  assert.deepEqual(ganhosDoNivel(3), { nivel: 3, vida: 1, foco: 0, pontosDeSonhar: 1, atributo: 1, dominioMaximo: 4 });
  assert.deepEqual(ganhosDoNivel(4), { nivel: 4, vida: 0, foco: 1, pontosDeSonhar: 1, atributo: 0, dominioMaximo: 4 });
  assert.deepEqual(ganhosDoNivel(5), { nivel: 5, vida: 0, foco: 0, pontosDeSonhar: 1, atributo: 1, dominioMaximo: 5 });
  assert.equal(ganhosDoNivel(6), null);
});

test('Nível 1 → 2: +1 Foco no máximo e no atual, 2 Pontos de Sonhar novos, história anotada', () => {
  assert.deepEqual(pendenciasDaSubida(base, { pontosNovos: {} }), ['Distribua os 2 Pontos de Sonhar novos.']);
  const n = aplicarSubidaDeNivel(base, { pontosNovos: { espaco: 2 }, historia: 'Sobreviveu ao Homem de Vidro.' }, new Date('2026-11-05T12:00:00'));
  assert.equal(n.nivel, 2);
  assert.equal(n.focoMaximo, 5); assert.equal(n.focoAtual, 2);
  assert.equal(n.vidaMaxima, 4); assert.equal(n.vidaAtual, 2);
  assert.equal(n.dominios.espaco, 2);
  assert.match(n.anotacoesGerais!, /^Nível 2 \(05\/11\/2026\): Sobreviveu ao Homem de Vidro\.$/);
});

test('Nível 2 → 3: +1 PV, +1 Atributo em qualquer atributo (inclusive o Principal), Defesa e Resistência recalculadas', () => {
  const n2 = { ...base, nivel: 2, focoMaximo: 5, dominios: { ...base.dominios, espaco: 2 } };
  assert.ok(pendenciasDaSubida(n2, { pontosNovos: { vida: 1 } }).includes('Escolha o atributo que recebe +1.'));
  const noPrincipal = aplicarSubidaDeNivel(n2, { atributoExtra: 'mente', pontosNovos: { vida: 1 } });
  assert.equal(noPrincipal.atributos.mente, 3);
  assert.equal(noPrincipal.vidaMaxima, 5); assert.equal(noPrincipal.vidaAtual, 3);
  const noCorpo = aplicarSubidaDeNivel(n2, { atributoExtra: 'corpo', pontosNovos: { vida: 1 } });
  assert.equal(noCorpo.resistencia, 7); assert.equal(noCorpo.defesa, 9);
});

test('Limites: Domínio máximo do nível, só um Domínio em 5, atributo até +4, e nada acima do nível 5', () => {
  assert.ok(pendenciasDaSubida(base, { pontosNovos: { consciencia: 2 } }).some(e => e.includes('máximo por Domínio é 3')));
  const n4 = { ...base, nivel: 4, atributos: { corpo: 0, mente: 4, vontade: 1, vinculo: -1 }, dominios: { consciencia: 4, espaco: 4, fluxo: 1, substancia: 0, vida: 0 } };
  assert.ok(pendenciasDaSubida(n4, { atributoExtra: 'mente', pontosNovos: { fluxo: 1 } }).some(e => e.includes('+4')));
  assert.deepEqual(pendenciasDaSubida(n4, { atributoExtra: 'corpo', pontosNovos: { consciencia: 1 } }), []);
  const comDois5 = { ...n4, dominios: { consciencia: 5, espaco: 4, fluxo: 0, substancia: 0, vida: 0 } };
  assert.ok(pendenciasDaSubida({ ...comDois5, nivel: 4 }, { atributoExtra: 'corpo', pontosNovos: { espaco: 1 } }).includes('Só um Domínio pode chegar ao nível 5.'));
  assert.deepEqual(pendenciasDaSubida({ ...base, nivel: 5 }, { pontosNovos: {} }), ['O personagem já está no nível máximo (5).']);
  assert.throws(() => aplicarSubidaDeNivel(base, { pontosNovos: {} }));
});

test('Aviso no Registro Vivo', () => {
  const e = eventoSubidaDeNivel(base, 2, 'Algo mudou.');
  assert.equal(e.type, 'system');
  assert.equal(e.content, 'Clara chegou ao nível 2. Algo mudou.');
});

test('Ficha: o nível não é mais um menu; sobe pelo botão "Subir para o nível N+1"', async () => {
  const { readFileSync } = await import('node:fs');
  const ficha = readFileSync('src/components/CharacterSheet.tsx', 'utf8');
  assert.doesNotMatch(ficha, /editarNivel/);
  assert.match(ficha, /Subir para o nível \{personagem\.nivel \+ 1\}/);
  assert.match(ficha, /<SubirNivelModal personagem=\{personagem\}/);
});
