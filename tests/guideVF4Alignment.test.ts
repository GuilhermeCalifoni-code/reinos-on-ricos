import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FULL_COMPENDIUM_RULES, getFullCompendiumRule} from '../src/rules/compendiumFullRules';
import {REGRAS_PASSOS_POTENCIA} from '../src/rules/referenceTables';
import {COMPENDIUM_ENTRIES} from '../src/rules/compendiumData';

const quickReference=readFileSync('src/components/RulesReference.tsx','utf8');

test('Guia vf4: all guide-derived Compendium entries cite 19-page playtest document with correct pages', () => {
  for(const [id, doc] of Object.entries(FULL_COMPENDIUM_RULES)){
    if(!doc.source.includes('Guia de Regras RO RPG vf4'))continue;
    assert.match(doc.pages, /^(?:[1-9]|1[0-9])(?:[–-](?:[1-9]|1[0-9]))?$/, id);
    assert.notEqual(doc.pages,'153', id);
  }
  assert.equal(getFullCompendiumRule('potencia')?.pages,'15');
  assert.equal(getFullCompendiumRule('dano-continuo')?.pages,'9');
  assert.equal(getFullCompendiumRule('ficha-adversario')?.pages,'18');
  assert.equal(getFullCompendiumRule('movimento-morte')?.pages,'9');
});

test('Guia vf4 page 15: Area is not bought with Potência and Contador affects limit, not progress', () => {
  assert.equal(REGRAS_PASSOS_POTENCIA.some(item=>item.id==='area'),false);
  const contador=REGRAS_PASSOS_POTENCIA.find(item=>item.id==='contador');
  assert.match(contador?.regra||'', /limite/);
  assert.match(contador?.observacao||'', /não avança o progresso/);
  const resistencia=REGRAS_PASSOS_POTENCIA.find(item=>item.id==='resistencia');
  assert.match(resistencia?.regra||'', /ponto/);
  const deslocamento=REGRAS_PASSOS_POTENCIA.find(item=>item.id==='deslocamento');
  assert.match(deslocamento?.regra||'', /categoria/);
  const potencia=JSON.stringify(getFullCompendiumRule('potencia'));
  assert.match(potencia,/múltiplos alvos individuais requer Espaço/);
  assert.match(potencia,/não modifica.*progresso|sem modificar progresso/i);
  assert.doesNotMatch(potencia, /\['Área\s*\*?','±1 faixa/);
});

test('Guia vf4 page 9: persistent environmental damage has defined round cadence and cancellation', () => {
  const dano=getFullCompendiumRule('dano-continuo');
  assert.ok(dano);
  assert.equal(dano.pages,'9');
  const content=JSON.stringify(dano);
  assert.match(content,/ao final de cada Rodada/);
  assert.match(content,/sair da Área/);
  assert.match(content,/interrompe a fonte/);
  assert.match(content,/instantâneos não causam dano contínuo/);
  assert.ok(COMPENDIUM_ENTRIES.some(entry=>entry.id==='dano-continuo'));
  assert.match(quickReference,/ao final de cada Rodada/);
});

test('Guia vf4 page 14: duration explicitly stays in Rodadas or Cenas',()=>{
 const rule=JSON.stringify(getFullCompendiumRule('duracao-sonhar'));
 assert.match(rule,/Instantâneo/);
 assert.match(rule,/1 Rodada/);
 assert.match(rule,/1 Cena/);
 assert.match(quickReference,/Alcance, Área e Duração/);
});

test('Guia vf4 page 10: advantage never applies to Onírico',()=>{
 const text=JSON.stringify(getFullCompendiumRule('vantagem-desvantagem'));
 assert.match(text,/nunca a Testes Oníricos/);
 assert.match(text,/use o maior/);
 assert.match(text,/use o menor/);
});
