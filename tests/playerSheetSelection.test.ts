import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('src/App.tsx','utf8'), mesa=readFileSync('src/components/MesaView.tsx','utf8'), live=readFileSync('src/components/live/LiveTable.tsx','utf8');
test('Jogador escolhe ficha pessoal sem abrir painel exclusivo do Mestre',()=>{
  assert.match(app,/personagensProprios=\{personagensRemotos\.personal\}/);
  assert.match(app,/handleVincularMinhaFicha\(campanhaAtiva\.id, id\)/);
  assert.match(mesa,/onVincularMinhaFicha=\{onVincularMinhaFicha\}/);
  assert.match(live,/Selecionar minha ficha nesta campanha/);
  assert.match(live,/p => !p\.campaignId \|\| p\.campaignId === campanha\.id/);
  assert.match(live,/!onVincularMinhaFicha \|\| salvandoVinculo \|\| mestre/);
  assert.match(live,/role="alert" className="live-vtt__sheet-link-error"/);
});
