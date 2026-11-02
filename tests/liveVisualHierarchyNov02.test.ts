import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const css = read('src/design-system/live-visual-hierarchy-nov02.css');
const index = read('src/index.css');
const table = read('src/components/live/LiveTable.tsx');
const scene = read('src/components/live/SceneStage.tsx');

test('polish CSS is loaded last and limited to the immersive Live Table', () => {
  assert.ok(index.indexOf('playtest-flow-nov02.css') < index.indexOf('live-visual-hierarchy-nov02.css'));
  assert.equal(index.match(/live-visual-hierarchy-nov02\.css/g)?.length, 1);
  assert.match(css, /\.ro-app-shell--live \.live-table--v5/);
  assert.doesNotMatch(css, /(^|\n)\s*(html|body|:root)\s*\{/);
});

test('character rail occupies a compact, dedicated row instead of overlaying the scene', () => {
  const rail = table.indexOf('className="live-vtt__player-bar"');
  const round = table.indexOf('<RoundTracker');
  const stage = table.indexOf('className="live-vtt__shell"');
  assert.ok(rail > 0 && round > rail && stage > round);
  assert.match(css, /> \.live-vtt__player-bar\s*\{[\s\S]*?position:\s*relative;/);
  assert.match(css, /\.live-vtt__player-strip\s*\{[\s\S]*?overflow-x:\s*auto;/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(table, /aria-label="Desvincular personagem sem excluir a ficha"/);
});

test('round controls remain available and participants scroll instead of wrapping over the scene', () => {
  assert.match(css, /\.live-round-tracker\s*\{[\s\S]*?display:\s*grid;/);
  assert.match(css, /\.live-round-tracker__players\s*\{[\s\S]*?flex-wrap:\s*nowrap;/);
  assert.match(css, /\.live-round-tracker__controls\s*\{[\s\S]*?justify-content:\s*flex-end;/);
});

test('scene introduction is bounded and independently dismissible above the dock', () => {
  assert.match(scene, /className="live-table__dismiss-scene"/);
  assert.match(css, /\.live-table__stage-copy\s*\{[\s\S]*?position:\s*absolute;/);
  assert.match(css, /max-height:\s*min\(43%, 24rem\);/);
  assert.match(css, /bottom:\s*5\.6rem;/);
  assert.match(css, /\.live-vtt__dock button span\s*\{\s*font-size:\s*\.69rem;/);
  assert.doesNotMatch(css, /\.live-vtt__dock\s*\{[^}]*display:\s*none;/);
});
