import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { executarTesteMundano, executarTesteOnirico } from '../src/rules/rulesEngine';

const read = (path: string) => readFileSync(path, 'utf8');
const live = read('src/components/live/LiveTable.tsx');
const dice = read('src/components/DiceRoller.tsx');
const feed = read('src/components/live/SessionFeed.tsx');
const css = read('src/design-system/live-dice-character-association.css');

test('player links only own eligible sheet; GM uses independent dice context',()=>{
  assert.match(live,/role="group" aria-label="Ficha do Jogador para rolagens"/);
  assert.match(live,/Dados do Jogador/);
  assert.match(live,/minhasFichasVinculaveis\.map\(personagem/);
  assert.match(live,/void alterarMinhaFicha\(event\.target\.value\)/);
  assert.match(live,/personagens\.filter\(p => p\.id === personagemJogadorId\)/);
  assert.match(live,/key=\{selecionado\.id\}/);
  assert.match(live,/<MasterDiceRoller onRegistrarRolagem/);
  assert.match(css,/min-height: 44px/);
});

test('player roll events include own sheet and await real Registro Vivo confirmation',()=>{
  assert.match(live,/await registro\.registrar\(\{ \.\.\.event, visibility: 'todos'/);
  assert.match(live,/characterId: selecionado\.id/);
  assert.match(dice,/onRegistrarRolagem\(\{ \.\.\.event, characterId: personagemAtivo\?\.id \}\)/);
  assert.match(dice,/estadoRegistro === 'pending'/);
  assert.match(dice,/estadoRegistro === 'saved'/);
  assert.match(dice,/estadoRegistro === 'error'/);
  assert.match(dice,/Rolagem feita, mas não registrada/);
  assert.doesNotMatch(live,/DiceRoller[^>]*onRegistrarRolagem=\{registrarSemFalhar\}/);
});

test('mundane, oniric, damage and death roll data match journal highlighting schema',()=>{
  assert.match(dice,/roll:\s*\{\s*kind: 'mundano'/);
  assert.match(dice,/roll:\s*\{\s*kind: 'onirico'/);
  assert.match(dice,/roll:\s*\{\s*kind:\s*'dano'/);
  assert.match(dice,/roll:\s*\{\s*kind:\s*'morte'/);
  assert.match(feed,/const raw = event\.metadata\.roll/);
  assert.match(feed,/roll\.kind === 'dano'/);
  assert.match(feed,/roll\.kind === 'onirico'/);
  assert.match(feed,/typeof roll\.total === 'number'/);
});

test('foco cannot be used without a bound character with available PF',()=>{
  assert.match(dice,/focoDisponivelMundano = Boolean\(usarFoco && personagemAtivo && personagemAtivo\.focoAtual > 0 && onSalvarPersonagem\)/);
  assert.match(dice,/usarFoco: focoDisponivelMundano/);
  assert.match(dice,/disabled=\{!personagemAtivo \|\| personagemAtivo\.focoAtual <= 0 \|\| !onSalvarPersonagem\}/);
  assert.match(dice,/danoDoSonhar && personagemAtivo \?/);
  const mundane = executarTesteMundano({atributo:'corpo',valorAtributo:3,dt:10,modificadores:[],modoRolagem:'normal',usarFoco:false});
  assert.equal(mundane.totalFinal,mundane.dadoBruto+3);
  const oniric = executarTesteOnirico({atributo:'vontade',valorAtributo:2,dt:13,modificadores:[]});
  assert.equal(oniric.totalRealidade,oniric.dadoRealidade+2);
  assert.equal(oniric.totalSonhar,oniric.dadoSonhar+2);
});
