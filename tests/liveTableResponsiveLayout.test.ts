import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panel = readFileSync('src/components/live/SessionPanel.tsx', 'utf8');
const styles = readFileSync('src/design-system/mobile-responsive-enhancements.css', 'utf8');
const table = readFileSync('src/components/live/LiveTable.tsx', 'utf8');

test('Registro Vivo não reutiliza o painel legado de tema claro', () => {
  assert.match(panel, /className="live-vtt__session-panel"/);
  assert.doesNotMatch(panel, /className="live-table__session"/);
  assert.match(table, /className="live-vtt__drawer live-vtt__drawer--left"/);
  assert.match(styles, /\.live-vtt__drawer > \.live-vtt__session-panel/);
});

test('Registro Vivo mantém timeline rolável e compositor em área separada', () => {
  assert.match(styles, /\.live-vtt__session-panel \.session-feed__events\s*\{/);
  assert.match(styles, /\.live-vtt__session-panel \.session-feed__composer\s*\{/);
  assert.match(styles, /max-height: none;/);
  assert.match(styles, /max-height: min\(42dvh, 21rem\);/);
});

test('Faixa de fichas ocupa área própria acima do palco, e nunca cobre o dock', () => {
  const player = table.indexOf('className="live-vtt__player-bar"');
  const shell = table.indexOf('className="live-vtt__shell"');
  const stage = table.indexOf('className="live-vtt__stage-shell"');
  assert.ok(player > 0 && player < shell && shell < stage,
    'Fichas devem ficar entre o cabeçalho e o shell da Mesa, fora do palco');
  assert.match(styles, /\.live-table--v5 > \.live-vtt__player-bar\s*\{/);
  assert.match(styles, /position:\s*relative;/);
  assert.match(styles, /inset:\s*auto;/);
  assert.match(styles, /overflow-x:\s*auto;/);
  assert.match(styles, /@media \(max-width:\s*700px\)/);
  assert.match(styles, /\.live-vtt__player-copy small\s*\{\s*display:\s*block;/);
});


test('Tema claro não clareia a área do Registro Vivo', () => {
  assert.match(styles, /:root\[data-theme='light'\] \.live-table--v5 \.live-vtt__drawer > \.live-vtt__session-panel/);
});
