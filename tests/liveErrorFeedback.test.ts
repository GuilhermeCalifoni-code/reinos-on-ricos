import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/components/live/LiveTable.tsx','utf8');
test('Mestre ve falha em mapas tokens contadores e cenas em vez de perda silenciosa',()=>{
  for(const op of ['Criar contador','Atualizar contador','Remover contador','Criar mapa','Atualizar mapa','Remover mapa','Criar token','Remover token','Direção da cena','Registro Vivo']) {
    assert.ok(source.includes("sinalizarErroMesa('"+op+"'"),op);
  }
  assert.match(source,/Alteração não confirmada\. \{erroMesa\}/);
  assert.match(source,/aria-label="Dispensar erro da Mesa"/);
});
