// Testes de comportamento do CONTRATO_FICHA_v3 (fase 1). Testam regras, não texto de código.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVISO_RECURSOS_AJUSTADOS_P1,
  atributoDoTesteOnirico,
  converterRecursosLegados,
  normalizarPersonagem,
  problemasDeAtributos,
  validarFichaDesvelado
} from '../src/rules/fichaContrato';
import { executarTesteOnirico, executarTesteMundano } from '../src/rules/rulesEngine';
import type { Personagem } from '../src/types/character';

const dados = (...valores: number[]) => { let i = 0; return () => valores[i++]; };

const base = (extra: Partial<Personagem> = {}): Personagem => ({
  id: 'p', nome: 'Helena', conceito: 'Tecelão', nivel: 1,
  atributos: { corpo: 0, mente: 2, vontade: 1, vinculo: -1 }, atributoPrincipal: 'mente',
  vidaMaxima: 4, vidaAtual: 4, resistencia: 6, defesa: 8,
  protecaoOniricaMaxima: 2, protecaoOniricaAtual: 2, focoMaximo: 4, focoAtual: 4,
  ruptura: 0, historicoRuptura: [], dominios: { consciencia: 2, espaco: 0, fluxo: 2, substancia: 1, vida: 0 },
  ancoragem: '', vinculos: [], recursosNivel: 1, itensGerais: [],
  criadoEm: '', atualizadoEm: '', ...extra
});

// ---------------- Teste Onírico (D1) ----------------

test('Teste Onírico usa o Atributo Principal, mesmo que outro atributo seja maior', () => {
  const p = base({ atributos: { corpo: 0, mente: 2, vontade: 3, vinculo: -1 } as any });
  assert.deepEqual(atributoDoTesteOnirico(p), { atributo: 'mente', valor: 2 });
});

test('Teste Onírico usa o valor ATUAL do Principal (progressão nível 3 e 5)', () => {
  assert.equal(atributoDoTesteOnirico(base({ nivel: 3, atributos: { corpo: 0, mente: 3, vontade: 1, vinculo: -1 } })).valor, 3);
  assert.equal(atributoDoTesteOnirico(base({ nivel: 5, atributos: { corpo: 1, mente: 3, vontade: 1, vinculo: -1 } })).valor, 3);
});

test('Teste Onírico: o mesmo modificador vale nos dois dados, e Foco +2 também', () => {
  const r = executarTesteOnirico({ atributo: 'mente', valorAtributo: 2, dt: 13, modificadores: [{ nome: 'Foco', valor: 2 }], rolarD20: dados(9, 12) });
  assert.equal(r.totalRealidade, 13);
  assert.equal(r.totalSonhar, 16);
  assert.equal(r.resultado, 'convergencia');
  assert.equal(r.impactoRuptura, -1);
});

test('Exemplo do diagnóstico: Helena (Mente +2) com dado 12 na Realidade dá 14, não 13', () => {
  const { atributo, valor } = atributoDoTesteOnirico(base());
  const r = executarTesteOnirico({ atributo, valorAtributo: valor, dt: 13, modificadores: [], rolarD20: dados(12, 10) });
  assert.equal(r.totalRealidade, 14);
  assert.equal(r.totalSonhar, 12);
  assert.equal(r.resultado, 'realidade_vence');
});

test('Teste Onírico contra Adversário usa a DT do teste ou a Dificuldade dele, a maior (VF18, p. 29)', () => {
  const r = executarTesteOnirico({ atributo: 'mente', valorAtributo: 2, dt: 13, dificuldadeAdversario: 16, modificadores: [], rolarD20: dados(13, 14) });
  assert.equal(r.dt, 16);
  assert.equal(r.sucessoRealidade, false); // 15 < 16
  assert.equal(r.sucessoSonhar, true);     // 16 ≥ 16
  const r2 = executarTesteOnirico({ atributo: 'mente', valorAtributo: 2, dt: 13, dificuldadeAdversario: 12, modificadores: [], rolarD20: dados(10, 10) });
  assert.equal(r2.dt, 13);
});

test('Teste Mundano continua livre: qualquer atributo pode ser usado', () => {
  const r = executarTesteMundano({ atributo: 'corpo', valorAtributo: 0, dt: 12, modificadores: [], modoRolagem: 'normal', usarFoco: false });
  assert.equal(r.atributo, 'corpo');
});

// ---------------- Atributos e criação ----------------

test('Criação recusa Principal sem +2', () => {
  const v = validarFichaDesvelado(base({ atributos: { corpo: 2, mente: 1, vontade: 0, vinculo: -1 } }), { modo: 'criacao' });
  assert.equal(v.bloqueia, true);
  assert.ok(v.erros.some(e => e.includes('Atributo Principal (Mente) deve ter +2')));
});

test('Criação recusa distribuição diferente de +2, +1, 0, −1', () => {
  const v = validarFichaDesvelado(base({ atributos: { corpo: 1, mente: 2, vontade: 1, vinculo: -1 } }), { modo: 'criacao' });
  assert.equal(v.bloqueia, true);
  assert.ok(v.erros.some(e => e.includes('+2, +1, 0 e −1')), v.erros.join(' | '));
});

test('Criação válida passa, e exige todos os Pontos de Sonhar distribuídos', () => {
  assert.equal(validarFichaDesvelado(base(), { modo: 'criacao' }).bloqueia, false);
  const incompleta = validarFichaDesvelado(base({ dominios: { consciencia: 1, espaco: 0, fluxo: 0, substancia: 0, vida: 0 } }), { modo: 'criacao' });
  assert.ok(incompleta.erros.some(e => e.includes('Pontos de Sonhar')));
});

