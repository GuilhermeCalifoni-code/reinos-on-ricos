import { supabase } from '../../lib/supabaseClient';

export interface CommunityBenefit {
  key: string;
  label: string;
  description: string;
  group: string;
}

export interface CommunityPlanLimits {
  characters: number;
  projects: number;
}

export interface CommunityPlan {
  id: string;
  slug: string;
  nome: string;
  tagline: string;
  descricao: string;
  rank: number;
  precoMensalCentavos: number;
  precoAnualCentavos: number;
  destaque: boolean;
  badge?: string;
  permissions: string[];
  benefits: CommunityBenefit[];
  limits: CommunityPlanLimits;
  digitalEntitlements: string[];
  ordem: number;
}

export interface CommunityMembership {
  plan: CommunityPlan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  billingCycle: 'monthly' | 'annual' | 'none';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase não está configurado neste ambiente.');
  return supabase;
};

const mapPlan = (row: any): CommunityPlan => ({
  id: row.id,
  slug: row.slug,
  nome: row.nome,
  tagline: row.tagline || '',
  descricao: row.descricao || '',
  rank: Number(row.rank || 0),
  precoMensalCentavos: Number(row.preco_mensal_centavos || 0),
  precoAnualCentavos: Number(row.preco_anual_centavos || 0),
  destaque: Boolean(row.destaque),
  badge: row.badge || undefined,
  permissions: Array.isArray(row.permissions) ? row.permissions : [],
  benefits: Array.isArray(row.benefits) ? row.benefits : [],
  limits: {
    characters: Number(row.limits?.characters || 0),
    projects: Number(row.limits?.projects || 0)
  },
  digitalEntitlements: Array.isArray(row.digital_entitlements) ? row.digital_entitlements : [],
  ordem: Number(row.ordem || 0)
});

export const communityService = {
  async listarPlanos(): Promise<CommunityPlan[]> {
    const { data, error } = await requireClient()
      .from('community_plans')
      .select('*')
      .eq('ativo', true)
      .order('ordem');

    if (error) throw error;
    return (data || []).map(mapPlan);
  },

  async assinaturaAtual(): Promise<CommunityMembership | null> {
    const client = requireClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await client
      .from('community_memberships')
      .select('status,billing_cycle,current_period_end,cancel_at_period_end,community_plans(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data || !data.community_plans) return null;

    const planRow = Array.isArray(data.community_plans)
      ? data.community_plans[0]
      : data.community_plans;

    if (!planRow) return null;

    return {
      plan: mapPlan(planRow),
      status: data.status,
      billingCycle: data.billing_cycle,
      currentPeriodEnd: data.current_period_end || undefined,
      cancelAtPeriodEnd: Boolean(data.cancel_at_period_end)
    };
  },

  async entrarListaInteresse(planId: string, billingCycle: 'monthly' | 'annual') {
    const client = requireClient();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Entre em sua conta para registrar interesse.');

    const { error } = await client
      .from('community_waitlist')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'user_id,plan_id' });

    if (error) throw error;
  },

  temPermissao(plan: CommunityPlan | null | undefined, permission: string) {
    return Boolean(plan?.permissions.includes(permission));
  }
};
