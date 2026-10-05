import { Campanha, Sessao, NPC, Adversario, Local, Pista, LoreEntry, Anotacao } from '../types/campaign';
import { Personagem } from '../types/character';

const MOCK_CAMPAIGN_IDS = new Set(['camp-01', 'camp-02', 'camp-03']);
const MOCK_CHARACTER_IDS = new Set(['caio-espaco', 'helena-vida', 'tomas-consciencia', 'livia-substancia']);

export const removeLegacyMockCampaigns = (items: Campanha[]) =>
  items.filter(item => !MOCK_CAMPAIGN_IDS.has(item.id));

export const removeLegacyMockCampaignContent = <T extends { campanhaId?: string }>(items: T[]) =>
  items.filter(item => !item.campanhaId || !MOCK_CAMPAIGN_IDS.has(item.campanhaId));

export const removeLegacyMockSessions = (items: Sessao[]) => removeLegacyMockCampaignContent(items);
export const removeLegacyMockNpcs = (items: NPC[]) => removeLegacyMockCampaignContent(items);
export const removeLegacyMockAdversaries = (items: Adversario[]) => removeLegacyMockCampaignContent(items);
export const removeLegacyMockLocations = (items: Local[]) => removeLegacyMockCampaignContent(items);
export const removeLegacyMockClues = (items: Pista[]) => removeLegacyMockCampaignContent(items);
export const removeLegacyMockLore = (items: LoreEntry[]) => removeLegacyMockCampaignContent(items);
export const removeLegacyMockNotes = (items: Anotacao[]) => removeLegacyMockCampaignContent(items);

export const removeLegacyMockCharacters = (items: Personagem[]) =>
  items.filter(item => !MOCK_CHARACTER_IDS.has(item.id) && (!item.campaignId || !MOCK_CAMPAIGN_IDS.has(item.campaignId)));

export const isLegacyMockCampaignId = (id?: string | null) => Boolean(id && MOCK_CAMPAIGN_IDS.has(id));
