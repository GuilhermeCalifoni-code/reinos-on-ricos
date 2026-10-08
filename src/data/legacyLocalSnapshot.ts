import type { LocalWorkspaceSnapshot } from '../services/migration/localCloudMigrationService';

/**
 * Leitura LEGADA para resgatar dados criados antes da migração para o Supabase.
 * Nunca escreve, modifica ou remove dados do navegador.
 * Não deve ser usada como fonte de dados do jogo.
 */
const keys = {
  campanhas: 'reinos_oniricos_campanhas_v2',
  personagens: 'reinos_oniricos_personagens_v1',
  sessoes: 'reinos_oniricos_sessoes_v2',
  npcs: 'reinos_oniricos_npcs_v2',
  adversarios: 'reinos_oniricos_adversarios_v2',
  locais: 'reinos_oniricos_locais_v2',
  pistas: 'reinos_oniricos_pistas_v2',
  loreEntries: 'reinos_oniricos_lore_v2',
  anotacoes: 'reinos_oniricos_anotacoes_v2',
  cenas: 'reinos_oniricos_cenas_v1',
  handouts: 'reinos_oniricos_handouts_v1',
  contadores: 'reinos_oniricos_contadores_v1',
  mapas: 'reinos_oniricos_mapas_v1',
  tokensMapa: 'reinos_oniricos_tokens_mapa_v1'
} satisfies Record<keyof LocalWorkspaceSnapshot, string>;

const demoIds = new Set([
  'camp-01', 'camp-02', 'camp-03',
  'sessao-04', 'sessao-05', 'sessao-06',
  'npc-01', 'npc-02', 'adv-01', 'adv-02',
  'loc-01', 'loc-02', 'pis-01', 'pis-02',
  'lore-01', 'lore-02', 'not-01',
  'caio-espaco', 'helena-vida', 'tomas-consciencia', 'livia-substancia'
]);

const readArray = (key: string): any[] => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item === 'object'
      && typeof item.id === 'string' && !demoIds.has(item.id));
  } catch {
    return [];
  }
};

export const readLegacyLocalSnapshot = (): LocalWorkspaceSnapshot => ({
  campanhas: readArray(keys.campanhas),
  personagens: readArray(keys.personagens),
  sessoes: readArray(keys.sessoes),
  npcs: readArray(keys.npcs),
  adversarios: readArray(keys.adversarios),
  locais: readArray(keys.locais),
  pistas: readArray(keys.pistas),
  loreEntries: readArray(keys.loreEntries),
  anotacoes: readArray(keys.anotacoes),
  cenas: readArray(keys.cenas),
  handouts: readArray(keys.handouts),
  contadores: readArray(keys.contadores),
  mapas: readArray(keys.mapas),
  tokensMapa: readArray(keys.tokensMapa)
});

export const summarizeLegacyLocalSnapshot = (snapshot: LocalWorkspaceSnapshot) => ({
  campanhas: snapshot.campanhas.length,
  personagens: snapshot.personagens.length,
  itens: snapshot.sessoes.length + snapshot.npcs.length + snapshot.adversarios.length
    + snapshot.locais.length + snapshot.pistas.length + snapshot.loreEntries.length
    + snapshot.anotacoes.length + snapshot.cenas.length + snapshot.handouts.length
    + snapshot.contadores.length + snapshot.mapas.length + snapshot.tokensMapa.length
});
