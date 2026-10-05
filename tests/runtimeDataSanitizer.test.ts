import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLegacyMockCampaignId,
  isLegacyMockCharacterId,
  removeLegacyMockCampaignContent,
  removeLegacyMockCampaigns,
  removeLegacyMockCharacters
} from '../src/data/runtimeDataSanitizer';

test('remove campanhas de demonstração sem tocar em campanhas reais', () => {
  const result = removeLegacyMockCampaigns([
    { id: 'camp-01', nome: 'demo' },
    { id: 'real-123', nome: 'Campanha real' }
  ] as any);

  assert.deepEqual(result.map(item => item.id), ['real-123']);
});

test('remove conteúdo ligado a campanhas mockadas', () => {
  const result = removeLegacyMockCampaignContent([
    { id: 'x', campanhaId: 'camp-02' },
    { id: 'y', campanhaId: 'real-123' },
    { id: 'z' }
  ]);

  assert.deepEqual(result.map(item => item.id), ['y', 'z']);
});

test('remove personagens de exemplo e preserva personagens reais', () => {
  const result = removeLegacyMockCharacters([
    { id: 'caio-espaco' },
    { id: 'desvelado-real', campaignId: 'real-123' }
  ] as any);

  assert.deepEqual(result.map(item => item.id), ['desvelado-real']);
});

test('identifica somente ids conhecidos como fixtures antigas', () => {
  assert.equal(isLegacyMockCampaignId('camp-03'), true);
  assert.equal(isLegacyMockCampaignId('camp-real'), false);
  assert.equal(isLegacyMockCharacterId('helena-vida'), true);
  assert.equal(isLegacyMockCharacterId('char-real'), false);
});
