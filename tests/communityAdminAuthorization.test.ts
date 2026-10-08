import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync('supabase/migrations/032_community_email_access_and_post_moderation.sql','utf8');
const admin = readFileSync('src/components/CommunityAdminPanel.tsx','utf8');
const service = readFileSync('src/services/admin/platformAdminService.ts','utf8');
const feed = readFileSync('src/components/CommunityView.tsx','utf8');

test('Busca no banco a conta pelo e-mail exato do Supabase Auth', () => {
  assert.match(migration,/lower\(auth_user\.email\)=lower\(trim\(p_email\)\)/);
  assert.match(migration,/public\.has_platform_permission\('community\.members\.manage'\)/);
  assert.match(service,/rpc\('community_admin_lookup_user'/);
  assert.match(admin,/type="email"/);
});

test('Liberação manual não modifica cobranças ou registros pagos', () => {
  assert.match(migration,/create table public\.community_access_overrides/);
  assert.match(migration,/from public\.community_memberships m/);
  assert.match(admin,/Liberações manuais não geram cobranças/);
  assert.doesNotMatch(migration,/update public\.community_memberships/);
  assert.doesNotMatch(migration,/insert into public\.community_memberships/);
});

test('Publicações são sempre enviadas pendentes e revisadas somente em RPC protegida', () => {
  assert.match(migration,/author_id=auth\.uid\(\) and status='pending'/);
  assert.match(migration,/public\.has_platform_permission\('community\.posts\.moderate'\)/);
  assert.match(migration,/status='approved' and public\.community_has_permission/);
  assert.match(service,/rpc\('community_admin_review_post'/);
  assert.match(feed,/communityService\.enviarPublicacao/);
});

test('Bloquear a comunidade não rebaixa cota de personagens e campanhas',()=>{
  assert.match(migration,/community_has_permission\(permission_key text\)/);
  assert.match(migration,/permission_key not like 'community\.%'/);
  assert.match(migration,/public\.community_rank_for_user/);
});
