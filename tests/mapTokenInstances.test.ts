import test from 'node:test';
import assert from 'node:assert/strict';
import { addTokenHp, nextInstanceName, resolvedTokenHp } from '../src/features/realtime/mapTokenInstances';

test('tokens com mesmo modelo mantêm PV independentes', () => {
  const source = {hpCurrent: 2,hpMax:2};
  const agent1 = {...source,hpCurrent:1};
  const agent2 = {...source};
  assert.equal(resolvedTokenHp(agent1 as any,2,2).current,1);
  assert.equal(resolvedTokenHp(agent2 as any,2,2).current,2);
});

test('tokens antigos sem PV usam valores do modelo sem o modificar', () => {
  assert.deepEqual(resolvedTokenHp({} as any,1,3), {current:1,max:3});
  assert.deepEqual(resolvedTokenHp({} as any,undefined,undefined), {current:1,max:1});
  assert.deepEqual(resolvedTokenHp({hpCurrent:0,hpMax:3} as any,2,3),{current:0,max:3});
});

test('cópias recebem nomes exclusivos inclusive se houver lacuna', () => {
  assert.equal(nextInstanceName('Agente DCR',['Agente DCR #1','Agente DCR #3']), 'Agente DCR #2');
});

test('PV de uma instância são limitados ao máximo', () => {
  assert.equal(addTokenHp(1,2,-9),0);
  assert.equal(addTokenHp(1,2,9),2);
});
