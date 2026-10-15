import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/039_admin_character_playtest_quota.sql', 'utf8');
const base = readFileSync('supabase/migrations/022_community_lean_plans_and_quotas.sql', 'utf8');
const repository = readFileSync('src/services/characters/characterRepository.ts', 'utf8');

test('admins have fifty character slots while free users keep plan quota', () => {
  assert.match(migration, /create or replace function public\.community_limit_for_user\(p_user_id uuid, limit_key text\)/);
  assert.match(migration, /limit_key = 'characters'/);
  assert.match(migration, /access\.role in \('admin', 'super_admin'\)/);
  assert.match(migration, /then greatest\(configured\.ordinary_limit, 50\)/);
  assert.match(migration, /else configured\.ordinary_limit/);
  assert.match(migration, /from public\.platform_access/);
  assert.match(migration, /set search_path = ''/);
  assert.match(migration, /revoke all on function public\.community_limit_for_user\(uuid,text\) from public, anon, authenticated/);
});

test('database INSERT protection and client errors still use the shared quota', () => {
  assert.match(base, /max_characters := public\.community_limit_for_user\(new\.owner_user_id, 'characters'\)/);
  assert.match(base, /raise exception 'CHARACTER_LIMIT_REACHED:%', max_characters/);
  assert.match(repository, /CHARACTER_LIMIT_REACHED:/);
  assert.doesNotMatch(migration, /disable row level security|grant all|drop trigger|update public\.personagens/i);
});
