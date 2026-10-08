import test from 'node:test';
import assert from 'node:assert/strict';
import { canPrepareCampaign, campaignEntryView } from '../src/services/campaigns/campaignNavigationPolicy';

test('Mestre pode abrir o estúdio de preparação', () => {
  assert.equal(canPrepareCampaign('mestre'), true);
  assert.equal(campaignEntryView('mestre'), 'detalhe_campanha');
});

test('Jogador e Observador entram na Mesa Ao Vivo, nunca no estúdio', () => {
  for (const role of ['jogador', 'observador', undefined] as const) {
    assert.equal(canPrepareCampaign(role), false);
    assert.equal(campaignEntryView(role), 'modo_mesa');
  }
});
