import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularDefesa, executarTesteMundano, executarTesteOnirico, processarDano, resolverMovimentoMorte } from '../src/rules/rulesEngine';
import { DT_SONHAR_POR_NIVEL, TABELA_PROGRESSAO } from '../src/rules/rulesData';
import { passosPotenciaDoNivel, resistenciaEstrutura, resolverDanoEstrutura } from '../src/rules/referenceTables';

const withRandom = <T>(values: number[], run: () => T): T => {
  const original = Math.random;
  let index = 0;
  Math.random = () => values[Math.min(index++, values.length - 1)] ?? 0;
  try { return run(); } finally { Math.random = original; }
};

test('Defesa usa 8 + Corpo, independentemente do Atributo Principal e nível', () => {
  const result = calcularDefesa('mente', { corpo: 2, mente: -1, vontade: 1, vinculo: 0 }, 5);
  assert.equal(result.defesa, 10);
  assert.equal(result.valorAtributo, 2);
  assert.equal(result.bonusNivel, 0);
});

test('Progressão atual mantém domínio 4 no nível 3 e Foco 4/5/5/6/6', () => {
  assert.equal(TABELA_PROGRESSAO[3].dominioMaximo, 4);
  assert.deepEqual([1,2,3,4,5].map(n => TABELA_PROGRESSAO[n].focoBase), [4,5,5,6,6]);
});

test('Dano é convertido em perda discreta de PV e PO reduz no máximo 1 PV', () => {
  assert.equal(processarDano(6, 8, 4, 2, false).vidaPerdida, 1);
  assert.equal(processarDano(9, 8, 4, 2, false).vidaPerdida, 2);
  assert.equal(processarDano(17, 8, 4, 2, false).vidaPerdida, 3);
  const protegido = processarDano(17, 8, 4, 2, true);
  assert.equal(protegido.vidaPerdida, 2);
  assert.equal(protegido.poUtilizada, 1);
});

test('Teste Mundano trata 20 natural como sucesso automático', () => {
  const result = withRandom([0.9999], () => executarTesteMundano({
    atributo: 'mente',
    valorAtributo: -1,
    dt: 99,
    modificadores: [],
    modoRolagem: 'normal',
    usarFoco: false
  }));
  assert.equal(result.dadoBruto, 20);
  assert.equal(result.sucesso, true);
});

test('Teste Onírico aplica Ruptura -1/0/+1/+2 nos quatro resultados', () => {
  const base = { atributo: 'mente' as const, valorAtributo: 0, dt: 13, modificadores: [] };
  const convergencia = withRandom([0.9999, 0.9999], () => executarTesteOnirico(base));
  const realidade = withRandom([0.9999, 0], () => executarTesteOnirico(base));
  const sonhar = withRandom([0, 0.9999], () => executarTesteOnirico(base));
  const divergencia = withRandom([0, 0], () => executarTesteOnirico(base));

  assert.deepEqual(
    [convergencia.resultado, realidade.resultado, sonhar.resultado, divergencia.resultado],
    ['convergencia', 'realidade_vence', 'sonhar_vence', 'divergencia']
  );
  assert.deepEqual(
    [convergencia.impactoRuptura, realidade.impactoRuptura, sonhar.impactoRuptura, divergencia.impactoRuptura],
    [-1, 0, 1, 2]
  );
});


test('Foco soma +2 aos dois resultados do Teste Onírico', () => {
  const result = withRandom([0.5, 0.5], () => executarTesteOnirico({
    atributo: 'vontade',
    valorAtributo: 1,
    dt: 13,
    modificadores: [{ nome: 'Foco', valor: 2 }]
  }));

  assert.equal(result.dadoRealidade, 11);
  assert.equal(result.dadoSonhar, 11);
  assert.equal(result.totalRealidade, 14);
  assert.equal(result.totalSonhar, 14);
  assert.equal(result.resultado, 'convergencia');
});


test('Potência fornece 0/1/2/2/3 Passos nos níveis 1–5', () => {
  assert.deepEqual([1,2,3,4,5].map(passosPotenciaDoNivel), [0,1,2,2,3]);
});

test('Resistência estrutural segue a matriz Material × Tamanho', () => {
  assert.equal(resistenciaEstrutura('fragil', 'pequeno'), 4);
  assert.equal(resistenciaEstrutura('comum', 'medio'), 8);
  assert.equal(resistenciaEstrutura('resistente', 'grande'), 12);
  assert.equal(resistenciaEstrutura('muito_resistente', 'imenso'), 16);
});

test('Estrutura só rompe quando dano supera R', () => {
  assert.deepEqual(resolverDanoEstrutura(10, 'resistente', 'medio'), { resistencia: 10, rompe: false });
  assert.deepEqual(resolverDanoEstrutura(11, 'resistente', 'medio'), { resistencia: 10, rompe: true });
});


test('Movimento de Morte segue os quatro resultados da VF5', () => {
  const rolls = [
    { dados: [20, 20], tipo: 'convergencia', vida: 2, ruptura: 0, consciente: true, morre: false },
    { dados: [20, 1], tipo: 'realidade_vence', vida: 0, ruptura: 0, consciente: false, morre: false },
    { dados: [1, 20], tipo: 'sonhar_vence', vida: 1, ruptura: 2, consciente: true, morre: false },
    { dados: [1, 1], tipo: 'divergencia', vida: 0, ruptura: 0, consciente: false, morre: true }
  ] as const;

  for (const esperado of rolls) {
    let index = 0;
    const result = resolverMovimentoMorte(() => esperado.dados[index++]);
    assert.equal(result.tipo, esperado.tipo);
    assert.equal(result.recuperaVida, esperado.vida);
    assert.equal(result.recebeRuptura, esperado.ruptura);
    assert.equal(result.ficaConsciente, esperado.consciente);
    assert.equal(result.morre, esperado.morre);
  }
});

test('DT do Sonhar para superar manifestações segue 10/12/14/16/18', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map(nivel => DT_SONHAR_POR_NIVEL[nivel]),
    [10, 12, 14, 16, 18]
  );
});
