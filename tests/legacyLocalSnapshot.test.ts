import test from 'node:test';
import assert from 'node:assert/strict';
import { readLegacyLocalSnapshot, summarizeLegacyLocalSnapshot } from '../src/data/legacyLocalSnapshot';

test('recupera dados legados sem alterar o armazenamento do navegador', () => {
  const contents = new Map<string,string>([
    ['reinos_oniricos_campanhas_v2', JSON.stringify([{ id: 'camp-01' }, { id: 'camp-original', nome: 'Campanha real' }])],
    ['reinos_oniricos_personagens_v1', JSON.stringify([{ id: 'helena-vida' }, { id: 'personagem-real' }])],
    ['reinos_oniricos_mapas_v1', JSON.stringify([{ id: 'mapa-real' }])]
  ]);
  const oldWindow = (globalThis as any).window;
  let writes = 0;
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => contents.get(key) ?? null,
      setItem: () => { writes++; },
      removeItem: () => { writes++; }
    }
  };
  try {
    const snapshot = readLegacyLocalSnapshot();
    assert.deepEqual(snapshot.campanhas.map(x => x.id), ['camp-original']);
    assert.deepEqual(snapshot.personagens.map(x => x.id), ['personagem-real']);
    assert.deepEqual(snapshot.mapas.map(x => x.id), ['mapa-real']);
    assert.deepEqual(summarizeLegacyLocalSnapshot(snapshot), {
      campanhas: 1, personagens: 1, itens: 1
    });
    assert.equal(writes, 0);
  } finally {
    (globalThis as any).window = oldWindow;
  }
});

test('reader legado ignora ausência de navegador e entradas inválidas', () => {
  const oldWindow = (globalThis as any).window;
  (globalThis as any).window = undefined;
  try {
    const snapshot = readLegacyLocalSnapshot();
    assert.equal(snapshot.campanhas.length, 0);
    assert.equal(snapshot.personagens.length, 0);
    assert.equal(summarizeLegacyLocalSnapshot(snapshot).itens, 0);
  } finally { (globalThis as any).window = oldWindow; }
});
