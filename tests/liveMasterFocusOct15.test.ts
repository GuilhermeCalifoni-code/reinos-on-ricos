import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(path:string)=>readFileSync(path,'utf8');
const scene=read('src/components/live/SceneStage.tsx');
const map=read('src/components/live/MapStage.tsx');
const table=read('src/components/live/LiveTable.tsx');
const css=read('src/design-system/live-master-focus-oct15.css');
const index=read('src/index.css');
test('scene overlay fades after 4.5 seconds and can be dismissed, GM edit retained',()=>{
 assert.match(scene,/window\.setTimeout\(\(\) => setShowIntro\(false\), 4500\)/);
 assert.match(scene,/window\.clearTimeout\(timer\)/);
 assert.match(scene,/showIntro \|\| editing/);
 assert.match(scene,/Ocultar apresentação da cena/);
 assert.match(scene,/mestre && !showIntro && !editing/);
 assert.match(scene,/Editar cena/);
});
test('Mestre sees a real persisted deletion result before inspector disappears',()=>{
 assert.match(map,/const confirmarRemocaoToken = async/);
 assert.match(map,/await onRemoverToken\(tokenSelecionado\.id\)/);
 assert.match(map,/setErroRemocao/);
 assert.match(map,/role="alert" className="map-stage__token-remove-error"/);
 assert.match(table,/try \{ await realtime\.removeToken\(id\); \}/);
 assert.match(table,/catch \(error\) \{ sinalizarErroMesa\('Remover token', error\); throw error;/);
 assert.doesNotMatch(map,/onClick=\{\(\) => \{ onRemoverToken\(tokenSelecionado\.id\); setSelecionadoId\(null\); \}\}/);
});
test('mobile starts in focus mode, panels stay accessible and styles win legacy declarations',()=>{
 assert.match(table,/matchMedia\('\(pointer: coarse\) and \(max-width: 1200px\)'\)/);
 assert.match(table,/setDirectorOpen\] = useState\(mestre && !interfaceCompacta\)/);
 assert.match(table,/className="live-vtt__compact-toggle"/);
 assert.match(table,/Foco no mapa/);
 assert.match(css,/is-compact-mobile > \.live-vtt__player-bar\s*\{[^}]*display: none !important/s);
 assert.match(css,/map-stage__setup\[open\] summary/);
 assert.ok(index.indexOf('live-master-focus-oct15.css')>index.indexOf('live-master-workflow.css'));
});
