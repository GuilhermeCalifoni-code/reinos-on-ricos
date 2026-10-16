import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rollMasterDice} from '../src/components/live/MasterDiceRoller';

const read=(p:string)=>readFileSync(p,'utf8');
const live=read('src/components/live/LiveTable.tsx');
const master=read('src/components/live/MasterDiceRoller.tsx');
const hook=read('src/services/session-events/useSessionEvents.ts');
const schema=read('src/types/sessionEvent.ts');

test('Mestre has independent dice with no character sheet and explicitly private default',()=>{
  assert.match(live,/ferramenta === 'dados' && \(mestre \?/);
  assert.match(live,/<MasterDiceRoller onRegistrarRolagem/);
  assert.match(master,/shareWithPlayers, setShareWithPlayers\] = useState\(false\)/);
  assert.match(master,/visibility: shareWithPlayers \? 'todos' : 'mestre'/);
  assert.match(master,/characterId: null/);
  assert.match(master,/Rolagens livres, sem ficha associada e sem gastar recursos de Desvelados/);
  assert.doesNotMatch(master,/personagemAtivo|onSalvarPersonagem|setSelecionadoId/);
  assert.match(hook,/input\.characterId !== undefined \? input\.characterId : characterId/);
  assert.match(schema,/characterId\?: string \| null;/);
});

test('Jogador must link own active sheet for their exclusive DiceRoller',()=>{
  assert.match(live,/role="group" aria-label="Ficha do Jogador para rolagens"/);
  assert.match(live,/minhasFichasVinculaveis\.map\(personagem/);
  assert.match(live,/personagemJogadorId === selecionado\.id/);
  assert.match(live,/<DiceRoller key=\{selecionado\.id\}/);
  assert.match(live,/visibility: 'todos'/);
  assert.match(live,/characterId: selecionado\.id/);
  assert.match(live,/onSalvarPersonagem=\{atualizarPersonagemMesa\}/);
  assert.match(live,/Nenhuma ficha associada/);
});

test('GM dice sum, bounds, modifier and DT independent of a Desvelado',()=>{
  const a=rollMasterDice(20,2,3,15,()=>0);
  assert.deepEqual(a,{faces:20,quantity:2,rolls:[1,1],modifier:3,total:5,difficulty:15});
  const b=rollMasterDice(6,3,-2,undefined,()=>.999999);
  assert.deepEqual(b.rolls,[6,6,6]);
  assert.equal(b.total,16);
  assert.throws(()=>rollMasterDice(0,1,0),/Configure dados/);
  assert.throws(()=>rollMasterDice(20,11,0),/Configure dados/);
  assert.throws(()=>rollMasterDice(20,1,0,0),/Configure dados/);
});

test('Masters are marked GM in metadata and do not auto-persist any PC resource',()=>{
  assert.match(master,/authorRole: 'mestre'/);
  assert.match(master,/kind: 'master_free_roll'/);
  assert.match(master,/role="alert"/);
  assert.match(master,/await onRegistrarRolagem/);
  assert.match(live,/characterId: null/);
  assert.match(live,/authorRole: 'jogador'/);
});
