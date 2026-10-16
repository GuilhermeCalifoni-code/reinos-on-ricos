import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(path, 'utf8');
const transfer = read('supabase/migrations/040_assign_prepared_character.sql');
const byEmail = read('supabase/migrations/041_assign_prepared_character_by_email.sql');
const panel = read('src/components/campaign/CampaignMembersPanel.tsx');
const detail = read('src/components/CampaignDetailView.tsx');
const app = read('src/App.tsx');
const repository = read('src/services/campaigns/campaignRepository.ts');

test('transfer verifies GM, ownership, active membership and recipient quota',()=>{
 assert.match(transfer,/create or replace function public\.assign_prepared_character/);
 assert.match(transfer,/public\.is_campaign_master\(p_campaign_id\)/);
 assert.match(transfer,/pj\.owner_user_id = v_actor/);
 assert.match(transfer,/cm\.status = 'ativo'/);
 assert.match(transfer,/cm\.role = 'jogador'/);
 assert.match(transfer,/public\.community_limit_for_user\(p_player_user_id, 'characters'\)/);
 assert.match(transfer,/pg_catalog\.pg_advisory_xact_lock/);
 assert.match(transfer,/set owner_user_id = p_player_user_id/);
 assert.match(transfer,/update public\.campaign_members/);
 assert.doesNotMatch(transfer,/disable row level security|grant all|delete from public\.personagens/i);
});
test('email lookup is only by GM, exact login email and active campaign player',()=>{
 assert.match(byEmail,/create or replace function public\.assign_prepared_character_by_email/);
 assert.match(byEmail,/security definer/);
 assert.match(byEmail,/set search_path = ''/);
 assert.match(byEmail,/public\.is_campaign_master\(p_campaign_id\)/);
 assert.match(byEmail,/join auth\.users au on au\.id = cm\.user_id/);
 assert.match(byEmail,/cm\.campaign_id = p_campaign_id/);
 assert.match(byEmail,/cm\.role = 'jogador'/);
 assert.match(byEmail,/cm\.status = 'ativo'/);
 assert.match(byEmail,/pg_catalog\.lower\(au\.email\) = v_email/);
 assert.match(byEmail,/perform public\.assign_prepared_character\(/);
 assert.match(byEmail,/grant execute on function public\.assign_prepared_character_by_email\(uuid,text,text\)/);
 assert.doesNotMatch(byEmail,/select\s+\*\s+from\s+auth\.users|returns\s+table|disable row level security/i);
});
test('GM confirms handoff using an email input, without global email listing',()=>{
 assert.match(panel,/character\.ownerUserId === currentUserId/);
 assert.match(panel,/!character\.campaignId \|\| character\.campaignId === campaignId/);
 assert.match(panel,/E-mail de login do jogador/);
 assert.match(panel,/type="email" required/);
 assert.match(panel,/preparedPlayerEmail\.trim\(\)\.toLowerCase\(\)/);
 assert.match(panel,/window\.confirm/);
 assert.match(panel,/onAssignPreparedCharacter\(campaignId, email, character\.id\)/);
 assert.doesNotMatch(panel,/onAssignPreparedCharacter\(campaignId, member\.userId/);
 assert.match(detail,/onAssignPreparedCharacter=\{onAtribuirFichaPreparada\}/);
 assert.match(app,/if \(role !== 'mestre'\) throw new Error/);
 assert.match(app,/campaignRepository\.atribuirFichaPreparadaPorEmail\(campaignId, playerEmail, characterId\)/);
 assert.match(repository,/\.rpc\('assign_prepared_character_by_email'/);
 assert.match(repository,/p_player_email: email/);
});
test('normal email format is valid; malformed emails are rejected in frontend',()=>{
 const pattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 for(const example of ['diogo@example.com','one+two@test.org']) assert.ok(pattern.test(example));
 for(const example of ['','not-an-email','foo @test.org','foo@']) assert.equal(pattern.test(example),false);
 assert.match(panel,/!\/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\/\.test\(email\)/);
 assert.match(repository,/!\/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\/\.test\(email\)/);
});
