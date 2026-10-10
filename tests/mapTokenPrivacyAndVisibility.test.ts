import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const map=readFileSync('src/components/live/MapStage.tsx','utf8');
const client=readFileSync('src/features/realtime/useCampaignRealtime.ts','utf8');
const repository=readFileSync('src/features/realtime/liveTableRepository.ts','utf8');
const css=readFileSync('src/design-system/map-token-conditions.css','utf8');
const migration=readFileSync('supabase/migrations/036_map_token_visibility_realtime_sync.sql','utf8');

test('Mestre tem ação separada Ocultar dos jogadores e ReveIar, sem apagar condição Oculto',()=>{
  assert.match(map,/Visibilidade para os jogadores/);
  assert.match(map,/Ocultar dos jogadores/);
  assert.match(map,/Revelar aos jogadores/);
  assert.match(map,/aria-pressed=\{tokenSelecionado\.oculto\}/);
  assert.match(map,/ajustarToken\(\{oculto:!tokenSelecionado\.oculto\}\)/);
  assert.match(map,/condicoes:updated/);
  assert.match(map,/condição de combate “Oculto” é independente/);
  assert.match(map,/\{mestre && \(\s*<section className=\{\`map-stage__visibility-editor/);
  assert.match(map,/mestre \|\| !token\.oculto/);
  assert.match(css,/map-stage__visibility-editor/);
  assert.match(css,/data-gm-private='true'/);
});

test('Banco publica SOMENTE revisão por campanha, sem IDs, nomes e posições de tokens ocultos',()=>{
  assert.match(migration,/create table if not exists public\.map_token_visibility_versions/);
  assert.match(migration,/campaign_id uuid primary key/);
  assert.match(migration,/revision bigint/);
  assert.doesNotMatch(migration,/token_id|nome|imagem_url|condicoes text\[\]|x numeric|y numeric/i);
  assert.match(migration,/after update of oculto on public\.map_tokens/);
  assert.match(migration,/when \(old\.oculto is distinct from new\.oculto\)/);
  assert.match(migration,/alter publication supabase_realtime add table public\.map_token_visibility_versions/);
});

test('Sinal só é lido por membro autorizado e não permite escrita a jogadores',()=>{
  assert.match(migration,/enable row level security/);
  assert.match(migration,/grant select on public\.map_token_visibility_versions to authenticated/);
  assert.match(migration,/revoke all on public\.map_token_visibility_versions from anon/);
  assert.match(migration,/using \(public\.is_campaign_member\(campaign_id\)\)/);
  assert.doesNotMatch(migration,/grant (all|insert|update|delete) on public\.map_token_visibility_versions to authenticated/i);
});

test('Jogador remove todos os tokens do cache antes de buscar somente tokens autorizados pela RLS',()=>{
  assert.match(repository,/async visibleTokens\(campaignId: string\)/);
  assert.match(repository,/api\.from\('map_tokens'\)\.select\('\*'\)\.eq\('campaign_id',campaignId\)/);
  assert.match(repository,/table:'map_token_visibility_versions'/);
  assert.match(client,/visibilityChanged: \(\) =>/);
  assert.match(client,/if \(!active \|\| role === 'mestre'\) return/);
  const code=client.slice(client.indexOf('visibilityChanged: () =>'),client.indexOf('resource: item =>'));
  assert.ok(code.indexOf('setTokens([])')>=0);
  assert.ok(code.indexOf('setTokens([])')<code.indexOf('liveTableRepository.visibleTokens(campaignId)'));
  assert.match(code,/sequence === visibilityLoadSequence/);
  assert.match(client,/if \(visibilityLoadSequence === 0\) setTokens\(data\.tokens\)/);
});
