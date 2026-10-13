import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getRollDisplay } from '../src/components/live/SessionFeed';
import type { SessionEvent } from '../src/types/sessionEvent';

const read = (path: string) => readFileSync(path, 'utf8');
const map = read('src/components/live/MapStage.tsx');
const combat = read('src/components/live/ActorCombatControls.tsx');
const live = read('src/components/live/LiveTable.tsx');
const feed = read('src/components/live/SessionFeed.tsx');
const css = read('src/design-system/live-master-workflow.css');
const imports = read('src/index.css');
const makeRoll = (roll: Record<string,unknown>, type: SessionEvent['type'] = 'roll') =>
  ({ type, metadata: { roll } } as unknown as SessionEvent);

test('map HUD can collapse while retaining map selector and access to settings', () => {
  assert.match(map, /map-stage__toolbar-top/);
  assert.match(map, /className="map-stage__toggle-tools"/);
  assert.match(map, /aria-expanded=\{ferramentasMapaAbertas\}/);
  assert.match(map, /Ferramentas/);
  assert.match(map, /Minimizar/);
  assert.match(map, /ferramentasMapaAbertas && <div className="map-stage__library-controls"/);
  assert.match(map, /aria-label="Selecionar mapa"/);
  assert.match(css, /\.map-stage__library-controls\s*\{[\s\S]*?max-height:/);
  assert.match(css, /\.map-stage__library-controls\s*\{[\s\S]*?overflow-y: auto/);
  assert.ok(imports.lastIndexOf('live-master-workflow.css') > imports.lastIndexOf('live-mobile-viewport.css'));
});

test('selected adversary has persistent map controls and model sheet with shared rolls', () => {
  assert.match(map, /abaToken === 'controle'/);
  assert.match(map, /abaToken === 'ficha'/);
  assert.match(map, /Ficha e rolagens/);
  assert.match(map, /modeloAtorDoToken = npcDoToken \|\| adversarioDoToken/);
  assert.match(map, /<ActorCombatControls key=\{tokenSelecionado\.id\}/);
  assert.match(map, /hideHpControls/);
  assert.match(map, /onActorRoll\(content, \{ \.\.\.details, tokenId: tokenSelecionado\.id \}\)/);
  assert.match(map, /map-stage__token-inspector-actions/);
  assert.match(map, /Encerrar adversário/);
  assert.match(live, /onActorRoll=\{registrarRolagemAtor\}/);
  assert.match(css, /\.map-stage__token-tabs/);
});

test('actor rolls remain private by default and public sharing is opted into by GM', () => {
  assert.match(combat, /useState\(false\)/);
  assert.match(combat, /compartilharRolagem \? 'todos' : 'mestre'/);
  assert.match(combat, /Mostrar próximas rolagens aos jogadores/);
  assert.match(live, /if \(!mestre\) throw new Error\('Somente o Mestre pode rolar/);
  assert.match(live, /visibility: visibility === 'todos' \? 'todos' : 'mestre'/);
  assert.match(live, /kind: 'actor_combat'/);
});

test('Registro Vivo distinguishes author role and highlights real rolled numbers without inferred combat hits', () => {
  assert.match(feed, /is-player/);
  assert.match(feed, /is-master/);
  assert.match(feed, /session-feed__roll-highlight/);
  assert.match(css, /session-feed__event\.is-player/);
  assert.match(css, /session-feed__event\.is-master/);
  assert.deepEqual(getRollDisplay(makeRoll({kind:'dano',total:5,die:5})), {label:'Dano rolado: 5',isDamage:true});
  assert.deepEqual(getRollDisplay(makeRoll({kind:'mundano',total:17,success:true})), {label:'Resultado: 17',isDamage:false});
  assert.deepEqual(getRollDisplay(makeRoll({kind:'onirico',realidade:12,sonhar:7})), {label:'Realidade 12 · Sonhar 7',isDamage:false});
  assert.equal(getRollDisplay(makeRoll({kind:'dano',total:7}, 'chat')), null);
  assert.equal(getRollDisplay(makeRoll({kind:'reflexo'})), null);
});
