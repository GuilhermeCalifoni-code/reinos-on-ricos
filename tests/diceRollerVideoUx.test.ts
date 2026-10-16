import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const roller=readFileSync('src/components/DiceRoller.tsx','utf8');
test('mundano uses full width until first roll',()=>{
  assert.match(roller,/resultadoMundano \? 'md:grid-cols-12' : 'md:grid-cols-1 md:max-w-3xl md:mx-auto'/);
  assert.match(roller,/resultadoMundano && <div className="md:col-span-6/);
  assert.match(roller,/aria-label="Detalhamento do Teste Mundano"/);
});
test('exact DT remains within original 8-25 and engine still receives it',()=>{
  assert.match(roller,/aria-label="Dificuldade exata do Teste Mundano"/);
  assert.match(roller,/Math\.max\(8, Math\.min\(25, Math\.round\(Number\(event\.target\.value\) \|\| 8\)\)\)/);
  assert.match(roller,/dt: dtMundano/);
  assert.match(roller,/executarTesteMundano\(\{/);
});
test('each roll gives immediate accessible feedback near execute',()=>{
  assert.match(roller,/setRolagensMundanas\(count => count \+ 1\)/);
  assert.match(roller,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(roller,/Rolagem #\{rolagensMundanas\}/);
  assert.match(roller,/resultadoMundano\.totalModificadores/);
  assert.match(roller,/registrarResultado\(\{ type: 'roll'/);
  assert.match(roller,/onRegistrarRolagem\(\{ \.\.\.event, characterId: personagemAtivo\?\.id \}\)/);
});
