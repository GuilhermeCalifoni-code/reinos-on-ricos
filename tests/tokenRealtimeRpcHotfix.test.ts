import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { explainRealtimeError } from '../src/features/realtime/explainRealtimeError';

const sql = readFileSync('supabase/migrations/045_fix_player_token_movement_rpc.sql','utf8');
const original = readFileSync('supabase/migrations/043_player_personal_token_placement_and_control.sql','utf8');
const hook = readFileSync('src/features/realtime/useCampaignRealtime.ts','utf8');
const table = readFileSync('src/components/live/LiveTable.tsx','utf8');

test('Supabase PostgREST JSON failure does not become [object Object]', () => {
  assert.equal(explainRealtimeError({code:'PGRST202', message:'Could not find public.move_own_map_token() function in the schema cache'}),
    'A API ainda não reconhece a função de movimentação (PGRST202). Atualize a página. Se persistir, informe ao administrador.');
  assert.equal(explainRealtimeError({code:'42883', message:'function pg_catalog.least(numeric, numeric) does not exist'}),
    'Erro de cálculo de posição no servidor (42883). A operação não foi salva.');
  assert.equal(explainRealtimeError({message:'Operação rejeitada', code:'42501'}),'[42501] Operação rejeitada');
  assert.equal(explainRealtimeError({code:'PGRST999', details:'Falha em conexão'}),'[PGRST999] Falha em conexão');
  assert.equal(explainRealtimeError({}), 'Erro não identificado na comunicação com a Mesa.');
  assert.equal(explainRealtimeError(new Error('Teste direto')),'Teste direto');
  assert.notEqual(explainRealtimeError({unexpected:1}), '[object Object]');
});

test('Migration repairs PostgreSQL greatest/least syntax without weakening token authorization',()=>{
  assert.match(original,/pg_catalog\.least/);
  assert.match(sql,/create or replace function public\.move_own_map_token/);
  assert.doesNotMatch(sql,/pg_catalog\.(?:least|greatest)/);
  assert.match(sql,/greatest\(0, least\(100, p_x\)\)/);
  assert.match(sql,/greatest\(0\.5, least\(4, p_token_size\)\)/);
  assert.match(sql,/cm\.role='jogador'/);
  assert.match(sql,/p\.owner_user_id=cm\.user_id/);
  assert.match(sql,/cm\.character_id=v_token\.character_id/);
  assert.match(sql,/public\.can_read_map_token/);
  assert.match(sql,/revoke all on function public\.move_own_map_token/);
  assert.match(sql,/grant execute on function public\.move_own_map_token/);
  assert.match(sql,/notify pgrst, 'reload schema'/);
});

test('Realtime distinguishes disconnected state from operation errors',()=>{
  assert.match(hook,/const \[operationError, setOperationError\]/);
  assert.match(hook,/setError\(explainRealtimeError\(reason\)\)/);
  assert.match(hook,/const message = explainRealtimeError\(reason\)/);
  assert.match(hook,/setOperationError\(message\)/);
  assert.match(hook,/throw reason instanceof Error \? reason : new Error\(message\)/);
  assert.match(hook,/error, operationError, presence/);
  assert.match(table,/Sincronização indisponível: \{realtime.error\}/);
  assert.match(table,/Alteração não confirmada: \{realtime.operationError\}/);
});
