import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const type=readFileSync('src/types/campaign.ts','utf8');
const map=readFileSync('src/components/live/MapStage.tsx','utf8');
const repo=readFileSync('src/features/realtime/liveTableRepository.ts','utf8');
const realtime=readFileSync('src/features/realtime/useCampaignRealtime.ts','utf8');
const migration=readFileSync('supabase/migrations/034_map_token_combat_conditions.sql','utf8');
const css=readFileSync('src/design-system/map-token-conditions.css','utf8');
const entry=readFileSync('src/index.css','utf8');

test('condições Oculto, Impedido e Vulnerável existem separadas da visibilidade oculta',()=>{
  assert.match(type,/export type CondicaoCombate = 'oculto' \| 'impedido' \| 'vulneravel'/);
  assert.match(type,/condicoes\?: CondicaoCombate\[\]/);
  assert.match(type,/oculto: boolean/);
  assert.match(migration,/add column if not exists condicoes text\[\] not null default/);
  assert.match(migration,/check \([\s\S]*cardinality\(condicoes\) <= 3[\s\S]*condicoes <@ array/);
  assert.doesNotMatch(migration,/alter column oculto/i);
});

test('marcadores aparecem em tokens visíveis, inclusive NPC, adversário e Desvelado',()=>{
  assert.match(map,/token\.tipo === 'marcador' \? \[\] : combatConditions\.filter/);
  assert.match(map,/map-stage__token-conditions/);
  for (const icon of ['EyeOff','Ban','AlertTriangle']){
    assert.match(map,new RegExp('Icon:'+icon));
  }
  assert.match(map,/\(mestre \|\| !token\.oculto\)/);
  assert.match(map,/statuses\.map\(\(\{id,label,Icon\}\)/);
  assert.match(css,/\.map-stage__condition-badge\.is-oculto/);
  assert.match(css,/\.map-stage__condition-badge\.is-impedido/);
  assert.match(css,/\.map-stage__condition-badge\.is-vulneravel/);
});

test('editor permite várias condições independentes por cópia e mobile touch',()=>{
  assert.match(map,/condicoes\.includes\(condition\)/);
  assert.match(map,/ajustarToken\(\{condicoes:updated\}\)/);
  assert.match(map,/aria-pressed=\{\(tokenSelecionado\.condicoes \|\| \[\]\)\.includes\(id\)\}/);
  assert.match(map,/tokenSelecionado\.tipo !== 'marcador'/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/min-height:55px/);
  assert.match(entry,/design-system\/map-token-conditions\.css/);
});

test('persistência Realtime e carregamento mantêm condições de cada token',()=>{
  assert.match(repo,/condicoes: \(row\.condicoes \|\| \[\]\)/);
  assert.match(repo,/condicoes: item\.condicoes \?\? \[\]/);
  assert.match(repo,/if\(patch\.condicoes!==undefined\) values\.condicoes=patch\.condicoes/);
  assert.match(realtime,/pendingConditionWritesRef/);
  assert.match(realtime,/local \? \{\.\.\.item,condicoes:local\.condicoes\}/);
  assert.match(realtime,/setTokens\(items=>items\.map\(item=>item\.id===id\?\{\.\.\.item,condicoes:next\}/);
});

test('jogador só altera condições do próprio Desvelado via RPC restrita',()=>{
  assert.match(repo,/set_own_map_token_conditions/);
  assert.match(repo,/if \(positioning && settingConditions\) throw/);
  assert.match(repo,/if \(!positioning && !settingConditions\) throw/);
  assert.match(migration,/security definer/);
  assert.match(migration,/v_token\.tipo <> 'personagem'/);
  assert.match(migration,/cm\.character_id::text=v_token\.character_id/);
  assert.match(migration,/cm\.role='jogador'/);
  assert.match(migration,/cm\.status='ativo'/);
  assert.match(migration,/public\.can_read_map_token\(v_token\.campaign_id,v_token\.map_id,v_token\.oculto\)/);
  assert.match(migration,/grant execute on function public\.set_own_map_token_conditions\(uuid,text\[\]\) to authenticated/);
  assert.match(realtime,/if \(role === 'observador'\) throw/);
});
