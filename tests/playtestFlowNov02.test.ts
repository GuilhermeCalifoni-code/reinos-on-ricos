import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {firstRound,nextRoundTurn,parseRoundState} from '../src/components/live/RoundTracker';
const read=(p:string)=>readFileSync(p,'utf8');
const sheet=read('src/components/CharacterSheet.tsx');
const dice=read('src/components/DiceRoller.tsx');
const live=read('src/components/live/LiveTable.tsx');
const dock=read('src/components/live/LiveDock.tsx');
const members=read('src/components/campaign/CampaignMembersPanel.tsx');
const counter=read('src/components/live/CounterPanel.tsx');
const repository=read('src/features/realtime/liveTableRepository.ts');
const realtime=read('src/features/realtime/useCampaignRealtime.ts');
const map=read('src/components/live/MapStage.tsx');
const db=read('supabase/migrations/047_shared_counters_death_condition.sql');

test('no initiative: three Players alternate with GM, then next Rodada',()=>{
  const players=['a','b','c'];
  let state=firstRound(players);
  assert.deepEqual([state.round,state.phase,state.currentPlayerId],[1,'jogador','a']);
  state=nextRoundTurn(state,players);
  assert.deepEqual([state.phase,state.actedPlayerIds],['mestre',['a']]);
  state=nextRoundTurn(state,players);
  assert.deepEqual([state.phase,state.currentPlayerId],['jogador','b']);
  state=nextRoundTurn(state,players);
  state=nextRoundTurn(state,players);
  assert.equal(state.currentPlayerId,'c');
  state=nextRoundTurn(state,players);
  state=nextRoundTurn(state,players);
  assert.deepEqual([state.round,state.phase,state.currentPlayerId,state.actedPlayerIds],
    [2,'jogador','a',[]]);
});

test('round state validation refuses corrupt or spoofed metadata',()=>{
  assert.equal(parseRoundState({round:'bad',phase:'mestre'}),null);
  assert.equal(parseRoundState({active:true,round:0,phase:'mestre',currentPlayerId:null,actedPlayerIds:[]}),null);
  assert.equal(parseRoundState({active:true,round:1,phase:'adversario',currentPlayerId:null,actedPlayerIds:[]}),null);
  assert.deepEqual(parseRoundState(firstRound(['a'])),firstRound(['a']));
});

test('Mundano and Onírico can be rolled directly inside the sheet',()=>{
  assert.match(sheet,/Teste Mundano/);
  assert.match(sheet,/Teste Onírico/);
  assert.match(sheet,/ro-sheet__inline-roller/);
  assert.match(sheet,/<DiceRoller key=/);
  assert.match(sheet,/initialTab=\{rolagemNaFicha\}/);
  assert.match(sheet,/onSalvarPersonagem=\{onSalvar\}/);
  assert.match(dice,/initialTab\?: 'mundano' \| 'onirico'/);
  assert.match(dock,/\['onirico', 'Onírico'/);
  assert.match(live,/initialTab=\{ferramenta === 'onirico' \? 'onirico' : 'mundano'\}/);
  assert.match(live,/personagemAtivo=\{null\} initialTab="onirico"/);
});

test('Player and GM may unlink without deleting a character',()=>{
  assert.match(members,/Desvincular ficha \(sem excluir\)/);
  assert.match(members,/linkOwnCharacter\(null\)/);
  assert.match(members,/update\(member, \{characterId: null\}\)/);
  assert.match(live,/Desvincular sem excluir/);
  assert.match(live,/alterarMinhaFicha\(''\)/);
  assert.doesNotMatch(members,/onExcluirPersonagem/);
});

test('Private counters remain inaccessible and shared counters have independent RLS policy',()=>{
  assert.match(db,/session_counters_gm_only_visibility/);
  assert.match(db,/visibilidade = 'compartilhado'/);
  assert.match(db,/public\.is_campaign_member\(campaign_id\)/);
  assert.doesNotMatch(db,/drop policy "masters read counters only"/);
  assert.match(counter,/Exibir para todos/);
  assert.match(counter,/Tornar privado/);
  assert.match(counter,/compartilharNovo/);
  assert.match(repository,/async visibleCounters\(campaignId: string\)/);
  assert.match(realtime,/visibleCounters\(campaignId\)/);
  assert.match(live,/contadoresPublicos/);
});

test('Morte marker is separate from actual PV and restricted by linked own-token RPC',()=>{
  assert.match(db,/cardinality\(condicoes\) <= 4/);
  assert.match(db,/v_token\.tipo <> 'personagem'/);
  assert.match(db,/public\.can_read_map_token/);
  assert.match(db,/p\.owner_user_id = cm\.user_id/);
  assert.match(db,/auth\.uid\(\) is null/);
  assert.match(db,/revoke all on function public\.set_own_map_token_conditions/);
  assert.match(db,/to authenticated/);
  assert.match(map,/id:'morte',label:'Morte'/);
  assert.match(sheet,/\['morte','Morte'/);
  assert.match(sheet,/não muda PV automaticamente/);
});

test('Guide vf4 is expressed in the general Rules reference',()=>{
  const reference=read('src/components/RulesReference.tsx');
  assert.match(reference,/Dois d20, escolha um só/);
  assert.match(reference,/nunca aos Oníricos/);
  assert.match(reference,/Não há rolagem de iniciativa/);
  assert.match(reference,/organizador de Rodadas/);
  assert.match(reference,/Marcador de Morte/);
});
