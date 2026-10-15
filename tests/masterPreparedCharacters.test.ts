import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
const sql=read('supabase/migrations/040_assign_prepared_character.sql');
const panel=read('src/components/campaign/CampaignMembersPanel.tsx');
const detail=read('src/components/CampaignDetailView.tsx');
const app=read('src/App.tsx');
const repository=read('src/services/campaigns/campaignRepository.ts');

test('GM-only prepared character transfer validates ownership, active membership and quota in one transaction',()=>{
 assert.match(sql,/create or replace function public\.assign_prepared_character/);
 assert.match(sql,/public\.is_campaign_master\(p_campaign_id\)/);
 assert.match(sql,/pj\.owner_user_id = v_actor/);
 assert.match(sql,/cm\.status = 'ativo'/);
 assert.match(sql,/cm\.role = 'jogador'/);
 assert.match(sql,/public\.community_limit_for_user\(p_player_user_id, 'characters'\)/);
 assert.match(sql,/pg_catalog\.pg_advisory_xact_lock/);
 assert.match(sql,/set owner_user_id = p_player_user_id/);
 assert.match(sql,/update public\.campaign_members/);
 assert.match(sql,/grant execute on function public\.assign_prepared_character\(uuid,uuid,text\) to authenticated/);
 assert.doesNotMatch(sql,/disable row level security|grant all|delete from public\.personagens/i);
});
test('GM can select only their own available sheets; player character changes go through RPC',()=>{
 assert.match(panel,/character\.ownerUserId === currentUserId/);
 assert.match(panel,/!character\.campaignId \|\| character\.campaignId === campaignId/);
 assert.match(panel,/window\.confirm/);
 assert.match(panel,/Entregar ficha/);
 assert.match(panel,/onAssignPreparedCharacter\(campaignId, member\.userId, character\.id\)/);
 assert.match(detail,/onAssignPreparedCharacter=\{onAtribuirFichaPreparada\}/);
 assert.match(app,/if \(role !== 'mestre'\) throw new Error/);
 assert.match(app,/campaignRepository\.atribuirFichaPreparada\(campaignId, playerUserId, characterId\)/);
 assert.match(repository,/\.rpc\('assign_prepared_character'/);
});
