import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(name:string)=>readFileSync(name,'utf8');
const migration=read('supabase/migrations/044_player_remove_own_character_token.sql');
const repo=read('src/features/realtime/liveTableRepository.ts');
const realtime=read('src/features/realtime/useCampaignRealtime.ts');
const table=read('src/components/live/LiveTable.tsx');
const map=read('src/components/live/MapStage.tsx');
const scene=read('src/components/live/SceneStage.tsx');

test('RPC deletion is restricted to visible owned linked Player Desvelado only',()=>{
  assert.match(migration,/create or replace function public\.remove_own_character_token/);
  assert.match(migration,/security definer/);
  assert.match(migration,/set search_path = ''/);
  assert.match(migration,/v_actor uuid := auth\.uid\(\)/);
  assert.match(migration,/v_token\.tipo <> 'personagem'/);
  assert.match(migration,/v_token\.character_id is null/);
  assert.match(migration,/v_token\.oculto/);
  assert.match(migration,/public\.can_read_map_token\(v_token\.campaign_id, v_token\.map_id, v_token\.oculto\)/);
  assert.match(migration,/cm\.user_id=v_actor/);
  assert.match(migration,/cm\.role='jogador'/);
  assert.match(migration,/cm\.status='ativo'/);
  assert.match(migration,/p\.owner_user_id=cm\.user_id/);
  assert.match(migration,/p\.campaign_id=cm\.campaign_id/);
  assert.match(migration,/cm\.character_id=v_token\.character_id/);
  assert.match(migration,/for update/);
  assert.match(migration,/delete from public\.map_tokens where id = p_token_id/);
  assert.doesNotMatch(migration,/delete from public\.personagens|delete from public\.narrative_maps|delete from public\.campaign_members/i);
  assert.match(migration,/grant execute on function public\.remove_own_character_token\(uuid\)\s+to authenticated/);
  assert.doesNotMatch(migration,/grant execute on function public\.remove_own_character_token\(uuid\)\s+to anon/);
});

test('Player deletion never uses GM DELETE endpoint and updates UI only after confirmation',()=>{
  assert.match(repo,/async removeOwnCharacterToken\(id: string\)/);
  assert.match(repo,/\.rpc\('remove_own_character_token', \{ p_token_id: id \}\)/);
  assert.match(realtime,/removeOwnToken: \(id: string\)/);
  assert.match(realtime,/role !== 'jogador'/);
  assert.match(realtime,/await liveTableRepository\.removeOwnCharacterToken\(id\)/);
  assert.match(realtime,/setTokens\(items => items\.filter\(item => item\.id !== id\)\)/);
  assert.match(table,/const removerMeuToken = async \(id: string\)/);
  assert.match(table,/role !== 'jogador' \|\| !personagemJogadorId \|\| !compartilhando/);
  assert.match(table,/token\.tipo !== 'personagem' \|\| token\.characterId !== personagemJogadorId \|\| token\.oculto/);
  assert.match(table,/realtime\.removeOwnToken\(id\)/);
  assert.match(table,/onRemoverTokenProprio=\{role === 'jogador' \? removerMeuToken : undefined\}/);
  assert.match(scene,/onRemoverTokenProprio=\{onRemoverTokenProprio\}/);
  assert.match(map,/onRemoverTokenProprio\?: \(id: string\) => Promise<unknown>/);
});

test('Player sees only own token removal with explicit confirmation and failure feedback',()=>{
  assert.match(map,/Remover meu token/);
  assert.match(map,/confirmarRemocaoMeuToken/);
  assert.match(map,/window\.confirm/);
  assert.match(map,/A ficha do seu Desvelado não será apagada/);
  assert.match(map,/tokenSelecionado\.characterId !== personagemJogadorId/);
  assert.match(map,/await onRemoverTokenProprio\(tokenId\)/);
  assert.match(map,/setSelecionadoId\(null\)/);
  assert.match(map,/setErroRemocao\(error instanceof Error/);
  assert.match(map,/role="alert" className="map-stage__token-remove-error"/);
  assert.match(map,/Seu Desvelado continuará salvo/);
  assert.match(map,/disabled=\{removendoToken\}/);
  assert.match(map,/Ações do meu token/);
});
