import { supabase } from '../../lib/supabaseClient';

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

export type PlatformRole = 'super_admin' | 'admin' | 'moderador' | 'usuario';
export type PlatformPermission = 'users.view' | 'campaign_roles.manage';

export interface PlatformAccess {
  role: PlatformRole;
  permissions: PlatformPermission[];
}

export interface PlatformUser {
  user_id: string;
  email: string;
  display_name: string;
  global_role: PlatformRole;
  permissions: PlatformPermission[];
  joined_at: string;
}

export interface PlatformCampaignMember {
  campaign_id: string;
  campaign_name: string;
  member_user_id: string;
  member_email: string;
  member_name: string;
  member_role: 'mestre' | 'jogador' | 'observador';
  member_status: string;
}

export const platformAdminService = {
  async getAccess(): Promise<PlatformAccess> {
    const { data, error } = await client().rpc('platform_my_access');
    if (error) throw error;
    const row = (data || {}) as Partial<PlatformAccess>;
    return {
      role: row.role || 'usuario',
      permissions: Array.isArray(row.permissions) ? row.permissions : []
    };
  },
  async listUsers(search = ''): Promise<PlatformUser[]> {
    const { data, error } = await client().rpc('platform_list_users', { p_search: search, p_limit: 100 });
    if (error) throw error;
    return (data || []) as PlatformUser[];
  },
  async setAccess(userId: string, role: Exclude<PlatformRole,'super_admin'>, permissions: PlatformPermission[]) {
    const { error } = await client().rpc('platform_set_user_access', {
      p_user_id: userId, p_role: role, p_permissions: permissions
    });
    if (error) throw error;
  },
  async listCampaignMembers(search = ''): Promise<PlatformCampaignMember[]> {
    const { data, error } = await client().rpc('platform_list_campaign_members', {
      p_search: search, p_limit: 150
    });
    if (error) throw error;
    return (data || []) as PlatformCampaignMember[];
  },
  async setCampaignRole(campaignId: string, userId: string, role: PlatformCampaignMember['member_role']) {
    const { error } = await client().rpc('platform_set_campaign_role', {
      p_campaign_id: campaignId, p_user_id: userId, p_role: role
    });
    if (error) throw error;
  }
};
