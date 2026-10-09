import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyLiveCharacterResources } from '../src/services/characters/characterRealtimeState';
import type { Personagem } from '../src/types/character';
import type { CharacterResourceUpdate } from '../src/features/realtime/liveTableRepository';

const personagem = {
  id: 'char-a', nome: 'Desvelado', vidaAtual: 4, vidaMaxima: 4,
  focoAtual: 3, ruptura: 0, protecaoOniricaAtual: 2,
  atualizadoEm: '2026-10-08T20:00:00.000Z'
} as Personagem;

const updated: CharacterResourceUpdate = {
  id: 'char-a', vidaAtual: 2, focoAtual: 3,
  ruptura: 0, protecaoOniricaAtual: 2,
  updatedAt: '2026-10-08T20:01:00.000Z'
};

test('evento Realtime atualiza apenas PV do personagem correto sem recriar todos', () => {
  const outro = {...personagem,id:'char-b'};
  const previous = [personagem,outro];
  const next = applyLiveCharacterResources(previous,updated);
  assert.equal(next[0].vidaAtual,2);
  assert.equal(next[1],outro);
  assert.equal(previous[0].vidaAtual,4);
  assert.equal(next[0].atualizadoEm,updated.updatedAt);
});

test('eco Realtime com PV idênticos não gera re-render desnecessário', () => {
  const already = applyLiveCharacterResources([personagem],updated);
  assert.equal(applyLiveCharacterResources(already,updated),already);
  assert.equal(applyLiveCharacterResources(already,{...updated,id:'outro'}),already);
});

test('alteração de Foco/Ruptura/PO atualiza o cache sem perder demais dados', () => {
  const update={...updated,vidaAtual:4,focoAtual:1,ruptura:2,protecaoOniricaAtual:1};
  const next=applyLiveCharacterResources([personagem],update);
  assert.equal(next[0].nome,'Desvelado');
  assert.equal(next[0].focoAtual,1);
  assert.equal(next[0].ruptura,2);
  assert.equal(next[0].protecaoOniricaAtual,1);
});

test('evento recebido na Mesa não invoca salvamento completo nem recarregamento', () => {
  const table=readFileSync('src/components/live/LiveTable.tsx','utf8');
  const hook=readFileSync('src/services/characters/useRemoteCharacters.ts','utf8');
  assert.match(table,/onCharacterUpdate:\s*onReceberRecursosPersonagem/);
  assert.match(table,/onReceberRecursosPersonagem\(novoEstado\)/);
  assert.match(table,/writesRecursosRef\.current\.set/);
  assert.doesNotMatch(table,/onCharacterUpdate:\s*update\s*=>\s*\{[^}]*onAtualizarPersonagem/s);
  assert.match(hook,/setCharacters\(current => applyLiveCharacterResources\(current, update\)\)/);
  assert.doesNotMatch(hook,/applyResourceUpdate\s*=.*characterRepository\.salvar/s);
});


test('PV de cópia de NPC/adversário são atualizados de forma otimista sem refresh',()=>{
  const hook=readFileSync('src/features/realtime/useCampaignRealtime.ts','utf8');
  assert.match(hook,/const hpPatch = role === 'mestre' && patch\.hpCurrent !== undefined/);
  assert.match(hook,/setTokens\(items => \{/);
  assert.match(hook,/item\.id === id \? \{ \.\.\.item, \.\.\.patch \} : item/);
  assert.match(hook,/catch \(error\) \{/);
  assert.match(hook,/original\.hpCurrent/);
  assert.doesNotMatch(hook,/window\.location\.reload/);
});
