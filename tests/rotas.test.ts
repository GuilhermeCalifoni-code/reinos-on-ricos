import test from 'node:test';
import assert from 'node:assert/strict';
import { caminhoDaRota, rotaDoCaminho, telaDeCampanha } from '../src/lib/rotas';
import type { MainViewType } from '../src/components/Sidebar';

const ID = '3f1c2b9e-1111-4a2b-8c3d-1234567890ab';

test('T6: cada tela principal tem um endereço e volta para a mesma tela', () => {
  const telas: MainViewType[] = ['dashboard', 'campanhas', 'criar_campanha', 'personagens', 'compendio', 'comunidade', 'configuracoes', 'administracao'];
  for (const view of telas) {
    const caminho = caminhoDaRota(view);
    assert.deepEqual(rotaDoCaminho(caminho), { view }, `${view} → ${caminho}`);
  }
  assert.equal(caminhoDaRota('dashboard'), '/');
  assert.equal(caminhoDaRota('administracao'), '/admin');
  assert.equal(caminhoDaRota('criar_campanha'), '/campanhas/nova');
});

test('T6: campanha e mesa levam o id da campanha', () => {
  assert.equal(caminhoDaRota('detalhe_campanha', ID), `/campanhas/${ID}`);
  assert.equal(caminhoDaRota('modo_mesa', ID), `/mesa/${ID}`);
  assert.deepEqual(rotaDoCaminho(`/campanhas/${ID}`), { view: 'detalhe_campanha', campanhaId: ID });
  assert.deepEqual(rotaDoCaminho(`/mesa/${ID}/`), { view: 'modo_mesa', campanhaId: ID });
});

test('T6: "/campanhas/nova" é a criação, não uma campanha chamada "nova"', () => {
  assert.deepEqual(rotaDoCaminho('/campanhas/nova'), { view: 'criar_campanha' });
});

test('T6: tela de campanha sem campanha escolhida cai na lista', () => {
  assert.equal(caminhoDaRota('modo_mesa', null), '/campanhas');
  assert.equal(caminhoDaRota('detalhe_campanha'), '/campanhas');
});

test('T6: endereço desconhecido ou estranho abre o Início', () => {
  for (const caminho of ['', '/nada', '/mesa', '/mesa/a/b', '/mesa/%E0%A4%A', '/mesa/<script>', '/campanhas/' + 'x'.repeat(200)]) {
    assert.deepEqual(rotaDoCaminho(caminho), { view: 'dashboard' }, caminho);
  }
});

test('T6: telas que dependem de campanha', () => {
  assert.equal(telaDeCampanha('modo_mesa'), true);
  assert.equal(telaDeCampanha('detalhe_campanha'), true);
  assert.equal(telaDeCampanha('campanhas'), false);
});
