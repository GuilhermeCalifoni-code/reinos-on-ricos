import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { firstRound, nextRoundTurn, parseRoundState } from '../src/components/live/RoundTracker';

const trackerSource = readFileSync('src/components/live/RoundTracker.tsx', 'utf8');
const sheetSource = readFileSync('src/components/CharacterSheet.tsx', 'utf8');

test('a paused round may be resumed without resetting turn or completed players', () => {
  const first = nextRoundTurn(firstRound(['jogador-1', 'jogador-2']), ['jogador-1', 'jogador-2']);
  const paused = { ...first, active: false };
  const restored = parseRoundState(paused);
  assert.deepEqual(restored, paused);
  assert.deepEqual({ ...restored!, active: true }, first);
  assert.match(trackerSource, /Retomar Rodada \{value\.round\}/);
  assert.match(trackerSource, /submit\(\{\.\.\.value,active:true\}\)/);
  assert.match(trackerSource, /!value\.active/);
});

test('Focus wording in character sheet matches Mundano and Onírico usage', () => {
  assert.match(sheetSource, /Até 1 PF por Teste: \+2/);
});
