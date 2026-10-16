import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(p:string)=>readFileSync(p,'utf8');
const app=read('src/App.tsx');
const detail=read('src/components/CampaignDetailView.tsx');
const panel=read('src/components/campaign/CampaignMembersPanel.tsx');
const repository=read('src/services/campaigns/campaignRepository.ts');
const live=read('src/components/live/LiveTable.tsx');
const gm=read('src/components/live/MasterDiceRoller.tsx');
const quota=read('supabase/migrations/039_admin_character_playtest_quota.sql');
const delivery=read('supabase/migrations/040_assign_prepared_character.sql');
const byEmail=read('supabase/migrations/041_assign_prepared_character_by_email.sql');

test('Master enters existing campaign-player login email, not a global user identifier',()=>{
 assert.match(panel,/E-mail de login do jogador/);
 assert.match(panel,/type="email" required/);
 assert.match(panel,/Entregar ficha ao e-mail/);
 assert.match(panel,/onAssignPreparedCharacter\(campaignId, email, character\.id\)/);
 assert.match(detail,/onAssignPreparedCharacter=\{onAtribuirFichaPreparada\}/);
 assert.match(app,/onAtribuirFichaPreparada=\{handleAtribuirFichaPreparada\}/);
 assert.match(repository,/\.rpc\('assign_prepared_character_by_email'/);
 assert.doesNotMatch(panel,/onAssignPreparedCharacter\(campaignId, member\.userId/);
});
test('Backend verifies exact email only inside active campaign and ownership on transfer',()=>{
 assert.match(byEmail,/join auth\.users au on au\.id = cm\.user_id/);
 assert.match(byEmail,/cm\.campaign_id = p_campaign_id/);
 assert.match(byEmail,/cm\.role = 'jogador'/);
 assert.match(byEmail,/cm\.status = 'ativo'/);
 assert.match(byEmail,/pg_catalog\.lower\(au\.email\) = v_email/);
 assert.match(byEmail,/public\.is_campaign_master\(p_campaign_id\)/);
 assert.match(byEmail,/perform public\.assign_prepared_character/);
 assert.match(delivery,/pj\.owner_user_id = v_actor/);
 assert.match(delivery,/set owner_user_id = p_player_user_id/);
 assert.match(delivery,/select count\(\*\)::integer into v_owned/);
 assert.match(delivery,/pg_catalog\.pg_advisory_xact_lock/);
 assert.match(quota,/access\.role in \('admin', 'super_admin'\)/);
 assert.doesNotMatch(byEmail,/returns table|returns setof|select \* from auth\.users/i);
});
test('GM remains sheet-independent while players roll with their assigned campaign sheet',()=>{
 assert.match(live,/ferramenta === 'dados' && \(mestre \?/);
 assert.match(live,/<MasterDiceRoller onRegistrarRolagem/);
 assert.match(gm,/characterId: null/);
 assert.match(live,/personagemJogadorId === selecionado\.id/);
 assert.match(live,/characterId: selecionado\.id/);
 assert.match(live,/onSalvarPersonagem=\{atualizarPersonagemMesa\}/);
});
