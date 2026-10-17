import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fixed = readFileSync('supabase/migrations/046_preserve_omitted_player_token_properties.sql', 'utf8');
const old = readFileSync('supabase/migrations/045_fix_player_token_movement_rpc.sql', 'utf8');
const repository = readFileSync('src/features/realtime/liveTableRepository.ts', 'utf8');

test('Original RPC has the regression: COALESCE wraps NULL-ignoring LEAST/GREATEST', () => {
  assert.match(old, /x = coalesce\(greatest\(0, least\(100, p_x\)\), x\)/);
  assert.match(old, /token_size = coalesce\(greatest\(0\.5, least\(4, p_token_size\)\), token_size\)/);
});

test('Updated RPC preserves every omitted field, clamping only explicit non-null inputs', () => {
  for(const [param, column] of [
    ['p_x', 'x'], ['p_y', 'y'], ['p_token_size', 'token_size'], ['p_range_cells', 'range_cells']
  ]) {
    assert.match(fixed, new RegExp(`\\b${column}\\s*=\\s*case when ${param} is null then ${column}\\b`));
  }
  assert.match(fixed, /else greatest\(0, least\(100, p_x\)\) end/);
  assert.match(fixed, /else greatest\(0\.5, least\(4, p_token_size\)\) end/);
  assert.match(fixed, /else greatest\(0, least\(30, p_range_cells\)\) end/);
  assert.doesNotMatch(fixed, /coalesce\(greatest/);
});

test('Player movement RPC retains auth, ownership, membership and visibility checks', () => {
  assert.match(fixed, /create or replace function public\.move_own_map_token/);
  assert.match(fixed, /security definer/);
  assert.match(fixed, /set search_path = ''/);
  assert.match(fixed, /auth\.uid\(\) is null/);
  assert.match(fixed, /public\.can_read_map_token/);
  assert.match(fixed, /p\.owner_user_id=cm\.user_id/);
  assert.match(fixed, /cm\.role='jogador'/);
  assert.match(fixed, /cm\.status='ativo'/);
  assert.match(fixed, /cm\.character_id=v_token\.character_id/);
  assert.match(fixed, /for update/);
  assert.match(fixed, /revoke all on function public\.move_own_map_token/);
  assert.match(fixed, /grant execute on function public\.move_own_map_token[\s\S]*to authenticated/);
  assert.match(fixed, /notify pgrst, 'reload schema'/);
});

test('The client sends absent values as NULL so the SQL patch must preserve them', () => {
  assert.match(repository, /p_x: patch\.x \?\? null/);
  assert.match(repository, /p_y: patch\.y \?\? null/);
  assert.match(repository, /p_token_size: patch\.tokenSize \?\? null/);
  assert.match(repository, /p_range_cells: patch\.rangeCells \?\? null/);
});
