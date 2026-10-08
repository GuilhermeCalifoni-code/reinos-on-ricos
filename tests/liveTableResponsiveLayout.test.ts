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

test('Faixa dos personagens mantém distância do dock, inclusive no celular', () => {
  assert.match(styles, /\.live-table--v5 \.live-vtt__player-bar\s*\{/);
  assert.match(styles, /bottom: calc\(5\.25rem \+ env\(safe-area-inset-bottom/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /bottom: calc\(5\.35rem \+ env\(safe-area-inset-bottom/);
});

test('Tema claro não clareia a área do Registro Vivo', () => {
  assert.match(styles, /:root\[data-theme='light'\] \.live-table--v5 \.live-vtt__drawer > \.live-vtt__session-panel/);
});
