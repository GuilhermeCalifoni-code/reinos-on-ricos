import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(file:string)=>readFileSync(file,'utf8');
const migration=read('supabase/migrations/042_master_character_campaign_roster.sql');
const create=read('src/components/CreateCampaignView.tsx');
const app=read('src/App.tsx');
const panel=read('src/components/campaign/CampaignMembersPanel.tsx');
const detail=read('src/components/CampaignDetailView.tsx');
const repo=read('src/services/campaigns/campaignRepository.ts');
const transfer=read('supabase/migrations/040_assign_prepared_character.sql');

test('Mestre attaches multiple owned sheets to campaign, never their single character slot',()=>{
 assert.match(migration,/create or replace function public\.manage_master_character_roster/);
 assert.match(migration,/public\.is_campaign_master\(p_campaign_id\)/);
 assert.match(migration,/pj\.owner_user_id = v_actor/);
 assert.match(migration,/campaign_id = case when p_attach then p_campaign_id else null end/);
 assert.match(migration,/pg_catalog\.btrim/);
 assert.match(migration,/for update/);
 assert.match(migration,/cm\.character_id = p_character_id/);
 assert.match(migration,/cm\.role = 'mestre'/);
 assert.match(migration,/grant execute on function public\.manage_master_character_roster\(uuid,text,boolean\)/);
 assert.doesNotMatch(migration,/insert\s+into\s+public\.campaign_members|insert\s+into\s+public\.personagens|delete\s+from\s+public\.personagens/i);
});

test('Campanha creation shows multi-select and updates all requested personal sheets',()=>{
 assert.match(create,/personagensDisponiveis\?: Personagem\[\]/);
 assert.match(create,/personagensIds\?: string\[\]/);
 assert.match(create,/type="checkbox" checked=\{personagensIds\.includes\(pj\.id\)\}/);
 assert.match(create,/personagensIds\s*\n\s*\}\);/);
 assert.match(app,/personagensDisponiveis=\{personagensRemotos\.personal\.filter\(p => !p\.campaignId\)\}/);
 assert.match(app,/for \(const id of dados\.personagensIds \|\| \[\]\)/);
 assert.match(app,/campaignRepository\.gerenciarFichaPreparada\(nova\.id, id, true\)/);
 assert.match(app,/A campanha foi criada, mas algumas fichas não puderam ser adicionadas/);
});
test('In existing campaign GM adds/removes multiple prepared sheets without a participant code',()=>{
 assert.match(detail,/onManagePreparedCharacter=\{onGerenciarFichaCampanha\}/);
 assert.match(app,/onGerenciarFichaCampanha=\{handleGerenciarFichaCampanha\}/);
 assert.match(panel,/Adicionar personagens à campanha/);
 assert.match(panel,/onManagePreparedCharacter\(campaignId, characterId, attach\)/);
 assert.match(panel,/freeCharacters\.map\(character/);
 assert.match(panel,/stagedCharacters\.map\(character/);
 assert.match(panel,/members\.some\(m => m\.characterId === character\.id\)/);
 assert.match(repo,/\.rpc\('manage_master_character_roster'/);
 assert.match(repo,/p_attach: attach/);
});
test('Email transfer still accepts GM-owned staged character and gives it to eligible Player',()=>{
 assert.match(transfer,/pj\.owner_user_id = v_actor/);
 assert.match(transfer,/pj\.campaign_id is null or pj\.campaign_id = p_campaign_id/);
 assert.match(transfer,/set owner_user_id = p_player_user_id/);
 assert.match(panel,/Entregar Desvelado por e-mail/);
});