test('Criação sem Principal escolhido é recusada', () => {
  assert.ok(problemasDeAtributos({ corpo: 0, mente: 2, vontade: 1, vinculo: -1 }, null, 1).includes('Escolha o Atributo Principal.'));
});

test('Progressão: nível 3 com Principal +3 é válido; nível 3 com soma 2 é inválido', () => {
  assert.deepEqual(problemasDeAtributos({ corpo: 0, mente: 3, vontade: 1, vinculo: -1 }, 'mente', 3), []);
  assert.ok(problemasDeAtributos({ corpo: 0, mente: 2, vontade: 1, vinculo: -1 }, 'mente', 3).some(p => p.includes('soma dos atributos deve ser 3')));
  assert.deepEqual(problemasDeAtributos({ corpo: 1, mente: 3, vontade: 1, vinculo: -1 }, 'mente', 5), []);
});

test('Ficha antiga com atributos zerados: salvar NÃO bloqueia e o aviso lista os dois problemas', () => {
  const v = validarFichaDesvelado(base({ atributos: { corpo: 0, mente: 0, vontade: 0, vinculo: 0 }, vidaAtual: 2 }), { modo: 'salvar' });
  assert.equal(v.bloqueia, false);
  assert.equal(v.avisos.length, 2);
  assert.ok(v.avisos.some(a => a.includes('Atributo Principal (Mente) deve ter +2 (hoje: +0)')));
  assert.ok(v.avisos.some(a => a.includes('soma 0')));
});

test('Salvar bloqueia só Recursos fora de 1–5 e Ruptura fora de 0–6', () => {
  assert.equal(validarFichaDesvelado(base({ recursosNivel: 6 as any }), { modo: 'salvar' }).bloqueia, true);
  assert.equal(validarFichaDesvelado(base({ ruptura: 7 }), { modo: 'salvar' }).bloqueia, true);
  assert.equal(validarFichaDesvelado(base({ ruptura: 6 }), { modo: 'salvar' }).bloqueia, false);
});

// ---------------- Recursos e Itens Gerais (D3, P1) ----------------

test('rec-1 (padrão antigo com 3) vira Recursos 1 com aviso P1', () => {
  const r = converterRecursosLegados([{ id: 'rec-1', nome: 'Recursos Estáveis', quantidade: 3, descricao: 'Nível 3 (Estável)' }], []);
  assert.equal(r.recursosNivel, 1);
  assert.deepEqual(r.avisosMigracao, [AVISO_RECURSOS_AJUSTADOS_P1]);
  assert.equal(r.itensGerais.length, 0);
});

test('rec-main mantém o nível escolhido (1 e 4, os valores reais do banco)', () => {
  assert.equal(converterRecursosLegados([{ id: 'rec-main', nome: 'Nível 4 (Confortável)', quantidade: 4 }], []).recursosNivel, 4);
  assert.equal(converterRecursosLegados([{ id: 'rec-main', nome: 'Nível 1 (Escasso)', quantidade: 1 }], []).recursosNivel, 1);
});

test('Lista vazia vira Recursos 1, sem aviso', () => {
  const r = converterRecursosLegados([], []);
  assert.equal(r.recursosNivel, 1);
  assert.deepEqual(r.avisosMigracao, []);
});

test('Item real sozinho em recursos é preservado em Itens Gerais', () => {
  const r = converterRecursosLegados([{ id: 'x', nome: 'Chave do porão', quantidade: 2, descricao: 'enferrujada' }], []);
  assert.equal(r.recursosNivel, 1);
  assert.deepEqual(r.itensGerais.map(i => [i.nome, i.quantidade, i.observacoes, i.origemLegada]), [['Chave do porão', 2, 'enferrujada', 'recursos']]);
});

test('Equipamentos (id, nome, descricao) viram Itens Gerais: descricao → observacoes, quantidade 1, original preservado', () => {
  const original = { id: 'eq-1', nome: 'Lanterna', descricao: 'Pilhas fracas' };
  const r = converterRecursosLegados([], [original]);
  assert.deepEqual(r.itensGerais[0], {
    id: 'legado-eq-1', nome: 'Lanterna', quantidade: 1, observacoes: 'Pilhas fracas',
    origemLegada: 'equipamentos', dadosLegados: original
  });
});

test('Ficha já no formato novo não é convertida de novo (nada duplica)', () => {
  const p = base({ recursosNivel: 3, itensGerais: [{ id: 'i', nome: 'Faca', quantidade: 1, observacoes: '' }], equipamentos: [{ id: 'eq-1', nome: 'Lanterna' }] as any });
  const n = normalizarPersonagem(p);
  assert.equal(n.recursosNivel, 3);
  assert.equal(n.itensGerais.length, 1);
  assert.deepEqual(normalizarPersonagem(n), n);
});

test('Ficha antiga (importação local ou backup) é normalizada para o formato novo', () => {
  const legado: any = { ...base(), recursosNivel: undefined, itensGerais: undefined,
    recursos: [{ id: 'rec-main', nome: 'Nível 2 (Limitado)', quantidade: 2 }],
    equipamentos: [{ id: 'eq-1', nome: 'Lanterna', descricao: '' }, { id: 'eq-2', nome: 'Casaco', descricao: 'impermeável' }] };
  const n = normalizarPersonagem(legado);
  assert.equal(n.recursosNivel, 2);
  assert.equal(n.itensGerais.length, 2);
});

test('Mudar o nível de Recursos não mexe nos itens', () => {
  const p = base({ itensGerais: [{ id: 'i1', nome: 'Faca', quantidade: 1, observacoes: '' }, { id: 'i2', nome: 'Corda', quantidade: 2, observacoes: '' }] });
  const depois = normalizarPersonagem({ ...p, recursosNivel: 4 });
  assert.equal(depois.itensGerais.length, 2);
  assert.equal(depois.recursosNivel, 4);
});
