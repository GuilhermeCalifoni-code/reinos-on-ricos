import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile=readFileSync('src/design-system/live-mobile-viewport.css','utf8');
const entry=readFileSync('src/index.css','utf8');
const app=readFileSync('src/App.tsx','utf8');
const table=readFileSync('src/components/live/LiveTable.tsx','utf8');
const combat=readFileSync('src/components/live/ActorCombatControls.tsx','utf8');

test('Mesa V5 preenche o viewport mesmo sob o breakpoint legado da V4',()=>{
  assert.match(entry,/@import "\.\/design-system\/live-mobile-viewport\.css";/);
  assert.ok(entry.indexOf('live-mobile-viewport.css')>entry.indexOf('mobile-responsive-enhancements.css'),
    'Correção deve vir depois das regras antigas');
  assert.match(app,/ro-app-shell--live/);
  assert.match(mobile,/\.ro-app-shell--live\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0;/);
  assert.match(mobile,/height:\s*100dvh\s*!important;/);
  assert.match(mobile,/background:\s*#090c10\s*!important;/);
  assert.match(mobile,/\.ro-app-shell--live > div > main\s*\{/);
  assert.match(mobile,/\.ro-app-shell--live \.live-table--v5\s*\{/);
});

test('mestre tem painel da largura completa e lista interna rolável no celular',()=>{
  assert.match(mobile,/@media \(max-width:\s*760px\)/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__drawer--right,/);
  assert.match(mobile,/right:\s*\.5rem;[\s\S]*?width:\s*auto;[\s\S]*?max-width:\s*none;/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__actor-list,/);
  assert.match(mobile,/overflow-y:\s*auto;/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__combat > \.live-vtt__combat-hp,/);
  assert.match(mobile,/grid-template-columns:\s*repeat\(2,\s*minmax\(0,1fr\)\);/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__combat > div > button/);
  assert.match(mobile,/min-height:\s*44px;/);
  assert.match(combat,/type="button" disabled=\{busy\|\|hp<=0\}/);
});

test('dock recebe área reservada para não ocultar mapa, mensagens e menus',()=>{
  assert.match(mobile,/--mobile-dock-space:\s*calc\(4\.55rem \+ env\(safe-area-inset-bottom,/);
  assert.match(mobile,/margin-bottom:\s*var\(--mobile-dock-space\);/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__dock \{/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__dock button span \{[\s\S]*?display:\s*block;/);
  assert.match(mobile,/\.ro-app-shell--live \.map-stage__token-inspector \{/);
  assert.match(mobile,/\.ro-app-shell--live \.map-stage__setup \{/);
});

test('troca de cena do Mestre usa segunda linha do cabeçalho, não sobrepõe fichas',()=>{
  assert.match(table,/live-vtt__stage-shell \$\{conteudo === 'mapa' \? 'is-map' : 'is-scene'\}/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__top-actions \{ display: contents; \}/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__mode-switch \{[\s\S]*?position:\s*static;[\s\S]*?grid-row:\s*2;/);
  assert.match(mobile,/\.ro-app-shell--live \.live-vtt__stage-shell\.is-map \.live-vtt__stage-meta \{\s*display:\s*none;/);
  assert.match(mobile,/\.ro-app-shell--live \.map-stage__library--v4 \{[\s\S]*?top:\s*\.65rem;/);
});

test('paisagem e telefones estreitos têm adaptações específicas',()=>{
  assert.match(mobile,/@media \(max-width:\s*390px\)/);
  assert.match(mobile,/@media \(max-height:\s*550px\) and \(max-width:\s*980px\)/);
  assert.match(mobile,/\.ro-app-shell--live \.live-table--v5 \{ min-height: 0 !important; \}/);
});
