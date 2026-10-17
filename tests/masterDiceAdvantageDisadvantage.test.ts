import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rollMasterDice} from '../src/components/live/MasterDiceRoller';
import {getRollDisplay} from '../src/components/live/SessionFeed';
import type {SessionEvent} from '../src/types/sessionEvent';

const read=(path:string)=>readFileSync(path,'utf8');
const component=read('src/components/live/MasterDiceRoller.tsx');
const feed=read('src/components/live/SessionFeed.tsx');
const style=read('src/design-system/live-master-dice.css');

const deterministic=(rolls:number[],faces=20)=>{
  let index=0;
  return ()=> {
    const next=rolls[index++];
    if(next===undefined) throw new Error('Unexpected extra die');
    return (next-0.5)/faces;
  };
};

const feedEvent=(roll:Record<string,unknown>)=>({
  type:'roll',visibility:'todos',metadata:{authorRole:'mestre',roll}
} as unknown as SessionEvent);

test('Normal 2d20 still sums dice for deliberate additive rolls',()=>{
  const value=rollMasterDice(20,2,0,undefined,deterministic([20,10]),'normal');
  assert.deepEqual(value,{
    faces:20,quantity:2,rolls:[20,10],modifier:0,total:30
  });
});

test('Vantagem (20,10) keeps 20, never sums 30; modifier applies once',()=>{
  const rolled=rollMasterDice(20,2,3,18,deterministic([20,10]),'vantagem');
  assert.deepEqual(rolled,{
    faces:20,quantity:2,rolls:[20,10],modifier:3,mode:'vantagem',
    selectedRoll:20,discardedRoll:10,total:23,difficulty:18
  });
  assert.equal(rolled.total-rolled.modifier,20);
});

test('Desvantagem (20,10) keeps 10; negative modifier applies once',()=>{
  const rolled=rollMasterDice(20,2,-2,11,deterministic([20,10]),'desvantagem');
  assert.deepEqual(rolled,{
    faces:20,quantity:2,rolls:[20,10],modifier:-2,mode:'desvantagem',
    selectedRoll:10,discardedRoll:20,total:8,difficulty:11
  });
  assert.equal(rolled.total-rolled.modifier,10);
});

test('Rolls work regardless of order and with identical d20s',()=>{
  const advantage=rollMasterDice(20,2,0,undefined,deterministic([10,20]),'vantagem');
  assert.deepEqual([advantage.selectedRoll,advantage.discardedRoll,advantage.total],[20,10,20]);
  const disadvantage=rollMasterDice(20,2,0,undefined,deterministic([10,20]),'desvantagem');
  assert.deepEqual([disadvantage.selectedRoll,disadvantage.discardedRoll,disadvantage.total],[10,20,10]);
  const tie=rollMasterDice(20,2,4,undefined,deterministic([20,20]),'vantagem');
  assert.deepEqual([tie.selectedRoll,tie.discardedRoll,tie.total],[20,20,24]);
});

test('Vantagem/desvantagem reject non-d20 and anything except 2 dice',()=>{
  assert.throws(()=>rollMasterDice(6,2,0,undefined,Math.random,'vantagem'),/Configure dados/);
  assert.throws(()=>rollMasterDice(20,1,0,undefined,Math.random,'vantagem'),/Configure dados/);
  assert.throws(()=>rollMasterDice(20,3,0,undefined,Math.random,'desvantagem'),/Configure dados/);
  assert.throws(()=>rollMasterDice(20,2,0,undefined,Math.random,'invalid' as 'vantagem'),/Configure dados/);
});

test('Master UI explicitly asks normal, advantage or disadvantage and stores selected die',()=>{
  assert.match(component,/Como rolar\?/);
  assert.match(component,/Normal \(somar dados\)/);
  assert.match(component,/label: 'Vantagem'/);
  assert.match(component,/label: 'Desvantagem'/);
  assert.match(component,/mode === 'normal' \? quantity : 2/);
  assert.match(component,/disabled=\{mode !== 'normal'\}/);
  assert.match(component,/disabled=\{faces !== 20 && option.id !== 'normal'\}/);
  assert.match(component,/rollMasterDice\(faces, effectiveQuantity, modifier/);
  assert.match(component,/mode, modifier/);
  assert.match(component,/selectedRoll: rolled.selectedRoll, discardedRoll: rolled.discardedRoll/);
  assert.match(component,/Escolhido|escolhido/);
  assert.match(component,/Descartado:/);
  assert.match(style,/live-vtt__master-dice-mode/);
});

test('Registro Vivo highlights picked/dropped die for advantage and disadvantage',()=>{
  const advantage=getRollDisplay(feedEvent({kind:'mestre_livre',mode:'vantagem',total:20,selectedRoll:20,discardedRoll:10}));
  const disadvantage=getRollDisplay(feedEvent({kind:'mestre_livre',mode:'desvantagem',total:10,selectedRoll:10,discardedRoll:20}));
  assert.deepEqual(advantage,{label:'Vantagem: 20 · d20 usado 20 (descartado 10)',isDamage:false});
  assert.deepEqual(disadvantage,{label:'Desvantagem: 10 · d20 usado 10 (descartado 20)',isDamage:false});
  assert.deepEqual(getRollDisplay(feedEvent({kind:'mestre_livre',total:30})),{label:'Resultado: 30',isDamage:false});
  assert.match(feed,/roll\.mode === 'vantagem'/);
});

test('No character sheet is linked, and shared/private visibility remains unchanged',()=>{
  assert.match(component,/characterId: null/);
  assert.match(component,/shareWithPlayers, setShareWithPlayers\] = useState\(false\)/);
  assert.match(component,/visibility: shareWithPlayers \? 'todos' : 'mestre'/);
  assert.doesNotMatch(component,/onSalvarPersonagem|ajustarPersonagem|personagemAtivo/);
});
