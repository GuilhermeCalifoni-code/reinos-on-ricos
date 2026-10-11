import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const migration = readFileSync('supabase/migrations/038_storage_asset_visibility.sql','utf8');
const shell = readFileSync('scripts/backup-reinos-oniricos.sh','utf8');
const storage = readFileSync('scripts/backup-storage.mjs','utf8');

test('storage assets can only be signed for matching visible content or campaign masters',()=>{
  assert.match(migration,/drop policy if exists "campaign members read assets"/);
  assert.match(migration,/is_campaign_master/);
  for(const tbl of ['campaign_npcs','campaign_adversaries','campaign_scenes','campaign_sessions','narrative_maps','campaign_clues','campaign_locations','campaign_handouts'])
    assert.ok(migration.includes('public.'+tbl), tbl);
  assert.match(migration,/visibilidade in \('compartilhado', 'revelado_jogadores'\)/);
  assert.doesNotMatch(migration,/disable row level security|grant all to anon/i);
});

test('backup exports database and all buckets into an encrypted archive',()=>{
  assert.match(shell,/pg_dump/);
  assert.match(shell,/--symmetric --cipher-algo AES256/);
  assert.match(shell,/tar -tzf -/);
  assert.match(shell,/BACKUP_PASSPHRASE/);
  assert.match(storage,/reinos-oniricos/);
  assert.match(storage,/profile-avatars/);
  assert.match(storage,/createHash\('sha256'\)/);
});
