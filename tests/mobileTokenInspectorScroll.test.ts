import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const map=readFileSync('src/components/live/MapStage.tsx','utf8');
const css=readFileSync('src/design-system/live-token-inspector-scroll.css','utf8');
const entry=readFileSync('src/index.css','utf8');

test('inspetor separa controles roláveis do cabeçalho e ações sempre disponíveis',()=>{
 const start=map.indexOf('<aside className="map-stage__token-inspector"');
 const end=map.indexOf('</aside>',start);
 assert.ok(start>=0 && end>start);
 const inspector=map.slice(start,end);
 const header=inspector.indexOf('className="map-stage__token-inspector-head"');
 const body=inspector.indexOf('className="map-stage__token-inspector-body"');
 const bodyClose=inspector.lastIndexOf('</div>',inspector.indexOf('className="map-stage__token-inspector-actions"'));
 const footer=inspector.indexOf('className="map-stage__token-inspector-actions"');
 assert.ok(header>=0 && header<body && body<footer);
 assert.ok(bodyClose>body && bodyClose<footer,'o corpo termina antes do rodapé');
 assert.match(inspector,/aria-label="Fechar controles do token"/);
 assert.match(inspector,/role="region"/);
 assert.match(inspector,/tabIndex=\{0\}/);
 assert.match(inspector,/event\.key === 'Escape'/);
 assert.match(inspector,/Encerrar adversário/);
 assert.match(inspector,/onRemoverToken\(tokenSelecionado\.id\)/);
 assert.match(inspector,/apenas esta cópia do mapa, sem apagar a ficha-base/);
 assert.match(inspector,/\{mestre && \(/);
});

test('touch do inspetor não movimenta mapa e centro rola de verdade',()=>{
 assert.match(map,/onPointerDown=\{event => event\.stopPropagation\(\)\}/);
 assert.match(map,/onPointerMove=\{event => event\.stopPropagation\(\)\}/);
 assert.match(map,/onWheel=\{event => event\.stopPropagation\(\)\}/);
 assert.match(css,/\.map-stage__token-inspector-body\s*\{[^}]*overflow-y:\s*auto/s);
 assert.match(css,/\.map-stage__token-inspector-body\s*\{[^}]*min-height:\s*0/s);
 assert.match(css,/\.map-stage__token-inspector-body\s*\{[^}]*touch-action:\s*pan-y/s);
 assert.match(css,/\.map-stage__token-inspector-actions\s*\{[^}]*flex:\s*0 0 auto/s);
 assert.match(css,/@media \(max-width: 760px\)/);
 assert.match(css,/@media \(max-height: 520px\)/);
 assert.ok(entry.lastIndexOf('live-token-inspector-scroll.css') > entry.lastIndexOf('map-token-conditions.css'), 'nova folha de estilos deve prevalecer sobre legadas');
});
