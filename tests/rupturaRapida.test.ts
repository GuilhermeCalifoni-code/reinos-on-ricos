import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ajustarRuptura } from '../src/rules/rupturaRapida';

const p: any = { id: 'p', nome: 'Helena', ruptura: 2, historicoRuptura: [{ id: 'antigo' }] };
const agora = new Date('2026-11-04T23:00:00Z');

test('+ e − mudam a Ruptura em 1 e registram no histórico (mais recente primeiro)', () => {
  const mais = ajustarRuptura(p, 1, '', agora);
  assert.equal(mais.ruptura, 3);
  assert.equal(mais.historicoRuptura.length, 2);
  assert.deepEqual([mais.historicoRuptura[0].valorAnterior, mais.historicoRuptura[0].novoValor, mais.historicoRuptura[0].origem], [2, 3, 'manual']);
  assert.equal(mais.historicoRuptura[1].id, 'antigo');
  assert.equal(ajustarRuptura(p, -1, '', agora).ruptura, 1);
});

test('Ruptura não passa de 6 nem fica abaixo de 0, e nesses casos nada é registrado', () => {
  assert.equal(ajustarRuptura({ ...p, ruptura: 6 }, 1, '', agora).historicoRuptura.length, 1);
  assert.equal(ajustarRuptura({ ...p, ruptura: 0 }, -1, '', agora).ruptura, 0);
});

test('Motivo informado vai para o histórico', () => {
  assert.equal(ajustarRuptura(p, 1, 'Ajuste na Mesa Ao Vivo', agora).historicoRuptura[0].motivo, 'Ajuste na Mesa Ao Vivo');
});

test('Ficha e Mesa Ao Vivo têm botões − e + de Ruptura sem abrir a janela', () => {
  const ficha = readFileSync('src/components/CharacterSheet.tsx', 'utf8');
  assert.match(ficha, /aria-label="Diminuir Ruptura"/);
  assert.match(ficha, /aria-label="Aumentar Ruptura"/);
  const mesa = readFileSync('src/components/live/LiveTable.tsx', 'utf8');
  assert.match(mesa, /onRuptura=\{\(personagem, delta\) => \{/);
  assert.match(readFileSync('src/components/live/LiveActorsPanel.tsx', 'utf8'), /onRuptura\(personagem, -1\)/);
});
