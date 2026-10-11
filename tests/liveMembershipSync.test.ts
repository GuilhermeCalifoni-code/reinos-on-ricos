import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const campaign = readFileSync('src/services/campaigns/useRemoteCampaigns.ts','utf8');
const roster = readFileSync('src/services/characters/useRemoteCharacters.ts','utf8');
const app = readFileSync('src/App.tsx','utf8');
const live = readFileSync('src/components/live/LiveTable.tsx','utf8');
const migration = readFileSync('supabase/migrations/037_campaign_members_realtime.sql','utf8');

test('membership realtime only publishes existing RLS-scoped rows',()=>{
  assert.match(migration,/alter publication supabase_realtime add table public\.campaign_members/);
  assert.match(migration,/pg_publication_tables/);
  assert.doesNotMatch(migration,/disable row level security|grant all to anon|security definer/i);
  assert.match(campaign,/table: 'campaign_members'/);
  assert.match(campaign,/event: '\*'/);
  assert.match(campaign,/api\.removeChannel\(channel\)/);
});

test('roster follows character changes and reconnects safely',()=>{
  assert.match(roster,/table: 'personagens'/);
  assert.match(roster,/owner_user_id=eq\.\$\{userId\}/);
  assert.match(roster,/campaign_id=eq\.\$\{campaignId\}/);
  assert.match(roster,/currentRequest === requestSeq\.current/);
  assert.match(roster,/window\.addEventListener\('focus', refreshSoon\)/);
  assert.match(app,/vinculosDaCampanha/);
  assert.match(app,/personagensRemotos\.refresh\(\)/);
});

test('UI distinguishes online presence from attached characters',()=>{
  assert.match(live,/realtime\.presence\.length/);
  assert.match(live,/>Desvelados<\/span>/);
  assert.match(live,/aria-label="Desvelados vinculados à campanha"/);
  assert.doesNotMatch(live,/aria-label="Personagens presentes"/);
});
