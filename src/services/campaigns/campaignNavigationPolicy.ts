import type { UserRole } from '../../types/auth';

export type CampaignEntryView = 'detalhe_campanha' | 'modo_mesa';

/** A preparação pertence ao Mestre; convite e demais papéis entram somente na Mesa. */
export const canPrepareCampaign = (role: UserRole | undefined): boolean => role === 'mestre';

export const campaignEntryView = (role: UserRole | undefined): CampaignEntryView =>
  canPrepareCampaign(role) ? 'detalhe_campanha' : 'modo_mesa';
