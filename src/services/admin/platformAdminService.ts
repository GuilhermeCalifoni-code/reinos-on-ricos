import { supabase } from '../../lib/supabaseClient';

const client = () => {
  if (!supabase) throw new Error('Supabase não está configurado.');
  return supabase;
};

export type PlatformRole = 'super_admin' | 'admin' | 'moderador' | 'usuario';
export type PlatformPermission = 'users.view' | 'campaign_roles.manage' | 'community.members.manage' | 'community.posts.moderate';

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

export interface CommunityAccount {
  user_id: string;
  email: string;
  display_name: string;
  email_confirmed: boolean;
  global_role: PlatformRole;
  access_status: 'allowed' | 'blocked';
  manual_plan_slug: string | null;
  paid_plan_slug: string | null;
  effective_rank: number;
}

export interface CommunityModerationPost {
  post_id: string;
  author_email: string;
  author_name: string;
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string;
  created_at: string;
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
  },
  async lookupCommunityUser(email: string): Promise<CommunityAccount | null> {
    const { data, error } = await client().rpc('community_admin_lookup_user', { p_email: email.trim() });
    if (error) throw error;
    return data as CommunityAccount | null;
  },
  async setCommunityAccess(userId: string, status: CommunityAccount['access_status'], manualPlan: string | null) {
    const { error } = await client().rpc('community_admin_set_access', {
      p_user_id: userId, p_status: status, p_manual_plan_slug: manualPlan
    });
    if (error) throw error;
  },
  async listCommunityPosts(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'): Promise<CommunityModerationPost[]> {
    const { data, error } = await client().rpc('community_admin_list_posts', {
      p_status: status, p_limit: 100
    });
    if (error) throw error;
    return (data || []) as CommunityModerationPost[];
  },
  async reviewCommunityPost(postId: string, decision: 'approved' | 'rejected', note = '') {
    const { error } = await client().rpc('community_admin_review_post', {
      p_post_id: postId, p_decision: decision, p_note: note
    });
    if (error) throw error;
  }
};
