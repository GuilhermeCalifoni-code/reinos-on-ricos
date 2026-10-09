import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/design-system/live-mobile-rules-contrast.css','utf8');
const entry=readFileSync('src/index.css','utf8');
const rules=readFileSync('src/components/RulesReference.tsx','utf8');
const table=readFileSync('src/components/live/LiveTable.tsx','utf8');
const dock=readFileSync('src/components/live/LiveDock.tsx','utf8');
const old=readFileSync('src/design-system/tokens.css','utf8');

test('Tema claro global não produz cartões brancos com texto claro na Mesa',()=>{
  assert.match(old,/:root\[data-theme='light'\] \.ro-surface/);
  assert.match(entry,/design-system\/live-mobile-rules-contrast\.css/);
  assert.ok(entry.indexOf('live-mobile-rules-contrast.css')>entry.indexOf('live-mobile-viewport.css'));
  assert.match(table,/live-vtt__tool--\$\{ferramenta\}/);
  assert.match(css,/:root\[data-theme='light'\] \.live-table--v5 \.live-vtt__tool--rules \.rules-reference \.ro-surface/);
  assert.match(css,/background:\s*linear-gradient\(145deg,#202c39,#18222d\)/);
  assert.match(css,/color:\s*#f7f4ed/);
  assert.match(css,/color-scheme:\s*dark/);
});

test('Regras: títulos, textos, tabelas e entradas possuem cores contrastantes no escopo',()=>{
  for(const marker of ['rules-reference__header h2','rules-reference__compact-list strong','rules-reference__power-table p','rules-reference__matrix td','rules-reference__structure-tool option','rules-reference__grid span']){
    assert.ok(css.includes(marker),marker);
  }
  assert.match(css,/background:\s*#121c27/);
  assert.match(rules,/aria-pressed=\{active\}/);
  assert.match(rules,/Regras essenciais/);
});

test('Ferramenta de Regras vira modal navegável de altura cheia no celular',()=>{
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/\.ro-app-shell--live \.live-vtt__tool-backdrop \{/);
  assert.match(css,/\.ro-app-shell--live \.live-table--v5 \.live-vtt__tool \{[\s\S]*?height:\s*100%/);
  assert.match(css,/\.ro-app-shell--live \.live-table--v5 \.live-vtt__tool-body \{[\s\S]*?overflow-y:\s*auto/);
  assert.match(css,/\.rules-reference__tabs \{[\s\S]*?position:\s*sticky/);
  assert.match(css,/\.rules-reference__tab \{[\s\S]*?min-height:\s*44px/);
  assert.match(css,/Deslize horizontalmente para consultar a tabela/);
});

test('Ações de voltar e fechar acessíveis: botão de 44px e Escape',()=>{
  assert.match(css,/\.live-vtt__tool-head button \{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/);
  assert.match(table,/role="dialog"/);
  assert.match(table,/aria-modal="true"/);
  assert.match(table,/aria-labelledby="live-vtt-active-tool"/);
  assert.match(table,/document\.addEventListener\('keydown', onEscape\)/);
  assert.match(table,/event\.key === 'Escape'/);
  assert.match(table,/setFerramenta\('nenhuma'\)/);
  assert.match(dock,/\['regras', 'Regras', BookOpen\]/);
});

test('PV e Foco permanecem visíveis na barra móvel com rolagem horizontal',()=>{
  assert.match(css,/\.ro-app-shell--live \.live-vtt__player-strip \{[\s\S]*?overflow-x:auto/);
  assert.match(css,/\.ro-app-shell--live \.live-vtt__player-copy small \{[\s\S]*?display:block/);
  assert.match(table,/PV \{personagem\.vidaAtual\}\/\{personagem\.vidaMaxima\}/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/@media\(max-height:550px\) and \(max-width:980px\)/);
});
