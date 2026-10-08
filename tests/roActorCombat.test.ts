import test from 'node:test';
import assert from 'node:assert/strict';
import { rollActorMundano, rollActorOnirico, rollActorDamage, clampActorHp, abilityRoll } from '../src/features/realtime/roActorCombat';

test('Ataque mundano de adversário usa 1d20 sem somar automaticamente NA', () => {
  assert.deepEqual(rollActorMundano(12,0,()=>0.55),{kind:'mundano',die:12,modifier:0,total:12,dt:12,success:true,critical:false});
  assert.equal(rollActorMundano(30,0,()=>.999).critical,true);
});
test('Teste Onírico compara Realidade e Sonhar individualmente e aplica Ruptura', () => {
  let n=0;const r=rollActorOnirico(13,2,()=>[.45,.75][n++]);
  assert.equal(r.kind,'onirico');
  if(r.kind==='onirico'){assert.equal(r.outcome,'Sonhar vence');assert.equal(r.ruptura,1);}
});
test('Dano onírico adiciona bônus indicado; dano mundano não recebe NA automaticamente', () => {
  const d=rollActorDamage(8,5,true,()=>.25);
  assert.equal(d.total,8);
  assert.equal(d.modifier,5);
});
test('PV não ultrapassam máximo e não ficam negativos',()=>{
  assert.equal(clampActorHp(2,3,-10),0);
  assert.equal(clampActorHp(2,3,10),3);
});
test('Reflexo é solicitado ao alvo, não rolado pelo adversário',()=>{
  assert.equal(abilityRoll({id:'a',categoria:'acao',nome:'Reflexo',descricao:'',teste:'reflexo'}),null);
});
